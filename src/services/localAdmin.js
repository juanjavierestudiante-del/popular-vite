// Acceso de administrador local (modo demostración del proyecto universitario).
//
// No crea usuarios en Supabase Auth: guarda una sesión en sessionStorage y
// opera contra la base con la anon key. Se puede desactivar con
// VITE_LOCAL_ADMIN=false en .env.local.
const ENABLED =
  String(import.meta.env.VITE_LOCAL_ADMIN ?? "true").toLowerCase() !== "false";

const STORAGE_KEY = "popular-local-admin";
const EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || "admin@popular.com"
)
  .trim()
  .toLowerCase();

export const LOCAL_ADMIN = {
  id: "00000000-0000-4000-8000-00000000ad01",
  alias: "admin",
  email: EMAIL,
  password: import.meta.env.VITE_ADMIN_PASSWORD || "admin123",
  nombre: "Administrador",
  rol: "gerente",
};

export function hasLocalAdminSession() {
  if (!ENABLED) return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function localAdminUser() {
  return {
    id: LOCAL_ADMIN.id,
    email: LOCAL_ADMIN.email,
    user_metadata: { nombre: LOCAL_ADMIN.nombre },
    app_metadata: { provider: "local-admin" },
  };
}

export function localAdminProfile() {
  return {
    id: LOCAL_ADMIN.id,
    nombre: LOCAL_ADMIN.nombre,
    email: LOCAL_ADMIN.email,
    rol: LOCAL_ADMIN.rol,
    estado: true,
  };
}

export function startLocalAdmin() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // sessionStorage no disponible: la sesión vivirá solo en memoria.
  }
}

export function stopLocalAdmin() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que limpiar.
  }
}

export function isLocalAdminCredentials(identifier, password) {
  if (!ENABLED) return false;
  const value = String(identifier || "").trim().toLowerCase();
  return (
    (value === LOCAL_ADMIN.alias || value === LOCAL_ADMIN.email) &&
    password === LOCAL_ADMIN.password
  );
}
