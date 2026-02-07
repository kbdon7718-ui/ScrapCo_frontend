import React, {useEffect, useMemo, useRef} from 'react';
import {ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {theme} from '../theme';
import {MapPin, Navigation2} from 'lucide-react-native';

export default function MapPlaceholder({
  coords = null,
  active = false,
  address = '',
  etaMinutes = null,
  onPressSend,
  loading = false,
  onPressEnableLocation,
}) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {useNativeDriver: true, toValue: 1, duration: 1500}),
        Animated.timing(pulseAnim, {useNativeDriver: true, toValue: 0, duration: 1500}),
      ])
    ).start();
  }, []);

  const opacityInterpolate = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const hasCoords = Boolean(coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number');

  const region = useMemo(() => {
    if (!hasCoords) return null;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [hasCoords, coords]);

  return (
    <View style={styles.wrap}>
      {/* Map background */}
      {region ? (
        <MapView
          style={StyleSheet.absoluteFill}
          region={region}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          liteMode={Platform.OS === 'android'}
          loadingEnabled
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          pointerEvents="none"
        >
          <Marker coordinate={{latitude: region.latitude, longitude: region.longitude}} />
        </MapView>
      ) : (
        <View style={styles.mapFallback}>
          {loading ? (
            <>
              <ActivityIndicator />
              <Text style={styles.mapFallbackText}>Detecting location…</Text>
            </>
          ) : (
            <>
              <Text style={styles.mapFallbackText}>Enable location to show live map</Text>
              {typeof onPressEnableLocation === 'function' ? (
                <Pressable onPress={onPressEnableLocation} style={styles.enableBtn}>
                  <Text style={styles.enableBtnText}>Enable location</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      )}

      {/* Soft overlay to match design */}
      <View pointerEvents="none" style={styles.overlayTint} />

      {/* Top label row */}
      <View style={styles.topRow}>
        <Text style={styles.topTitle}>LIVE TRACKER</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>{active ? 'ACTIVENOW' : 'IDLE'}</Text>
        </View>
      </View>

      {/* User pulse marker */}
      <View style={styles.center}>
        <Animated.View style={[styles.pulseRing, {opacity: opacityInterpolate}]} />
        <View style={styles.userMarker}>
          <View style={styles.innerDot} />
        </View>
      </View>

      {/* Floating send button */}
      <Pressable onPress={onPressSend} style={styles.sendBtn}>
        <Navigation2 size={18} color="#FFFFFF" strokeWidth={2.6} />
      </Pressable>

      {/* Bottom location pill */}
      <View style={styles.bottomPill}>
        <View style={styles.pinCircle}>
          <MapPin size={16} color={theme.colors.primary} strokeWidth={2.4} />
        </View>

        <Text numberOfLines={1} style={styles.addressText}>
          {address || (hasCoords ? 'Location detected' : 'Location not set')}
        </Text>

        {typeof etaMinutes === 'number' ? (
          <View style={styles.etaPill}>
            <Text style={styles.etaText}>{etaMinutes} min</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 224,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.04)',
  },
  mapFallbackText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  enableBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  enableBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  overlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  topTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '800',
    color: 'rgba(8, 17, 31, 0.55)',
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.18)',
  },
  activeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.green,
    letterSpacing: 0.6,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  userMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  sendBtn: {
    position: 'absolute',
    right: 12,
    top: 52,
    width: 42,
    height: 42,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomPill: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 46,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.14)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {flex: 1, fontSize: 12, fontWeight: '800', color: theme.colors.text},
  etaPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.16)',
  },
  etaText: {fontSize: 11, fontWeight: '900', color: theme.colors.accent},
});
