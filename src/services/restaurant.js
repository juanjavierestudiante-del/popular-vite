import { supabase } from "./supabaseClient.js";
import { balance, buildLines, cents } from "../shared/utils/domain.js";
export const orderSelect =
  "*, mesas(numero_mesa), detalle_pedido(*, menu(nombre)), pagos(id,monto,estado_pago,metodo_pago,fecha_pago)";
export async function checked(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function moveOrder(order, next) {
  const transitions = {
    pendiente: ["en_cocina", "cancelado"],
    en_cocina: ["listo"],
    listo: ["entregado"],
  };
  if (!transitions[order.estado_pedido]?.includes(next))
    throw new Error("Transición no permitida.");
  if (
    next === "cancelado" &&
    (order.pagos || []).some((p) => p.estado_pago === "completado")
  )
    throw new Error("El pedido tiene pagos. Debe revisarlo gerencia.");
  const result = await checked(
    supabase
      .from("pedidos")
      .update({ estado_pedido: next })
      .eq("id", order.id)
      .eq("estado_pedido", order.estado_pedido)
      .select("id")
      .maybeSingle()
  );
  if (!result)
    throw new Error(
      "El pedido cambió o no tienes permisos. Actualiza la lista."
    );
}
export async function createOrder(cart, fields) {
  const menu = await checked(
    supabase.from("menu").select("id,precio,disponible")
  );
  const lines = buildLines(cart, menu);
  const total = lines.reduce((s, l) => s + cents(l.subtotal), 0) / 100;
  // El borrador cancelado no entra en cocina hasta guardar todos los detalles.
  const draft = await checked(
    supabase
      .from("pedidos")
      .insert({ ...fields, estado_pedido: "cancelado", monto_total: 0 })
      .select("id")
      .single()
  );
  let detailsSaved = false;
  try {
    await checked(
      supabase
        .from("detalle_pedido")
        .insert(lines.map((line) => ({ ...line, pedido_id: draft.id })))
    );
    detailsSaved = true;
    const committed = await checked(
      supabase
        .from("pedidos")
        .update({ monto_total: total, estado_pedido: "pendiente" })
        .eq("id", draft.id)
        .eq("estado_pedido", "cancelado")
        .select("id")
        .maybeSingle()
    );
    if (!committed) throw new Error("No se pudo activar el borrador.");
    return draft.id;
  } catch (error) {
    // No se reintenta automáticamente: una respuesta perdida no prueba que la escritura falló.
    throw new Error(
      `Pedido #${draft.id}: ${error.message}. ${
        detailsSaved
          ? "Revisa Mis pedidos o Salón antes de repetir; la activación pudo completarse."
          : "Quedó un borrador cancelado; revisa sus detalles antes de repetir."
      }`
    );
  }
}
const paymentsInFlight = new Set();
export async function collect(orderId, cashierId, method) {
  if (paymentsInFlight.has(orderId))
    throw new Error("Este cobro ya está en curso.");
  paymentsInFlight.add(orderId);
  try {
    const current = await checked(
      supabase.from("pedidos").select(orderSelect).eq("id", orderId).single()
    );
    if (current.estado_pedido === "cancelado")
      throw new Error("El pedido está cancelado.");
    const amount = balance(current);
    if (!amount) throw new Error("El pedido ya está pagado.");
    // Solo registra el pago; NO modifica preparación ni entrega.
    await checked(
      supabase.from("pagos").insert({
        pedido_id: orderId,
        cajero_id: cashierId,
        monto: amount,
        metodo_pago: method,
        estado_pago: "completado",
      })
    );
  } finally {
    paymentsInFlight.delete(orderId);
  }
}

// Evita depender del límite predeterminado de 1000 filas de la API.
export async function allRows(factory) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const page = await checked(factory().range(offset, offset + 499));
    rows.push(...(page || []));
    if (!page || page.length < 500) return rows;
  }
}
