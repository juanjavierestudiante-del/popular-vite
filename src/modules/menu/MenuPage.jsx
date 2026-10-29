import React, { useRef, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { checked } from "../../services/restaurant";
import useRemote from "../../shared/hooks/useRemote";
import { Notice, RemoteState } from "../../shared/components/UI";
import { money, cents } from "../../shared/utils/domain";
const empty = {
  nombre: "",
  descripcion: "",
  categoria: "Platos fuertes",
  precio: "",
  imagen_url: "",
  disponible: true,
};
export default function MenuPage() {
  const remote = useRemote(
    () => checked(supabase.from("menu").select("*").order("nombre")),
    ["menu"]
  );
  const [form, setForm] = useState(empty),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  async function save(e) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const price = Number(form.precio);
      if (
        !form.nombre.trim() ||
        !form.categoria.trim() ||
        !Number.isFinite(price) ||
        price < 0 ||
        form.precio === ""
      )
        throw new Error("Completa nombre, categoría y un precio válido.");
      if (form.imagen_url && !/^https?:\/\//i.test(form.imagen_url))
        throw new Error("La imagen debe usar una URL http o https.");
      const fields = {
        ...form,
        nombre: form.nombre.trim(),
        categoria: form.categoria.trim(),
        precio: cents(price) / 100,
      };
      delete fields.id;
      if (form.id) {
        const updated = await checked(
          supabase
            .from("menu")
            .update(fields)
            .eq("id", form.id)
            .select("id")
            .maybeSingle()
        );
        if (!updated) throw new Error("No se pudo guardar el producto.");
      } else await checked(supabase.from("menu").insert(fields));
      setForm(empty);
      setMessage("Producto guardado.");
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
      <h1>Menú del restaurante</h1>
      <p className="muted">
        Productos, precios y disponibilidad para el servicio.
      </p>
      <RemoteState remote={remote} />
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      <div className="admin-columns">
        <div>
          <label className="search-field">
            Buscar producto
            <input
              value={search}
              placeholder="Nombre o categoría"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="table-scroll panel">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {remote.data
                  ?.filter((p) =>
                    (p.nombre + " " + p.categoria)
                      .toLowerCase()
                      .includes(search.toLowerCase())
                  )
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.nombre}</strong>
                        <small>{p.categoria}</small>
                      </td>
                      <td>{money(p.precio)}</td>
                      <td>
                        <span
                          className={
                            "badge " + (p.disponible ? "listo" : "cancelado")
                          }
                        >
                          {p.disponible ? "Disponible" : "No disponible"}
                        </span>
                      </td>
                      <td>
                        <button
                          disabled={busy}
                          onClick={() =>
                            setForm({
                              ...p,
                              descripcion: p.descripcion || "",
                              imagen_url: p.imagen_url || "",
                            })
                          }
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <form className="panel" onSubmit={save}>
          <h2>{form.id ? "Editar producto" : "Agregar producto"}</h2>
          <fieldset disabled={busy}>
            <legend>Información del producto</legend>
            {[
              ["nombre", "Nombre"],
              ["categoria", "Categoría"],
              ["precio", "Precio (Bs.)"],
              ["imagen_url", "URL de imagen (opcional)"],
            ].map(([key, text]) => (
              <label key={key}>
                {text}
                <input
                  type={
                    key === "precio"
                      ? "number"
                      : key === "imagen_url"
                      ? "url"
                      : "text"
                  }
                  min={key === "precio" ? 0 : undefined}
                  step={key === "precio" ? "0.01" : undefined}
                  maxLength={key === "nombre" ? 150 : undefined}
                  required={key !== "imagen_url"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label>
              Descripción
              <textarea
                maxLength={2000}
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.disponible}
                onChange={(e) =>
                  setForm({ ...form, disponible: e.target.checked })
                }
              />
              Disponible para pedidos
            </label>
            <div className="actions">
              <button className="primary">
                {busy ? "Guardando…" : "Guardar producto"}
              </button>
              <button type="button" onClick={() => setForm(empty)}>
                Limpiar
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
