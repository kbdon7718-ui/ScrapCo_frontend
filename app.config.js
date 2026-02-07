// Expo dynamic config (loads frontend/.env via dotenv).
// We only inject values into `expo.extra` so runtime code can read them via expo-constants.

import 'dotenv/config';

export default ({config}) => {
  const expo = config?.expo || {};
  const extra = expo.extra || {};

  const apiBase = String(process.env.EXPO_PUBLIC_API_BASE || '').trim() || undefined;
  const googleMapsApiKey = String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim() || undefined;
  const easProjectId = String(process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '').trim() || undefined;

  return {
    ...config,
    expo: {
      ...expo,
      extra: {
        ...extra,
        ...(apiBase ? {apiBase} : {}),
        ...(googleMapsApiKey ? {googleMapsApiKey} : {}),
        eas: {
          ...(extra.eas || {}),
          ...(easProjectId ? {projectId: easProjectId} : {}),
        },
      },
    },
  };
};
