import React from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import Card from '../components/Card';

export default function SupabaseSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Setup Required</Text>

      <Card>
        <Text style={styles.text}>
          This app needs Supabase environment variables before it can run.
        </Text>

        <Text style={styles.text}>1) Create a file: frontend/.env</Text>
        <Text style={styles.text}>
          2) Add these lines (values from your Supabase project):
        </Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=...</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY=...</Text>

        <Text style={styles.text}>
          3) Restart Expo (stop and run npm start again).
        </Text>

        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://supabase.com/docs')}
        >
          Open Supabase Docs
        </Text>
      </Card>

      <Text style={styles.note}>
        If you already created frontend/.env, ensure it is in the frontend folder (not the repo root).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, justifyContent: 'center'},
  title: {fontSize: 20, fontWeight: '400', marginBottom: 12},
  text: {marginTop: 8, color: '#111827'},
  code: {marginTop: 6, fontFamily: 'monospace', color: '#111827'},
  link: {marginTop: 14, color: '#2563EB', fontWeight: '400'},
  note: {marginTop: 14, color: '#6B7280'},
});
