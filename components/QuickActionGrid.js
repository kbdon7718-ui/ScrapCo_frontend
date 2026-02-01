import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {theme} from '../theme';

function QuickActionCard({icon, label, color, onPress, subtitle}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.cardWrap, pressed && styles.cardPressed]}>
      <LinearGradient
        colors={[`${color}12`, `${color}08`]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}
      >
        <View style={[styles.iconBox, {backgroundColor: `${color}22`}]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>

        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </LinearGradient>
    </Pressable>
  );
}

export default function QuickActionGrid({onBulk, onRates}) {
  return (
    <View style={styles.grid}>
      <View style={styles.col}>
        <QuickActionCard
          icon="cube"
          label="Bulk Scrap"
          color={theme.colors.accent}
          subtitle="Large qty pickup"
          onPress={onBulk}
        />
      </View>

      <View style={styles.col}>
        <QuickActionCard icon="trending-up" label="Live Rates" color="#10B981" subtitle="Today's prices" onPress={onRates} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  col: {
    flex: 1,
  },
  cardWrap: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  cardPressed: {
    transform: [{scale: 0.94}],
  },
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.12)',
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '400',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
