export const money = (value) => `Bs. ${Number(value || 0).toFixed(2)}`;
export const label = (value) => String(value || "").replaceAll("_", " ");
export const cents = (value) => Math.round(Number(value || 0) * 100);
export function balance(order) {
  const paid = (order.pagos || [])
    .filter((p) => p.estado_pago === "completado")
    .reduce((sum, p) => sum + cents(p.monto), 0);
  return Math.max(0, cents(order.monto_total) - paid) / 100;
}
export const dateBO = (value) =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
export const dayBO = (value) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
export function reservationISO(local) {
  const result = new Date(`${local}:00-04:00`);
  if (Number.isNaN(result.getTime()) || result.getTime() <= Date.now())
    throw new Error("Elige una fecha futura (hora de Bolivia).");
  return result.toISOString();
}
export function buildLines(cart, menu) {
  if (!cart.length) throw new Error("Agrega al menos un producto.");
  return cart.map((item) => {
    const product = menu.find(
      (p) => String(p.id) === String(item.id) && p.disponible
    );
    if (!product)
      throw new Error("Un producto ya no está disponible. Actualiza el menú.");
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      throw new Error("Cantidad inválida (1 a 99).");
    const price = cents(product.precio);
    if (!Number.isFinite(price) || price < 0)
      throw new Error("Precio inválido.");
    return {
      menu_id: product.id,
      cantidad: item.quantity,
      precio_unitario: price / 100,
      subtotal: (price * item.quantity) / 100,
      notas_preparacion: (item.notes || "").trim().slice(0, 500),
    };
  });
}
