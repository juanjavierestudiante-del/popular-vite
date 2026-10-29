import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChefHat,
  Menu as MenuIcon,
  Star,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { supabase } from "../../services/supabaseClient";
import { money } from "../../shared/utils/domain";
import Brand from "../../shared/components/Brand";

const ORDEN_CATEGORIAS = [
  "Entradas",
  "Platos fuertes",
  "Desayunos",
  "Postres",
  "Bebidas",
];

const ORDEN_NORMALIZADO = ORDEN_CATEGORIAS.map((categoria) =>
  categoria.toLocaleLowerCase("es")
);

const ENLACES = [
  { nombre: "Inicio", href: "#inicio" },
  { nombre: "Concepto", href: "#concepto" },
  { nombre: "Menú", href: "#menu" },
  { nombre: "Acceso", to: "/login" },
];

const TESTIMONIOS = [
  {
    texto:
      "Una experiencia gourmet increíble a un precio inigualable. Los sabores tradicionales bolivianos presentados con una técnica impecable. La fila vale totalmente la pena.",
    autor: "Carlos M.",
    fecha: "Hace 2 semanas",
  },
  {
    texto:
      "Los postres son de otro nivel, totalmente recomendado. El ambiente de cocina abierta le da un toque muy especial y cercano. Excelente servicio.",
    autor: "Andrea V.",
    fecha: "Hace 1 mes",
  },
  {
    texto:
      "El mejor almuerzo de La Paz. Cada plato está pensado al detalle, desde el pan hasta la infusión final. Es alta cocina accesible para todos.",
    autor: "Javier S.",
    fecha: "Hace 2 meses",
  },
];

function agruparPorCategoria(platos) {
  const grupos = new Map();
  platos.forEach((plato) => {
    const categoria = (plato.categoria || "Otros").trim() || "Otros";
    if (!grupos.has(categoria)) grupos.set(categoria, []);
    grupos.get(categoria).push(plato);
  });

  return [...grupos.entries()]
    .map(([categoria, items]) => ({
      categoria,
      platos: [...items].sort((a, b) =>
        String(a.nombre || "").localeCompare(String(b.nombre || ""), "es")
      ),
    }))
    .sort((a, b) => {
      const posA = ORDEN_NORMALIZADO.indexOf(
        a.categoria.toLocaleLowerCase("es")
      );
      const posB = ORDEN_NORMALIZADO.indexOf(
        b.categoria.toLocaleLowerCase("es")
      );
      if (posA !== -1 || posB !== -1) {
        if (posA === -1) return 1;
        if (posB === -1) return -1;
        return posA - posB;
      }
      return a.categoria.localeCompare(b.categoria, "es");
    });
}

function NavEnlace({ enlace, onClick }) {
  return enlace.to ? (
    <Link className="pub-nav__enlace" to={enlace.to} onClick={onClick}>
      {enlace.nombre}
    </Link>
  ) : (
    <a className="pub-nav__enlace" href={enlace.href} onClick={onClick}>
      {enlace.nombre}
    </a>
  );
}

