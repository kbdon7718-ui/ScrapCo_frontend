import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'scrapco.pickupIds.v1';
const MAX = 20;

export async function getSavedPickupIds() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch {
    return [];
  }
}

export async function addSavedPickupId(pickupId) {
  if (!pickupId) return;
  const id = String(pickupId);
  const current = await getSavedPickupIds();
  const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function removeSavedPickupId(pickupId) {
  if (!pickupId) return;
  const id = String(pickupId);
  const current = await getSavedPickupIds();
  const next = current.filter((x) => x !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
