import { useState } from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store';
import { colors, money } from '../../src/ui';

export default function Cart() {
  const router = useRouter();
  const { cartItems, cartTotal, setQty, checkout, online, session, setAfterLogin } = useStore();

  const [address, setAddress] = useState('');
  const pay = () => {
    // Sin sesion: se manda a la tab de login y se recuerda que debe volver aqui.
    if (!session?.user) {
      setAfterLogin('cart');
      return router.navigate('/login');
    }
    if (!address.trim()) return Alert.alert('Dirección requerida', 'Escribe la dirección de entrega.');
    const orderId = checkout(address);
    // La factura se abre sobre las tabs; desde ella se vuelve a la tienda
    if (orderId) router.push({ pathname: '/invoice', params: { id: orderId } });
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="cart-outline" size={56} color={colors.border} />
        <Text style={styles.empty}>Tu carrito esta vacio.</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.navigate('/')}>
          <Text style={styles.emptyBtnText}>Seguir comprando</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={cartItems}
        keyExtractor={(i) => String(i.productId)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Pressable style={styles.info} onPress={() => router.push(`/product/${item.productId}`)}>
              <Image source={{ uri: item.product.image }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.price}>{money(item.product.price)}</Text>
                {item.qty >= item.product.stock && <Text style={{ color: colors.warn, fontSize: 11, fontWeight: '700' }}>Máximo disponible ({item.product.stock})</Text>}
              </View>
            </Pressable>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => setQty(item.productId, item.qty - 1)} hitSlop={6}>
                <Ionicons name={item.qty === 1 ? 'trash-outline' : 'remove'} size={16} color={colors.text} />
              </Pressable>
              <Text style={styles.qty}>{item.qty}</Text>
              <Pressable style={[styles.stepBtn, item.qty >= item.product.stock && { opacity: 0.35 }]} disabled={item.qty >= item.product.stock} onPress={() => setQty(item.productId, item.qty + 1)} hitSlop={6}>
                <Ionicons name="add" size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        {!online && (
          <View style={styles.note}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.warn} />
            <Text style={styles.noteText}>Sin conexion: el pedido se enviara cuando vuelva internet.</Text>
          </View>
        )}
        <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 6 }}>Dirección de entrega</Text>
        <TextInput value={address} onChangeText={setAddress} placeholder="Calle, número, apartamento..." placeholderTextColor={colors.muted} style={{ borderWidth: 1, borderColor: colors.border, color: colors.text, borderRadius: 10, padding: 12, marginBottom: 12 }} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{money(cartTotal)}</Text>
        </View>
        <Pressable style={styles.pay} onPress={pay}>
          <Ionicons name="card-outline" size={20} color={colors.mint} />
          <Text style={styles.payText}>{session?.user ? 'Pagar' : 'Inicia sesión para pagar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  empty: { color: colors.muted },
  emptyBtn: { marginTop: 6, paddingHorizontal: 20, height: 42, borderRadius: 21, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { color: colors.text, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 8 },
  image: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.surface },
  name: { color: colors.text, fontSize: 13 },
  price: { marginTop: 4, color: colors.text, fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mintSoft, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 18, textAlign: 'center', color: colors.text, fontWeight: '600' },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  noteText: { flex: 1, color: colors.warn, fontSize: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { color: colors.text, fontSize: 16 },
  total: { color: colors.text, fontSize: 20, fontWeight: '800' },
  pay: { height: 48, borderRadius: 24, backgroundColor: colors.text, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  payText: { color: colors.mint, fontWeight: '800' },
});