export default function PublicSite() {
  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [menuMovil, setMenuMovil] = useState(false);
  const [desplazado, setDesplazado] = useState(false);

  async function cargarCarta() {
    setCargando(true);
    setError("");

    const { data, error: errorCarga } = await supabase
      .from("menu")
      .select(
        "id,nombre,descripcion,precio,categoria,disponible,imagen_url"
      )
      .eq("disponible", true)
      .order("categoria")
      .order("nombre");

    if (errorCarga) {
      setError(
        errorCarga.message ||
          "No se pudo consultar la carta. Revisa la conexión e intenta otra vez."
      );
      setPlatos([]);
    } else {
      setPlatos(data ?? []);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarCarta();
  }, []);

  useEffect(() => {
    function alDesplazar() {
      setDesplazado(window.scrollY > 20);
    }

    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  const grupos = useMemo(() => agruparPorCategoria(platos), [platos]);
  const totalCategorias = grupos.length;

  function cerrarMenu() {
    setMenuMovil(false);
  }

  return (
    <div className="pub-pagina">
      <header className={`pub-nav ${desplazado ? "pub-nav--desplazado" : ""}`}>
        <div className="pub-contenedor pub-nav__inner">
          <a
            className="pub-nav__marca"
            href="#inicio"
            onClick={cerrarMenu}
            aria-label="Popular Cocina Boliviana, inicio"
          >
            <Brand claro={!desplazado} />
          </a>

          <nav className="pub-nav__enlaces" aria-label="Navegación principal">
            {ENLACES.map((enlace) => (
              <NavEnlace key={enlace.nombre} enlace={enlace} onClick={cerrarMenu} />
            ))}
          </nav>

          <button
            className="pub-nav__toggle"
            type="button"
            aria-label={menuMovil ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuMovil}
            aria-controls="pub-menu-movil"
            onClick={() => setMenuMovil((actual) => !actual)}
          >
            {menuMovil ? <X size={26} /> : <MenuIcon size={26} />}
          </button>
        </div>

        {menuMovil && (
          <nav
            className="pub-nav__movil"
            id="pub-menu-movil"
            aria-label="Navegación móvil"
          >
            {ENLACES.map((enlace) =>
              enlace.to ? (
                <Link key={enlace.nombre} to={enlace.to} onClick={cerrarMenu}>
                  {enlace.nombre}
                </Link>
              ) : (
                <a
                  key={enlace.nombre}
                  href={enlace.href}
                  onClick={cerrarMenu}
                >
                  {enlace.nombre}
                </a>
              )
            )}
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="pub-hero">
          <div className="pub-hero__contenido">
            <ChefHat size={48} className="pub-hero__icono" />
            <h1>
              Cocina Boliviana <br />
              <span>Reimaginada</span>
            </h1>
            <p>
              Sabores tradicionales, ingredientes locales y alta cocina en un
              ambiente cálido y casual.
            </p>
            <a className="pub-hero__cta" href="#menu">
              Ver Menú
            </a>
          </div>
        </section>

        <Concepto />

        <SeccionMenu
          grupos={grupos}
          cargando={cargando}
          error={error}
          alReintentar={cargarCarta}
        />

        <SeccionSistema
          totalCategorias={totalCategorias}
          totalPlatos={platos.length}
          cargando={cargando}
        />

        <Testimonios />
      </main>

      <Pie />
    </div>
  );
}

function Concepto() {
  return (
    <section id="concepto" className="pub-seccion pub-concepto">
      <div className="pub-contenedor pub-concepto__grid">
        <div className="pub-concepto__media">
          <img
            src="/images/chef.jpg"
            alt="Cocinero preparando un plato en la cocina"
            loading="lazy"
          />
        </div>

        <div className="pub-concepto__texto">
          <p className="pub-eyebrow">Nuestra Historia</p>
          <h2>Tributo a nuestras raíces andinas</h2>
          <p>
            En Popular Cocina Boliviana, transformamos las recetas de nuestras
            abuelas en una experiencia gastronómica moderna. Trabajamos de la
            mano con productores locales para garantizar que cada ingrediente
            cuente la historia de nuestra tierra.
          </p>
          <p>
            Nuestra cocina abierta te permite ser parte de la creación. No hay
            secretos, solo pasión por la gastronomía boliviana llevada al
            siguiente nivel.
          </p>

          <div className="pub-concepto__rasgos">
            <div className="pub-concepto__rasgo">
              <UtensilsCrossed size={28} />
              <strong>Ingredientes Locales</strong>
              <span>Directo del productor</span>
            </div>
            <div className="pub-concepto__rasgo">
              <ChefHat size={28} />
              <strong>Cocina Abierta</strong>
              <span>El arte frente a ti</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeccionMenu({ grupos, cargando, error, alReintentar }) {
  return (
    <section id="menu" className="pub-seccion pub-menu-seccion">
      <div className="pub-contenedor pub-contenedor--angosto">
        <header className="pub-encabezado">
          <p className="pub-eyebrow">Carta publicada</p>
          <h2>Nuestro Menú</h2>
          <p>Platos y precios publicados desde el sistema del restaurante.</p>
        </header>

        {cargando && (
          <div className="pub-menu pub-menu--estado" role="status">
            <strong>Consultando la carta</strong>
            <p>Estamos leyendo el menú publicado por el restaurante.</p>
          </div>
        )}

        {!cargando && error && (
          <div className="pub-menu pub-menu--estado" role="alert">
            <strong>No se pudo cargar la carta</strong>
            <p>{error}</p>
            <button
              className="pub-estado__reintentar"
              type="button"
              onClick={alReintentar}
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && grupos.length === 0 && (
          <div className="pub-menu pub-menu--estado">
            <strong>La carta todavía no está publicada</strong>
            <p>Vuelve a consultarla más tarde.</p>
          </div>
        )}

        {!cargando && !error && grupos.length > 0 && (
          <article className="pub-menu">
            <header className="pub-menu__cabecera">
              <h3>Carta del restaurante</h3>
              <p>
                {grupos.length}{" "}
                {grupos.length === 1 ? "categoría" : "categorías"} ·{" "}
                {grupos.reduce((total, grupo) => total + grupo.platos.length, 0)}{" "}
                platos disponibles
              </p>
            </header>

            <div className="pub-menu__cursos">
              {grupos.map((grupo) => (
                <section className="pub-curso" key={grupo.categoria}>
                  <h4>{grupo.categoria}</h4>
                  <ul className="pub-curso__lista">
                    {grupo.platos.map((plato) => (
                      <li className="pub-plato" key={plato.id}>
                        <div>
                          <h5>{plato.nombre}</h5>
                          {plato.descripcion && <p>{plato.descripcion}</p>}
                        </div>
                        <span className="pub-plato__precio">
                          {money(plato.precio)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <p className="pub-menu__nota">
              Los precios corresponden a cada plato publicado. La carta se
              actualiza desde el sistema del restaurante.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}

function SeccionSistema({ totalCategorias, totalPlatos, cargando }) {
  return (
    <section id="sistema" className="pub-sistema">
      <div className="pub-contenedor pub-sistema__grid">
        <div>
          <p className="pub-eyebrow pub-sistema__eyebrow">
            Sistema del restaurante
          </p>
          <h2>La carta, siempre al día</h2>
          <p className="pub-sistema__texto">
            Los platos, precios y la disponibilidad que ves en esta página se
            consultan directamente en el sistema interno del restaurante. No
            mostramos platos ni precios de ejemplo.
          </p>

          <div className="pub-sistema__datos">
            <div className="pub-sistema__dato">
              <CalendarDays size={24} />
              <div>
                <strong>Carta vigente</strong>
                <span>Platos publicados desde el sistema.</span>
              </div>
            </div>
            <div className="pub-sistema__dato">
              <Users size={24} />
              <div>
                <strong>Acceso del personal</strong>
                <span>El panel administrativo requiere iniciar sesión.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pub-sistema__tarjeta">
          <h3>Acceso al sistema</h3>
          <p>
            Gestiona la carta, las mesas y las atenciones desde el panel
            interno del restaurante.
          </p>

          <div className="pub-sistema__resumen">
            <div>
              <span>Carta</span>
              <strong>Restaurante</strong>
            </div>
            <div>
              <span>Categorías</span>
              <strong>{cargando ? "—" : totalCategorias}</strong>
            </div>
            <div>
              <span>Platos publicados</span>
              <strong>{cargando ? "—" : totalPlatos}</strong>
            </div>
          </div>

          <Link className="pub-sistema__cta" to="/login">
            Ingresar al panel
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonios() {
  return (
    <section className="pub-seccion pub-testimonios">
      <div className="pub-contenedor">
        <header className="pub-encabezado pub-testimonios__encabezado">
          <p className="pub-eyebrow">Lo que dicen de nosotros</p>
          <h2>Testimonios</h2>
        </header>

        <div className="pub-testimonios__grid">
          {TESTIMONIOS.map((testimonio) => (
            <article className="pub-testimonio" key={testimonio.autor}>
              <div
                className="pub-testimonio__estrellas"
                aria-label="Cinco estrellas"
              >
                {[0, 1, 2, 3, 4].map((estrella) => (
                  <Star key={estrella} size={18} fill="currentColor" />
                ))}
              </div>
              <blockquote>“{testimonio.texto}”</blockquote>
              <footer className="pub-testimonio__pie">
                <span className="pub-testimonio__autor">
                  {testimonio.autor}
                </span>
                <span className="pub-testimonio__fecha">
                  {testimonio.fecha}
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pie() {
  return (
    <footer className="pub-pie">
      <div className="pub-contenedor">
        <div className="pub-pie__marca">
          <Brand claro grande />
        </div>

        <nav className="pub-pie__enlaces" aria-label="Enlaces del pie">
          {ENLACES.map((enlace) =>
            enlace.to ? (
              <Link key={enlace.nombre} to={enlace.to}>
                {enlace.nombre}
              </Link>
            ) : (
              <a key={enlace.nombre} href={enlace.href}>
                {enlace.nombre}
              </a>
            )
          )}
        </nav>

        <p className="pub-pie__copy">
          © {new Date().getFullYear()} Popular Cocina Boliviana. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
}
