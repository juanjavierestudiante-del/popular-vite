import React, { useRef, useState } from "react";
import { supabase } from "../../services/supabaseClient.js";
import { orderSelect, moveOrder, allRows } from "../../services/restaurant.js";
import useRemote from "../../shared/hooks/useRemote.js";
import { Notice, RemoteState, OrderCard } from "../../shared/components/UI.jsx";
export default function CocinaView() {
  const remote = useRemote(
    () =>
      allRows(() =>
        supabase
          .from("pedidos")
          .select(orderSelect)
          .in("estado_pedido", ["pendiente", "en_cocina"])
          .order("created_at")
          .order("id")
      ),
    ["pedidos", "detalle_pedido"]
  );
  const [busy, setBusy] = useState(null),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function advance(p) {
    if (lock.current) return;
    lock.current = true;
    setBusy(p.id);
    setError("");
    try {
      await moveOrder(
        p,
        p.estado_pedido === "pendiente" ? "en_cocina" : "listo"
      );
      await remote.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  return (
    <section>
      <h1>Estación de cocina</h1>
      <p>Pedidos ordenados por hora de llegada.</p>
      <RemoteState remote={remote} />
      <Notice error>{error}</Notice>
      <div className="kitchen-columns">
        {[
          ["pendiente", "Por preparar"],
          ["en_cocina", "En preparación"],
        ].map(([state, title]) => (
          <div className="kitchen-column" key={state}>
            <h2>
              {title}
              <span className="badge">
                {remote.data?.filter((p) => p.estado_pedido === state).length ||
                  0}
              </span>
            </h2>
            <div className="cards">
              {remote.data
                ?.filter((p) => p.estado_pedido === state)
                .map((p) => (
                  <OrderCard key={p.id} order={p}>
                    <button
                      className="primary"
                      disabled={busy !== null}
                      onClick={() => advance(p)}
                    >
                      {busy === p.id
                        ? "Guardando…"
                        : state === "pendiente"
                        ? "Iniciar preparación"
                        : "Marcar listo"}
                    </button>
                  </OrderCard>
                ))}
            </div>
            {remote.data &&
              !remote.data.some((p) => p.estado_pedido === state) && (
                <p className="empty-state">Sin pedidos en esta etapa.</p>
              )}
          </div>
        ))}
      </div>
      {remote.data?.length === 0 && (
        <p className="panel">No hay pedidos pendientes en cocina.</p>
      )}
    </section>
  );
}
