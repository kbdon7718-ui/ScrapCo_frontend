import Constants from 'expo-constants';

export function getGoogleMapsApiKey() {
  const fromProcess = String(process?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  if (fromProcess) return fromProcess;

  const fromExtra = String(Constants?.expoConfig?.extra?.googleMapsApiKey || '').trim();
  if (fromExtra) return fromExtra;

  return '';
}

export function getApiBase() {
  const fromProcess = String(process?.env?.EXPO_PUBLIC_API_BASE || '').trim();
  if (fromProcess) return fromProcess.replace(/\/+$/, '');

  const fromExtra = String(Constants?.expoConfig?.extra?.apiBase || '').trim();
  if (fromExtra) return fromExtra.replace(/\/+$/, '');

  return '';
}
