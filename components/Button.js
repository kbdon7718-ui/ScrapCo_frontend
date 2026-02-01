import React from 'react';
import {Pressable, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {theme} from '../theme';

export default function Button({label, onPress, loading = false, variant = 'primary', disabled = false}) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({pressed}) => [
        styles.base,
        isPrimary ? styles.primary : null,
        isSecondary ? styles.secondary : null,
        isDanger ? styles.danger : null,
        pressed ? styles.pressed : null,
        (loading || disabled) ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isDanger ? '#FFFFFF' : '#0F172A'} />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.textPrimary : null,
            isSecondary ? styles.textSecondary : null,
            isDanger ? styles.textDanger : null,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {backgroundColor: theme.colors.primary || theme.colors.sky},
  secondary: {backgroundColor: theme.colors.secondary || theme.colors.green},
  danger: {backgroundColor: theme.colors.danger},
  pressed: {opacity: 0.96, transform: [{scale: 0.95}]},
  disabled: {opacity: 0.55},
  text: {fontSize: 14, fontWeight: '700', fontFamily: theme.fonts?.ui, letterSpacing: 0.2},
  textPrimary: {color: '#0F172A'},
  textSecondary: {color: '#0F172A'},
  textDanger: {color: '#FFFFFF'},
});
