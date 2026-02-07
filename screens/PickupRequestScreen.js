import React, {useContext, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import Input from '../components/Input';
import Screen from '../components/Screen';
import GlassHeader from '../components/GlassHeader';

import {AuthContext} from '../contexts/AuthContext';
import {UiStatusContext} from '../contexts/UiStatusContext';
import {isSupabaseConfigured, supabase} from '../lib/supabase';
import {postPickup} from '../utils/api';
import {addSavedPickupId} from '../utils/pickupHistory';
import {loadSavedAddresses} from '../utils/addresses';
import {getCurrentCoordinatesAsync, requestLocationPermissionAsync} from '../utils/location';
import {estimateEarnings, getActiveScrapRates} from '../utils/rates';
import {theme} from '../theme';

export default function PickupRequestScreen({navigation}) {
  const {session} = useContext(AuthContext);
  const ui = useContext(UiStatusContext);

  const [availableTypes, setAvailableTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [selectedTypeIds, setSelectedTypeIds] = useState([]);
  const [weightKg, setWeightKg] = useState(8);
  const [weightText, setWeightText] = useState('8');
  const [ratesRows, setRatesRows] = useState([]);
  const [showAllTypes, setShowAllTypes] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [address, setAddress] = useState('');
  const [timeSlot, setTimeSlot] = useState('Morning');
  const [coords, setCoords] = useState(null);

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function refreshSavedAddresses() {
    setLoadingAddresses(true);
    try {
      const list = await loadSavedAddresses();
      setSavedAddresses(list);
    } catch {
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    setLoadingTypes(true);

    (async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          if (mounted) setAvailableTypes([]);
          return;
        }
        const {data, error} = await supabase
          .from('scrap_types')
          .select('id,name')
          .order('name', {ascending: true});
        if (error) throw error;
        if (mounted) setAvailableTypes(data || []);
      } catch (e) {
        console.warn('Failed to fetch scrap types', e);
        if (mounted) setAvailableTypes([]);
      } finally {
        if (mounted) setLoadingTypes(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoadingAddresses(true);

    (async () => {
      try {
        const list = await loadSavedAddresses();
        if (mounted) setSavedAddresses(list);
      } catch (_e) {
        if (mounted) setSavedAddresses([]);
      } finally {
        if (mounted) setLoadingAddresses(false);
      }
    })();

    const unsub = navigation?.addListener?.('focus', () => {
      refreshSavedAddresses();
    });

    return () => {
      mounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  const typeOptions = useMemo(() => {
    const list = (availableTypes || []).map((t) => ({id: t.id, name: t.name}));
    const ordered = [];
    const used = new Set();

    function takeByIncludes(key) {
      const found = list.find((t) => String(t.name || '').toLowerCase().includes(key));
      if (found && !used.has(String(found.id))) {
        ordered.push(found);
        used.add(String(found.id));
      }
    }

    // Prefer Kabadiwala-style simple categories when present in DB.
    ['paper', 'plastic', 'metal', 'other'].forEach(takeByIncludes);

    const rest = list.filter((t) => !used.has(String(t.id)));
    const compact = ordered.length ? [...ordered, ...rest] : rest;
    return showAllTypes ? compact : compact.slice(0, 8);
  }, [availableTypes, showAllTypes]);

  const selectedTypes = useMemo(() => {
    const idSet = new Set((selectedTypeIds || []).map(String));
    return (availableTypes || []).filter((t) => idSet.has(String(t.id)));
  }, [availableTypes, selectedTypeIds]);

  const items = useMemo(() => {
    if (!selectedTypes.length) return [];
    const perType = Math.max(0.5, Number(weightKg) / selectedTypes.length);
    const qty = Number(perType.toFixed(2));
    return selectedTypes.map((t) => ({scrapTypeId: t.id, scrapTypeName: t.name, estimatedQuantity: qty}));
  }, [selectedTypes, weightKg]);

  const earningsEstimate = useMemo(() => {
    return estimateEarnings({items, ratesRows});
  }, [items, ratesRows]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await getActiveScrapRates();
        if (mounted) setRatesRows(r);
      } catch {
        if (mounted) setRatesRows([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addressOptions = useMemo(
    () =>
      savedAddresses.map((a) => ({
        id: a.id,
        name: a.label || a.address || 'Saved address',
        address: a.address,
        latitude: a.latitude,
        longitude: a.longitude,
      })),
    [savedAddresses]
  );

  async function useCurrentLocation() {
    try {
      setFetchingLocation(true);
      ui?.setLoading?.(true);
      const permission = await requestLocationPermissionAsync();
      if (!permission.granted) {
        ui?.showError?.(permission.message || 'Location permission is required.');
        return;
      }
      const location = await getCurrentCoordinatesAsync();
      setCoords(location);
    } catch (e) {
      console.warn(e);
      ui?.showError?.('Could not fetch location');
    } finally {
      setFetchingLocation(false);
      ui?.setLoading?.(false);
    }
  }

  function validate() {
    if (!selectedTypes.length) return 'Please select at least one scrap type.';
    if (!Number.isFinite(Number(weightKg)) || Number(weightKg) <= 0) return 'Please enter an approximate weight.';
    if (!address.trim()) return 'Please enter pickup address.';
    if (!coords) return 'Please select a pickup location.';
    return null;
  }

  function setWeightFromText(val) {
    const raw = String(val ?? '');
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, '');
    setWeightText(cleaned);
    const n = Number(cleaned);
    if (Number.isFinite(n)) setWeightKg(Math.max(0, Math.min(500, n)));
    else setWeightKg(0);
  }

  function toggleType(type) {
    if (!type?.id) return;
    const id = String(type.id);
    setSelectedTypeIds((prev) => {
      const current = Array.isArray(prev) ? prev.map(String) : [];
      if (current.includes(id)) return current.filter((x) => x !== id);
      return [...current, id];
    });
  }

  async function onSubmit() {
    const error = validate();
    if (error) {
      ui?.showError?.(error);
      return;
    }

    try {
      setSubmitting(true);
      ui?.setLoading?.(true);
      const payload = {
        address: address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        timeSlot,
        items: items.map((it) => ({scrapTypeId: it.scrapTypeId, estimatedQuantity: it.estimatedQuantity})),
      };

      if (!isSupabaseConfigured || !supabase) {
        ui?.showError?.(
          'Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in frontend/.env and restart Expo.'
        );
        return;
      }

      const token = session?.access_token;
      if (!token) {
        ui?.showError?.('Not logged in. Please log in again.');
        return;
      }

      const resp = await postPickup({
        ...payload,
        accessToken: token,
      });

      if (resp?.pickupId) {
        await addSavedPickupId(resp.pickupId);
      }

      ui?.showInfo?.('Pickup requested successfully');
      setSelectedTypeIds([]);
      setWeightKg(8);
      setWeightText('8');
      if (resp?.pickupId) {
        navigation.navigate('Pickup Status', {pickupId: resp.pickupId});
      } else {
        navigation.goBack();
      }
    } catch (e) {
      console.error(e);
      ui?.showError?.(e?.message || 'Could not submit pickup');
    } finally {
      setSubmitting(false);
      ui?.setLoading?.(false);
    }
  }

  return (
    <Screen variant="soft">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <GlassHeader title="ScrapCo" status="Bulk Pickup" />

          <View style={{marginTop: theme.spacing.lg}}>
            <Text style={styles.pageTitle}>Bulk Pickup</Text>
            <Text style={styles.pageSubtitle}>CHOOSE ITEMS, LOCATION & TIME</Text>
          </View>

          <View style={{marginTop: theme.spacing.lg}}>
            <Card>
              <Text style={styles.sectionTitle}>Scrap types (multi-select)</Text>
              {loadingTypes ? <ActivityIndicator /> : null}
              {!loadingTypes && availableTypes.length === 0 ? (
                <Text style={styles.helperText}>No scrap types found in the database.</Text>
              ) : null}

              <View style={styles.chipsRow}>
                {typeOptions.map((t) => {
                  const selected = selectedTypeIds.map(String).includes(String(t.id));
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => toggleType(t)}
                      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
                    >
                      <Text style={[styles.chipText, selected ? styles.chipTextOn : styles.chipTextOff]}>{t.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {availableTypes.length > 8 ? (
                <View style={{marginTop: theme.spacing.sm}}>
                  <Pressable onPress={() => setShowAllTypes((v) => !v)}>
                    <Text style={styles.moreLink}>{showAllTypes ? 'Show less' : 'More types'}</Text>
                  </Pressable>
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Approximate weight</Text>
              <Text style={styles.helperText}>This is only an estimate. Final amount depends on actual weight.</Text>

              <View style={styles.weightRow}>
                <Pressable
                  onPress={() => {
                    const next = Math.max(0, Number(weightKg || 0) - 1);
                    setWeightKg(next);
                    setWeightText(String(next));
                  }}
                  style={[styles.weightBtn, styles.weightBtnOff]}
                >
                  <Text style={styles.weightBtnText}>−</Text>
                </Pressable>
                <View style={styles.weightValue}>
                  <Input
                    label={null}
                    placeholder="e.g. 10"
                    value={weightText}
                    onChangeText={setWeightFromText}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
                <Pressable
                  onPress={() => {
                    const next = Math.min(500, Number(weightKg || 0) + 1);
                    setWeightKg(next);
                    setWeightText(String(next));
                  }}
                  style={[styles.weightBtn, styles.weightBtnOn]}
                >
                  <Text style={styles.weightBtnText}>+</Text>
                </Pressable>
              </View>

              <View style={{marginTop: theme.spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                {[5, 10, 20, 40, 60].map((v) => (
                  <Pressable
                    key={String(v)}
                    onPress={() => {
                      setWeightKg(v);
                      setWeightText(String(v));
                    }}
                    style={[styles.chip, Number(weightKg) === v ? styles.chipOn : styles.chipOff]}
                  >
                    <Text style={[styles.chipText, Number(weightKg) === v ? styles.chipTextOn : styles.chipTextOff]}>{v} kg</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{marginTop: theme.spacing.md}}>
                <Text style={styles.earningsText}>Estimated earning: ₹{earningsEstimate}</Text>
              </View>

            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Pickup location</Text>
              {loadingAddresses ? <ActivityIndicator /> : null}
              {addressOptions.length ? (
                <Dropdown
                  label="Saved Address"
                  options={addressOptions}
                  value={selectedAddress}
                  onChange={(a) => {
                    setSelectedAddress(a);
                    if (a?.address) setAddress(a.address);
                    if (a?.latitude != null && a?.longitude != null) {
                      setCoords({latitude: Number(a.latitude), longitude: Number(a.longitude)});
                    }
                  }}
                />
              ) : null}

              <Input
                label="Pickup Address"
                placeholder="House/Shop, Area, Landmark"
                value={address}
                onChangeText={setAddress}
                multiline
              />

              <View style={{marginTop: theme.spacing.md}}>
                <Button
                  label={fetchingLocation ? 'Getting location...' : 'Use Current Location'}
                  variant="secondary"
                  loading={fetchingLocation}
                  onPress={useCurrentLocation}
                />
              </View>

              {coords ? (
                <View style={{marginTop: theme.spacing.md}}>
                  <Text style={styles.coords}>
                    Location set: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                  </Text>
                </View>
              ) : null}

              {/* Map disabled (prevents crashes / Google Maps dependency). */}
              <View style={styles.mapBlank} />
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Time slot</Text>
              <View style={styles.timeRow}>
                {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                  <View key={slot} style={styles.timePillWrap}>
                    <Button label={slot} variant={timeSlot === slot ? 'primary' : 'secondary'} onPress={() => setTimeSlot(slot)} />
                  </View>
                ))}
              </View>
            </Card>

            <Button label={submitting ? 'Submitting...' : 'Confirm Pickup'} loading={submitting} onPress={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollContent: {paddingBottom: 28},
  pageTitle: {marginTop: 4, fontSize: 22, fontWeight: '800', color: theme.colors.text},
  pageSubtitle: {marginTop: 6, fontSize: 11, letterSpacing: 1.2, fontWeight: '800', color: theme.colors.textMuted},
  sectionTitle: {fontSize: 14, fontWeight: '800', color: theme.colors.text, marginBottom: 10, letterSpacing: 0.2},
  label: {fontSize: 13, fontWeight: '400', marginTop: 12, marginBottom: 6, color: theme.colors.text},
  timeRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 4},
  timePillWrap: {marginRight: 10, marginBottom: 10},
  coords: {fontSize: 12, color: theme.colors.textMuted, fontWeight: '400'},
  helperText: {color: theme.colors.textMuted, fontSize: 13, marginBottom: 8, fontWeight: '400'},
  chipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipOn: {backgroundColor: 'rgba(37, 211, 102, 0.12)', borderColor: 'rgba(37, 211, 102, 0.35)'},
  chipOff: {backgroundColor: theme.colors.bgSoft, borderColor: theme.colors.border},
  chipText: {fontWeight: '800'},
  chipTextOn: {color: theme.colors.green},
  chipTextOff: {color: theme.colors.text},
  weightRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  weightBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  weightBtnOn: {backgroundColor: 'rgba(37, 211, 102, 0.12)', borderColor: 'rgba(37, 211, 102, 0.35)'},
  weightBtnOff: {backgroundColor: theme.colors.bgSoft, borderColor: theme.colors.border},
  weightBtnText: {fontSize: 22, fontWeight: '600', color: theme.colors.text},
  weightValue: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: theme.colors.card,
  },
  mapBlank: {
    marginTop: theme.spacing.md,
    height: 160,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSoft,
  },
  weightValueText: {fontSize: 16, fontWeight: '600', color: theme.colors.text},
  earningsText: {fontSize: 14, fontWeight: '600', color: theme.colors.text},
  moreLink: {color: theme.colors.green, fontWeight: '500'},
});
