import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, LOW_STOCK } from '../../src/store';
import { colors } from '../../src/ui';

const STEPS = [-10, -1, 1, 10];

function StockBadge({ stock }) {
  if (stock <= 0) return <Text style={[styles.badge, { color: colors.danger }]}>Agotado</Text>;
  if (stock < LOW_STOCK) return <Text style={[styles.badge, { color: colors.warn }]}>Poco stock</Text>;
  return <Text style={[styles.badge, { color: colors.mintDark }]}>En stock</Text>;
}

export default function Admin() {
  const { products, isAdmin, adjustStock, refreshProducts, online } = useStore();
  const [query, setQuery] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (!q || p.name.toLowerCase().includes(q)) && (!onlyLow || p.stock < LOW_STOCK));
  }, [products, query, onlyLow]);

  // Respaldo: la pestaña solo existe para admins, pero aqui tambien se comprueba.
  if (!isAdmin) return <View style={styles.center}><Text style={{ color: colors.muted }}>Solo para administradores.</Text></View>;

  const change = async (item, delta) => {
    if (busyId) return;
    if (!online) return Alert.alert('Sin conexión', 'Necesitas internet para cambiar el stock.');
    setBusyId(item.id);
    try { await adjustStock(item.id, delta); }
    catch (e) { Alert.alert('No se pudo cambiar el stock', e.message); }
    finally { setBusyId(null); }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de stock</Text>
        <Pressable onPress={refreshProducts} hitSlop={10}><Ionicons name="refresh-outline" size={22} color={colors.text} /></Pressable>
      </View>
      <View style={styles.tools}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput style={styles.search} placeholder="Buscar producto" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} />
        </View>
        <Pressable style={[styles.chip, onlyLow && styles.chipActive]} onPress={() => setOnlyLow((v) => !v)}>
          <Text style={[styles.chipText, onlyLow && styles.chipTextActive]}>Bajo stock</Text>
        </Pressable>
      </View>
      <FlatList
        data={list}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos para mostrar.</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.top}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <StockBadge stock={item.stock} />
              </View>
              <Text style={styles.stock}>{item.stock}</Text>
            </View>
            <View style={styles.steps}>
              {STEPS.map((d) => (
                <Pressable key={d} disabled={busyId === item.id || (d < 0 && item.stock <= 0)} onPress={() => change(item, d)}
                  style={[styles.step, d < 0 ? styles.stepDown : styles.stepUp, (busyId === item.id || (d < 0 && item.stock <= 0)) && { opacity: 0.35 }]}>
                  <Text style={styles.stepText}>{d > 0 ? `+${d}` : d}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, marginTop: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, borderRadius: 21, backgroundColor: colors.surface, paddingHorizontal: 14 },
  search: { flex: 1, color: colors.text },
  chip: { paddingHorizontal: 14, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.text },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.mint, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  image: { width: 52, height: 52, borderRadius: 8, backgroundColor: colors.surface },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  badge: { marginTop: 2, fontSize: 12, fontWeight: '700' },
  stock: { fontSize: 24, fontWeight: '800', color: colors.text, minWidth: 44, textAlign: 'right' },
  steps: { flexDirection: 'row', gap: 8, marginTop: 10 },
  step: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepDown: { backgroundColor: '#fdecea' },
  stepUp: { backgroundColor: colors.mintSoft },
  stepText: { color: colors.text, fontWeight: '800' },
});
