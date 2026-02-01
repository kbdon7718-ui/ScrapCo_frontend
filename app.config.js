// Expo config with env support.
// This lets you keep Google Maps keys out of source control by setting them in frontend/.env

import 'dotenv/config';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || undefined;

export default ({config}) => {
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
      extra: {
        ...(config.expo?.extra || {}),
        googleMapsApiKey,
      },
      ios: {
        ...(config.expo?.ios || {}),
        config: {
          ...(config.expo?.ios?.config || {}),
          googleMapsApiKey,
        },
      },
      android: {
        ...(config.expo?.android || {}),
        config: {
          ...(config.expo?.android?.config || {}),
          googleMaps: {
            ...(config.expo?.android?.config?.googleMaps || {}),
            apiKey: googleMapsApiKey,
          },
        },
      },
    },
  };
};
