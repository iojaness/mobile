import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { fetchProducts, postOrder, loginUser, registerUser, adjustProductStock, setApiToken } from './api';

// Menos de este numero de unidades se muestra como "Poco stock".
export const LOW_STOCK = 5;

const KEYS = { products: 'v2:products', cart: 'v2:cart', orders: 'v2:orders', session: 'v2:session' };

async function load(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const save = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));

// El id se genera en el movil para poder registrar pedidos sin conexion.
const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }) {
  const [rawProducts, setProducts] = useState([]); // lo ultimo que dijo el servidor (el admin recibe tambien los agotados)
  const [cart, setCart] = useState({}); // { [productId]: qty }
  const [orders, setOrders] = useState([]);
  const [online, setOnline] = useState(true);
  const onlineRef = useRef(true);
  const [session, setSession] = useState(null);
  // Si el usuario intenta pagar sin sesion, aqui se guarda a donde volver tras el login.
  const [afterLogin, setAfterLogin] = useState(null);
  const [ready, setReady] = useState(false);

  // Refs con el valor mas reciente, para que la sincronizacion no lea estado viejo.
  const ordersRef = useRef([]);
  const cartRef = useRef({});
  const syncing = useRef(false);

  const persistOrders = (next) => {
    ordersRef.current = next;
    setOrders(next);
    save(KEYS.orders, next);
  };

  const persistCart = (next) => {
    cartRef.current = next;
    setCart(next);
    save(KEYS.cart, next);
  };

  const refreshProducts = async () => {
    try {
      const list = await fetchProducts();
      setProducts(list);
      save(KEYS.products, list);
    } catch {
      // Sin back o sin red: se queda con el catalogo guardado.
    }
  };

  // Envia los pedidos pendientes en orden. Si falla por red, corta y reintenta luego.
  const syncOrders = async () => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      const pending = ordersRef.current.filter((o) => o.status === 'pending');
      let processed = false;
      for (const order of pending) {
        let status = 'synced';
        let reason;
        try {
          await postOrder(order);
        } catch (err) {
          // Un 4xx significa que el back rechazo el pedido; reintentar no sirve.
          if (err.status >= 400 && err.status < 500) { status = 'rejected'; reason = err.message; }
          else break;
        }
        persistOrders(ordersRef.current.map((o) => (o.id === order.id ? { ...o, status, error: reason } : o)));
        processed = true;
      }
      // El stock cambio (o el pedido fue rechazado por stock): se actualiza el catalogo.
      if (processed) refreshProducts();
    } finally {
      syncing.current = false;
    }
  };

  // Arranque: primero lo local, despues la red.
  useEffect(() => {
    let unsubscribe;
    (async () => {
      const [p, c, o] = await Promise.all([
        load(KEYS.products, []),
        load(KEYS.cart, {}),
        load(KEYS.orders, []),
      ]);
      // No iniciar sesión automáticamente al abrir la aplicación.
      setApiToken(null);
      setSession(null);
      await AsyncStorage.removeItem(KEYS.session);
      setProducts(p);
      cartRef.current = c;
      setCart(c);
      ordersRef.current = o;
      setOrders(o);
      setReady(true);

      // NetInfo dispara el listener al registrarlo y en cada cambio de conexion.
      unsubscribe = NetInfo.addEventListener((state) => {
        const isOnline = !!state.isConnected && state.isInternetReachable !== false;
        setOnline(isOnline);
        onlineRef.current = isOnline;
        if (isOnline) {
          refreshProducts();
          syncOrders();
        }
      });
    })();
    return () => unsubscribe && unsubscribe();
  }, []);

  // Si hay conexion pero el back estaba caido, reintenta cada 30 s.
  useEffect(() => {
    const timer = setInterval(() => {
      if (ordersRef.current.some((o) => o.status === 'pending')) syncOrders();
      else if (onlineRef.current) refreshProducts(); // mantiene el stock al dia
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const stockOf = (productId) => rawProducts.find((p) => p.id === Number(productId))?.stock ?? 0;

  // Devuelve false si no hay stock suficiente para agregar esa cantidad.
  const addToCart = (productId, qty = 1) => {
    const current = cartRef.current[productId] || 0;
    if (current + qty > stockOf(productId)) return false;
    persistCart({ ...cartRef.current, [productId]: current + qty });
    return true;
  };

  const setQty = (productId, qty) => {
    const next = { ...cartRef.current };
    if (qty <= 0) delete next[productId];
    else next[productId] = Math.min(qty, stockOf(productId));
    persistCart(next);
  };

  const isAdmin = session?.user?.role === 'admin';
  // Comprador: solo lo que tiene stock. Admin: todo, para poder reponerlo.
  const products = useMemo(
    () => (isAdmin ? rawProducts : rawProducts.filter((p) => (p.stock ?? 0) > 0)),
    [rawProducts, isAdmin]
  );

  // Carrito unido con el catalogo: sin agotados y con la cantidad limitada al stock disponible.
  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = rawProducts.find((p) => p.id === Number(id));
          const stock = product?.stock ?? 0;
          return product && stock > 0 ? { productId: product.id, qty: Math.min(qty, stock), product } : null;
        })
        .filter(Boolean),
    [cart, rawProducts]
  );

  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  // Guarda el pedido local como pendiente y trata de enviarlo de inmediato.
  // El pago es simulado: aqui iria la pasarela real.
  const startSession = (result) => {
    setApiToken(result.token);
    setSession(result);
    refreshProducts(); // el admin recibe tambien los productos agotados
    // La sesión dura solo mientras la aplicación permanezca abierta.
  };

  const signIn = async (username, password) => startSession(await loginUser(username, password));

  // El registro siempre crea un comprador (el servidor ignora cualquier rol enviado).
  const signUp = async (name, username, password) => startSession(await registerUser(name, username, password));

  const signOut = async () => {
    setApiToken(null);
    setSession(null);
    await AsyncStorage.removeItem(KEYS.session);
    refreshProducts();
  };

  // Admin: suma o resta stock y actualiza el catalogo local con la respuesta del servidor.
  const adjustStock = async (productId, delta) => {
    const updated = await adjustProductStock(productId, delta);
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      save(KEYS.products, next);
      return next;
    });
    return updated;
  };

  const checkout = (deliveryAddress) => {
    if (!session?.user || !deliveryAddress?.trim()) return null;
    if (cartItems.length === 0) return null;
    const order = {
      id: newId(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      total: cartTotal,
      customerName: session.user.name,
      deliveryAddress: deliveryAddress.trim(),
      items: cartItems.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        image: i.product.image,
        price: i.product.price,
        qty: i.qty,
      })),
    };
    persistOrders([order, ...ordersRef.current]);
    persistCart({});
    syncOrders();
    return order.id;
  };

  const value = {
    ready, session, isAdmin, signIn, signUp, signOut, afterLogin, setAfterLogin, adjustStock, refreshProducts, online, products, orders, cart, cartItems, cartCount, cartTotal, pendingCount,
    addToCart, setQty, checkout,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
