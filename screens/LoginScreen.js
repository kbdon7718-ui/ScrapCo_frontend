/**
 * frontend/screens/LoginScreen.js
 *
 * Simple login screen (no real auth).
 * - Demonstrates form state with `useState`.
 * - Validates input and simulates a login by logging the object.
 * - Navigates to Signup screen if user needs to create an account.
 */

import React, { useState, useContext } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { AuthContext } from '../contexts/AuthContext';
import { authErrorMessage } from '../utils/authErrorMessage';
import { UiStatusContext } from '../contexts/UiStatusContext';

export default function LoginScreen({ navigation }) {
  // Form state: controlled inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmail, bypassed } = useContext(AuthContext);
  const ui = useContext(UiStatusContext);

  function validate() {
    if (!email.trim()) return 'Please enter your email.';
    if (!password) return 'Please enter your password.';
    return null;
  }

  function onLogin() {
    if (bypassed) {
      navigation.replace('Main');
      return;
    }
    const error = validate();
    if (error) {
      ui?.showError?.(error);
      return;
    }
    ui?.setLoading?.(true);
    loginWithEmail(email.trim(), password)
      .then(() => navigation.replace('Main'))
      .catch((e) => ui?.showError?.(authErrorMessage(e)))
      .finally(() => ui?.setLoading?.(false));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@example.com"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <View style={styles.actions}>
        <PrimaryButton title="Login" onPress={onLogin} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <PrimaryButton title="Sign Up" onPress={() => navigation.navigate('Signup')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '400', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '400', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  actions: { marginTop: 18 },
  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { color: '#6B7280', marginBottom: 8 },
});
