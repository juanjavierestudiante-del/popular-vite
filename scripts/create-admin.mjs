// Crea (o actualiza) la cuenta de administrador en Supabase.
//
// Uso:
//   SUPABASE_SERVICE_ROLE_KEY=... npm run admin:create
//
// La service_role key se obtiene en Supabase → Project Settings → API.
// NUNCA debe usarse en el frontend ni subirse al repositorio.
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "node:process";

// Carga .env y .env.local (las variables ya definidas en el entorno mandan).
for (const file of [".env", ".env.local"]) {
  try {
    loadEnvFile(file);
  } catch {
    // El archivo no existe: se ignora.
  }
}

const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const email = (process.env.ADMIN_EMAIL || "admin@popular.com").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "admin123";
const nombre = process.env.ADMIN_NOMBRE || "Administrador";

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!url) fail("Falta VITE_SUPABASE_URL (revisa .env.local).");
if (!serviceKey) {
  fail(
    "Falta SUPABASE_SERVICE_ROLE_KEY.\n" +
      "  Ejemplo: SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run admin:create"
  );
}
if (!/^https:\/\/[a-z0-9.-]+\/?$/i.test(url)) fail(`URL de Supabase inválida: ${url}`);
if (password.length < 8 || password.length > 128)
  fail("La contraseña debe tener entre 8 y 128 caracteres.");

// La service_role es un JWT con role=service_role (o una clave sb_secret_ nueva).
if (serviceKey.split(".").length === 3) {
  try {
    const payload = JSON.parse(
      Buffer.from(serviceKey.split(".")[1], "base64url").toString("utf8")
    );
    if (payload.role !== "service_role")
      fail("La clave indicada no es service_role. No uses la anon key aquí.");
  } catch {
    fail("No se pudo leer la service_role key.");
  }
} else if (!serviceKey.startsWith("sb_secret_")) {
  fail("La clave no parece una service_role key válida.");
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(target) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === target
    );
    if (found) return found;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const { data: profile, error: profileError } = await admin
    .from("empleados")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (profileError) throw profileError;

  let user = profile ? { id: profile.id } : await findAuthUserByEmail(email);
  let created = false;

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
      app_metadata: { source: "popular-admin-script" },
    });
    if (error) throw error;
    user = data.user;
    created = true;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (error) throw error;
  }

  const { error: saveError } = await admin.from("empleados").upsert(
    { id: user.id, nombre, email, rol: "gerente", estado: true },
    { onConflict: "id" }
  );
  if (saveError) throw saveError;

  console.log(`
✔ Administrador ${created ? "creado" : "actualizado"}
  Usuario:  admin
  Email:    ${email}
  Password: ${password}
  Rol:      gerente
  ID:       ${user.id}
`);
}

main().catch((error) => fail(error.message || String(error)));
