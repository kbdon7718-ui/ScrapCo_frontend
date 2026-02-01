import React, {useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Autocomplete, GoogleMap, MarkerF, useJsApiLoader} from '@react-google-maps/api';

import {theme} from '../theme';
import {getGoogleMapsApiKey} from '../utils/env';

export default function MapPicker({
  value,
  onChange,
  onAddressChange,
  height = 220,
  title = 'Select pickup location',
  subtitle = 'Search an address or drop the pin',
}) {
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const hasCoords = value && typeof value.latitude === 'number' && typeof value.longitude === 'number';

  const region = useMemo(() => {
    if (!hasCoords) return null;
    return {latitude: value.latitude, longitude: value.longitude};
  }, [hasCoords, value]);

  const apiKey = getGoogleMapsApiKey();

  const searchInputStyle = useMemo(
    () => ({
      width: '100%',
      height: 44,
      padding: '0 12px',
      borderRadius: 12,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: '#ffffff',
      fontSize: 14,
      fontWeight: '400',
      outline: 'none',
      boxSizing: 'border-box',
    }),
    []
  );

  const {isLoaded, loadError} = useJsApiLoader({
    id: 'scrapco-google-maps',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
  });

  const autoRef = useRef(null);

  async function reverseGeocode(lat, lng) {
    if (!isLoaded || !globalThis.google?.maps?.Geocoder) return;
    setReverseGeocoding(true);
    try {
      const geocoder = new globalThis.google.maps.Geocoder();
      const {results} = await geocoder.geocode({location: {lat, lng}});
      const formatted = results?.[0]?.formatted_address;
      if (formatted) onAddressChange?.(formatted);
    } catch {
      // ignore
    } finally {
      setReverseGeocoding(false);
    }
  }

  const center = useMemo(() => {
    if (!region) return null;
    return {lat: region.latitude, lng: region.longitude};
  }, [region]);

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={[styles.frame, {height}]}> 
        {!apiKey ? (
          <View style={styles.missingKey}>
            <Text style={styles.missingKeyText}>Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in frontend/.env</Text>
          </View>
        ) : loadError ? (
          <View style={styles.missingKey}>
            <Text style={styles.missingKeyText}>
              Google Maps failed to load. Check API key restrictions and enable Maps JavaScript API + Places API.
            </Text>
          </View>
        ) : !isLoaded ? (
          <View style={styles.missingKey}>
            <Text style={styles.missingKeyText}>Loading map…</Text>
          </View>
        ) : !center ? (
          <View style={styles.missingKey}>
            <Text style={styles.missingKeyText}>Set a location to see the map (use saved address or current location).</Text>
          </View>
        ) : (
          <View style={styles.mapWrap}>
            <View style={styles.searchWrap}>
              <Autocomplete
                onLoad={(a) => {
                  autoRef.current = a;
                }}
                onPlaceChanged={() => {
                  const a = autoRef.current;
                  if (!a) return;
                  const place = a.getPlace();
                  const loc = place?.geometry?.location;
                  const lat = typeof loc?.lat === 'function' ? loc.lat() : null;
                  const lng = typeof loc?.lng === 'function' ? loc.lng() : null;
                  if (typeof lat === 'number' && typeof lng === 'number') {
                    onChange?.({latitude: lat, longitude: lng});
                    if (place?.formatted_address) onAddressChange?.(place.formatted_address);
                    else reverseGeocode(lat, lng);
                  }
                }}
              >
                <input
                  placeholder="Search address"
                  style={searchInputStyle}
                  aria-label="Search address"
                />
              </Autocomplete>
              {reverseGeocoding ? <Text style={styles.searchHint}>Updating address…</Text> : null}
            </View>

            <GoogleMap
              mapContainerStyle={{width: '100%', height: '100%'}}
              center={center}
              zoom={15}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                clickableIcons: false,
              }}
              onClick={(e) => {
                const lat = e?.latLng?.lat?.();
                const lng = e?.latLng?.lng?.();
                if (typeof lat !== 'number' || typeof lng !== 'number') return;
                onChange?.({latitude: lat, longitude: lng});
                reverseGeocode(lat, lng);
              }}
            >
              <MarkerF
                position={center}
                draggable
                onDragEnd={(e) => {
                  const lat = e?.latLng?.lat?.();
                  const lng = e?.latLng?.lng?.();
                  if (typeof lat !== 'number' || typeof lng !== 'number') return;
                  onChange?.({latitude: lat, longitude: lng});
                  reverseGeocode(lat, lng);
                }}
              />
            </GoogleMap>
          </View>
        )}
      </View>
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
  mapWrap: {flex: 1},
  searchWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    zIndex: 10,
  },
  searchHint: {marginTop: 6, color: theme.colors.textMuted, fontWeight: '400'},
  missingKey: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12},
  missingKeyText: {textAlign: 'center', color: theme.colors.textMuted, fontWeight: '400'},
});
