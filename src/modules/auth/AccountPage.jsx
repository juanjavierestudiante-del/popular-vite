import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
import { isDemo } from "../../services/supabaseClient";
import { Notice } from "../../shared/components/UI";
export default function AccountPage() {
  const a = useAuth();
  const [error, setError] = useState("");
  return (
    <section>
      <h1>Mi cuenta</h1>
      <p className="muted">Perfil de acceso al portal del personal.</p>
      <div className="panel narrow account-card">
        <div className="avatar large">
          {a.userProfile?.nombre?.charAt(0) || "P"}
        </div>
        <h2>{a.userProfile?.nombre}</h2>
        <dl>
          <dt>Correo de acceso</dt>
          <dd>{a.user?.email}</dd>
          <dt>Rol</dt>
          <dd>{a.userRole}</dd>
          <dt>Estado</dt>
          <dd>Activo</dd>
          <dt>Entorno</dt>
          <dd>{isDemo ? "Demostración local" : "Supabase"}</dd>
        </dl>
        <Notice error>{error}</Notice>
        <div className="actions">
          <button onClick={a.refreshProfile}>Actualizar perfil</button>
          <button
            onClick={async () => {
              try {
                await a.logout();
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </section>
  );
}
