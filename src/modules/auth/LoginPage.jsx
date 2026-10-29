import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { isDemo, configurationError } from "../../services/supabaseClient";
import { Notice } from "../../shared/components/UI";
const ADMIN_ALIAS = "admin";
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@popular.com";
export default function LoginPage() {
  const auth = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState("gerente"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const identifier = email.trim();
      const account =
        identifier.toLowerCase() === ADMIN_ALIAS ? ADMIN_EMAIL : identifier;
      await auth.login(
        isDemo ? `${role}@demo.local` : account,
        isDemo ? "demo" : password
      );
      navigate(location.state?.from || "/personal/inicio");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setPassword("");
    }
  }
  return (
    <div className="login-shell">
      <section className="login-story">
        <div className="brand-large">
          popular<span>cocina boliviana</span>
        </div>
        <div>
          <span className="eyebrow">EL EQUIPO DETRÁS DE CADA PLATO</span>
          <h1>
            Buen servicio.
            <br />
            Trabajo en equipo.
          </h1>
          <p>
            Un espacio para coordinar el salón, la cocina y la caja. Hecho para
            quienes dan vida a Popular.
          </p>
        </div>
        <div className="pennants">
          <i />
          <i />
          <i />
        </div>
        <small>La Paz · Bolivia</small>
      </section>
      <section className="login-form">
        <span className="eyebrow">PORTAL DEL PERSONAL</span>
        <h2>{auth.user ? "Tu sesión está activa" : "Bienvenido al equipo"}</h2>
        <p className="muted">
          {isDemo
            ? "Explora el portal con datos de ejemplo."
            : "Ingresa con tu cuenta de empleado."}
        </p>
        <Notice error>{configurationError || auth.authError || error}</Notice>
        {auth.loading ? (
          <p role="status">Cargando sesión…</p>
        ) : auth.user ? (
          <>
            <p>{auth.userProfile?.nombre || auth.user.email}</p>
            <p>Perfil: {auth.userRole || "No disponible"}</p>
            <div className="actions">
              <Link className="button primary" to="/personal/inicio">
                Abrir portal
              </Link>
              <button
                onClick={async () => {
                  try {
                    await auth.logout();
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Cerrar sesión
              </button>
              <button onClick={auth.refreshProfile}>Actualizar perfil</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            {isDemo ? (
              <>
                <div className="demo-label">
                  DEMOSTRACIÓN · SIN CONEXIÓN A SUPABASE
                </div>
                <label>
                  Explorar como
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {["gerente", "mesero", "cocinero", "cajero"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <>
                <label>
                  Usuario o correo electrónico
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="admin o correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Contraseña
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              </>
            )}
            <button className="primary" disabled={busy}>
              {busy
                ? "Ingresando…"
                : isDemo
                ? "Explorar demostración"
                : "Ingresar al portal"}{" "}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
        {isDemo && (
          <div className="setup-help">
            <h3>Conecta tu base de datos</h3>
            <p>
              Completa <code>VITE_SUPABASE_URL</code> y{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> en <code>.env.local</code>.
              Al reiniciar se habilitará el ingreso real.
            </p>
            <p>
              Usa la clave publicable o anon. Los datos de demostración se
              guardan solo en esta pestaña.
            </p>
          </div>
        )}
        <small>
          El acceso depende del rol y estado de tu perfil de empleado.
        </small>
        <Link className="login-volver" to="/">
          ← Volver al sitio público
        </Link>
      </section>
    </div>
  );
}
