import React, { useRef, useState } from "react";
import { isDemo } from "../../services/supabaseClient";
import { Notice } from "../../shared/components/UI";
import { TEST_EMPLOYEES, TEST_PASSWORD } from "./testFixtures";
import { loadTestData } from "./employeeService";
export default function TestDataPanel({ onLoaded, disabled, onBusyChange }) {
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [result, setResult] = useState(null); const lock = useRef(false);
  async function load(e) {
    e.preventDefault(); if (lock.current || !confirmed || disabled) return;
    lock.current = true; setBusy(true); onBusyChange(true); setError(""); setResult(null);
    try { const response = await loadTestData(); setResult(response); await onLoaded(); }
    catch(e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  }
  return <section className="panel test-data-panel"><span className="eyebrow">PRESENTACIÓN Y PRUEBAS</span><h2>Conjunto de datos de ejemplo</h2>
    <p>Prepara tres empleados, dos clientes ficticios, cuatro productos, mesas 901–903, seis pedidos y dos reservas. Los registros nuevos se identifican como pruebas.</p>
    <div className="table-scroll"><table><thead><tr><th>Rol</th><th>Correo de prueba</th><th>Contraseña inicial</th></tr></thead><tbody>{TEST_EMPLOYEES.map(e => <tr key={e.email}><td>{e.rol}</td><td>{e.email}</td><td><code>{TEST_PASSWORD}</code></td></tr>)}</tbody></table></div>
    <p className="muted">{isDemo ? "En demostración se usan datos locales. Para cambiar de vista, sal e ingresa seleccionando otro rol; estas cuentas no se crean en Supabase." : "En la base real, la función administrativa crea las cuentas y genera sus UUID. Si ya se cargó el conjunto, conserva los registros existentes y no cambia sus contraseñas."}</p>
    <form onSubmit={load}><label className="check"><input type="checkbox" checked={confirmed} disabled={busy || disabled} onChange={e => setConfirmed(e.target.checked)} />Confirmo que quiero agregar datos ficticios para probar el sistema.</label>
      <button className="primary" disabled={!confirmed || busy || disabled}>{busy ? "Preparando datos…" : isDemo ? "Cargar pruebas en demostración" : "Crear conjunto de prueba"}</button></form>
    <Notice error>{error}</Notice>{result && <Notice>{result.message}</Notice>}
    {result?.orders?.length > 0 && <p>Pedidos preparados: {result.orders.map(o => `#${o.id} (${o.scenario})`).join(" · ")}</p>}
    <details><summary>Qué comprobar en cada vista</summary><ol>
      <li><strong>Gerencia:</strong> registra un empleado con todos sus datos, edita su salario y turno, cambia disponibilidad de un producto y consulta Reportes.</li>
      <li><strong>Mesero:</strong> abre las mesas 901–903; registra un pedido con notas; entrega un pedido listo y revisa las reservas pendientes y confirmadas.</li>
      <li><strong>Cocinero:</strong> inicia un pendiente y pasa el pedido de en cocina a listo. Comprueba cantidades y notas.</li>
      <li><strong>Cajero:</strong> el pedido de Bs. 30 tiene Bs. 10 abonados y Bs. 20 pendientes. Cobra ese saldo; el pedido pagado de Bs. 53 no debe aparecer para cobrar otra vez.</li>
      <li><strong>Reservas:</strong> confirma una solicitud de cuatro personas en una mesa con capacidad suficiente, marca completada la confirmada o cancela una solicitud.</li>
      <li><strong>Reportes:</strong> consulta hoy: antes de realizar nuevos cobros, el conjunto aporta Bs. 63 cobrados y un pedido cancelado.</li>
    </ol></details>
    <small>Los datos no se borran ni se reinician automáticamente. En el servidor, la carga de pruebas requiere POPULAR_ALLOW_TEST_DATA=true.</small>
  </section>;
}
