import React, {useContext} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {UiStatusContext} from '../contexts/UiStatusContext';

export default function ToastHost() {
  const ui = useContext(UiStatusContext);
  const toast = ui?.toast;
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Pressable onPress={ui.hideToast} style={[styles.toast, isError ? styles.toastError : styles.toastInfo]}>
        <Text style={styles.title}>{isError ? 'Error' : 'Info'}</Text>
        <Text style={styles.message}>{toast.message}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    bottom: 16,
    right: Platform.OS === 'web' ? 16 : 16,
    left: Platform.OS === 'web' ? 'auto' : 16,
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'stretch',
    zIndex: 9999,
  },
  toast: {
    maxWidth: 520,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  toastError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  toastInfo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  title: {fontSize: 12, fontWeight: '600', color: '#111827', marginBottom: 2},
  message: {fontSize: 13, fontWeight: '400', color: '#111827'},
});
