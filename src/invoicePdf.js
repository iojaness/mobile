import * as Print from 'expo-print';
import { money } from './ui';

// Los nombres vienen de la base de datos: se escapan antes de meterlos al HTML.
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STATUS_LABEL = {
  pending: 'Pendiente de registro en el servidor',
  synced: 'Registrado',
  rejected: 'Rechazado por el servidor',
};

function buildHtml(order) {
  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td>${esc(i.name)}</td>
        <td class="num">${i.qty}</td>
        <td class="num">${money(i.price)}</td>
        <td class="num">${money(i.price * i.qty)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 32px; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; }
    h1 { margin: 0; font-size: 28px; }
    .bar { height: 4px; width: 64px; background: #7ae8b5; margin: 8px 0 20px; }
    .meta { color: #6b7280; font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; }
    th { text-align: left; border-bottom: 2px solid #111; padding: 8px 4px; }
    td { border-bottom: 1px solid #e4e9e7; padding: 8px 4px; }
    .num { text-align: right; white-space: nowrap; }
    .total { margin-top: 20px; text-align: right; font-size: 20px; font-weight: 700; }
  </style>
</head>
<body>
  <h1>GeekShop</h1>
  <div class="bar"></div>
  <div class="meta">
    Factura del pedido #${esc(order.id.slice(-6))}<br />
    Fecha: ${esc(new Date(order.createdAt).toLocaleString('es-CO'))}<br />
    Estado: ${esc(STATUS_LABEL[order.status] || order.status)}<br />
    Cliente: ${esc(order.customerName || 'Sin nombre')}<br />
    Dirección: ${esc(order.deliveryAddress || 'Sin dirección')}
  </div>
  <table>
    <thead>
      <tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Subtotal</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">Total: ${money(order.total)} COP</div>
</body>
</html>`;
}

// Android/Expo Go: el PDF temporal de printToFileAsync puede quedar ilegible.
// El dialogo nativo de impresion evita leer/copiar esa URI y permite "Guardar como PDF".
export async function shareInvoicePdf(order) {
  const html = buildHtml(order);
  await Print.printAsync({ html });
}
