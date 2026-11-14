export const colors = {
  bg: '#ffffff',
  surface: '#f3f6f5',
  text: '#111111',
  muted: '#6b7280',
  border: '#e4e9e7',
  mint: '#7ae8b5',
  mintSoft: '#e8faf2',
  mintDark: '#0e9f6e', // para texto sobre blanco, el menta claro no se lee
  warn: '#b45309',
  danger: '#c0392b',
};

// 99900 -> "$99.900" (pesos colombianos, punto como separador de miles).
export const money = (n) => `$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
