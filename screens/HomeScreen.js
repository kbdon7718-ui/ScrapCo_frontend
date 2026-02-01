/**
 * frontend/screens/HomeScreen.js
 *
 * HomeScreen requirements:
 * - Show the app title "ScrapCo"
 * - Button: "Request Scrap Pickup"
 * - On button press, navigate to PickupRequestScreen
 */

import React, {useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import {AuthContext} from '../contexts/AuthContext';
import {theme} from '../theme';
import {getPickupStatus} from '../utils/api';
import {getSavedPickupIds} from '../utils/pickupHistory';
import {getActiveScrapRates} from '../utils/rates';

export default function HomeScreen({ navigation }) {
  const {session} = useContext(AuthContext);

  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

  const [loadingPickup, setLoadingPickup] = useState(false);
  const [pickup, setPickup] = useState(null);

  function goToPickupRequest() {
    navigation.navigate('SchedulePickup');
  }

  const normalizedStatus = useMemo(() => {
    const s = String(pickup?.status || '').toUpperCase();
    if (s === 'REQUESTED') return 'FINDING_VENDOR';
    if (s === 'ACCEPTED') return 'ASSIGNED';
    return s;
  }, [pickup?.status]);

  const hasActivePickup = useMemo(() => {
    // Active means the customer should wait; scheduling must be disabled.
    return normalizedStatus === 'FINDING_VENDOR' || normalizedStatus === 'ASSIGNED';
  }, [normalizedStatus]);

  const statusHeadline = useMemo(() => {
    if (!pickup) return 'Schedule your scrap pickup';
    if (normalizedStatus === 'FINDING_VENDOR') return 'Finding a nearby vendor…';
    if (normalizedStatus === 'ASSIGNED') return 'Pickup confirmed';
    if (normalizedStatus === 'NO_VENDOR_AVAILABLE') return 'No vendor available right now';
    if (normalizedStatus === 'COMPLETED') return 'Pickup completed 🎉';
    return 'Schedule your scrap pickup';
  }, [pickup, normalizedStatus]);

  const statusSub = useMemo(() => {
    if (!pickup) return 'Bas request daali aur wait.';
    if (normalizedStatus === 'FINDING_VENDOR') return 'We’re matching you with the best nearby vendor.';
    if (normalizedStatus === 'ASSIGNED') return 'A vendor has accepted. You’re all set.';
    if (normalizedStatus === 'NO_VENDOR_AVAILABLE') return 'All nearby vendors are busy. Try again a bit later.';
    if (normalizedStatus === 'COMPLETED') return 'Thanks for recycling with ScrapCo.';
    return 'Bas request daali aur wait.';
  }, [pickup, normalizedStatus]);

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
      // Use the most recent saved pickup id.
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
    let mounted = true;
    (async () => {
      setLoadingRates(true);
      try {
        const rows = await getActiveScrapRates();
        if (mounted) setRates(rows);
      } catch (e) {
        if (mounted) setRates([]);
      } finally {
        if (mounted) setLoadingRates(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  return (
    <Screen>
      <AppHeader title="ScrapCo" subtitle="Bas request daali aur wait" />

      <View style={{marginTop: theme.spacing.lg}}>
        <Card>
          <Text style={styles.h2}>{statusHeadline}</Text>
          <Text style={styles.p}>{statusSub}</Text>

          {loadingPickup ? (
            <View style={{marginTop: theme.spacing.md, alignItems: 'flex-start'}}>
              <ActivityIndicator />
            </View>
          ) : null}

          <View style={{marginTop: theme.spacing.md}}>
            <Button label="Schedule Pickup" onPress={goToPickupRequest} variant="primary" disabled={hasActivePickup} />
          </View>

          {pickup?.id ? (
            <View style={{marginTop: theme.spacing.sm}}>
              <Button
                label="Open Pickup Status"
                onPress={() => navigation.navigate('Pickup Status', {pickupId: pickup.id})}
                variant="secondary"
              />
            </View>
          ) : null}
        </Card>

        <Card>
          <Text style={styles.h2}>Today’s scrap rates</Text>
          <Text style={styles.p}>Transparent ₹ per kg (display only)</Text>
          {loadingRates ? <ActivityIndicator style={{marginTop: 10}} /> : null}
          {!loadingRates && !rates.length ? <Text style={[styles.p, {marginTop: 10}]}>No rates found.</Text> : null}
          {rates.slice(0, 4).map((r) => (
            <View key={r.id} style={styles.rateRow}>
              <Text style={styles.rateName}>{r.name}</Text>
              <Text style={styles.rateValue}>₹{r.ratePerKg}/kg</Text>
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: {fontSize: 16, fontWeight: '400', color: theme.colors.text},
  p: {marginTop: 6, color: theme.colors.textMuted, fontWeight: '400', lineHeight: 18},
  rateRow: {marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  rateName: {color: theme.colors.text, fontWeight: '400'},
  rateValue: {color: theme.colors.text, fontWeight: '400'},
});
