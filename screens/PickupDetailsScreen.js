import React, {useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import AppHeader from '../components/AppHeader';
import Card from '../components/Card';
import Screen from '../components/Screen';
import StatusBadge from '../components/StatusBadge';
import {AuthContext} from '../contexts/AuthContext';
import {getPickupStatus} from '../utils/api';
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

export default function PickupDetailsScreen({route}) {
  const {session} = useContext(AuthContext);
  const {pickupId} = route.params || {};
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState(null);
  const [error, setError] = useState(null);
  const [ratesRows, setRatesRows] = useState([]);

  const normalized = useMemo(() => {
    if (!row) return null;
    const raw = String(row.status || '').toUpperCase();
    const status = raw === 'REQUESTED' ? 'FINDING_VENDOR' : raw === 'ACCEPTED' ? 'ASSIGNED' : raw;
    return {
      id: row.id,
      status,
      createdAt: row.createdAt || row.created_at,
      address: row.address,
      timeSlot: row.timeSlot || row.time_slot,
      latitude: row.latitude,
      longitude: row.longitude,
      items: row.items || row.pickup_items || [],
    };
  }, [row]);

  const approxWeight = useMemo(() => {
    const items = normalized?.items || [];
    let sum = 0;
    for (const it of items) {
      const qty = Number(it.estimatedQuantity || it.estimated_quantity || 0);
      if (Number.isFinite(qty)) sum += qty;
    }
    return Number(sum.toFixed(2));
  }, [normalized]);

  const earningsEstimate = useMemo(() => {
    if (!normalized) return null;
    return estimateEarnings({items: normalized.items, ratesRows});
  }, [normalized, ratesRows]);

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
    let mounted = true;
    (async () => {
      if (!pickupId) return;
      setLoading(true);
      setError(null);
      try {
        const token = session?.access_token;
        if (!token) {
          if (mounted) setError('Please log in to view pickup status.');
          return;
        }

        const resp = await getPickupStatus({pickupId, accessToken: token});
        if (mounted) setRow(resp.pickup || null);
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load pickup');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pickupId]);

  return (
    <Screen>
      <AppHeader title="Pickup Details" subtitle="Receipt" />

      <View style={{marginTop: theme.spacing.lg, flex: 1}}>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {normalized ? (
          <Card>
            <StatusBadge status={normalized.status} />

            <Text style={styles.h2}>Pickup #{shortId(normalized.id)}</Text>
            <Text style={styles.kv}>Date & time: {fmtDateTime(normalized.createdAt)}</Text>
            <Text style={styles.kv}>Time slot: {normalized.timeSlot || '—'}</Text>
            <Text style={styles.kv}>Approx weight: {approxWeight} kg</Text>
            <Text style={styles.kv}>Estimated amount: {earningsEstimate == null ? '—' : `₹${earningsEstimate}`}</Text>

            <Text style={styles.section}>Scrap types</Text>
            {(normalized.items || []).length ? (
              (normalized.items || []).map((it) => (
                <Text key={it.id || `${it.scrap_type_id || it.scrapTypeId}`} style={styles.item}>
                  • {it.scrapTypeName || it.scrap_types?.name || it.scrapTypeId || it.scrap_type_id}
                </Text>
              ))
            ) : (
              <Text style={styles.item}>—</Text>
            )}

            <Text style={styles.section}>Pickup address</Text>
            <Text style={styles.item}>{normalized.address || '—'}</Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: {marginTop: theme.spacing.md, fontSize: 18, fontWeight: '500', color: theme.colors.text},
  kv: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400'},
  section: {marginTop: 16, fontWeight: '500', color: theme.colors.text},
  item: {marginTop: 8, color: theme.colors.textMuted, fontWeight: '400'},
  error: {color: theme.colors.danger, marginBottom: 10, fontWeight: '400'},
});
