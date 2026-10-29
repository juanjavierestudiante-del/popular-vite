import { TEST_PASSWORD, TEST_MARKER, TEST_EMPLOYEES, TEST_CLIENTS, TEST_MENU, TEST_TABLES } from "../modules/personal/testFixtures";
import { validateEmployee, validatePassword } from "../modules/personal/employeeValidation";
// Datos locales de demostración. Ninguna operación de este archivo llama a Supabase.
const ids = { gerente: '11111111-1111-4111-8111-111111111111', mesero: '22222222-2222-4222-8222-222222222222', cocinero: '33333333-3333-4333-8333-333333333333', cajero: '44444444-4444-4444-8444-444444444444' };
const ago = minutes => new Date(Date.now() - minutes * 60000).toISOString();
const seed = () => ({
  empleados: Object.entries(ids).map(([rol,id])=>({id,rol,nombre:{gerente:'Cristian · Gerencia',mesero:'Ana · Salón',cocinero:'Diego · Cocina',cajero:'Lucía · Caja'}[rol], email:`${rol}@demo.local`, estado:true,telefono:''})),
  clientes:[{id:'55555555-5555-4555-8555-555555555555',nombre:'María Flores',email:'cliente@demo.local'}],
  mesas:[{id:1,numero_mesa:1,capacidad:4,ubicacion:'Patio',estado:'ocupada'},{id:2,numero_mesa:2,capacidad:2,ubicacion:'Salón',estado:'disponible'},{id:3,numero_mesa:3,capacidad:6,ubicacion:'Patio',estado:'ocupada'},{id:4,numero_mesa:4,capacidad:4,ubicacion:'Salón',estado:'reservada'},{id:5,numero_mesa:5,capacidad:8,ubicacion:'Salón',estado:'disponible'}],
  menu:[{id:1,nombre:'Plato paceño',descripcion:'Choclo, queso dorado, habas y papa.',precio:45,categoria:'Platos fuertes',disponible:true},{id:2,nombre:'Chicharrón de cerdo',descripcion:'Con mote, chuño y llajua.',precio:60,categoria:'Platos fuertes',disponible:true},{id:3,nombre:'Api con pastel',descripcion:'Api morado y pastel de queso.',precio:15,categoria:'Desayunos',disponible:true},{id:4,nombre:'Mocochinchi',descripcion:'Refresco tradicional de durazno.',precio:8,categoria:'Bebidas',disponible:true},{id:5,nombre:'Queso humacha',descripcion:'Queso criollo, habas y ají amarillo.',precio:25,categoria:'Entradas',disponible:true}],
  pedidos:[{id:101,mesa_id:1,cliente_id:null,mesero_id:ids.mesero,tipo_pedido:'salon',estado_pedido:'pendiente',monto_total:98,created_at:ago(8)},{id:102,mesa_id:3,cliente_id:null,mesero_id:ids.mesero,tipo_pedido:'salon',estado_pedido:'en_cocina',monto_total:120,created_at:ago(18)},{id:103,mesa_id:null,cliente_id:null,mesero_id:ids.mesero,tipo_pedido:'para_llevar',estado_pedido:'listo',monto_total:30,created_at:ago(26)}],
  detalle_pedido:[{id:1,pedido_id:101,menu_id:1,cantidad:2,precio_unitario:45,subtotal:90,notas_preparacion:'Una porción sin ají'},{id:2,pedido_id:101,menu_id:4,cantidad:1,precio_unitario:8,subtotal:8},{id:3,pedido_id:102,menu_id:2,cantidad:2,precio_unitario:60,subtotal:120},{id:4,pedido_id:103,menu_id:3,cantidad:2,precio_unitario:15,subtotal:30}],
  pagos:[{id:1,pedido_id:103,cajero_id:ids.cajero,monto:10,metodo_pago:'efectivo',estado_pago:'completado',fecha_pago:ago(20)}],
  reservas:[{id:1,cliente_id:'55555555-5555-4555-8555-555555555555',mesa_id:null,fecha_hora_reserva:new Date(Date.now()+86400000).toISOString(),numero_personas:4,estado_reserva:'pendiente',observaciones:'Mesa en el patio si está disponible.',created_at:ago(40)}]
});
let database;
try { database = JSON.parse(sessionStorage.getItem('popular-demo-data')) || seed(); } catch { database=seed(); }
const changes = new Set(), authListeners = new Set();
const persist = () => { try { sessionStorage.setItem('popular-demo-data',JSON.stringify(database)); } catch {} changes.forEach(cb=>cb()); };
const joined = (table,row) => {
  const data={...row};
  if(table==='pedidos') { data.mesas=database.mesas.find(t=>t.id===row.mesa_id)||null; data.pagos=database.pagos.filter(p=>p.pedido_id===row.id); data.detalle_pedido=database.detalle_pedido.filter(d=>d.pedido_id===row.id).map(d=>({...d,menu:database.menu.find(p=>p.id===d.menu_id)||null})); }
  if(table==='reservas') { data.mesas=database.mesas.find(t=>t.id===row.mesa_id)||null;data.clientes=database.clientes.find(c=>c.id===row.cliente_id)||null; }
  return data;
};
function query(table) {
  let filters=[],sorts=[],single=false,verb='select',fields=null,limit=null,range=null;
  const q={
    select(){return q;},eq(k,v){filters.push(r=>String(r[k])===String(v));return q;},neq(k,v){filters.push(r=>String(r[k])!==String(v));return q;},in(k,v){filters.push(r=>v.includes(r[k]));return q;},
    gte(k,v){filters.push(r=>k.includes('fecha')||k==='created_at'?new Date(r[k])>=new Date(v):r[k]>=v);return q;},
    lt(k,v){filters.push(r=>k.includes('fecha')||k==='created_at'?new Date(r[k])<new Date(v):r[k]<v);return q;},
    lte(k,v){filters.push(r=>k.includes('fecha')||k==='created_at'?new Date(r[k])<=new Date(v):r[k]<=v);return q;},
    order(k,o={}){sorts.push([k,o.ascending!==false]);return q;},limit(v){limit=v;return q;},range(a,b){range=[a,b];return q;},
    maybeSingle(){single=true;return q;},single(){single=true;return q;},abortSignal(){return q;},
    insert(v){verb='insert';fields=Array.isArray(v)?v:[v];return q;},update(v){verb='update';fields=v;return q;},
    then(ok,fail){return Promise.resolve().then(()=>{
      if(!database[table])return {data:null,error:{message:`Tabla de demostración desconocida: ${table}`}};
      let rows=database[table].filter(r=>filters.every(f=>f(r)));
      if(verb==='insert') { rows=fields.map((f,index)=>({id:Math.max(0,...database[table].map(r=>Number(r.id)||0))+1+index,...f,created_at:f.created_at||new Date().toISOString(),...(table==='pagos'?{fecha_pago:new Date().toISOString()}: {})})); database[table].push(...rows);persist(); }
      if(verb==='update'){rows.forEach(r=>Object.assign(r,fields));persist();}
      rows=[...rows].sort((a,b)=>{for(const [key,asc] of sorts){if(a[key]!==b[key])return (a[key]>b[key]?1:-1)*(asc?1:-1);}return 0;});
      if(range)rows=rows.slice(range[0],range[1]+1);if(limit!==null)rows=rows.slice(0,limit);
      const result=rows.map(r=>joined(table,r));return {data:single?(result[0]||null):result,error:null};
    }).then(ok,fail);}
  };return q;
}
function session(){try{return JSON.parse(sessionStorage.getItem('popular-demo-session'));}catch{return null;}}
export const demoClient={from:query,channel(){const handlers=[];const c={on(event,filter,cb){handlers.push(cb);return c;},subscribe(){handlers.forEach(cb=>changes.add(cb));return c;},handlers};return c;},removeChannel(c){c.handlers.forEach(cb=>changes.delete(cb));},auth:{
  getSession:async()=>({data:{session:session()},error:null}),
  onAuthStateChange(cb){authListeners.add(cb);Promise.resolve().then(()=>{if(authListeners.has(cb))cb('INITIAL_SESSION',session());});return {data:{subscription:{unsubscribe(){authListeners.delete(cb);}}}};},
  async signInWithPassword({email}){const role=email.split('@')[0];if(!ids[role])return {data:null,error:{message:'Selecciona un rol de demostración.'}};const value={user:{id:ids[role],email}};sessionStorage.setItem('popular-demo-session',JSON.stringify(value));authListeners.forEach(cb=>cb('SIGNED_IN',value));return {data:value,error:null};},
  async signOut(){sessionStorage.removeItem('popular-demo-session');authListeners.forEach(cb=>cb('SIGNED_OUT',null));return {error:null};}
}};

