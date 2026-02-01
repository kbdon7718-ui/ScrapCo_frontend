import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BlurView} from 'expo-blur';
import {LinearGradient} from 'expo-linear-gradient';
import {Recycle} from 'lucide-react-native';
import {theme} from '../theme';

export default function GlassHeader({title = 'ScrapCo', status = 'Ready'}) {
  return (
    <LinearGradient
      colors={[
        'rgba(14, 165, 233, 0.08)',  // sky blue tint
        'rgba(220, 252, 231, 0.06)', // green tint
      ]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.wrap}
    >
      <BlurView intensity={90} style={styles.blur}>
        <View style={styles.content}>
          <View style={styles.left}>
            <View style={styles.logoBox}>
              <Recycle size={22} color={theme.colors.primary} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{status}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live</Text>
          </View>
        </View>
      </BlurView>

      {/* Glass border accent */}
      <View style={styles.borderAccent} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.12)',
  },
  blur: {
    padding: theme.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(220, 252, 231, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    transform: [{rotate: '-3deg'}],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    letterSpacing: 0.4,
  },
  borderAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
});
