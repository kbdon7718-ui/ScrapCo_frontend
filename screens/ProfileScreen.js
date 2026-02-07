import React, {useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Screen from '../components/Screen';
import GlassHeader from '../components/GlassHeader';
import {AuthContext} from '../contexts/AuthContext';
import {addSavedAddress, loadSavedAddresses, newAddressId, removeSavedAddress} from '../utils/addresses';
import {getCurrentCoordinatesAsync, requestLocationPermissionAsync} from '../utils/location';
import {theme} from '../theme';
import {ChevronRight, Globe, HelpCircle, Lock, Moon, Truck} from 'lucide-react-native';
import {PreferencesContext} from '../contexts/PreferencesContext';
import {t} from '../i18n/strings';

export default function ProfileScreen() {
  const {user, bypassed, logout} = useContext(AuthContext);
  const navigation = useNavigation();
  const prefs = useContext(PreferencesContext);
  const lang = prefs?.language || 'en';

  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [label, setLabel] = useState('Home');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const addressRows = useMemo(() => addresses || [], [addresses]);

  const fullName = user?.user_metadata?.full_name || 'Customer';
  const phone = user?.phone || 'Not provided';
  const userId = user?.id || '—';

  useEffect(() => {
    let mounted = true;
    setLoadingAddresses(true);
    (async () => {
      try {
        const list = await loadSavedAddresses();
        if (mounted) setAddresses(list);
      } catch {
        if (mounted) setAddresses([]);
      } finally {
        if (mounted) setLoadingAddresses(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function useCurrentLocation() {
    try {
      setFetchingLocation(true);
      const permission = await requestLocationPermissionAsync();
      if (!permission.granted) {
        Alert.alert(t(lang, 'profile.permissionRequired'), permission.message);
        return;
      }
      const location = await getCurrentCoordinatesAsync();
      setCoords(location);
    } catch (e) {
      Alert.alert(t(lang, 'profile.locationError'), e?.message || 'Could not fetch location');
    } finally {
      setFetchingLocation(false);
    }
  }

  async function onSaveAddress() {
    if (!address.trim()) {
      Alert.alert(t(lang, 'profile.missingInfoTitle'), t(lang, 'profile.missingAddress'));
      return;
    }
    if (!coords) {
      Alert.alert(t(lang, 'profile.missingInfoTitle'), t(lang, 'profile.missingCoords'));
      return;
    }

    try {
      setLoadingAddresses(true);
      const next = await addSavedAddress({
        id: newAddressId(),
        label: label.trim() || 'Saved',
        address: address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        createdAt: new Date().toISOString(),
      });
      setAddresses(next);
      setAddress('');
      setCoords(null);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save address');
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function onRemoveAddress(id) {
    try {
      setLoadingAddresses(true);
      const next = await removeSavedAddress(id);
      setAddresses(next);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not remove address');
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function onLogout() {
    try {
      await logout();
    } catch (e) {
      Alert.alert('Error', e?.message || t(lang, 'profile.logoutError'));
    }
  }

  function Row({icon: Icon, label, onPress}) {
    return (
      <Pressable onPress={onPress} style={styles.rowBtn}>
        <View style={styles.rowLeft}>
          <View style={styles.rowIcon}>
            <Icon size={18} color={theme.colors.primary} strokeWidth={2.4} />
          </View>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <ChevronRight size={18} color={theme.colors.textMuted} strokeWidth={2.4} />
      </Pressable>
    );
  }

  return (
    <Screen variant="soft">
      <GlassHeader title={t(lang, 'profile.title')} status="" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 24}}>
      <View style={{marginTop: theme.spacing.lg}}>
        <Card>
          <View style={styles.userWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{String(fullName || 'C').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userSub}>{phone}</Text>
            </View>
          </View>
          <Text style={styles.hint}>Mode: {bypassed ? 'Direct login (dev)' : 'Supabase Auth'} • ID: {userId}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>{t(lang, 'profile.general')}</Text>
          <Row
            icon={Truck}
            label={t(lang, 'profile.bulk')}
            onPress={() => {
              // Jump to Home tab -> SchedulePickup screen
              const tabs = navigation.getParent?.();
              if (tabs?.navigate) {
                tabs.navigate('Home', {screen: 'SchedulePickup'});
                return;
              }
              navigation.navigate('SchedulePickup');
            }}
          />
          <Row
            icon={Globe}
            label={`${t(lang, 'profile.language')} (${prefs?.language === 'hi' ? t(lang, 'preferences.hindi') : t(lang, 'preferences.english')})`}
            onPress={() => navigation.navigate('Preferences')}
          />
          <Row
            icon={Moon}
            label={`${t(lang, 'profile.theme')} (${prefs?.themeMode || 'system'})`}
            onPress={() => navigation.navigate('Preferences')}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>{t(lang, 'profile.support')}</Text>
          <Row icon={HelpCircle} label={t(lang, 'profile.help')} onPress={() => navigation.navigate('HelpSupport')} />
          <Row icon={Lock} label={t(lang, 'profile.privacy')} onPress={() => navigation.navigate('Legal')} />
          <Row icon={Lock} label={t(lang, 'profile.terms')} onPress={() => navigation.navigate('Legal')} />
          <Row
            icon={HelpCircle}
            label={t(lang, 'profile.ai')}
            onPress={() => Alert.alert(t(lang, 'profile.aiSoonTitle'), t(lang, 'profile.aiSoonBody'))}
          />
        </Card>

        <Card>
          <Text style={styles.h2}>{t(lang, 'profile.savedAddresses')}</Text>
          <Text style={styles.hint}>{t(lang, 'profile.savedAddressesHint')}</Text>

          {loadingAddresses ? <ActivityIndicator style={{marginTop: 10}} /> : null}

          <Input label={t(lang, 'profile.label')} placeholder="Home / Office" value={label} onChangeText={setLabel} />
          <Input
            label={t(lang, 'profile.address')}
            placeholder="House/Shop, Area, Landmark"
            value={address}
            onChangeText={setAddress}
            multiline
          />

          <View style={{marginTop: theme.spacing.md}}>
            <Button
              label={fetchingLocation ? t(lang, 'profile.gettingLocation') : t(lang, 'profile.useCurrentLocation')}
              variant="secondary"
              loading={fetchingLocation}
              onPress={useCurrentLocation}
            />
          </View>
          {coords ? (
            <Text style={styles.coords}>
              Location set: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </Text>
          ) : null}

          <View style={{marginTop: theme.spacing.md}}>
            <Button label={t(lang, 'profile.saveAddress')} onPress={onSaveAddress} variant="primary" />
          </View>

          {addressRows.length ? (
            <View style={{marginTop: theme.spacing.md}}>
              {addressRows.map((a) => (
                <View key={a.id} style={styles.addrRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.addrLabel}>{a.label || 'Saved'}</Text>
                    <Text style={styles.addrText} numberOfLines={2}>
                      {a.address}
                    </Text>
                  </View>
                  <Button label={t(lang, 'profile.remove')} variant="secondary" onPress={() => onRemoveAddress(a.id)} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.hint, {marginTop: theme.spacing.md}]}>{t(lang, 'profile.noneSaved')}</Text>
          )}
        </Card>

        <Card>
          <Text style={styles.h2}>{t(lang, 'profile.sustainability')}</Text>
          <Text style={styles.hint}>{t(lang, 'profile.sustainabilityHint')}</Text>
          <View style={{marginTop: theme.spacing.md}}>
            <Button label={t(lang, 'profile.logout')} onPress={onLogout} variant="secondary" />
          </View>
        </Card>
      </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  userWrap: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 22, fontWeight: '900', color: theme.colors.primary},
  userName: {fontSize: 18, fontWeight: '800', color: theme.colors.text},
  userSub: {marginTop: 6, color: theme.colors.textMuted, fontWeight: '600'},
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '900',
    color: theme.colors.textMuted,
  },
  rowBtn: {
    marginTop: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {fontSize: 14, fontWeight: '700', color: theme.colors.text},
  h2: {fontSize: 18, fontWeight: '800', color: theme.colors.text},
  hint: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400', lineHeight: 18},
  coords: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400'},
  addrRow: {marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  addrLabel: {color: theme.colors.text, fontWeight: '400'},
  addrText: {marginTop: 6, color: theme.colors.textMuted, fontWeight: '400'},
});
