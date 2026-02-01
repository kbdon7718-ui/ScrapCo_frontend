import React, {useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Card from '../components/Card';
import Screen from '../components/Screen';
import StatusBadge from '../components/StatusBadge';
import GlassHeader from '../components/GlassHeader';
import {AuthContext} from '../contexts/AuthContext';
import {cancelPickup, findVendorAgain, getPickupStatus} from '../utils/api';
import {getSavedPickupIds, removeSavedPickupId} from '../utils/pickupHistory';
import {theme} from '../theme';

function fmtDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function shortId(id) {
  if (!id) return '—';
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 8)}…` : s;
}

export default function MyPickupsScreen({navigation}) {
  const {session} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const normalized = useMemo(() => {
    return (rows || []).map((r) => {
      const status = r.status;
      const accepted = String(status || '').toUpperCase() === 'ACCEPTED' || !!r.assignedVendorRef || !!r.assigned_vendor_ref;
      const vendorRef = r.assignedVendorRef || r.assigned_vendor_ref || null;
      return {
        id: r.id,
        status,
        createdAt: r.createdAt || r.created_at,
        timeSlot: r.timeSlot || r.time_slot,
        address: r.address,
        itemsCount: (r.items || r.pickup_items || []).length,
        vendorMessage: accepted ? `Vendor accepted${vendorRef ? ` (${vendorRef})` : ''}` : 'Waiting for vendor acceptance',
      };
    });
  }, [rows]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      if (!token) {
        setRows([]);
        setError('Please log in to view pickup history.');
        return;
      }

      const ids = await getSavedPickupIds();
      if (!ids.length) {
        setRows([]);
        return;
      }

      const results = await Promise.all(
        ids.map(async (pickupId) => {
          try {
            const resp = await getPickupStatus({pickupId, accessToken: token});
            return resp.pickup || null;
          } catch (e) {
            // Keep a stub row so the list doesn't collapse completely
            return {id: pickupId, status: 'UNKNOWN'};
          }
        })
      );

      setRows(results.filter(Boolean));
    } catch (e) {
      setError(e?.message || 'Failed to load pickups');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [session?.access_token]);

  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [session?.access_token])
  );

  function canCancelStatus(status) {
    const s = String(status || '').toUpperCase();
    if (!s) return true;
    return !['COMPLETED', 'CANCELLED', 'CANCELED'].includes(s);
  }

  async function onDeleteOrder(item) {
    const pickupId = item?.id;
    const willTryCancel = Boolean(session?.access_token) && canCancelStatus(item?.status);

    Alert.alert(
      'Delete order?',
      willTryCancel
        ? 'This will cancel the pickup (if possible) and remove it from your list.'
        : 'This will remove the order from your list.',
      [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!pickupId) return;

          let cancelFailed = null;
          try {
            const token = session?.access_token;
            if (token && canCancelStatus(item?.status)) {
              await cancelPickup({pickupId, accessToken: token});
            }
          } catch (e) {
            cancelFailed = e;
          }

          await removeSavedPickupId(pickupId);
          await load();

          if (cancelFailed) {
            Alert.alert(
              'Removed from history',
              'We could not cancel this pickup on server (maybe it is already completed), but it has been removed from your list.'
            );
          }
        },
      },
      ]
    );
  }

  async function onFindVendorAgain(pickupId) {
    try {
      const token = session?.access_token;
      if (!token) {
        Alert.alert('Login required', 'Please log in to retry vendor assignment.');
        return;
      }

      await findVendorAgain({pickupId, accessToken: token});
      Alert.alert('Searching again', 'We are finding the nearest available vendor.');
      await load();
    } catch (e) {
      Alert.alert('Could not retry', e?.message || 'Failed to restart vendor dispatch');
    }
  }

  return (
    <Screen variant="soft">
      <GlassHeader title="ScrapCo" status="LIVE IN LAHORE" />

      <View style={{marginTop: theme.spacing.lg}}>
        <Text style={styles.pageTitle}>History</Text>
        <Text style={styles.pageSubtitle}>YOUR PAST TRANSACTIONS</Text>
      </View>

      <View style={{marginTop: theme.spacing.md, flex: 1}}>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && (!normalized || normalized.length === 0) ? (
        <Card>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Create a pickup and it will appear here.</Text>
          <View style={{marginTop: theme.spacing.md}}>
            <Pressable onPress={load} style={styles.refreshBtn}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      <FlatList
        data={normalized}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{paddingBottom: 24}}
        renderItem={({item}) => (
          <Pressable onPress={() => navigation.navigate('Pickup Details', {pickupId: item.id})}>
            <Card>
              <StatusBadge status={item.status} />
              <Text style={styles.rowTitle}>Order #{shortId(item.id)}</Text>
              <Text style={styles.rowSub}>
                {fmtDateTime(item.createdAt)} • Slot: {item.timeSlot || '—'}
              </Text>
              <Text style={styles.rowSub}>{item.vendorMessage}</Text>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onFindVendorAgain(item.id);
                  }}
                  style={[styles.actionBtn, styles.actionPrimary]}
                >
                  <Text style={[styles.actionText, styles.actionTextPrimary]}>Find vendor again</Text>
                </Pressable>

                  <Pressable
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onDeleteOrder(item);
                  }}
                  style={[styles.actionBtn, styles.actionDanger]}
                >
                  <Text style={[styles.actionText, styles.actionTextDanger]}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          </Pressable>
        )}
      />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {marginTop: 4, fontSize: 22, fontWeight: '800', color: theme.colors.text},
  pageSubtitle: {
    marginTop: 6,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  rowTitle: {marginTop: 10, fontSize: 16, fontWeight: '400', color: theme.colors.text},
  rowSub: {marginTop: 6, color: theme.colors.textMuted, fontWeight: '400'},
  error: {color: theme.colors.danger, marginBottom: 10, fontWeight: '400'},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: theme.colors.text},
  emptySub: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400'},
  refreshBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  refreshBtnText: {fontWeight: '700', color: theme.colors.primary},
  actionsRow: {marginTop: theme.spacing.md, flexDirection: 'row', gap: 10},
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionPrimary: {borderColor: theme.colors.green, backgroundColor: 'rgba(37, 211, 102, 0.10)'},
  actionDanger: {borderColor: theme.colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.08)'},
  actionText: {fontWeight: '500'},
  actionTextPrimary: {color: theme.colors.green},
  actionTextDanger: {color: theme.colors.danger},
});
