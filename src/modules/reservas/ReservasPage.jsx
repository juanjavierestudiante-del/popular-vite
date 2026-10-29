import React, { useRef, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { checked, allRows } from "../../services/restaurant";
import useRemote from "../../shared/hooks/useRemote";
import { Notice, RemoteState } from "../../shared/components/UI";
import { dateBO, dayBO } from "../../shared/utils/domain";
export default function ReservasPage() {
  const remote = useRemote(async () => {
    const [reservations, tables] = await Promise.all([
      allRows(() =>
        supabase
          .from("reservas")
          .select("*,clientes(nombre),mesas(numero_mesa)")
          .in("estado_reserva", ["pendiente", "confirmada"])
          .order("fecha_hora_reserva")
          .order("id")
      ),
      checked(supabase.from("mesas").select("*").order("numero_mesa")),
    ]);
    return { reservations, tables };
  }, ["reservas", "mesas"]);
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [date, setDate] = useState("");
  const lock = useRef(false);
  async function update(r, next, tableId) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const fields = { estado_reserva: next };
      if (next === "confirmada") {
        if (new Date(r.fecha_hora_reserva) <= new Date())
          throw new Error(
            "La fecha de esta solicitud ya pasó. Contacta al cliente antes de confirmarla."
          );
        const t = remote.data.tables.find(
          (t) => String(t.id) === String(tableId)
        );
        if (!t || t.capacidad < r.numero_personas)
          throw new Error("Elige una mesa con capacidad suficiente.");
        const conflicts = await checked(
          supabase
            .from("reservas")
            .select("id")
            .eq("mesa_id", t.id)
            .eq("estado_reserva", "confirmada")
            .eq("fecha_hora_reserva", r.fecha_hora_reserva)
            .neq("id", r.id)
        );
        if (conflicts.length)
          throw new Error("Hay otra reserva confirmada para esa mesa y hora.");
        fields.mesa_id = t.id;
      }
      const saved = await checked(
        supabase
          .from("reservas")
          .update(fields)
          .eq("id", r.id)
          .eq("estado_reserva", r.estado_reserva)
          .select("id")
          .maybeSingle()
      );
      if (!saved) throw new Error("La reserva cambió o no tienes permisos.");
      setMessage("Reserva actualizada.");
      await remote.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const rows =
    remote.data?.reservations.filter(
      (r) => !date || dayBO(r.fecha_hora_reserva) === date
    ) || [];
  return (
    <section>
      <h1>Agenda de reservas</h1>
      <p className="muted">
        Solicitudes y mesas confirmadas. Fechas y horas de Bolivia.
      </p>
      <RemoteState remote={remote} />
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      <div className="toolbar">
        <label>
          Filtrar por fecha
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button onClick={() => setDate("")}>Ver todas las activas</button>
      </div>
      <div className="info-strip">
        Revisa la disponibilidad antes de confirmar. El esquema actual no guarda
        la duración: las reservas con horarios cercanos necesitan revisión
        manual.
      </div>
      <div className="cards">
        {rows.map((r) => (
          <Reservation
            key={r.id}
            r={r}
            tables={remote.data.tables}
            busy={busy}
            update={update}
          />
        ))}
      </div>
      {!remote.loading && !remote.error && !rows.length && (
        <p className="empty-state">No hay reservas activas para este filtro.</p>
      )}
    </section>
  );
}
function Reservation({ r, tables, busy, update }) {
  const [table, setTable] = useState(r.mesa_id || "");
  return (
    <article className="panel">
      <div className="section-bar">
        <h2>Reserva #{r.id}</h2>
        <span
          className={
            "badge " +
            (r.estado_reserva === "confirmada" ? "listo" : "pendiente")
          }
        >
          {r.estado_reserva}
        </span>
      </div>
      <h3>{r.clientes?.nombre || "Cliente"}</h3>
      <p>{dateBO(r.fecha_hora_reserva)}</p>
      <p>
        {r.numero_personas} personas · {r.observaciones || "Sin observaciones"}
      </p>
      {r.estado_reserva === "pendiente" ? (
        <>
          <label>
            Mesa
            <select
              value={table}
              disabled={busy}
              onChange={(e) => setTable(e.target.value)}
            >
              <option value="">Selecciona una mesa</option>
              {tables
                .filter((t) => t.capacidad >= r.numero_personas)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.numero_mesa} · {t.ubicacion} · {t.capacidad}{" "}
                    personas
                  </option>
                ))}
            </select>
          </label>
          <button
            className="primary"
            disabled={busy || !table}
            onClick={() => update(r, "confirmada", table)}
          >
            Confirmar reserva
          </button>
        </>
      ) : (
        <>
          <p>
            <strong>Mesa {r.mesas?.numero_mesa}</strong>
          </p>
          <button
            className="primary"
            disabled={busy}
            onClick={() => update(r, "completada")}
          >
            Marcar completada
          </button>
        </>
      )}
      <button disabled={busy} onClick={() => update(r, "cancelada")}>
        Cancelar reserva
      </button>
    </article>
  );
}
