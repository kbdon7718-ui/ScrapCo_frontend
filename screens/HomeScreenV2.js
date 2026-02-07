import React, {useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import GlassHeader from '../components/GlassHeader';
import HeroCard from '../components/HeroCard';
import QuickActionGrid from '../components/QuickActionGrid';
import PickupCartModal from '../components/PickupCartModal';
import Screen from '../components/Screen';
import {AuthContext} from '../contexts/AuthContext';
import {UiStatusContext} from '../contexts/UiStatusContext';
import {postPickup, getPickupStatus} from '../utils/api';
import {addSavedPickupId, getSavedPickupIds} from '../utils/pickupHistory';
import {getActiveScrapRates} from '../utils/rates';
import {
  getCurrentCoordinatesAsync,
  requestLocationPermissionAsync,
  reverseGeocodeToAddressAsync,
  shortAddress,
} from '../utils/location';
import {theme} from '../theme';

export default function HomeScreenV2({navigation}) {
  const {session} = useContext(AuthContext);
  const ui = useContext(UiStatusContext);

  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [loadingPickup, setLoadingPickup] = useState(false);

  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [submittingPickup, setSubmittingPickup] = useState(false);

  const [liveCoords, setLiveCoords] = useState(null);
  const [liveAddress, setLiveAddress] = useState('');
  const [loadingLive, setLoadingLive] = useState(false);

  const uiRates = useMemo(() => {
    return (rates || []).map((r) => ({
      id: r.id,
      name: r.name,
      unit: 'kg',
      price: Number(r.ratePerKg ?? 0),
      nameKey: r.nameKey,
      trend: 'flat',
      icon: null,
      color: null,
    }));
  }, [rates]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingRates(true);
      try {
        const r = await getActiveScrapRates();
        if (mounted) setRates(r);
      } catch {
        if (mounted) setRates([]);
      } finally {
        if (mounted) setLoadingRates(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function refreshLiveLocation() {
    setLoadingLive(true);
    try {
      const permission = await requestLocationPermissionAsync();
      if (!permission.granted) {
        setLiveCoords(null);
        setLiveAddress('');
        return;
      }

      const coords = await getCurrentCoordinatesAsync();
      setLiveCoords(coords);

      const addr = await reverseGeocodeToAddressAsync(coords);
      setLiveAddress(addr || '');
    } catch {
      setLiveCoords(null);
      setLiveAddress('');
    } finally {
      setLoadingLive(false);
    }
  }

  useEffect(() => {
    refreshLiveLocation();
    const unsub = navigation?.addListener?.('focus', () => {
      // If user enabled permissions from settings, refresh when coming back.
      refreshLiveLocation();
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation]);

  async function loadLatestPickup() {
    const token = session?.access_token;
    if (!token) {
      setPickup(null);
      return;
    }
    setLoadingPickup(true);
    try {
      const ids = await getSavedPickupIds();
      if (!ids.length) {
        setPickup(null);
        return;
      }
      const pickupId = ids[0];
      const resp = await getPickupStatus({pickupId, accessToken: token});
      setPickup(resp.pickup || null);
    } catch {
      setPickup(null);
    } finally {
      setLoadingPickup(false);
    }
  }

  useEffect(() => {
    loadLatestPickup();
    const unsub = navigation?.addListener?.('focus', () => {
      loadLatestPickup();
    });
    const t = setInterval(loadLatestPickup, 12000);
    return () => {
      clearInterval(t);
      if (typeof unsub === 'function') unsub();
    };
  }, [navigation, session?.access_token]);

  const hasActivePickup = useMemo(() => {
    const status = String(pickup?.status || '').toUpperCase();
    return (
      status === 'FINDING_VENDOR' ||
      status === 'REQUESTED' ||
      status === 'ACCEPTED' ||
      status === 'ASSIGNED' ||
      status === 'ON_THE_WAY'
    );
  }, [pickup]);

  function timeSlotFromNow() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }

  async function handlePickupConfirm(items, estimate) {
    setSubmittingPickup(true);
    ui?.setLoading?.(true);
    try {
      const token = session?.access_token;
      if (!token) {
        ui?.showError?.('Please log in first.');
        setCartModalVisible(false);
        return;
      }

      const permission = await requestLocationPermissionAsync();
      if (!permission.granted) {
        ui?.showError?.(permission.message || 'Location permission is required for instant pickup.');
        return;
      }
      const coords = liveCoords || (await getCurrentCoordinatesAsync());
      const resolvedAddress = liveAddress || (await reverseGeocodeToAddressAsync(coords)) || '';

      const payload = {
        address: resolvedAddress || `Current location (${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)})`,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timeSlot: timeSlotFromNow(),
        items: items,
      };

      const resp = await postPickup({...payload, accessToken: token});
      if (resp?.pickupId) {
        const newPickupId = resp.pickupId;

        await addSavedPickupId(newPickupId);
        // Immediately switch the home UI to the new pickup, so users don't see the previous order.
        setPickup({id: newPickupId, status: 'REQUESTED'});
        ui?.showInfo?.('Pickup requested! Finding vendors...');
        setCartModalVisible(false);
        navigation.navigate('Pickup Status', {pickupId: newPickupId});

        // Refresh from backend shortly after creation.
        setTimeout(() => {
          loadLatestPickup();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      ui?.showError?.(e?.message || 'Could not create pickup');
    } finally {
      setSubmittingPickup(false);
      ui?.setLoading?.(false);
    }
  }

  const statusMsg = useMemo(() => {
    if (!pickup) return 'Ready to pickup';
    const s = String(pickup?.status || '').toUpperCase();
    if (s === 'FINDING_VENDOR' || s === 'REQUESTED') return 'Finding vendors...';
    if (s === 'ASSIGNED' || s === 'ACCEPTED') return 'Pickup confirmed!';
    if (s === 'ON_THE_WAY') return 'Vendor is on the way';
    if (s === 'COMPLETED') return 'Last pickup done ✓';
    return 'Ready to pickup';
  }, [pickup]);

  return (
    <Screen variant="soft">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Glass Header */}
        <GlassHeader title="ScrapCo" status={shortAddress(liveAddress) || statusMsg} />

        {/* Live Tracker Map (disabled to prevent crashes / maps dependency). */}
        <View style={styles.mapBlank} />

        {/* Hero Card for Instant Pickup */}
        <HeroCard
          title={'Instant Scrap\nPickup'}
          subtitle="BEST RATES GUARANTEED"
          onPress={() => {
            // Always allow creating another pickup request.
            setCartModalVisible(true);
          }}
        />

        {/* Quick Actions */}
        <QuickActionGrid
          onBulk={() => navigation.navigate('SchedulePickup')}
          onRates={() => navigation.getParent()?.navigate('Rates')}
        />

        {/* Active Pickup Summary */}
        {loadingPickup ? (
          <View style={{marginVertical: theme.spacing.lg, alignItems: 'center'}}>
            <ActivityIndicator />
          </View>
        ) : null}

        {pickup && hasActivePickup ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeTitle}>Active Pickup</Text>
            <Text style={styles.activeId}>ID: {String(pickup.id).slice(0, 8)}...</Text>
            <Text style={styles.activeStatus}>Status: {String(pickup.status).toUpperCase()}</Text>
            <View style={{marginTop: theme.spacing.sm}} />

            <Pressable
              onPress={() => navigation.navigate('Pickup Status', {pickupId: pickup?.id})}
              style={styles.viewStatusBtn}
            >
              <Text style={styles.viewStatusText}>View status</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Pickup Cart Modal */}
      <PickupCartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
        rates={uiRates}
        onConfirm={handlePickupConfirm}
        loading={submittingPickup}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapBlank: {
    height: 180,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSoft,
    marginTop: theme.spacing.md,
  },
  activeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.20)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  activeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  activeId: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.textMuted,
  },
  activeStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  viewStatusBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.20)',
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  viewStatusText: {fontWeight: '800', color: theme.colors.primary},
});