const demoUuid = () => globalThis.crypto?.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
  const n = Math.floor(Math.random() * 16); return (c === "x" ? n : ((n & 3) | 8)).toString(16);
});
const addDemo = (table, fields) => {
  const row = { id: Math.max(0, ...database[table].map(r => Number(r.id) || 0)) + 1, created_at: new Date().toISOString(), ...fields };
  database[table].push(row); return row;
};
export async function manageDemoEmployees(body) {
  const actor = database.empleados.find(e => e.id === session()?.user?.id);
  if (actor?.rol !== "gerente" || actor.estado !== true) throw new Error("Solo un gerente activo administra empleados.");
  if (body.action === "seed") {
    if (body.confirmed !== true) throw new Error("Confirma la carga de datos.");
    const employees = TEST_EMPLOYEES.map(profile => {
      const previous = database.empleados.find(e => e.email === profile.email);
      if (previous && previous.fixture !== TEST_MARKER) throw new Error(`El correo ${profile.email} ya está ocupado.`);
      return previous || addDemo("empleados", { ...profile, id: demoUuid(), fixture: TEST_MARKER });
    });
    const clients = TEST_CLIENTS.map(profile => database.clientes.find(c => c.email === profile.email) || addDemo("clientes", { ...profile, id: demoUuid(), fixture: TEST_MARKER, puntos_fidelidad: 0 }));
    const menu = TEST_MENU.map(fields => database.menu.find(p => p.nombre === fields.nombre) || addDemo("menu", fields));
    const tables = TEST_TABLES.map(fields => {
      const current = database.mesas.find(t => t.numero_mesa === fields.numero_mesa);
      if (current && current.ubicacion !== fields.ubicacion) throw new Error(`La mesa ${fields.numero_mesa} ya está ocupada por otros datos.`);
      return current || addDemo("mesas", fields);
    });
    const definitions = [
      { key: "salon-pendiente", state: "pendiente", table: 0, type: "salon", lines: [[0, 2], [2, 2]] },
      { key: "cocina", state: "en_cocina", table: 2, type: "salon", lines: [[1, 2]] },
      { key: "llevar-parcial", state: "listo", type: "para_llevar", lines: [[3, 2]], payment: 10 },
      { key: "entregado-pagado", state: "entregado", table: 1, type: "salon", lines: [[0, 1], [2, 1]], payment: 53 },
      { key: "web", state: "pendiente", type: "web_anticipado", client: 0, lines: [[1, 1], [2, 1]] },
      { key: "cancelado", state: "cancelado", type: "para_llevar", lines: [[0, 1]] },
    ];
    const orders = [];
    for (const spec of definitions) {
      const marker = `Sin ají · [${TEST_MARKER}:${spec.key}]`;
      const detail = database.detalle_pedido.find(d => d.notas_preparacion === marker);
      let order = detail ? database.pedidos.find(p => p.id === detail.pedido_id) : null;
      if (!order) {
        order = addDemo("pedidos", { cliente_id: spec.client === undefined ? null : clients[spec.client].id,
          mesa_id: spec.table === undefined ? null : tables[spec.table].id, mesero_id: spec.type === "web_anticipado" ? null : employees[0].id,
          tipo_pedido: spec.type, estado_pedido: spec.state, monto_total: spec.lines.reduce((s, [i, qty]) => s + menu[i].precio * qty, 0) });
        spec.lines.forEach(([i, qty], line) => addDemo("detalle_pedido", { pedido_id: order.id, menu_id: menu[i].id,
          cantidad: qty, precio_unitario: menu[i].precio, subtotal: menu[i].precio * qty, notas_preparacion: line ? "Datos ficticios para pruebas" : marker }));
        if (spec.payment) addDemo("pagos", { pedido_id: order.id, cajero_id: employees[2].id, monto: spec.payment,
          metodo_pago: "efectivo", estado_pago: "completado", fecha_pago: new Date().toISOString() });
      }
      orders.push({ id: order.id, scenario: spec.key });
    }
    const future = new Date(Date.now() + 86400000); future.setUTCHours(17, 0, 0, 0);
    for (const [i, state] of ["pendiente", "confirmada"].entries()) {
      const marker = `[${TEST_MARKER}:reserva-${i + 1}]`;
      if (!database.reservas.some(r => r.observaciones === marker)) addDemo("reservas", { cliente_id: clients[i].id,
        mesa_id: i ? tables[1].id : null, fecha_hora_reserva: future.toISOString(), numero_personas: i ? 2 : 4, estado_reserva: state, observaciones: marker });
    }
    persist(); return { ok: true, accounts: employees.map(e => ({ email: e.email, rol: e.rol, password: TEST_PASSWORD })), orders,
      message: "Conjunto de pruebas agregado a la demostración. Los registros anteriores se conservaron." };
  }
  const fields = validateEmployee(body.profile);
  if (body.action === "create") {
    validatePassword(body.password);
    if ([...database.empleados, ...database.clientes].some(p => p.email?.toLowerCase() === fields.email)) throw new Error("Ese correo ya está registrado.");
    const employee = addDemo("empleados", { ...fields, id: demoUuid() }); persist();
    return { ok: true, id: employee.id, message: "Empleado de demostración creado con identificador automático." };
  }
  if (body.action !== "update") throw new Error("Acción no válida.");
  if (body.id === actor.id) throw new Error("No puedes modificar tu propia cuenta desde este formulario.");
  const current = database.empleados.find(e => e.id === body.id);
  if (!current) throw new Error("Empleado no encontrado.");
  if (fields.email !== current.email.toLowerCase()) throw new Error("El correo de acceso se conserva al editar.");
  Object.assign(current, fields); persist(); return { ok: true, id: current.id, message: "Perfil de demostración actualizado." };
}
