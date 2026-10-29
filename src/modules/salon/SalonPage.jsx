import React, { useRef, useState } from "react";
import { supabase } from "../../services/supabaseClient.js";
import {
  checked,
  orderSelect,
  moveOrder,
  allRows,
} from "../../services/restaurant.js";
import useRemote from "../../shared/hooks/useRemote.js";
import OrderForm from "./OrderForm.jsx";
import { Notice, RemoteState, OrderCard } from "../../shared/components/UI.jsx";
import { balance, money } from "../../shared/utils/domain.js";
export default function SalonView() {
  const remote = useRemote(async () => {
    const [menu, tables, orders] = await Promise.all([
      checked(
        supabase.from("menu").select("*").eq("disponible", true).order("nombre")
      ),
      checked(supabase.from("mesas").select("*").order("numero_mesa")),
      allRows(() =>
        supabase
          .from("pedidos")
          .select(orderSelect)
          .in("estado_pedido", ["pendiente", "en_cocina", "listo"])
          .order("created_at")
          .order("id")
      ),
    ]);
    return { menu, tables, orders };
  }, ["pedidos", "menu", "mesas", "pagos"]);
  const [tab, setTab] = useState("mesas"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function change(p, next) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await moveOrder(p, next);
      await remote.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function tableState(t, state) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const updated = await checked(
        supabase
          .from("mesas")
          .update({ estado: state })
          .eq("id", t.id)
          .eq("estado", t.estado)
          .select("id")
          .maybeSingle()
      );
      if (!updated) throw new Error("La mesa cambió o no tienes permisos.");
      await remote.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>Salón y mesas</h1>
      <div className="tabs">
        {["pedidos", "nuevo", "mesas"].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t === "nuevo" ? "Nuevo pedido" : t}
          </button>
        ))}
      </div>
      <RemoteState remote={remote} />
      <Notice error>{error}</Notice>
      {tab === "nuevo" && remote.data && (
        <OrderForm
          menu={remote.data.menu}
          tables={remote.data.tables}
          salon
          onSaved={remote.reload}
        />
      )}
      {tab === "pedidos" && (
        <>
          <div className="cards">
            {remote.data?.orders.map((p) => (
              <OrderCard key={p.id} order={p}>
                <p>Saldo: {money(balance(p))}</p>
                {p.estado_pedido === "listo" && (
                  <button
                    disabled={busy}
                    className="primary"
                    onClick={() => change(p, "entregado")}
                  >
                    Confirmar entrega
                  </button>
                )}
                {p.estado_pedido === "pendiente" &&
                  balance(p) === Number(p.monto_total) && (
                    <button
                      disabled={busy}
                      onClick={() => change(p, "cancelado")}
                    >
                      Cancelar pedido pendiente
                    </button>
                  )}
              </OrderCard>
            ))}
          </div>
          {remote.data?.orders.length === 0 && <p>No hay pedidos activos.</p>}
        </>
      )}
      {tab === "mesas" && (
        <>
          <p>
            El estado de la mesa se controla manualmente; entregar un pedido no
            libera automáticamente la mesa.
          </p>
          <div className="cards">
            {remote.data?.tables.map((t) => (
              <article className="panel" key={t.id}>
                <h2>Mesa {t.numero_mesa}</h2>
                <p>
                  {t.capacidad} personas · {t.ubicacion}
                </p>
                <label>
                  Estado
                  <select
                    disabled={busy}
                    value={t.estado}
                    onChange={(e) => tableState(t, e.target.value)}
                  >
                    {["disponible", "ocupada", "reservada"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
