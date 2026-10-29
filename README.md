# Popular · Portal del personal

Frontend en React 19 + Vite + Supabase.

## Requisitos

- Node 22 (Vite 7 requiere 20.19+ o 22.12+)

## Desarrollo

```bash
npm install
npm run dev
```

La app queda en http://localhost:3000.

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

- Solo las variables con prefijo `VITE_` llegan al navegador.
- La `anon key` es pública por diseño. **Nunca** uses la `service_role` en el frontend.
- Sin variables, la app arranca en **modo demostración**.

## Build

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ localmente
```

## Usuario administrador

El login acepta el usuario corto **`admin`**.

### Opción rápida (sin service_role)

Por defecto está activo el **administrador local**: `admin` / `admin123`.
No crea un usuario en Supabase Auth; guarda la sesión en `sessionStorage` y
opera contra las tablas con la anon key. Sirve para el proyecto universitario,
pero cualquiera que abra la app puede entrar como admin.

- Desactivar: `VITE_LOCAL_ADMIN=false` en `.env.local`.
- Cambiar credenciales: `VITE_ADMIN_EMAIL` y `VITE_ADMIN_PASSWORD`.
- La gestión de empleados guarda el perfil, pero no crea cuentas de acceso
  (eso necesita la `service_role`).

### Opción real (cuenta en Supabase Auth)

El login acepta el usuario corto **`admin`** (se traduce al correo definido en
`VITE_ADMIN_EMAIL`, por defecto `admin@popular.com`).

Para crear la cuenta real en Supabase, consigue la **service_role key**
(Supabase → Project Settings → API). Puedes usarla de dos formas:

**Opción A — en `.env.local` (recomendada):**

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

y luego:

```bash
npm run admin:create
```

**Opción B — puntual en la terminal:**

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ... npm run admin:create
```

Queda creado/actualizado:

- Usuario: `admin`
- Contraseña: `admin123`
- Rol: `gerente` (administrador)

También se puede personalizar:

```bash
ADMIN_EMAIL=otro@correo.com ADMIN_PASSWORD=OtraClave123 npm run admin:create
```

> La `service_role` key se usa solo en este script local. Nunca debe ir en
> `.env.local` del frontend ni subirse al repositorio.

### Alternativa desde el dashboard

1. Supabase → Authentication → Users → **Add user**
   (`admin@popular.com` / `admin123`, marcar *Auto Confirm User*).
2. En el SQL Editor:

```sql
insert into public.empleados (id, nombre, email, rol, estado)
select id, 'Administrador', 'admin@popular.com', 'gerente', true
from auth.users
where email = 'admin@popular.com'
on conflict (id) do update set rol = 'gerente', estado = true;
```

## Deploy en Render

El archivo `render.yaml` define el servicio estático:

- Build: `npm ci && npm run build`
- Publish: `dist`
- Rewrite SPA: `/*` → `/index.html`
- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` se cargan desde el dashboard de Render.
