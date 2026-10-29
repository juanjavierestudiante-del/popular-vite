import React from "react";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  ChefHat,
  Wallet,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../services/supabaseClient";
import { checked, allRows, orderSelect } from "../../services/restaurant";
import useRemote from "../../shared/hooks/useRemote";
import { RemoteState } from "../../shared/components/UI";
import {
  balance,
  money,
  cents,
  dayBO,
  dateBO,
  label,
} from "../../shared/utils/domain";
export default function DashboardPage() {
  const { userProfile, userRole } = useAuth();
  const manager = userRole === "gerente",
    floor = manager || userRole === "mesero",
    cash = manager || userRole === "cajero";
  const remote = useRemote(async () => {
    const orders = await allRows(() =>
      supabase
        .from("pedidos")
        .select(orderSelect)
        .neq("estado_pedido", "cancelado")
        .order("id")
    );
    const tables = floor
      ? await checked(supabase.from("mesas").select("*").order("numero_mesa"))
      : [];
    const reservations = floor
      ? await checked(
          supabase
            .from("reservas")
            .select("id,estado_reserva")
            .eq("estado_reserva", "pendiente")
        )
      : [];
    const payments = cash
      ? await allRows(() =>
          supabase
            .from("pagos")
            .select("id,monto,fecha_pago")
            .eq("estado_pago", "completado")
            .gte("fecha_pago", `${dayBO(Date.now())}T00:00:00-04:00`)
            .order("id")
        )
      : [];
    return { orders, tables, reservations, payments };
  }, ["pedidos", "pagos", ...(floor ? ["mesas", "reservas"] : [])]);
  const d = remote.data,
    active =
      d?.orders.filter((p) =>
        ["pendiente", "en_cocina", "listo"].includes(p.estado_pedido)
      ) || [];
  const actions = [
    ...(floor
      ? [
          [
            "/personal/salon",
            "Atender salón",
            "Mesas y pedidos presenciales",
            UtensilsCrossed,
          ],
        ]
      : []),
    ...(manager || userRole === "cocinero"
      ? [
          [
            "/personal/cocina",
            "Abrir cocina",
            "Comandas y preparación",
            ChefHat,
          ],
        ]
      : []),
    ...(cash
      ? [
          [
            "/personal/caja",
            "Ir a caja",
            "Cuentas y registro de cobros",
            Wallet,
          ],
        ]
      : []),
    ...(floor
      ? [
          [
            "/personal/reservas",
            "Ver reservas",
            "Agenda y asignación de mesas",
            CalendarDays,
          ],
        ]
      : []),
  ];
  return (
    <section>
      <header className="page-heading">
        <div>
          <span className="eyebrow">EL RESTAURANTE, EN UN VISTAZO</span>
          <h1>
            Hola, {userProfile?.nombre?.split(" ")[0] || "equipo"}{" "}
            <span className="wave">✳</span>
          </h1>
          <p className="muted">
            Todo listo para un buen servicio. Este es el estado de la operación.
          </p>
        </div>
        <span className="date-chip">{dateBO(Date.now())}</span>
      </header>
      <RemoteState remote={remote} />
      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon green">
            <UtensilsCrossed size={21} />
          </span>
          <small>Pedidos activos</small>
          <strong>{d ? active.length : "—"}</strong>
          <span>Pendientes, en cocina y listos</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon orange">
            <ChefHat size={21} />
          </span>
          <small>Por preparar</small>
          <strong>
            {d
              ? active.filter((p) => p.estado_pedido === "pendiente").length
              : "—"}
          </strong>
          <span>Esperando inicio en cocina</span>
        </article>
        {floor && (
          <article className="stat-card">
            <span className="stat-icon blue">
              <CalendarDays size={21} />
            </span>
            <small>Mesas ocupadas</small>
            <strong>
              {d
                ? `${d.tables.filter((t) => t.estado === "ocupada").length} / ${
                    d.tables.length
                  }`
                : "—"}
            </strong>
            <span>{d?.reservations.length || 0} reservas por revisar</span>
          </article>
        )}
        {cash && (
          <article className="stat-card">
            <span className="stat-icon green">
              <Wallet size={21} />
            </span>
            <small>Cobros de hoy</small>
            <strong>
              {d
                ? money(
                    d.payments.reduce((s, p) => s + cents(p.monto), 0) / 100
                  )
                : "—"}
            </strong>
            <span>Pagos completados · hora boliviana</span>
          </article>
        )}
      </div>
      <h2 className="section-title">Tu espacio de trabajo</h2>
      <div className="quick-grid">
        {actions.map(([url, title, desc, Icon]) => (
          <Link className="quick-card" key={url} to={url}>
            <Icon size={25} />
            <div>
              <strong>{title}</strong>
              <small>{desc}</small>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        ))}
      </div>
      <div className="dashboard-lower">
        <article className="panel">
          <div className="section-bar">
            <h2>Pedidos en curso</h2>
            <span className="badge">{active.length} activos</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  {cash && <th>Saldo</th>}
                </tr>
              </thead>
              <tbody>
                {active.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>#{p.id}</strong>
                    </td>
                    <td>
                      {p.mesas
                        ? `Mesa ${p.mesas.numero_mesa}`
                        : label(p.tipo_pedido)}
                    </td>
                    <td>
                      <span className={"badge " + p.estado_pedido}>
                        {label(p.estado_pedido)}
                      </span>
                    </td>
                    {cash && <td>{money(balance(p))}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d && !active.length && (
            <div className="empty-state">
              Sin pedidos activos por el momento.
            </div>
          )}
        </article>
        <article className="service-note">
          <span className="eyebrow">UN EQUIPO, UN MISMO SERVICIO</span>
          <h2>
            Cada detalle
            <br />
            cuenta.
          </h2>
          <p>
            Revisa las notas de preparación y confirma las entregas. Cobrar un
            pedido mantiene su estado de cocina.
          </p>
          <div className="pennants">
            <i />
            <i />
            <i />
          </div>
        </article>
      </div>
    </section>
  );
}
