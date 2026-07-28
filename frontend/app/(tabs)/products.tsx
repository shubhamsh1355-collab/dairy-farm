import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api";
import { colors, spacing, radius, shadow } from "@/src/theme";

type Product = {
  id: string;
  name: string;
  unit: string;
  icon: string;
  price_per_unit: number;
  stock: number;
};

type ActionMode = "add" | "sell" | null;

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [active, setActive] = useState<Product | null>(null);
  const [mode, setMode] = useState<ActionMode>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.products();
      setProducts(res.products);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.sub}>Manage dairy stock</Text>
        </View>
        <Pressable testID="add-product-btn" style={styles.addBtn} onPress={() => setShowNew(true)}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.onBrandPrimary} />
          <Text style={styles.addBtnText}>New</Text>
        </Pressable>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.xl }}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Pressable
              testID={`product-card-${item.name.toLowerCase()}`}
              style={styles.card}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActive(item);
                setMode("add");
              }}
            >
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.brandPrimary} />
              </View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardStock}>
                {item.stock.toFixed(1)} {item.unit}
              </Text>
              <Text style={styles.cardPrice}>₹{item.price_per_unit}/{item.unit}</Text>
              <View style={styles.cardActions}>
                <Pressable
                  testID={`product-add-${item.name.toLowerCase()}`}
                  style={styles.smallBtn}
                  onPress={() => {
                    setActive(item);
                    setMode("add");
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={14} color={colors.brandPrimary} />
                  <Text style={styles.smallBtnText}>Add</Text>
                </Pressable>
                <Pressable
                  testID={`product-sell-${item.name.toLowerCase()}`}
                  style={[styles.smallBtn, styles.smallBtnAlt]}
                  onPress={() => {
                    setActive(item);
                    setMode("sell");
                  }}
                >
                  <MaterialCommunityIcons name="cart" size={14} color={colors.onBrandSecondary} />
                  <Text style={[styles.smallBtnText, { color: colors.onBrandSecondary }]}>Sell</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No products yet</Text>
            </View>
          }
        />
      )}

      <NewProductModal
        visible={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => {
          setShowNew(false);
          load();
        }}
      />

      <StockActionModal
        product={active}
        mode={mode}
        onClose={() => {
          setActive(null);
          setMode(null);
        }}
        onDone={() => {
          setActive(null);
          setMode(null);
          load();
        }}
      />
    </View>
  );
}

function NewProductModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!name.trim()) {
      setErr("Name required");
      return;
    }
    setSaving(true);
    try {
      await api.createProduct({
        name,
        unit,
        icon: "food",
        price_per_unit: Number(price) || 0,
        stock: 0,
      });
      setName("");
      setPrice("");
      onCreated();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New product</Text>
            <TextInput
              testID="new-product-name"
              placeholder="Product name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <TextInput
                testID="new-product-unit"
                placeholder="Unit (kg/ltr/pcs)"
                placeholderTextColor={colors.muted}
                value={unit}
                onChangeText={setUnit}
                style={[styles.input, { flex: 1 }]}
              />
              <TextInput
                testID="new-product-price"
                placeholder="Price / unit"
                placeholderTextColor={colors.muted}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            {!!err && <Text style={styles.err}>{err}</Text>}
            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
              <Pressable style={[styles.cta, styles.ctaGhost]} onPress={onClose}>
                <Text style={[styles.ctaText, { color: colors.onSurface }]}>Cancel</Text>
              </Pressable>
              <Pressable testID="new-product-save" style={styles.cta} onPress={submit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <Text style={styles.ctaText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function StockActionModal({
  product,
  mode,
  onClose,
  onDone,
}: {
  product: Product | null;
  mode: ActionMode;
  onClose: () => void;
  onDone: () => void;
}) {
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const visible = !!product && !!mode;

  const submit = async () => {
    if (!product) return;
    const q = Number(qty);
    if (!q || q <= 0) {
      setErr("Enter a valid quantity");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (mode === "add") {
        await api.adjustStock(product.id, q, "manual add");
      } else {
        await api.sellProduct(product.id, q, Number(price) || undefined);
      }
      setQty("");
      setPrice("");
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {mode === "add" ? `Add stock — ${product?.name}` : `Sell — ${product?.name}`}
            </Text>
            <Text style={styles.sheetSub}>
              Current: {product?.stock.toFixed(1)} {product?.unit} · ₹{product?.price_per_unit}/{product?.unit}
            </Text>
            <TextInput
              testID="stock-qty-input"
              placeholder={`Quantity (${product?.unit})`}
              placeholderTextColor={colors.muted}
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              style={styles.input}
            />
            {mode === "sell" && (
              <TextInput
                testID="stock-price-input"
                placeholder={`Sale price / ${product?.unit} (optional)`}
                placeholderTextColor={colors.muted}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
              />
            )}
            {!!err && <Text style={styles.err}>{err}</Text>}
            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
              <Pressable style={[styles.cta, styles.ctaGhost]} onPress={onClose}>
                <Text style={[styles.ctaText, { color: colors.onSurface }]}>Cancel</Text>
              </Pressable>
              <Pressable testID="stock-submit-btn" style={styles.cta} onPress={submit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={colors.onBrandPrimary} />
                ) : (
                  <Text style={styles.ctaText}>{mode === "add" ? "Add" : "Sell"}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.onSurface },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: 999,
  },
  addBtnText: { color: colors.onBrandPrimary, fontWeight: "600", fontSize: 13 },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cardName: { fontSize: 15, fontWeight: "600", color: colors.onSurface },
  cardStock: { fontSize: 20, fontWeight: "700", color: colors.onSurface, marginTop: 2 },
  cardPrice: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  cardActions: { flexDirection: "row", gap: spacing.sm },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    flex: 1,
    justifyContent: "center",
  },
  smallBtnAlt: { backgroundColor: colors.brandSecondary },
  smallBtnText: { fontSize: 11, fontWeight: "600", color: colors.brandPrimary },
  empty: { alignItems: "center", padding: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: 14 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(28,27,26,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.card,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  sheetSub: { fontSize: 13, color: colors.muted, marginTop: -6 },
  input: {
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.onSurface,
  },
  cta: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaGhost: { backgroundColor: colors.surfaceTertiary },
  ctaText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "600" },
  err: { color: colors.error, fontSize: 13 },
});
