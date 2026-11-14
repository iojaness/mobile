import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../src/store';
import { colors, money } from '../src/ui';
import { shareInvoicePdf } from '../src/invoicePdf';

// El estado se lee del store, asi pasa de "pendiente" a "registrado" solo
// cuando el pedido se sincroniza con el back.
const STATUS = {
  pending: { label: 'Pendiente de enviar', color: colors.warn, icon: 'time-outline' },
  synced: { label: 'Registrado', color: colors.mintDark, icon: 'checkmark-circle' },
  rejected: { label: 'Rechazado por el servidor', color: colors.danger, icon: 'close-circle' },
};

export default function Invoice() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { orders } = useStore();
  const [busy, setBusy] = useState(false);

  const order = orders.find((o) => o.id === id);
  if (!order) return <Text style={styles.missing}>No se encontro el pedido.</Text>;

  const status = STATUS[order.status];

  const download = async () => {
    setBusy(true);
    try {
      await shareInvoicePdf(order);
    } catch (err) {
      console.error('PDF ERROR:', err);
      Alert.alert('Error al descargar PDF', err?.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.top}>
          <Ionicons name={status.icon} size={64} color={status.color} />
          <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
          {order.status === 'rejected' && !!order.error && <Text style={styles.hint}>{order.error}</Text>}
          {order.status === 'pending' && (
            <Text style={styles.hint}>Se registrara solo cuando haya conexion con el servidor.</Text>
          )}
        </View>

        <Text style={styles.title}>Pedido #{order.id.slice(-6)}</Text>
        <Text style={styles.date}>{new Date(order.createdAt).toLocaleString()}</Text>

        {!!order.customerName && <Text style={styles.date}>Cliente: {order.customerName}</Text>}
        {!!order.deliveryAddress && <Text style={styles.date}>Entrega: {order.deliveryAddress}</Text>}
        <View style={styles.lines}>
          {order.items.map((i) => (
            <View key={i.productId} style={styles.line}>
              <Text style={styles.lineName} numberOfLines={2}>{i.qty} x {i.name}</Text>
              <Text style={styles.lineTotal}>{money(i.price * i.qty)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{money(order.total)}</Text>
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <Pressable style={styles.secondary} onPress={download} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Ionicons name="download-outline" size={20} color={colors.text} />
          )}
          <Text style={styles.secondaryText}>Guardar / imprimir PDF</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => router.navigate('/')}>
          <Ionicons name="storefront-outline" size={20} color={colors.text} />
          <Text style={styles.buttonText}>Volver a la tienda</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  missing: { padding: 24, color: colors.muted },
  top: { alignItems: 'center', paddingVertical: 12 },
  status: { marginTop: 6, fontWeight: '700', fontSize: 16 },
  hint: { marginTop: 4, color: colors.muted, fontSize: 12, textAlign: 'center' },
  title: { marginTop: 16, fontSize: 18, fontWeight: '800', color: colors.text },
  date: { marginTop: 2, color: colors.muted },
  lines: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  lineName: { flex: 1, color: colors.text },
  lineTotal: { color: colors.text, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  totalLabel: { fontSize: 16, color: colors.text },
  total: { fontSize: 20, fontWeight: '800', color: colors.text },
  bar: { padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: colors.border },
  secondary: { height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.text, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontWeight: '700' },
  button: { height: 48, borderRadius: 24, backgroundColor: colors.mint, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.text, fontWeight: '800' },
});