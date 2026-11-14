import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../src/store';
import { colors } from '../src/ui';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Producto', headerBackTitle: 'Atrás' }} />
        <Stack.Screen name="invoice" options={{ title: 'Factura', headerBackVisible: false, gestureEnabled: false }} />
      </Stack>
    </StoreProvider>
  );
}
