import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { allRows } from "../../services/restaurant";
import useRemote from "../../shared/hooks/useRemote";
import { RemoteState } from "../../shared/components/UI";
import { dayBO, dateBO, money, cents, label } from "../../shared/utils/domain";
export default function ReportesPage() {
  const [from, setFrom] = useState(dayBO(Date.now())),
    [to, setTo] = useState(dayBO(Date.now()));
  const remote = useRemote(async () => {
    if (!from || !to || to < from)
      throw new Error("Selecciona un rango de fechas válido.");
    const start = `${from}T00:00:00-04:00`,
      end = new Date(
        new Date(`${to}T00:00:00-04:00`).getTime() + 86400000
      ).toISOString();
    const [payments, orders] = await Promise.all([
      allRows(() =>
        supabase
          .from("pagos")
          .select("*")
          .eq("estado_pago", "completado")
          .gte("fecha_pago", start)
          .lt("fecha_pago", end)
          .order("id")
      ),
      allRows(() =>
        supabase
          .from("pedidos")
          .select("id,estado_pedido,monto_total,created_at")
          .gte("created_at", start)
          .lt("created_at", end)
          .order("id")
      ),
    ]);
    return { payments, orders, from, to };
  }, ["pagos", "pedidos"]);
  const d = remote.data;
  return (
    <section>
      <h1>Reportes de operación</h1>
      <p className="muted">
        Pedidos y cobros completados, por fecha de registro.
      </p>
      <form
        className="filter-bar"
        onSubmit={(e) => {
          e.preventDefault();
          remote.reload();
        }}
      >
        <label>
          Desde
          <input
            type="date"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            required
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button className="primary" disabled={remote.refreshing}>
          Consultar
        </button>
      </form>
      <RemoteState remote={remote} />
      {d && (
        <>
          <p className="report-period">
            Resultado consultado: {d.from} — {d.to} · hora boliviana
          </p>
          <div className="stats-grid">
            <article className="stat-card">
              <small>Cobros completados</small>
              <strong>
                {money(
                  d.payments.reduce((s, p) => s + cents(p.monto), 0) / 100
                )}
              </strong>
              <span>{d.payments.length} pagos registrados</span>
            </article>
            <article className="stat-card">
              <small>Pedidos registrados</small>
              <strong>
                {d.orders.filter((p) => p.estado_pedido !== "cancelado").length}
              </strong>
              <span>
                {d.orders.filter((p) => p.estado_pedido === "cancelado").length}{" "}
                cancelados o borradores
              </span>
            </article>
          </div>
          <div className="cards">
            {["efectivo", "qr", "tarjeta"].map((method) => (
              <article className="panel" key={method}>
                <small>{label(method)}</small>
                <h2>
                  {money(
                    d.payments
                      .filter((p) => p.metodo_pago === method)
                      .reduce((s, p) => s + cents(p.monto), 0) / 100
                  )}
                </h2>
              </article>
            ))}
          </div>
          <article className="panel">
            <h2>Detalle de cobros</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Pago</th>
                    <th>Pedido</th>
                    <th>Fecha y hora</th>
                    <th>Método</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {d.payments.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>#{p.pedido_id}</td>
                      <td>{dateBO(p.fecha_pago)}</td>
                      <td>{label(p.metodo_pago)}</td>
                      <td>{money(p.monto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!d.payments.length && (
              <p className="empty-state">
                No hay pagos completados en este período.
              </p>
            )}
          </article>
        </>
      )}
    </section>
  );
}
