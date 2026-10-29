export class AdminError extends Error {
  constructor(message, status = 400, code = "invalid_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const nullable = (value, max, field) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.trim().length > max)
    throw new AdminError(`${field}: dato inválido o demasiado largo.`);
  return value.trim() || null;
};
export function validateEmployee(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new AdminError("Faltan los datos del empleado.");
  const nombre = nullable(raw.nombre, 150, "Nombre"),
    email = nullable(raw.email, 150, "Correo")?.toLowerCase();
  if (!nombre || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AdminError("Nombre y correo válido son obligatorios.");
  if (!["gerente", "mesero", "cocinero", "cajero"].includes(raw.rol))
    throw new AdminError("Rol no válido.");
  if (typeof raw.estado !== "boolean")
    throw new AdminError("Indica si el empleado está activo.");
  const telefono = nullable(raw.telefono, 50, "Teléfono"),
    ci_nit = nullable(raw.ci_nit, 50, "CI/NIT");
  if (telefono && !/^[+\d][\d\s()-]{5,24}$/.test(telefono))
    throw new AdminError("El teléfono no tiene un formato válido.");
  let salario = null;
  if (raw.salario !== null && raw.salario !== undefined && raw.salario !== "") {
    if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(raw.salario)))
      throw new AdminError(
        "Salario: usa un monto no negativo con hasta dos decimales."
      );
    salario = Number(raw.salario);
  }
  const turno = nullable(raw.turno, 50, "Turno");
  if (turno && !["mañana", "tarde", "noche"].includes(turno))
    throw new AdminError("Turno no válido.");
  const fecha_contratacion = nullable(
    raw.fecha_contratacion,
    10,
    "Fecha de contratación"
  );
  if (
    fecha_contratacion &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_contratacion) ||
      !Number.isFinite(Date.parse(`${fecha_contratacion}T00:00:00Z`)) ||
      new Date(`${fecha_contratacion}T00:00:00Z`).toISOString().slice(0, 10) !==
        fecha_contratacion)
  )
    throw new AdminError("Fecha de contratación no válida.");
  return {
    nombre,
    email,
    telefono,
    ci_nit,
    rol: raw.rol,
    salario,
    turno,
    fecha_contratacion,
    estado: raw.estado,
  };
}
export function validatePassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128)
    throw new AdminError(
      "La contraseña inicial debe tener entre 8 y 128 caracteres."
    );
  return value;
}
export function validateId(value) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  )
    throw new AdminError("Identificador de empleado inválido.");
  return value;
}
