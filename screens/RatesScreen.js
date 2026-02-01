import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native';
import Card from '../components/Card';
import GlassHeader from '../components/GlassHeader';
import Screen from '../components/Screen';
import {isSupabaseConfigured, supabase} from '../lib/supabase';
import {theme} from '../theme';

export default function RatesScreen() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured || !supabase) {
        setRows([]);
        setError('Supabase is not configured. Create frontend/.env and restart Expo.');
        return;
      }
      const {data: types, error: typesErr} = await supabase
        .from('scrap_types')
        .select('id,name,description')
        .order('name', {ascending: true});
      if (typesErr) throw typesErr;

      const {data: rates, error: ratesErr} = await supabase
        .from('scrap_rates')
        .select('scrap_type_id,rate_per_kg,effective_from,is_active')
        .eq('is_active', true);
      if (ratesErr) throw ratesErr;

      const latestRateByType = new Map();
      for (const r of rates || []) {
        const prev = latestRateByType.get(r.scrap_type_id);
        if (!prev) {
          latestRateByType.set(r.scrap_type_id, r);
          continue;
        }
        const prevDate = prev.effective_from ? new Date(prev.effective_from) : new Date(0);
        const nextDate = r.effective_from ? new Date(r.effective_from) : new Date(0);
        if (nextDate >= prevDate) latestRateByType.set(r.scrap_type_id, r);
      }

      setRows(
        (types || []).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          ratePerKg: latestRateByType.get(t.id)?.rate_per_kg ?? null,
        }))
      );
    } catch (e) {
      setError(e?.message || 'Failed to load rates');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen variant="soft">
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{paddingBottom: 28}}
        ListHeaderComponent={
          <>
            <GlassHeader title="ScrapCo" status="Transparent ₹ per kg" />

            <View style={{marginTop: theme.spacing.lg}}>
              <Text style={styles.pageTitle}>Rates</Text>
              <Text style={styles.pageSubtitle}>TODAY'S SCRAP PRICES</Text>
            </View>

            <View style={{marginTop: theme.spacing.md}}>
              {loading ? <ActivityIndicator /> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </>
        }
        renderItem={({item}) => (
          <Card>
            <View style={styles.rateRow}>
              <View style={{flex: 1}}>
                <Text style={styles.name}>{item.name}</Text>
                {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              </View>
              <View style={styles.ratePill}>
                <Text style={styles.rateText}>{item.ratePerKg == null ? 'N/A' : `₹${item.ratePerKg}/kg`}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {marginTop: 4, fontSize: 22, fontWeight: '800', color: theme.colors.text},
  pageSubtitle: {marginTop: 6, fontSize: 11, letterSpacing: 1.2, fontWeight: '800', color: theme.colors.textMuted},
  rateRow: {flexDirection: 'row', alignItems: 'center'},
  name: {fontSize: 16, fontWeight: '700', color: theme.colors.text},
  desc: {marginTop: 6, color: theme.colors.textMuted, fontWeight: '400', lineHeight: 18},
  ratePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(46,204,113,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.22)',
    marginLeft: theme.spacing.md,
  },
  rateText: {fontWeight: '800', color: theme.colors.green},
  error: {color: theme.colors.danger, marginBottom: 10, fontWeight: '400'},
});
