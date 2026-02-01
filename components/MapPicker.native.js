import React, {useEffect, useMemo, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MapView, {Marker} from 'react-native-maps';

import {theme} from '../theme';

export default function MapPicker({
  value,
  onChange,
  height = 220,
  title = 'Pin location',
  subtitle = 'Tap or drag the pin to adjust',
}) {
  const mapRef = useRef(null);
  const hasCoords = value && typeof value.latitude === 'number' && typeof value.longitude === 'number';

  const region = useMemo(() => {
    if (!hasCoords) return null;
    return {
      latitude: value.latitude,
      longitude: value.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [hasCoords, value]);

  useEffect(() => {
    if (!hasCoords) return;
    if (!mapRef.current) return;
    // Smoothly recenter when app sets a new coordinate.
    try {
      mapRef.current.animateToRegion(region, 350);
    } catch {
      // ignore
    }
  }, [hasCoords, region]);

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={[styles.frame, {height}]}>
        {hasCoords && region ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            onPress={(e) => {
              const c = e?.nativeEvent?.coordinate;
              if (!c) return;
              onChange?.({latitude: c.latitude, longitude: c.longitude});
            }}
          >
            <Marker
              coordinate={{latitude: region.latitude, longitude: region.longitude}}
              draggable
              onDragEnd={(e) => {
                const c = e?.nativeEvent?.coordinate;
                if (!c) return;
                onChange?.({latitude: c.latitude, longitude: c.longitude});
              }}
            />
          </MapView>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Set a location to see the map</Text>
          </View>
        )}
      </View>

      {!hasCoords ? <Text style={styles.helper}>Tip: Tap “Use Current Location”, then fine-tune the pin.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 13, fontWeight: '400', color: theme.colors.text, marginTop: theme.spacing.md},
  subtitle: {marginTop: 6, color: theme.colors.textMuted, fontWeight: '400'},
  frame: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    ...theme.shadow.card,
  },
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12},
  emptyText: {textAlign: 'center', color: theme.colors.textMuted, fontWeight: '400'},
  helper: {marginTop: 10, color: theme.colors.textMuted, fontWeight: '400'},
});
