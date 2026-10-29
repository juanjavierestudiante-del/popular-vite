import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";
import { createOrder } from "../../services/restaurant.js";
import { money, cents } from "../../shared/utils/domain.js";
import { Notice } from "../../shared/components/UI.jsx";
export default function OrderForm({
  menu,
  tables = [],
  salon = false,
  onSaved,
  category = "Todos",
}) {
  const { user, userRole } = useAuth();
  const [cart, setCart] = useState([]),
    [table, setTable] = useState("");
  const [type, setType] = useState(salon ? "salon" : "web_anticipado");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const allowed = salon
    ? ["gerente", "mesero"].includes(userRole)
    : userRole === "cliente";
  function add(p) {
    setCart((old) =>
      old.some((i) => i.id === p.id)
        ? old.map((i) =>
            i.id === p.id ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i
          )
        : [...old, { id: p.id, quantity: 1, notes: "" }]
    );
    setMessage("");
  }
  async function send(e) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!allowed)
        throw new Error("Necesitas un perfil autorizado para pedir.");
      if (type === "salon" && !table) throw new Error("Selecciona una mesa.");
      const id = await createOrder(cart, {
        cliente_id: salon ? null : user.id,
        mesero_id: salon ? user.id : null,
        mesa_id: type === "salon" ? Number(table) : null,
        tipo_pedido: type,
      });
      setCart([]);
      setMessage(`Pedido #${id} enviado a cocina.`);
      if (onSaved) onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="ordering">
      <div>
        <div className="cards">
          {menu
            .filter((p) => category === "Todos" || p.categoria === category)
            .map((p) => (
              <article className="panel" key={p.id}>
                {p.imagen_url && /^https?:\/\//i.test(p.imagen_url) && (
                  <img
                    className="food-photo"
                    src={p.imagen_url}
                    alt={p.nombre}
                    loading="lazy"
                  />
                )}
                <small>{p.categoria}</small>
                <h2>{p.nombre}</h2>
                <p>{p.descripcion}</p>
                <div className="toolbar">
                  <strong>{money(p.precio)}</strong>
                  <button disabled={!allowed || busy} onClick={() => add(p)}>
                    Agregar
                  </button>
                </div>
              </article>
            ))}
        </div>
        {!menu.length && <p>No hay productos disponibles en esta categoría.</p>}
      </div>
      <aside className="panel cart">
        <h2>Nuevo pedido</h2>
        <Notice error>{error}</Notice>
        <Notice>{message}</Notice>
        {!allowed && (
          <p>
            {!user ? (
              <Link to="/login">Ingresa como cliente para pedir.</Link>
            ) : (
              "El pedido web está disponible para perfiles de cliente. El personal registra pedidos desde Salón."
            )}
          </p>
        )}
        <form onSubmit={send}>
          <fieldset disabled={busy || !allowed}>
            <legend>Productos seleccionados</legend>
            {!cart.length && <p>Agrega productos del menú.</p>}
            {cart.map((i) => (
              <div key={i.id} className="cart-line">
                <strong>
                  {menu.find((p) => p.id === i.id)?.nombre ||
                    `Producto #${i.id}`}
                </strong>
                <label>
                  Cantidad
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={i.quantity}
                    onChange={(e) =>
                      setCart((old) =>
                        old.map((x) =>
                          x.id === i.id
                            ? { ...x, quantity: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                  />
                </label>
                <label>
                  Notas de preparación
                  <input
                    maxLength={500}
                    value={i.notes}
                    onChange={(e) =>
                      setCart((old) =>
                        old.map((x) =>
                          x.id === i.id ? { ...x, notes: e.target.value } : x
                        )
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCart((old) => old.filter((x) => x.id !== i.id))
                  }
                >
                  Quitar
                </button>
              </div>
            ))}
            {salon && (
              <>
                <label>
                  Tipo de pedido
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="salon">Salón</option>
                    <option value="para_llevar">Para llevar</option>
                  </select>
                </label>
                {type === "salon" && (
                  <label>
                    Mesa
                    <select
                      required
                      value={table}
                      onChange={(e) => setTable(e.target.value)}
                    >
                      <option value="">Selecciona</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          Mesa {t.numero_mesa} · {t.estado}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
            <p className="total">
              Estimado:{" "}
              {money(
                cart.reduce(
                  (s, i) =>
                    s +
                    cents(menu.find((p) => p.id === i.id)?.precio) * i.quantity,
                  0
                ) / 100
              )}
            </p>
            <button className="primary" disabled={!cart.length}>
              {busy ? "Enviando…" : "Confirmar pedido"}
            </button>
          </fieldset>
        </form>
        {!salon && allowed && <Link to="/mis-pedidos">Ver mis pedidos</Link>}
      </aside>
    </div>
  );
}
