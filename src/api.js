let authToken = null;
export const setApiToken = (token) => { authToken = token; };
const BASE = process.env.EXPO_PUBLIC_API_URL;

async function request(path, options = {}) {
  // Sin timeout, fetch puede quedarse colgado minutos con una red mala.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(BASE + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...options.headers },
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const err = new Error(detail.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const loginUser = (username, password) => request('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const registerUser = (name, username, password) => request('/register', { method: 'POST', body: JSON.stringify({ name, username, password }) });
export const fetchProducts = () => request('/products');
// Solo admin: delta positivo suma, negativo resta. Devuelve el producto actualizado.
export const adjustProductStock = (productId, delta) => request(`/admin/products/${productId}/stock`, { method: 'PATCH', body: JSON.stringify({ delta }) });

// Solo se envian ids y cantidades: el back calcula precios y total.
export const postOrder = (order) =>
  request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      id: order.id,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((i) => ({ productId: i.productId, qty: i.qty })),
    }),
  });
