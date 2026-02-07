/**
 * frontend/screens/SignupScreen.js
 *
 * Simple signup screen (no real auth or backend).
 * - Collects name, email, password, confirm password
 * - Validates inputs and simulates account creation
 */

import React, { useState, useContext } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { AuthContext } from '../contexts/AuthContext';
import { authErrorMessage } from '../utils/authErrorMessage';
import { UiStatusContext } from '../contexts/UiStatusContext';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { signupWithEmail, bypassed } = useContext(AuthContext);
  const ui = useContext(UiStatusContext);

  function validate() {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!password) return 'Please enter a password.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  function onSignup() {
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
    signupWithEmail(name.trim(), email.trim(), password)
      .then(() => {
        ui?.showInfo?.('Sign up successful. Please login.');
        navigation.replace('Login');
      })
      .catch((e) => ui?.showError?.(authErrorMessage(e)))
      .finally(() => ui?.setLoading?.(false));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" />

      <Text style={styles.label}>Confirm password</Text>
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry />

      <View style={styles.actions}>
        <PrimaryButton title="Create account" onPress={onSignup} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '400', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '400', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, marginTop: 6 },
  actions: { marginTop: 18 },
});
