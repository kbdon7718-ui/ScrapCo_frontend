import React from 'react';
import {ActivityIndicator, Platform, StyleSheet, Text, View} from 'react-native';

export default function LoadingOverlay({visible, message = 'Loading...'}) {
  if (!visible) return null;

  return (
    <View pointerEvents={Platform.OS === 'web' ? 'none' : 'auto'} style={styles.backdrop}>
      <View style={styles.card}>
        <ActivityIndicator size="small" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  text: {fontSize: 13, fontWeight: '400', color: '#111827'},
});
