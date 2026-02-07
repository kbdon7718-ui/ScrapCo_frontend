import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {CheckCircle2, Trash2, X} from 'lucide-react-native';
import {theme} from '../theme';
import Button from './Button';

function colorForNameKey(nameKey) {
  const key = String(nameKey || '').toLowerCase();
  if (key.includes('paper') || key.includes('newspaper')) return '#8B7355';
  if (key.includes('plastic')) return '#FF6B9D';
  if (key.includes('metal') || key.includes('iron') || key.includes('steel')) return '#94A3B8';
  if (key.includes('glass')) return '#38BDF8';
  if (key.includes('copper')) return '#B87333';
  return theme.colors.primary;
}

export default function PickupCartModal({visible, onClose, rates = [], onConfirm, loading = false}) {
  const [cart, setCart] = useState([]);
  const [weights, setWeights] = useState({});

  function sanitizeWeightInput(val) {
    const raw = String(val ?? '').trim();
    if (!raw) return '';

    // Some keyboards use comma as decimal separator. Treat ',' as '.'.
    const normalized = raw.replace(/,/g, '.');
    let cleaned = normalized
      .replace(/[^0-9.]/g, '')
      .replace(/\.(?=.*\.)/g, '');

    if (!cleaned) return '';
    if (cleaned === '.') return '0.';

    const [intPart, decPart] = cleaned.split('.');
    cleaned = decPart != null ? `${intPart}.${decPart.slice(0, 2)}` : intPart;

    const n = Number(cleaned);
    if (!Number.isFinite(n)) return '';
    const capped = Math.max(0, Math.min(500, n));

    // Preserve a trailing '.' while typing (e.g. "12.").
    if (normalized.endsWith(',') || normalized.endsWith('.')) {
      return `${Math.trunc(capped)}.`;
    }

    // Keep up to 2 decimals, but avoid trailing zeros.
    const fixed = capped % 1 === 0 ? String(Math.trunc(capped)) : capped.toFixed(2);
    return fixed.replace(/\.?0+$/, '');
  }

  function formatKg(n) {
    const num = Number(n);
    if (!Number.isFinite(num) || num <= 0) return '0';
    const fixed = num % 1 === 0 ? String(Math.trunc(num)) : num.toFixed(2);
    return fixed.replace(/\.?0+$/, '');
  }

  useEffect(() => {
    if (visible) {
      setCart([]);
      setWeights({});
    }
  }, [visible]);

  const rateById = useMemo(() => {
    const map = new Map();
    for (const r of rates || []) {
      const id = String(r.id);
      const price = Number(r.price ?? r.ratePerKg ?? 0);
      if (id) map.set(id, Number.isFinite(price) ? price : 0);
    }
    return map;
  }, [rates]);

  const categories = useMemo(() => {
    return (rates || []).map((r) => {
      const nameKey = r.nameKey || String(r.name || '').trim().toLowerCase();
      return {
        id: r.id,
        name: r.name,
        nameKey,
        color: r.color || colorForNameKey(nameKey),
        price: Number(r.price ?? r.ratePerKg ?? 0),
      };
    });
  }, [rates]);

  function toggleCategory(cat) {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === cat.id);
      if (exists) return prev.filter((c) => c.id !== cat.id);
      return [...prev, cat];
    });
  }

  function setWeight(catId, val) {
    const cleaned = sanitizeWeightInput(val);
    setWeights((prev) => ({...prev, [catId]: cleaned}));
  }

  function bumpWeight(catId, delta) {
    const current = Number(weights[catId] || 0);
    const next = Math.max(0, Math.min(500, Math.round((current + delta) * 10) / 10));
    setWeights((prev) => ({...prev, [catId]: next ? String(next) : ''}));
  }

  const estimate = useMemo(() => {
    let total = 0;
    for (const c of cart) {
      const wt = Number(weights[c.id] || 0);
      if (wt > 0) {
        const rate = rateById.get(String(c.id)) || 0;
        total += wt * rate;
      }
    }
    return Math.round(total);
  }, [cart, weights, rateById]);

  function removeFromCart(catId) {
    setCart((prev) => prev.filter((c) => c.id !== catId));
    setWeights((prev) => {
      const next = {...prev};
      delete next[catId];
      return next;
    });
  }

  function handleConfirm() {
    const items = cart
      .map((c) => ({
        scrapTypeId: c.id,
        scrapTypeName: c.name,
        estimatedQuantity: Number(weights[c.id] || 0),
      }))
      .filter((it) => it.estimatedQuantity > 0);

    if (items.length === 0) {
      Alert.alert('Missing info', 'Please add at least one item with weight.');
      return;
    }

    onConfirm?.(items, estimate);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <X size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Scrap Items</Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Grid */}
          <Text style={styles.sectionTitle}>Select scrap types</Text>
          <View style={styles.grid}>
            {categories.map((cat) => {
              const selected = cart.some((c) => c.id === cat.id);
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat)}
                  style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                >
                  <View style={[styles.categoryIcon, {backgroundColor: `${cat.color}22`}]}>
                    <View style={{width: 16, height: 16, borderRadius: 4, backgroundColor: cat.color}} />
                  </View>
                  <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>{cat.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Weight Entry */}
          {cart.length > 0 ? (
            <View style={{marginTop: theme.spacing.lg}}>
              <Text style={styles.sectionTitle}>Enter estimated weight (kg)</Text>
              {cart.map((c) => (
                <View key={c.id} style={styles.weightRow}>
                  <View style={{flex: 1}}>
                    <Text style={styles.weightLabel}>{c.name}</Text>
                      <Text style={styles.weightRate}>₹{rateById.get(String(c.id)) || 0}/kg</Text>
                  </View>
                  <View style={styles.weightControls}>
                    <Pressable onPress={() => bumpWeight(c.id, -0.5)} style={[styles.stepBtn, styles.stepBtnOff]}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>

                    <View style={styles.weightInputWrap}>
                      <TextInput
                        style={styles.weightInput}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        value={weights[c.id] || ''}
                        onChangeText={(val) => setWeight(c.id, val)}
                        returnKeyType="done"
                      />
                      <Text style={styles.kgSuffix}>kg</Text>
                    </View>

                    <Pressable onPress={() => bumpWeight(c.id, 0.5)} style={[styles.stepBtn, styles.stepBtnOn]}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Cart Summary */}
              <View style={styles.summary}>
                <Text style={styles.summaryLabel}>Estimated payout</Text>
                <Text style={styles.summaryAmount}>₹{estimate}</Text>
              </View>

              {/* Cart List */}
              <Text style={[styles.sectionTitle, {marginTop: theme.spacing.md}]}>Review items</Text>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({item}) => {
                  const wt = Number(weights[item.id] || 0);
                  const rate = rateById.get(String(item.id)) || 0;
                  const subtotal = wt * rate;
                  return (
                    <View style={styles.cartItem}>
                      <View style={{flex: 1}}>
                        <Text style={styles.cartItemName}>{item.name}</Text>
                        <Text style={styles.cartItemQty}>
                          {formatKg(wt)} kg × ₹{rate} = ₹{Math.round(subtotal)}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
                        <Trash2 size={18} color={theme.colors.danger} />
                      </Pressable>
                    </View>
                  );
                }}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle2 size={48} color={theme.colors.textMuted} strokeWidth={2.2} />
              <Text style={styles.emptyText}>Select scrap types to continue</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            label={loading ? 'Confirming...' : `Confirm (₹${estimate})`}
            onPress={handleConfirm}
            disabled={cart.length === 0 || loading}
            loading={loading}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  categoryBtn: {
    width: '31%',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bgSoft,
  },
  categoryBtnSelected: {
    backgroundColor: 'rgba(14, 165, 233, 0.10)',
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: theme.colors.text,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  weightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  weightRate: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  weightInput: {
    flex: 1,
    height: 40,
    paddingLeft: theme.spacing.sm,
    paddingRight: 4,
    fontSize: 14,
    textAlign: 'right',
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 38,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepBtnOn: {backgroundColor: 'rgba(37, 211, 102, 0.12)', borderColor: 'rgba(37, 211, 102, 0.35)'},
  stepBtnOff: {backgroundColor: theme.colors.bgSoft, borderColor: theme.colors.border},
  stepBtnText: {fontSize: 20, fontWeight: '700', color: theme.colors.text},
  weightInputWrap: {
    width: 96,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginHorizontal: 8,
  },
  kgSuffix: {
    paddingRight: 10,
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  summary: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cartItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  cartItemQty: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  removeBtn: {
    padding: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
});
