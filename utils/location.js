/**
 * frontend/utils/location.js
 *
 * This file holds location-related helper functions.
 *
 * We keep this logic out of screens to:
 * - keep screens simpler
 * - reuse code later
 *
 * IMPORTANT:
 * - This uses Expo Location (expo-location)
 * - We handle permission denied properly
 */

import * as Location from 'expo-location';

/**
 * Ask the user for location permission.
 * Returns an object:
 *   { granted: boolean, message?: string }
 */
export async function requestLocationPermissionAsync() {
  // Ask for foreground location permission.
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    return {
      granted: false,
      message:
        'Location permission was denied. Please enable it in your phone settings if you want to use GPS.',
    };
  }

  return { granted: true };
}

/**
 * Get the current GPS coordinates (latitude & longitude).
 *
 * Returns:
 *   { latitude: number, longitude: number }
 */
export async function getCurrentCoordinatesAsync() {
  // This asks the phone for the current position.
  // Accuracy.Balanced is a good “beginner” choice.
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

/**
 * Best-effort reverse geocode to a human-readable address string.
 * Returns null if not available.
 */
export async function reverseGeocodeToAddressAsync({latitude, longitude}) {
  try {
    const results = await Location.reverseGeocodeAsync({latitude, longitude});
    const r = Array.isArray(results) ? results[0] : null;
    if (!r) return null;

    const parts = [
      r.name,
      r.street,
      r.district,
      r.city,
      r.region,
    ].filter(Boolean);

    const text = parts.join(', ').trim();
    return text || null;
  } catch {
    return null;
  }
}

export function shortAddress(address) {
  const s = String(address || '').trim();
  if (!s) return '';
  // Keep just the first 2-3 comma-separated parts.
  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.slice(0, 3).join(', ');
}
