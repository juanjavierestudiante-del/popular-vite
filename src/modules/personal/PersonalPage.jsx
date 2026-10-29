import React, { useRef, useState } from "react";
import { supabase, isDemo } from "../../services/supabaseClient";
import { checked, allRows } from "../../services/restaurant";
import { useAuth } from "../auth/AuthProvider";
import useRemote from "../../shared/hooks/useRemote";
import { Notice, RemoteState } from "../../shared/components/UI";
import { money, dateBO } from "../../shared/utils/domain";
import { saveEmployee } from "./employeeService";
import { hasLocalAdminSession } from "../../services/localAdmin";
import TestDataPanel from "./TestDataPanel";
const empty = {
  id: null,
  nombre: "",
  email: "",
  telefono: "",
  ci_nit: "",
  rol: "mesero",
  salario: "",
  turno: "",
  fecha_contratacion: "",
  estado: true,
  password: "",
};
export default function PersonalPage() {
  const { user } = useAuth();
  const remote = useRemote(
    () =>
      allRows(() =>
        supabase
          .from("empleados")
          .select(
            "id,nombre,email,telefono,ci_nit,rol,salario,turno,fecha_contratacion,estado,created_at"
          )
          .order("nombre")
          .order("id")
      ),
    ["empleados"]
  );
  const [form, setForm] = useState(empty),
    [busy, setBusy] = useState(false),
    [testBusy, setTestBusy] = useState(false);
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const lock = useRef(false);
  const change = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const edit = (e) => {
    setForm({
      ...empty,
      ...e,
      telefono: e.telefono || "",
      ci_nit: e.ci_nit || "",
      salario: e.salario ?? "",
      turno: e.turno || "",
      fecha_contratacion: e.fecha_contratacion || "",
      password: "",
    });
    setError("");
    setMessage("");
  };
  async function save(e) {
    e.preventDefault();
    if (lock.current || testBusy) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (form.id === user.id)
        throw new Error(
          "No puedes cambiar tu propio acceso desde este formulario."
        );
      if (!form.id && (form.password.length < 8 || form.password.length > 128))
        throw new Error(
          "La contraseña inicial debe tener entre 8 y 128 caracteres."
        );
      const result = await saveEmployee(form);
      setForm(empty);
      setMessage(
        `${result.message} ${
          isDemo
            ? "Solo se actualizaron los datos de demostración."
            : hasLocalAdminSession()
            ? ""
            : form.id
            ? "El empleado debe actualizar su perfil o ingresar nuevamente."
            : "El empleado ya puede ingresar con el correo y la contraseña inicial que definiste."
        }`
      );
      await remote.reload();
    } catch (e) {
      setError(e.message);
      await remote.reload();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>Equipo de Popular</h1>
      <p className="muted">
        Cuentas de acceso, información laboral y perfiles del personal.
      </p>
      <RemoteState remote={remote} />
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      <div className="info-strip">
        {isDemo
          ? "Demostración: el formulario genera un identificador local y no crea usuarios en Supabase."
          : hasLocalAdminSession()
          ? "Administrador local: se guarda el perfil, pero no se crea una cuenta de acceso en Supabase Auth."
          : "El gerente crea la cuenta y el perfil desde aquí. Authentication genera el UUID y la base registra la fecha de creación automáticamente."}
      </div>
      <div className="admin-columns">
        <div className="stack">
          {remote.data?.map((e) => (
            <article
              className="panel person-card employee-full-card"
              key={e.id}
            >
              <span className="avatar large">{e.nombre.charAt(0)}</span>
              <div>
                <h2>{e.nombre}</h2>
                <p>{e.email}</p>
                <span className="badge">{e.rol}</span>{" "}
                <span className={"badge " + (e.estado ? "listo" : "cancelado")}>
                  {e.estado ? "Activo" : "Inactivo"}
                </span>
                <dl className="employee-facts">
                  <div>
                    <dt>CI / NIT</dt>
                    <dd>{e.ci_nit || "Sin registrar"}</dd>
                  </div>
                  <div>
                    <dt>Teléfono</dt>
                    <dd>{e.telefono || "Sin registrar"}</dd>
                  </div>
                  <div>
                    <dt>Salario</dt>
                    <dd>
                      {e.salario == null ? "Sin registrar" : money(e.salario)}
                    </dd>
                  </div>
                  <div>
                    <dt>Turno</dt>
                    <dd>{e.turno || "Sin registrar"}</dd>
                  </div>
                  <div>
                    <dt>Contratación</dt>
                    <dd>{e.fecha_contratacion || "Sin registrar"}</dd>
                  </div>
                </dl>
              </div>
              <button
                disabled={busy || testBusy || e.id === user.id}
                onClick={() => edit(e)}
              >
                Editar
              </button>
            </article>
          ))}
        </div>
        <form className="panel employee-form" onSubmit={save}>
          <h2>{form.id ? "Editar empleado" : "Registrar nuevo empleado"}</h2>
          <fieldset disabled={busy || testBusy}>
            <legend>Datos personales y contacto</legend>
            <label>
              Nombre completo *
              <input
                name="nombre"
                required
                maxLength={150}
                autoComplete="name"
                value={form.nombre}
                onChange={change}
              />
            </label>
            <div className="form-grid">
              <label>
                CI o NIT (opcional)
                <input
                  name="ci_nit"
                  maxLength={50}
                  value={form.ci_nit}
                  onChange={change}
                />
              </label>
              <label>
                Teléfono (opcional)
                <input
                  name="telefono"
                  type="tel"
                  maxLength={25}
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={change}
                />
              </label>
            </div>
          </fieldset>
          <fieldset disabled={busy || testBusy}>
            <legend>Información laboral</legend>
            <div className="form-grid">
              <label>
                Rol *
                <select name="rol" required value={form.rol} onChange={change}>
                  {["mesero", "cocinero", "cajero", "gerente"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                Salario mensual (Bs., opcional)
                <input
                  name="salario"
                  type="number"
                  min={0}
                  max="99999999.99"
                  step="0.01"
                  value={form.salario}
                  onChange={change}
                />
              </label>
              <label>
                Turno (opcional)
                <select name="turno" value={form.turno} onChange={change}>
                  <option value="">Sin asignar</option>
                  <option value="mañana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                </select>
              </label>
              <label>
                Fecha de contratación (opcional)
                <input
                  name="fecha_contratacion"
                  type="date"
                  value={form.fecha_contratacion}
                  onChange={change}
                />
              </label>
            </div>
            <label className="check">
              <input
                name="estado"
                type="checkbox"
                checked={form.estado}
                onChange={change}
              />
              Empleado activo
            </label>
          </fieldset>
          <fieldset disabled={busy || testBusy}>
            <legend>Cuenta de acceso</legend>
            <label>
              Correo electrónico *
              <input
                name="email"
                type="email"
                required
                maxLength={150}
                autoComplete="username"
                readOnly={!!form.id}
                value={form.email}
                onChange={change}
              />
            </label>
            {!form.id ? (
              <label>
                Contraseña inicial *
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={change}
                />
                <small>
                  Entrégala al empleado. No se guarda en la tabla empleados.
                </small>
              </label>
            ) : (
              <small>
                El correo de acceso se conserva al editar. Esta acción no cambia
                contraseñas.
              </small>
            )}
            <p className="auto-fields-note">
              UUID y fecha de creación: automáticos.
              {form.created_at
                ? ` Alta registrada: ${dateBO(form.created_at)}.`
                : ""}
            </p>
            <div className="actions">
              <button className="primary">
                {busy
                  ? "Guardando…"
                  : form.id
                  ? "Guardar cambios"
                  : "Crear cuenta y empleado"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setError("");
                }}
              >
                Limpiar
              </button>
            </div>
          </fieldset>
        </form>
      </div>
      <TestDataPanel
        onLoaded={remote.reload}
        disabled={busy}
        onBusyChange={setTestBusy}
      />
    </section>
  );
}
