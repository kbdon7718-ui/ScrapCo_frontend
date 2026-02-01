import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {theme} from '../theme';
import {ArrowRight, Truck} from 'lucide-react-native';

export default function HeroCard({onPress, title = 'Instant Pickup', subtitle = 'Schedule a scrap pickup in seconds'}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={[theme.colors.primary, 'rgba(14, 165, 233, 0.72)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}
      >
        <View style={styles.topIcon}>
          <Truck size={22} color="#FFFFFF" strokeWidth={2.6} />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.ctaRow}>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Request Now</Text>
            <ArrowRight size={16} color={theme.colors.primary} strokeWidth={2.6} />
          </View>
        </View>

        {/* Decorative blobs */}
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{scale: 0.95}],
  },
  gradient: {
    padding: theme.spacing.lg,
    minHeight: 180,
    justifyContent: 'center',
  },
  topIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  ctaRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  blob1: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    bottom: -40,
    right: -40,
  },
  blob2: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    top: -30,
    left: -30,
  },
});
