import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore, LOW_STOCK } from '../../src/store';
import { colors, money } from '../../src/ui';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, cart, addToCart } = useStore();

  const product = products.find((p) => p.id === Number(id));
  const inCart = product ? (cart[product.id] || 0) : 0;

  const stockDisponible = product
    ? Math.max(0, product.stock - inCart)
    : 0;

  const atLimit = stockDisponible <= 0;

  if (!product) {
    return <Text style={styles.missing}>Este producto ya no esta disponible.</Text>;
  }

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.body}>
          <Text style={styles.price}>{money(product.price)}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{product.category}</Text>
          </View>
          {product.stock <= 0 ? (
            <Text style={[styles.stock, { color: colors.danger }]}>
              Agotado
            </Text>
          ) : stockDisponible === 0 ? (
            <Text style={[styles.stock, { color: colors.warn }]}>
              Todas las unidades están en tu carrito
            </Text>
          ) : stockDisponible < LOW_STOCK ? (
            <Text style={[styles.stock, { color: colors.warn }]}>
              Poco stock
            </Text>
          ) : null}

          <Text style={styles.stock}>
            Stock disponible: {stockDisponible}
          </Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.bar}>
        {inCart > 0 && (
          <Pressable style={styles.secondary} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={20} color={colors.text} />
            <Text style={styles.secondaryText}>{inCart}</Text>
          </Pressable>
        )}
        <Pressable style={[styles.primary, atLimit && { opacity: 0.4 }]} disabled={atLimit} onPress={() => addToCart(product.id)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.text} />
          <Text style={styles.primaryText}>
          {product.stock <= 0
            ? 'Agotado'
            : atLimit
              ? 'Ya tienes todo el stock'
              : 'Agregar al carrito'}
        </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  missing: { padding: 24, color: colors.muted },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.surface },
  body: { padding: 16 },
  price: { color: colors.text, fontSize: 26, fontWeight: '800' },
  name: { marginTop: 6, color: colors.text, fontSize: 18, fontWeight: '600' },
  tag: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.mintSoft },
  tagText: { color: colors.mintDark, fontSize: 12, fontWeight: '600' },
  stock: { marginTop: 10, fontWeight: '700' },
  description: { marginTop: 14, color: colors.text, lineHeight: 21 },
  bar: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  primary: { flex: 1, height: 48, borderRadius: 24, backgroundColor: colors.mint, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.text, fontWeight: '800' },
  secondary: { height: 48, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.text, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '700' },
});
