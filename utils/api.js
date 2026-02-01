/**
 * frontend/utils/api.js
 *
 * Small helper to centralize the API URL and POST logic.
 *
 * IMPORTANT for beginners:
 * - When running on Android emulator, use `http://10.0.2.2:3000` to reach
 *   a backend running on your PC at port 3000.
 * - When running on a real iPhone, replace `API_BASE` with your PC's LAN IP,
 *   e.g. `http://192.168.1.42:3000`, or use the Expo tunnel URL (exp.direct)
 *   if you started Expo with `--tunnel`.
 */

import {Platform} from 'react-native';

// You can override this without code changes by setting:
// EXPO_PUBLIC_API_BASE=http://<your-ip>:3000
const ENV_BASE = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_BASE : undefined;

// Default API base by platform:
// - Web: backend is usually on the same machine -> localhost
// - Android emulator: 10.0.2.2 maps to host machine
// - iOS simulator / others: localhost usually works
export const API_BASE =
  (ENV_BASE && String(ENV_BASE).trim()) ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3006' : 'http://localhost:3006');

async function parseJsonOrThrow(res) {
  const contentType = String(res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      const msg = data && data.error ? data.error : `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  const text = await res.text();
  const preview = text ? String(text).slice(0, 120) : '';
  throw new Error(
    `Unexpected response from server (${res.status}). Expected JSON but got: ${preview || '[empty body]'}\n` +
      `Tip: make sure the backend is restarted and has the route you are calling.`
  );
}

/**
 * postPickup
 * Sends a pickup request object to the backend.
 *
 * @param {Object} pickup - the pickup object to send
 * @returns {Object} the JSON response from the server
 */
export async function postPickup(pickup) {
  const url = `${API_BASE}/api/pickups`;

  // If Supabase auth is used, include the access token so the backend can enforce RLS.
  // (When bypass mode is enabled, callers can omit this.)
  const token = pickup?.accessToken;
  const body = {...pickup};
  delete body.accessToken;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: JSON.stringify(body),
  });

  return parseJsonOrThrow(res);
}

export async function getPickupStatus({pickupId, accessToken}) {
  const url = `${API_BASE}/api/pickups/${encodeURIComponent(String(pickupId))}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
    },
  });
  return parseJsonOrThrow(res);
}

export async function cancelPickup({pickupId, accessToken}) {
  const url = `${API_BASE}/api/pickups/${encodeURIComponent(String(pickupId))}/cancel`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
    },
    body: JSON.stringify({}),
  });
  return parseJsonOrThrow(res);
}

export async function findVendorAgain({pickupId, accessToken}) {
  const url = `${API_BASE}/api/pickups/${encodeURIComponent(String(pickupId))}/find-vendor`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
    },
    body: JSON.stringify({}),
  });
  return parseJsonOrThrow(res);
}
