import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {theme} from '../theme';

function normalize(status) {
  return String(status || 'UNKNOWN').toUpperCase();
}

function badgeColors(status) {
  const s = normalize(status);
  if (s === 'ACCEPTED' || s === 'ASSIGNED') return {bg: 'rgba(61,185,255,0.16)', fg: theme.colors.sky};
  if (s === 'FINDING_VENDOR') return {bg: 'rgba(61,185,255,0.10)', fg: theme.colors.sky};
  if (s === 'COMPLETED') return {bg: 'rgba(46,204,113,0.16)', fg: theme.colors.green};
  if (s === 'NO_VENDOR_AVAILABLE') return {bg: 'rgba(239,68,68,0.14)', fg: theme.colors.danger};
  if (s === 'CANCELLED') return {bg: 'rgba(239,68,68,0.14)', fg: theme.colors.danger};
  if (s === 'REQUESTED') return {bg: 'rgba(46,204,113,0.12)', fg: theme.colors.green};
  return {bg: 'rgba(100,116,139,0.14)', fg: theme.colors.textMuted};
}

export default function StatusBadge({status}) {
  const s = normalize(status);
  const c = badgeColors(s);
  return (
    <View style={[styles.badge, {backgroundColor: c.bg}]}> 
      <Text style={[styles.text, {color: c.fg}]}>{s}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  text: {fontSize: 12, fontWeight: '400', letterSpacing: 0.3},
});
