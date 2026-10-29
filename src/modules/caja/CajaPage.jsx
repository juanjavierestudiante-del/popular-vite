import React, { useRef, useState } from "react";
import { supabase } from "../../services/supabaseClient.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { orderSelect, collect, allRows } from "../../services/restaurant.js";
import useRemote from "../../shared/hooks/useRemote.js";
import { Notice, RemoteState, OrderCard } from "../../shared/components/UI.jsx";
import { balance, money } from "../../shared/utils/domain.js";
export default function CajaView() {
  const { user } = useAuth();
  const remote = useRemote(
    () =>
      allRows(() =>
        supabase
          .from("pedidos")
          .select(orderSelect)
          .neq("estado_pedido", "cancelado")
          .order("created_at")
          .order("id")
      ),
    ["pedidos", "pagos"]
  );
  const [selected, setSelected] = useState(null),
    [method, setMethod] = useState("efectivo");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(null);
  const lock = useRef(false);
  async function pay() {
    if (lock.current || !selected) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await collect(selected.id, user.id, method);
      setMessage(`Pago registrado para el pedido #${selected.id}.`);
      setSelected(null);
      await remote.reload();
    } catch (e) {
      setError(`${e.message}. Revisa los pagos antes de intentar otro cobro.`);
      setUncertain(selected.id);
      setSelected(null);
      await remote.reload();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const pending = remote.data?.filter((p) => balance(p) > 0) || [];
  return (
    <section>
      <h1>Estación de caja</h1>
      <p>El cobro no cambia la preparación ni la entrega del pedido.</p>
      <RemoteState remote={remote} />
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      {uncertain !== null && (
        <div className="panel">
          <p>
            Comprueba el pedido #{uncertain} y sus pagos en Supabase antes de
            habilitar un reintento.
          </p>
          <button
            onClick={() => {
              setUncertain(null);
              setError("");
            }}
          >
            Ya revisé el registro de pagos
          </button>
        </div>
      )}
      <div className="cards">
        {pending.map((p) => (
          <OrderCard key={p.id} order={p}>
            <p className="total">Saldo: {money(balance(p))}</p>
            <button
              className="primary"
              disabled={busy || uncertain === p.id}
              onClick={() => {
                setSelected(p);
                setMethod("efectivo");
              }}
            >
              Registrar cobro
            </button>
          </OrderCard>
        ))}
      </div>
      {!remote.loading && !remote.error && !pending.length && (
        <p className="panel">No hay saldos pendientes.</p>
      )}
      {selected && (
        <section
          className="payment-confirm panel"
          role="region"
          aria-label="Confirmar pago"
        >
          <h2>Confirmar pago · pedido #{selected.id}</h2>
          <p>
            {money(balance(selected))}. Confirma que recibiste el dinero o
            verificaste el abono.
          </p>
          <label>
            Método
            <select
              disabled={busy}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="qr">QR (verificado manualmente)</option>
              <option value="tarjeta">Tarjeta (verificada manualmente)</option>
            </select>
          </label>
          <div className="actions">
            <button disabled={busy} onClick={() => setSelected(null)}>
              Volver
            </button>
            <button className="primary" disabled={busy} onClick={pay}>
              {busy ? "Registrando…" : "Confirmo recepción del pago"}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
