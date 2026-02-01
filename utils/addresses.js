import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'scrapco_saved_addresses_v1';

export async function loadSavedAddresses() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSavedAddresses(addresses) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(addresses || []));
}

export async function addSavedAddress(address) {
  const list = await loadSavedAddresses();
  const next = [address, ...list].slice(0, 25);
  await saveSavedAddresses(next);
  return next;
}

export async function removeSavedAddress(id) {
  const list = await loadSavedAddresses();
  const next = list.filter((a) => String(a.id) !== String(id));
  await saveSavedAddresses(next);
  return next;
}

export function newAddressId() {
  return `addr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
