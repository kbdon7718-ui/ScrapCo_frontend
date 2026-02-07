import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Card from '../components/Card';
import Screen from '../components/Screen';
import StatusBadge from '../components/StatusBadge';
import GlassHeader from '../components/GlassHeader';
import {AuthContext} from '../contexts/AuthContext';
import {cancelPickup, findVendorAgain, getPickupStatus} from '../utils/api';
import {getSavedPickupIds, removeSavedPickupId} from '../utils/pickupHistory';
import {estimateEarnings, getActiveScrapRates} from '../utils/rates';
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

function normalizeStatus(status) {
  const raw = String(status || '').toUpperCase();
  if (raw === 'REQUESTED') return 'FINDING_VENDOR';
  if (raw === 'ACCEPTED') return 'ASSIGNED';
  return raw || 'UNKNOWN';
}

function sumApproxWeight(items) {
  let sum = 0;
  for (const it of items || []) {
    const qty = Number(it?.estimatedQuantity ?? it?.estimated_quantity ?? 0);
    if (Number.isFinite(qty)) sum += qty;
  }
  return Number(sum.toFixed(2));
}

function formatItems(items) {
  const list = (items || []).map((it) => {
    const name = it?.scrapTypeName || it?.scrap_types?.name || it?.scrapTypeId || it?.scrap_type_id;
    const qty = Number(it?.estimatedQuantity ?? it?.estimated_quantity ?? 0);
    const qtyText = Number.isFinite(qty) && qty > 0 ? ` (${qty} kg)` : '';
    return name ? `${name}${qtyText}` : null;
  });
  return list.filter(Boolean).join(', ');
}

