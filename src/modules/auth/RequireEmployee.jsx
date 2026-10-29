import React from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Notice } from "../../shared/components/UI";
export default function RequireEmployee({ roles }) {
  const auth = useAuth(),
    location = useLocation();
  if (auth.loading)
    return (
      <div className="loading-state" role="status">
        <span className="loader" />
        Verificando tu acceso…
      </div>
    );
  if (auth.authError)
    return (
      <section className="panel narrow">
        <h1>No pudimos cargar tu perfil</h1>
        <Notice error>{auth.authError}</Notice>
        <button onClick={auth.refreshProfile}>Reintentar</button>
      </section>
    );
  if (!auth.user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!["gerente", "mesero", "cocinero", "cajero"].includes(auth.userRole))
    return (
      <section className="panel narrow">
        <h1>Acceso no disponible</h1>
        <p>
          {auth.userRole === "inactivo"
            ? "Tu perfil de empleado está inactivo."
            : "Esta cuenta no tiene un perfil de empleado activo."}
        </p>
        <Link to="/login">Volver a mi cuenta</Link>
      </section>
    );
  if (roles && !roles.includes(auth.userRole))
    return (
      <section className="panel">
        <h1>No tienes acceso a esta sección</h1>
        <Link to="/personal/inicio">Volver al inicio</Link>
      </section>
    );
  return <Outlet />;
}
