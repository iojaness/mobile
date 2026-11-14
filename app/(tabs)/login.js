import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store';
import { colors } from '../../src/ui';

export default function Login() {
  const router = useRouter();
  const { signIn, signUp, signOut, session, isAdmin, afterLogin, setAfterLogin, cartCount } = useStore();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  const finish = () => {
    setName(''); setUsername(''); setPassword(''); setConfirm('');
    // Si venia de intentar pagar, vuelve al carrito (la sesion ya esta en el context).
    const goCart = afterLogin === 'cart' && cartCount > 0;
    setAfterLogin(null);
    router.navigate(goCart ? '/cart' : '/');
  };

  const submit = async () => {
    if (!username.trim() || !password) return Alert.alert('Faltan datos', 'Ingresa usuario y contraseña.');
    if (registering) {
      if (name.trim().length < 2) return Alert.alert('Falta tu nombre', 'Escribe tu nombre completo.');
      if (password.length < 6) return Alert.alert('Contraseña muy corta', 'Usa al menos 6 caracteres.');
      if (password !== confirm) return Alert.alert('Las contraseñas no coinciden', 'Verifica que sean iguales.');
    }
    setBusy(true);
    try {
      if (registering) await signUp(name.trim(), username.trim(), password);
      else await signIn(username.trim(), password);
      finish();
    } catch (e) {
      Alert.alert(registering ? 'No se pudo crear la cuenta' : 'No se pudo iniciar sesión', e.message);
    } finally {
      setBusy(false);
    }
  };

  if (session?.user) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Mi cuenta</Text>
        <Text style={styles.hello}>Hola, {session.user.name}</Text>
        <Text style={styles.sub}>{isAdmin ? 'Administrador · puedes gestionar el stock desde la pestaña Admin.' : 'Sesión iniciada. Ya puedes comprar.'}</Text>
        <Pressable style={styles.button} onPress={async () => { await signOut(); router.navigate('/'); }}>
          <Text style={styles.buttonText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{registering ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
        {afterLogin === 'cart' && <Text style={styles.sub}>{registering ? 'Crea tu cuenta' : 'Inicia sesión'} para continuar con tu compra.</Text>}
        {registering && <TextInput value={name} onChangeText={setName} placeholder="Nombre completo" placeholderTextColor={colors.muted} style={styles.input} />}
        <TextInput autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} placeholder="Usuario" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput secureTextEntry value={password} onChangeText={setPassword} placeholder="Contraseña" placeholderTextColor={colors.muted} style={styles.input} onSubmitEditing={registering ? undefined : submit} />
        {registering && <TextInput secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Repite la contraseña" placeholderTextColor={colors.muted} style={styles.input} onSubmitEditing={submit} />}
        {registering && <Text style={styles.hint}>Usuario: 3 a 30 caracteres (letras, números, punto o guion bajo). Contraseña: mínimo 6.</Text>}
        <Pressable disabled={busy} onPress={submit} style={[styles.button, busy && { opacity: 0.6 }]}>
          <Text style={styles.buttonText}>{busy ? 'Espera...' : registering ? 'Crear cuenta' : 'Ingresar'}</Text>
        </Pressable>
        <Pressable onPress={() => setMode(registering ? 'login' : 'register')} style={styles.switch} hitSlop={8}>
          <Text style={styles.switchText}>{registering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crear cuenta'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flex: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 24 },
  hello: { color: colors.text, marginBottom: 8, fontSize: 16 },
  sub: { color: colors.muted, marginBottom: 24 },
  hint: { color: colors.muted, fontSize: 12, marginBottom: 14 },
  input: { borderWidth: 1, borderColor: colors.border, color: colors.text, borderRadius: 12, padding: 14, marginBottom: 14 },
  button: { backgroundColor: colors.mint, borderRadius: 24, padding: 16, alignItems: 'center' },
  buttonText: { color: colors.text, fontWeight: '800' },
  switch: { marginTop: 18, alignItems: 'center' },
  switchText: { color: colors.mintDark, fontWeight: '700' },
});
