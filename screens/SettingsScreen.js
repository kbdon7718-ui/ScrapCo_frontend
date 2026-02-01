import React, {useContext} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import {AuthContext} from '../contexts/AuthContext';
import {theme} from '../theme';

export default function SettingsScreen() {
  const {logout, bypassed} = useContext(AuthContext);

  async function onLogout() {
    try {
      await logout();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not logout');
    }
  }

  return (
    <Screen>
      <AppHeader title="Settings" subtitle="Account & app preferences" />

      <View style={{marginTop: theme.spacing.lg}}>
        <Card>
          <Text style={styles.row}>Mode</Text>
          <Text style={styles.hint}>{bypassed ? 'Direct login (dev)' : 'Supabase Auth'}</Text>
        </Card>

        <Card>
          <Text style={styles.row}>Account</Text>
          <Text style={styles.hint}>Logout will return to the login screen.</Text>
          <View style={{marginTop: theme.spacing.md}}>
            <Button label="Logout" variant="secondary" onPress={onLogout} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {fontSize: 14, fontWeight: '400', color: theme.colors.text},
  hint: {marginTop: 8, color: theme.colors.textMuted, fontWeight: '400'},
});
