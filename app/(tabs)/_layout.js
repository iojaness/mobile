import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/ui';
import { useStore } from '../../src/store';

// Thumb navigation: barra inferior estandar de expo-router (ya respeta el area segura
// del telefono). Siempre muestra Tienda, Carrito y Login/Mi cuenta.
const icon = (name, focusedName) => ({ color, size, focused }) => (
  <Ionicons name={focused ? focusedName : name} size={size} color={color} />
);

export default function TabsLayout() {
  const { cartCount, session, isAdmin } = useStore();
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.mintDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarBadgeStyle: { backgroundColor: colors.mint, color: colors.text, fontWeight: '800' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tienda', tabBarIcon: icon('storefront-outline', 'storefront') }} />
      <Tabs.Screen
        name="cart"
        options={{ title: 'Carrito', tabBarIcon: icon('cart-outline', 'cart'), tabBarBadge: cartCount > 0 ? cartCount : undefined }}
      />
      {/* La pestaña Admin solo existe para administradores. */}
      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen name="admin" options={{ title: 'Admin', tabBarIcon: icon('construct-outline', 'construct') }} />
      </Tabs.Protected>
      <Tabs.Screen
        name="login"
        options={{ title: session ? 'Mi cuenta' : 'Login', tabBarIcon: icon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  );
}
