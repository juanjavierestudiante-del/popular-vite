import { supabase, isDemo } from "../../services/supabaseClient";
import { hasLocalAdminSession } from "../../services/localAdmin";
import { manageDemoEmployees } from "../../services/demoClient";
import { validateEmployee, validatePassword } from "./employeeValidation";
const fields = [
  "nombre",
  "email",
  "telefono",
  "ci_nit",
  "rol",
  "salario",
  "turno",
  "fecha_contratacion",
  "estado",
];
async function invokeLocalAdmin(body) {
  // El administrador local no tiene una cuenta real en Supabase Auth, así que
  // no puede invocar la Edge Function (que exige un JWT de gerente).
  if (body.action === "seed")
    throw new Error(
      "La carga de datos de prueba requiere iniciar sesión con una cuenta real de Supabase."
    );
  if (body.action === "create") {
    const id =
      globalThis.crypto?.randomUUID?.() ||
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const n = Math.floor(Math.random() * 16);
        return (c === "x" ? n : (n & 3) | 8).toString(16);
      });
    const { data, error } = await supabase
      .from("empleados")
      .insert({ ...body.profile, id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return {
      ok: true,
      id: data.id,
      message:
        "Perfil guardado en modo administrador local. No se creó una cuenta de acceso (eso requiere la service_role key).",
    };
  }
  if (body.action === "update") {
    const { data, error } = await supabase
      .from("empleados")
      .update(body.profile)
      .eq("id", body.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Empleado no encontrado.");
    return {
      ok: true,
      id: data.id,
      message: "Perfil actualizado en modo administrador local.",
    };
  }
  throw new Error("Acción no válida.");
}

async function invoke(body) {
  if (isDemo) return manageDemoEmployees(body);
  if (hasLocalAdminSession()) return invokeLocalAdmin(body);
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError || !sessionData?.session)
    throw new Error("Inicia sesión nuevamente con un gerente activo.");
  const { data, error } = await supabase.functions.invoke("manage-employees", {
    body,
  });
  if (error) {
    let detail;
    try {
      detail = await error.context?.clone().json();
    } catch {}
    if (detail?.error) throw new Error(detail.error);
    throw new Error(
      "No se pudo completar la operación administrativa. Verifica que la función manage-employees esté desplegada en el mismo proyecto. Revisa los registros antes de repetir."
    );
  }
  if (!data?.ok)
    throw new Error(
      data?.error ||
        "El servidor no confirmó la operación. Revisa el listado antes de repetir."
    );
  return data;
}
export async function saveEmployee(form) {
  const profile = validateEmployee(
    Object.fromEntries(
      fields.map((key) => [
        key,
        form[key] === "" && !["nombre", "email"].includes(key)
          ? null
          : form[key],
      ])
    )
  );
  if (!form.id) validatePassword(form.password);
  return invoke({
    action: form.id ? "update" : "create",
    profile,
    ...(form.id ? { id: form.id } : { password: form.password }),
  });
}
export const loadTestData = () => invoke({ action: "seed", confirmed: true });
