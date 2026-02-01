import React, {useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, StyleSheet, Text, View} from 'react-native';

import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import StatusBadge from '../components/StatusBadge';
import {AuthContext} from '../contexts/AuthContext';
import {UiStatusContext} from '../contexts/UiStatusContext';
import {cancelPickup, findVendorAgain, getPickupStatus} from '../utils/api';
import {estimateEarnings, getActiveScrapRates} from '../utils/rates';
import {removeSavedPickupId} from '../utils/pickupHistory';
import {theme} from '../theme';

function normalizeStatus(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'REQUESTED') return 'FINDING_VENDOR';
  if (s === 'ACCEPTED') return 'ASSIGNED';
  return s;
}

function shortId(id) {
  if (!id) return '—';
  const s = String(id);
  return s.length > 12 ? `${s.slice(0, 8)}…` : s;
}

export default function PickupStatusScreen({navigation, route}) {
  const {session} = useContext(AuthContext);
  const ui = useContext(UiStatusContext);
  const {pickupId} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState(null);
  const [error, setError] = useState(null);
  const [ratesRows, setRatesRows] = useState([]);

  const normalized = useMemo(() => {
    if (!row) return null;
    const status = normalizeStatus(row.status);
    return {
      id: row.id,
      status,
      createdAt: row.createdAt || row.created_at,
      address: row.address,
      timeSlot: row.timeSlot || row.time_slot,
      vendorRef: row.assignedVendorRef || row.assigned_vendor_ref || null,
      items: row.items || row.pickup_items || [],
    };
  }, [row]);

  const earningsEstimate = useMemo(() => {
    if (!normalized) return null;
    return estimateEarnings({items: normalized.items, ratesRows});
  }, [normalized, ratesRows]);

  async function load() {
    if (!pickupId) return;
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      if (!token) {
        setRow(null);
        setError('Please log in to view pickup status.');
        return;
      }

      const resp = await getPickupStatus({pickupId, accessToken: token});
      setRow(resp.pickup || null);
    } catch (e) {
      setError(e?.message || 'Failed to load pickup');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [pickupId, session?.access_token]);

  async function onTryAgainLater() {
    try {
      const token = session?.access_token;
      if (!token) {
        Alert.alert('Login required', 'Please log in to retry.');
        return;
      }
      ui?.setLoading?.(true);
      await findVendorAgain({pickupId, accessToken: token});
      await load();
    } catch (e) {
      Alert.alert('Could not retry', e?.message || 'Failed to restart vendor search');
    } finally {
      ui?.setLoading?.(false);
    }
  }

  async function onCancelPickup() {
    Alert.alert('Cancel pickup?', 'We will stop searching / cancel the pickup request.', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = session?.access_token;
            if (!token) {
              Alert.alert('Login required', 'Please log in to cancel.');
              return;
            }
            ui?.setLoading?.(true);
            await cancelPickup({pickupId, accessToken: token});
            await removeSavedPickupId(pickupId);
            navigation.popToTop();
          } catch (e) {
            Alert.alert('Could not cancel', e?.message || 'Failed to cancel pickup');
          } finally {
            ui?.setLoading?.(false);
          }
        },
      },
    ]);
  }

  const status = normalized?.status;
  const title =
    status === 'FINDING_VENDOR'
      ? 'Finding a nearby vendor…'
      : status === 'ASSIGNED'
        ? 'Pickup confirmed'
        : status === 'NO_VENDOR_AVAILABLE'
          ? 'No vendor available right now'
          : status === 'COMPLETED'
            ? 'Pickup completed'
            : 'Pickup status';

  return (
    <Screen>
      <AppHeader title="Pickup" subtitle="Bas request daali aur wait" />

      <View style={{marginTop: theme.spacing.lg, flex: 1}}>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!pickupId ? (
          <Card>
            <Text style={styles.h2}>No pickup selected</Text>
            <Text style={styles.p}>Create a pickup first.</Text>
          </Card>
        ) : null}

        {normalized ? (
          <Card>
            <View style={styles.statusTopRow}>
              <StatusBadge status={normalized.status} />
              <Text style={styles.small}>#{shortId(normalized.id)}</Text>
            </View>

            <Text style={styles.h1}>{title}</Text>

            {normalized.status === 'FINDING_VENDOR' ? (
              <View style={{marginTop: theme.spacing.md}}>
                <Text style={styles.p}>We’re finding the best nearby vendor for you.</Text>
                <View style={{marginTop: 14, alignItems: 'flex-start'}}>
                  <ActivityIndicator />
                </View>

                <View style={{marginTop: theme.spacing.md}}>
                  <Button label="Cancel pickup" onPress={onCancelPickup} variant="danger" />
                </View>
              </View>
            ) : null}

            {normalized.status === 'ASSIGNED' ? (
              <View style={{marginTop: theme.spacing.md}}>
                <Text style={styles.p}>A vendor has accepted your pickup.</Text>
                <View style={{marginTop: theme.spacing.md}}>
                  <Text style={styles.kv}>Vendor: {normalized.vendorRef ? String(normalized.vendorRef) : 'Assigned'}</Text>
                  <Text style={styles.kv}>Time slot: {normalized.timeSlot || '—'}</Text>
                  <Text style={styles.kv} numberOfLines={3}>
                    Address: {normalized.address || '—'}
                  </Text>
                </View>

                <View style={{marginTop: theme.spacing.md}}>
                  <Button label="Cancel pickup" onPress={onCancelPickup} variant="danger" />
                </View>

                <View style={{marginTop: theme.spacing.sm}}>
                  <Button
                    label="Request another pickup"
                    onPress={() => navigation.navigate('SchedulePickup')}
                    variant="secondary"
                  />
                </View>
              </View>
            ) : null}

            {normalized.status === 'NO_VENDOR_AVAILABLE' ? (
              <View style={{marginTop: theme.spacing.md}}>
                <Text style={styles.p}>No worries — this happens when all nearby vendors are busy.</Text>
                <View style={{marginTop: theme.spacing.md}}>
                  <Button label="Try again later" onPress={onTryAgainLater} variant="primary" />
                </View>
              </View>
            ) : null}

            {normalized.status === 'COMPLETED' ? (
              <View style={{marginTop: theme.spacing.md}}>
                <Text style={styles.p}>Thanks for recycling with ScrapCo.</Text>
                <View style={{marginTop: theme.spacing.md}}>
                  <Text style={styles.kv}>Estimated earnings: {earningsEstimate == null ? '—' : `₹${earningsEstimate}`}</Text>
                </View>

                <View style={{marginTop: theme.spacing.md}}>
                  <Button
                    label="View Details"
                    onPress={() => navigation.navigate('Pickup Details', {pickupId: normalized.id})}
                    variant="secondary"
                  />
                </View>
              </View>
            ) : null}

            {normalized.status !== 'COMPLETED' && normalized.status !== 'NO_VENDOR_AVAILABLE' ? (
              <View style={{marginTop: theme.spacing.md}}>
                <Pressable onPress={() => load()} style={styles.refreshLink}>
                  <Text style={styles.refreshText}>Refresh</Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusTopRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  h1: {marginTop: theme.spacing.md, fontSize: 20, fontWeight: '500', color: theme.colors.text},
  h2: {fontSize: 16, fontWeight: '500', color: theme.colors.text},
  p: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400', lineHeight: 18},
  kv: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400'},
  small: {color: theme.colors.textMuted, fontWeight: '400'},
  error: {color: theme.colors.danger, marginBottom: 10, fontWeight: '400'},
  refreshLink: {alignSelf: 'flex-start'},
  refreshText: {color: theme.colors.green, fontWeight: '500'},
});
