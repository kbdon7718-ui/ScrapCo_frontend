import {isSupabaseConfigured, supabase} from '../lib/supabase';

let cache = {at: 0, rows: []};
const TTL_MS = 5 * 60 * 1000;

function normalizeName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export async function getActiveScrapRates({force = false} = {}) {
  const now = Date.now();
  if (!force && cache?.rows?.length && now - cache.at < TTL_MS) return cache.rows;

  if (!isSupabaseConfigured || !supabase) {
    cache = {at: now, rows: []};
    return [];
  }

  const {data: types, error: typesErr} = await supabase
    .from('scrap_types')
    .select('id,name')
    .order('name', {ascending: true});
  if (typesErr) throw typesErr;

  const {data: activeRates, error: ratesErr} = await supabase
    .from('scrap_rates')
    .select('scrap_type_id,rate_per_kg,effective_from,is_active')
    .eq('is_active', true);
  if (ratesErr) throw ratesErr;

  const latestRateByType = new Map();
  for (const r of activeRates || []) {
    const prev = latestRateByType.get(r.scrap_type_id);
    if (!prev) {
      latestRateByType.set(r.scrap_type_id, r);
      continue;
    }
    const prevDate = prev.effective_from ? new Date(prev.effective_from) : new Date(0);
    const nextDate = r.effective_from ? new Date(r.effective_from) : new Date(0);
    if (nextDate >= prevDate) latestRateByType.set(r.scrap_type_id, r);
  }

  const rows = (types || [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      nameKey: normalizeName(t.name),
      ratePerKg: latestRateByType.get(t.id)?.rate_per_kg ?? null,
    }))
    .filter((x) => x.ratePerKg != null);

  cache = {at: now, rows};
  return rows;
}

export function estimateEarnings({items, ratesRows}) {
  const rows = Array.isArray(ratesRows) ? ratesRows : [];
  const rateByTypeId = new Map(rows.map((r) => [String(r.id), Number(r.ratePerKg)]));

  let total = 0;
  for (const it of items || []) {
    const typeId = String(it.scrapTypeId ?? it.scrap_type_id ?? it.scrap_type?.id ?? '');
    const qty = Number(it.estimatedQuantity ?? it.estimated_quantity ?? 0);
    const rate = rateByTypeId.get(typeId);
    if (!typeId || !Number.isFinite(qty) || !Number.isFinite(rate)) continue;
    total += qty * rate;
  }

  // round to nearest rupee
  return Math.round(total);
}
