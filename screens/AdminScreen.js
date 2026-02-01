import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View} from 'react-native';

import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Screen from '../components/Screen';
import {adminCreateScrapType, adminGetScrapTypes, adminSetScrapRate} from '../utils/api';
import {theme} from '../theme';

export default function AdminScreen() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const [newTypeName, setNewTypeName] = useState('');
  const [rateDrafts, setRateDrafts] = useState({});

  const list = useMemo(() => rows || [], [rows]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminGetScrapTypes();
      setRows(resp.scrapTypes || []);
    } catch (e) {
      setRows([]);
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onAddType() {
    const name = newTypeName.trim();
    if (!name) {
      Alert.alert('Missing info', 'Enter a scrap type name');
      return;
    }
    try {
      setLoading(true);
      await adminCreateScrapType({name});
      setNewTypeName('');
      await load();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not create type');
    } finally {
      setLoading(false);
    }
  }

  async function onSaveRate(typeId) {
    const draft = String(rateDrafts[typeId] ?? '').trim();
    const ratePerKg = Number(draft);
    if (!draft || Number.isNaN(ratePerKg) || ratePerKg <= 0) {
      Alert.alert('Invalid rate', 'Enter a positive number');
      return;
    }

    try {
      setLoading(true);
      await adminSetScrapRate({scrapTypeId: typeId, ratePerKg});
      await load();
      setRateDrafts((prev) => ({...prev, [typeId]: ''}));
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save rate');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        <AppHeader title="Admin Portal" subtitle="Manage scrap types and prices" />

        <View style={{marginTop: theme.spacing.lg}}>
          <Card>
            <Text style={styles.h2}>Add scrap type</Text>
            <Input label="Type name" placeholder="e.g. Paper" value={newTypeName} onChangeText={setNewTypeName} />
            <View style={{marginTop: theme.spacing.md}}>
              <Button label="Add" onPress={onAddType} variant="primary" />
            </View>
          </Card>

          <Card>
            <Text style={styles.h2}>Scrap types & prices</Text>
            {loading ? <ActivityIndicator style={{marginTop: 10}} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!loading && !list.length ? <Text style={styles.hint}>No scrap types found.</Text> : null}

            {list.map((t) => (
              <View key={t.id} style={styles.row}>
                <View style={{flex: 1}}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.hint}>Current: {t.ratePerKg != null ? `₹${t.ratePerKg}/kg` : '—'}</Text>
                </View>

                <View style={{width: 140}}>
                  <Input
                    label="New ₹/kg"
                    placeholder="e.g. 25"
                    value={String(rateDrafts[t.id] ?? '')}
                    onChangeText={(v) => setRateDrafts((prev) => ({...prev, [t.id]: v}))}
                    keyboardType="numeric"
                  />
                  <Button label="Save" variant="secondary" onPress={() => onSaveRate(t.id)} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: {fontSize: 16, fontWeight: '400', color: theme.colors.text},
  error: {marginTop: 10, color: theme.colors.danger, fontWeight: '400'},
  hint: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400'},
  row: {marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  name: {fontWeight: '400', color: theme.colors.text},
});
