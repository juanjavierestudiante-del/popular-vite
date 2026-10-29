import React from "react";
import { dateBO, label, money } from "../utils/domain.js";
export function Notice({ children, error = false }) {
  return children ? (
    <div
      className={`notice ${error ? "error" : "success"}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
export function RemoteState({ remote }) {
  return (
    <>
      <div className="toolbar">
        <button onClick={remote.reload} disabled={remote.refreshing}>
          {remote.refreshing ? "Actualizando…" : "Actualizar"}
        </button>
        <small>Actualización automática cada 30 s.</small>
      </div>
      {remote.loading && <p role="status">Cargando datos…</p>}
      <Notice error>{remote.error}</Notice>
    </>
  );
}
export function OrderCard({ order, children }) {
  return (
    <article className="panel order-card">
      <div className="toolbar">
        <h2>Pedido #{order.id}</h2>
        <span className={`badge ${order.estado_pedido}`}>
          {label(order.estado_pedido)}
        </span>
      </div>
      <p>
        {order.mesas
          ? `Mesa ${order.mesas.numero_mesa}`
          : label(order.tipo_pedido)}{" "}
        · {dateBO(order.created_at)}
      </p>
      <ul className="order-lines">
        {order.detalle_pedido?.map((line) => (
          <li key={line.id}>
            <strong>
              {line.cantidad} ×{" "}
              {line.menu?.nombre || `Producto #${line.menu_id}`}
            </strong>
            <span>{money(line.subtotal)}</span>
            {line.notas_preparacion && (
              <small>Nota: {line.notas_preparacion}</small>
            )}
          </li>
        ))}
      </ul>
      {!order.detalle_pedido?.length && <p>Sin productos registrados.</p>}
      <p className="total">Total: {money(order.monto_total)}</p>
      {children}
    </article>
  );
}
