import Constants from 'expo-constants';

export function getGoogleMapsApiKey() {
  const fromProcess = String(process?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  if (fromProcess) return fromProcess;

  const fromExtra = String(Constants?.expoConfig?.extra?.googleMapsApiKey || '').trim();
  if (fromExtra) return fromExtra;

  return '';
}
