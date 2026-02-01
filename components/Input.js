import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {theme} from '../theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  editable = true,
}) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline ? styles.multiline : null, !editable ? styles.disabled : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginTop: theme.spacing.md},
  label: {fontSize: 12, fontWeight: '400', letterSpacing: 0.3, marginBottom: 6, color: theme.colors.textMuted},
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.bg,
  },
  multiline: {minHeight: 80, textAlignVertical: 'top'},
  disabled: {backgroundColor: '#F1F5F9', color: theme.colors.textMuted},
});
