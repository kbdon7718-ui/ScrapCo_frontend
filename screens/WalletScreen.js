import React, {useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';

import AppHeader from '../components/AppHeader';
import Card from '../components/Card';
import Screen from '../components/Screen';
import {AuthContext} from '../contexts/AuthContext';
import {getPickupStatus} from '../utils/api';
import {getSavedPickupIds} from '../utils/pickupHistory';
import {estimateEarnings, getActiveScrapRates} from '../utils/rates';
import {theme} from '../theme';

function normalizeStatus(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'ACCEPTED') return 'ASSIGNED';
  if (s === 'REQUESTED') return 'FINDING_VENDOR';
  return s;
}

function fmtDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

export default function WalletScreen({navigation}) {
  const {session} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [ratesRows, setRatesRows] = useState([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      if (!token) {
        setRows([]);
        setError('Please log in to view earnings.');
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
          } catch {
            return null;
          }
        })
      );

      setRows(results.filter(Boolean));
    } catch (e) {
      setError(e?.message || 'Failed to load earnings');
      setRows([]);
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
  }, [session?.access_token]);

  const completed = useMemo(() => {
    return (rows || [])
      .map((r) => {
        const status = normalizeStatus(r.status);
        const items = r.items || r.pickup_items || [];
        const amount = estimateEarnings({items, ratesRows});
        return {
          id: r.id,
          status,
          createdAt: r.createdAt || r.created_at,
          amount,
        };
      })
      .filter((r) => r.status === 'COMPLETED')
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [rows, ratesRows]);

  const totalEarned = useMemo(() => {
    return completed.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [completed]);

  return (
    <Screen>
      <AppHeader title="Wallet" subtitle="Your earnings" />

      <View style={{marginTop: theme.spacing.lg, flex: 1}}>
        {loading ? <ActivityIndicator /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Card>
          <Text style={styles.h2}>Total earned</Text>
          <Text style={styles.total}>₹{totalEarned}</Text>
          <Text style={styles.hint}>Earnings are estimated from current active rates.</Text>
        </Card>

        <FlatList
          data={completed}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Card>
              <Text style={styles.h2}>No completed pickups yet</Text>
              <Text style={styles.hint}>Once a pickup is completed, it will appear here.</Text>
            </Card>
          )}
          contentContainerStyle={{paddingBottom: 24}}
          renderItem={({item}) => (
            <Pressable onPress={() => navigation.navigate('Pickup Details', {pickupId: item.id})}>
              <Card>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>Pickup</Text>
                  <Text style={styles.rowAmount}>₹{item.amount}</Text>
                </View>
                <Text style={styles.rowSub}>{fmtDate(item.createdAt)}</Text>
              </Card>
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: {fontSize: 16, fontWeight: '500', color: theme.colors.text},
  total: {marginTop: 10, fontSize: 28, fontWeight: '600', color: theme.colors.text},
  hint: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400', lineHeight: 18},
  rowTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  rowTitle: {fontSize: 16, fontWeight: '500', color: theme.colors.text},
  rowAmount: {fontSize: 16, fontWeight: '600', color: theme.colors.green},
  rowSub: {marginTop: 8, color: theme.colors.textMuted, fontWeight: '400'},
  error: {color: theme.colors.danger, marginBottom: 10, fontWeight: '400'},
});
