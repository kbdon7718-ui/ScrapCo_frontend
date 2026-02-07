<<<<<<< HEAD
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
=======
// Expo dynamic config.
// IMPORTANT: this repo includes native folders (android/). To keep builds stable,
// avoid defining native config props here (ios/android/plugins/icon/splash/etc),
// because they won't be auto-synced into the native projects.

import 'dotenv/config';

export default ({config}) => {
  const expo = config?.expo || {};

  // Strip native-managed fields when native folders are present.
  // (They remain defined in app.json / native projects, but expo-doctor expects
  // the dynamic config output to avoid these properties.)
  // eslint-disable-next-line no-unused-vars
  const {plugins, ios, android, orientation, icon, userInterfaceStyle, splash, ...restExpo} = expo;

  const apiBase = process.env.EXPO_PUBLIC_API_BASE;
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  return {
    ...config,
    expo: {
      ...restExpo,
      extra: {
        ...(restExpo.extra || {}),
        ...(apiBase ? {apiBase} : {}),
        eas: {
          ...(restExpo.extra?.eas || {}),
          ...(easProjectId ? {projectId: easProjectId} : {}),
>>>>>>> 9cb2e93950d01b5fd70745293e347ad295f5c8ef
        },
      },
    },
  };
};