export default function MyPickupsScreen({navigation}) {
  const {session} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [ratesRows, setRatesRows] = useState([]);
  const loadSeq = useRef(0);
  const actionPressingRef = useRef(false);

  const normalized = useMemo(() => {
    return (rows || []).map((r) => {
      const status = normalizeStatus(r.status);
      const vendorRef = r.assignedVendorRef || r.assigned_vendor_ref || r?.vendor?.ref || null;
      const vendorName = r?.vendor?.name || null;
      const vendorPhone = r?.vendor?.phone || null;
      const items = r.items || r.pickup_items || [];
      const approxWeight = sumApproxWeight(items);
      const estimatedAmount = estimateEarnings({items, ratesRows});
      const etaMinutes = typeof r.etaMinutes === 'number' ? r.etaMinutes : null;
      const etaText =
        typeof etaMinutes === 'number'
          ? `${etaMinutes} min`
          : status === 'ON_THE_WAY'
            ? '~15 min'
            : status === 'ASSIGNED'
              ? '~30 min'
              : '—';

      const isFinding = status === 'FINDING_VENDOR' || status === 'NO_VENDOR_AVAILABLE';
      const isAssigned = status === 'ASSIGNED' || status === 'ON_THE_WAY';
      const isCompleted = status === 'COMPLETED';
      const isCancelled = status === 'CANCELLED' || status === 'CANCELED';

      const primaryStatusText =
        status === 'FINDING_VENDOR'
          ? 'Finding vendor'
          : status === 'NO_VENDOR_AVAILABLE'
            ? 'No vendor available'
            : status === 'ASSIGNED'
              ? 'Assigned'
              : status === 'ON_THE_WAY'
                ? 'On the way'
                : status === 'COMPLETED'
                  ? 'Completed'
                  : status === 'CANCELLED' || status === 'CANCELED'
                    ? 'Cancelled'
                    : status;

      return {
        id: r.id,
        status,
        createdAt: r.createdAt || r.created_at,
        timeSlot: r.timeSlot || r.time_slot,
        address: r.address,
        items,
        itemsText: formatItems(items) || '—',
        approxWeight,
        estimatedAmount: Number.isFinite(estimatedAmount) ? Math.round(estimatedAmount) : null,
        vendorRef,
        vendorName,
        vendorPhone,
        etaMinutes,
        etaText,
        isFinding,
        isAssigned,
        isCompleted,
        isCancelled,
        primaryStatusText,
      };
    });
  }, [rows, ratesRows]);

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

  async function load() {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      if (!token) {
        if (seq === loadSeq.current) {
          setRows([]);
          setError('Please log in to view pickup history.');
        }
        return;
      }

      const ids = await getSavedPickupIds();
      if (!ids.length) {
        if (seq === loadSeq.current) setRows([]);
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

      if (seq === loadSeq.current) setRows(results.filter(Boolean));
    } catch (e) {
      if (seq === loadSeq.current) {
        setError(e?.message || 'Failed to load pickups');
        setRows([]);
      }
    } finally {
      if (seq === loadSeq.current) setLoading(false);
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
    if (s === 'UNKNOWN') return false;
    return !['COMPLETED', 'CANCELLED', 'CANCELED'].includes(s);
  }

  async function onCancelOrder(item) {
    const pickupId = item?.id;
    try {
      const token = session?.access_token;
      if (!token) {
        Alert.alert('Login required', 'Please log in to cancel this pickup.');
        return;
      }
      if (!pickupId) return;
      await cancelPickup({pickupId, accessToken: token});
      Alert.alert('Cancelled', 'Your pickup has been cancelled.');
      await load();
    } catch (e) {
      Alert.alert('Could not cancel', e?.message || 'Failed to cancel pickup');
    }
  }

  function tryCall(phone) {
    const p = String(phone || '').trim();
    if (!p) return;
    const url = `tel:${p}`;
    Linking.openURL(url).catch(() => {
      // ignore
    });
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

          // Optimistically remove from UI first, so the list updates immediately.
          setRows((prev) => (Array.isArray(prev) ? prev.filter((r) => String(r?.id) !== String(pickupId)) : prev));

          let cancelFailed = null;
          try {
            const token = session?.access_token;
            if (token && canCancelStatus(item?.status)) {
              await cancelPickup({pickupId, accessToken: token});
            }
          } catch (e) {
            cancelFailed = e;
          }

          try {
            await removeSavedPickupId(pickupId);
          } finally {
            // Re-load to keep list consistent with storage.
            await load();
          }

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
      <GlassHeader title="ScrapCo" status="" />

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
          <Pressable
            onPress={() => {
              if (actionPressingRef.current) return;
              navigation.navigate('Pickup Details', {pickupId: item.id});
            }}
          >
            <Card>
              <StatusBadge status={item.status} />
              <Text style={styles.rowTitle}>Order #{shortId(item.id)}</Text>
              <Text style={styles.rowSub}>{fmtDateTime(item.createdAt)} • Slot: {item.timeSlot || '—'}</Text>

              <View style={styles.infoBlock}>
                <View style={styles.kvRow}>
                  <Text style={styles.kvKey}>Status</Text>
                  <Text style={styles.kvVal}>{item.primaryStatusText}</Text>
                </View>

                {item.isFinding ? (
                  <>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Scrap items</Text>
                      <Text style={styles.kvVal} numberOfLines={2}>
                        {item.itemsText}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Approx weight</Text>
                      <Text style={styles.kvVal}>{item.approxWeight} kg</Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Estimate</Text>
                      <Text style={styles.kvVal}>{item.estimatedAmount == null ? '—' : `₹${item.estimatedAmount}`}</Text>
                    </View>
                  </>
                ) : null}

                {item.isAssigned || item.isCompleted ? (
                  <>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Vendor</Text>
                      <Text style={styles.kvVal} numberOfLines={1}>
                        {item.vendorName || item.vendorRef || '—'}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Phone</Text>
                      <Pressable onPress={() => tryCall(item.vendorPhone)} disabled={!item.vendorPhone}>
                        <Text style={[styles.kvVal, item.vendorPhone ? styles.link : null]}>
                          {item.vendorPhone || '—'}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Scrap items</Text>
                      <Text style={styles.kvVal} numberOfLines={2}>
                        {item.itemsText}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>ETA</Text>
                      <Text style={styles.kvVal}>{item.etaText}</Text>
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.actionsRow}>
                {item.status === 'NO_VENDOR_AVAILABLE' ? (
                  <Pressable
                    onPressIn={() => {
                      actionPressingRef.current = true;
                    }}
                    onPress={() => {
                      actionPressingRef.current = true;
                      onFindVendorAgain(item.id);
                      setTimeout(() => {
                        actionPressingRef.current = false;
                      }, 0);
                    }}
                    style={[styles.actionBtn, styles.actionPrimary]}
                  >
                    <Text style={[styles.actionText, styles.actionTextPrimary]}>Find vendor again</Text>
                  </Pressable>
                ) : null}

                {canCancelStatus(item.status) ? (
                  <Pressable
                    onPressIn={() => {
                      actionPressingRef.current = true;
                    }}
                    onPress={() => {
                      actionPressingRef.current = true;
                      onCancelOrder(item);
                      setTimeout(() => {
                        actionPressingRef.current = false;
                      }, 0);
                    }}
                    style={[styles.actionBtn, styles.actionDanger]}
                  >
                    <Text style={[styles.actionText, styles.actionTextDanger]}>Cancel</Text>
                  </Pressable>
                ) : null}

                  <Pressable
                  onPressIn={() => {
                    actionPressingRef.current = true;
                  }}
                  onPress={(e) => {
                    actionPressingRef.current = true;
                    onDeleteOrder(item);
                    setTimeout(() => {
                      actionPressingRef.current = false;
                    }, 0);
                  }}
                    style={[styles.actionBtn, styles.actionNeutral]}
                >
                  <Text style={[styles.actionText, styles.actionTextNeutral]}>Remove</Text>
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
  infoBlock: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSoft,
  },
  kvRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 8},
  kvKey: {width: 110, color: theme.colors.textMuted, fontWeight: '700', fontSize: 12},
  kvVal: {flex: 1, color: theme.colors.text, fontWeight: '500', fontSize: 12, textAlign: 'right'},
  link: {color: theme.colors.primary, fontWeight: '800'},
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
  actionNeutral: {borderColor: theme.colors.border, backgroundColor: theme.colors.card},
  actionText: {fontWeight: '500'},
  actionTextPrimary: {color: theme.colors.green},
  actionTextDanger: {color: theme.colors.danger},
  actionTextNeutral: {color: theme.colors.textMuted},
});
