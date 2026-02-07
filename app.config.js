// Expo config with env support.
// Keeps Google Maps key in .env and FIXES EAS linking

import 'dotenv/config';

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || undefined;

// Default backend (Render). Can be overridden via EXPO_PUBLIC_API_BASE.
const apiBase = process.env.EXPO_PUBLIC_API_BASE || 'https://scrapco-backend-8bix.onrender.com';

function withPlugin(list, plugin) {
  const arr = Array.isArray(list) ? [...list] : [];
  if (!arr.includes(plugin)) arr.push(plugin);
  return arr;
}

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
    owner: "azad_gupta",
      name: "ScrapCo Customer",
      slug: "scrapcocustomer",
      version: "1.0.0",

      plugins: withPlugin(config.expo?.plugins, "expo-font"),

      extra: {
        ...(config.expo?.extra || {}),
        apiBase,
        googleMapsApiKey,
        eas: {
          projectId: "9492573f-4baa-4a91-b626-749c08f14fe4",
        },
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
        package: "com.anonymous.scrapcocustomer",
        config: {
          ...(config.expo?.android?.config || {}),
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        },
      },
    },
  };
};
