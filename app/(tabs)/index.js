import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, LOW_STOCK } from '../../src/store';
import { colors, money } from '../../src/ui';

export default function Home() {
  const router = useRouter();
  const { products, cart, cartCount, addToCart, online, pendingCount, isAdmin } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todo');

  const categories = useMemo(() => ['Todo', ...new Set(products.map((p) => p.category))], [products]);

  // La busqueda es local, asi funciona igual sin conexion.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'Todo' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q))
    );
  }, [products, query, category]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            style={styles.search}
            placeholder="Buscar figuras, comics, sables..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.cartBtn} onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={26} color={colors.text} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {!online && (
        <View style={styles.offline}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.warn} />
          <Text style={styles.offlineText}>
            Sin conexion, trabajas en modo local
            {pendingCount > 0 ? ` (${pendingCount} pedido(s) por enviar)` : ''}.
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
        {categories.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>
            {products.length === 0 ? 'Cargando catalogo...' : 'No hay productos con esa busqueda.'}
          </Text>
        }
        renderItem={({ item }) => {
          const inCart = cart[item.id] || 0;
          const stockDisponible = Math.max(0, item.stock - inCart);
          const soldOut = item.stock <= 0;
          const atLimit = stockDisponible <= 0;
          return (
            <Pressable style={[styles.card, soldOut && { opacity: 0.55 }]} onPress={() => router.push(`/product/${item.id}`)}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              {soldOut ? (
                <Text style={styles.soldOut}>Agotado</Text>
              ) : stockDisponible === 0 ? (
                <Text style={styles.lowStock}>Todo el stock está en tu carrito</Text>
              ) : stockDisponible < LOW_STOCK ? (
                <Text style={styles.lowStock}>Poco stock</Text>
              ) : null}

              <Text style={styles.stock}>
                Stock disponible: {stockDisponible}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{money(item.price)}</Text>
                <Pressable style={[styles.add, atLimit && styles.addDisabled]} disabled={atLimit} onPress={() => addToCart(item.id)} hitSlop={8}>
                  <Ionicons name="add" size={20} color={colors.text} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingTop: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 22, backgroundColor: colors.surface, paddingHorizontal: 14 },
  search: { flex: 1, color: colors.text },
  cartBtn: { padding: 4 },
  badge: { position: 'absolute', top: -2, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: colors.surface },
  offlineText: { flex: 1, color: colors.warn, fontSize: 12 },
  chips: { flexGrow: 0, marginTop: 10 },
  chipsContent: { paddingHorizontal: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.mint, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 32 },
  row: { gap: 10, marginBottom: 14 },
  card: { flex: 1 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.surface },
  name: { marginTop: 6, color: colors.text, fontSize: 13, minHeight: 34 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: { color: colors.text, fontSize: 16, fontWeight: '800' },
  lowStock: { color: colors.warn, fontSize: 12, fontWeight: '700' },
  soldOut: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  addDisabled: { opacity: 0.35 },
  add: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
