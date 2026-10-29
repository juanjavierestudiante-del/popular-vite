// Identidades ficticias reservadas para pruebas; no se envían correos.
export const TEST_PASSWORD = "Popular.Prueba2026!";
export const TEST_MARKER = "popular-test-v1";
export const TEST_EMPLOYEES = [
  {
    nombre: "Ana Flores — Pruebas",
    email: "mesero@popular.example.test",
    telefono: "70000101",
    ci_nit: "90000101",
    rol: "mesero",
    salario: 3000,
    turno: "mañana",
    fecha_contratacion: "2026-01-15",
    estado: true,
  },
  {
    nombre: "Diego Mamani — Pruebas",
    email: "cocina@popular.example.test",
    telefono: "70000102",
    ci_nit: "90000102",
    rol: "cocinero",
    salario: 3800,
    turno: "tarde",
    fecha_contratacion: "2026-02-01",
    estado: true,
  },
  {
    nombre: "Lucía Quispe — Pruebas",
    email: "caja@popular.example.test",
    telefono: "70000103",
    ci_nit: "90000103",
    rol: "cajero",
    salario: 3200,
    turno: "noche",
    fecha_contratacion: "2026-03-10",
    estado: true,
  },
];
export const TEST_CLIENTS = [
  {
    nombre: "María Pérez — Pruebas",
    email: "cliente1@popular.example.test",
    telefono: "70000201",
    ci_nit: "90000201",
  },
  {
    nombre: "José Rojas — Pruebas",
    email: "cliente2@popular.example.test",
    telefono: "70000202",
    ci_nit: "90000202",
  },
];
export const TEST_MENU = [
  {
    nombre: "PRUEBA · Plato paceño",
    descripcion: "Plato para probar pedidos y notas de cocina.",
    precio: 45,
    categoria: "Platos Fuertes",
    disponible: true,
  },
  {
    nombre: "PRUEBA · Chicharrón",
    descripcion: "Producto para probar preparación y cobros.",
    precio: 60,
    categoria: "Platos Fuertes",
    disponible: true,
  },
  {
    nombre: "PRUEBA · Mocochinchi",
    descripcion: "Bebida de prueba.",
    precio: 8,
    categoria: "Bebidas",
    disponible: true,
  },
  {
    nombre: "PRUEBA · Api con pastel",
    descripcion: "Producto para pedidos para llevar.",
    precio: 15,
    categoria: "Desayunos",
    disponible: true,
  },
];
export const TEST_TABLES = [
  {
    numero_mesa: 901,
    capacidad: 4,
    ubicacion: "PRUEBAS POPULAR V1",
    estado: "ocupada",
  },
  {
    numero_mesa: 902,
    capacidad: 2,
    ubicacion: "PRUEBAS POPULAR V1",
    estado: "reservada",
  },
  {
    numero_mesa: 903,
    capacidad: 6,
    ubicacion: "PRUEBAS POPULAR V1",
    estado: "ocupada",
  },
];
