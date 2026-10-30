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
import Brand from "../../shared/components/Brand";

const PRECIO_MENU = 89;

const EXPERIENCIA = [
  {
    id: "entradas",
    numero: "01",
    titulo: "Para Empezar",
    etiqueta: "Entrada",
    descripcion:
      "Bocados frescos y profundos para abrir el apetito con producto de temporada.",
  },
  {
    id: "fuertes",
    numero: "02",
    titulo: "El Fuerte",
    etiqueta: "Plato fuerte",
    descripcion:
      "El corazón del menú: técnica, fuego y sabores de nuestra tierra.",
  },
  {
    id: "postres",
    numero: "03",
    titulo: "El Dulce Final",
    etiqueta: "Postre",
    descripcion:
      "El cierre dulce de la experiencia, con frutas y chocolate boliviano.",
  },
];

const CATEGORIA_A_CURSO = {
  entradas: "entradas",
  entrada: "entradas",
  "platos fuertes": "fuertes",
  "plato fuerte": "fuertes",
  principales: "fuertes",
  postres: "postres",
  postre: "postres",
};

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

function normalizarCategoria(categoria) {
  return String(categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

function agruparExperiencia(platos) {
  const grupos = new Map(EXPERIENCIA.map((curso) => [curso.id, []]));

  platos.forEach((plato) => {
    const curso = CATEGORIA_A_CURSO[normalizarCategoria(plato.categoria)];
    if (curso) grupos.get(curso).push(plato);
  });

  return EXPERIENCIA.map((curso) => ({
    ...curso,
    platos: grupos
      .get(curso.id)
      .sort((a, b) =>
        String(a.nombre || "").localeCompare(String(b.nombre || ""), "es")
      ),
  }));
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

  const grupos = useMemo(() => agruparExperiencia(platos), [platos]);
  const totalPlatos = useMemo(
    () => grupos.reduce((total, grupo) => total + grupo.platos.length, 0),
    [grupos]
  );
  const totalCategorias = useMemo(
    () => grupos.filter((grupo) => grupo.platos.length > 0).length,
    [grupos]
  );

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
          totalPlatos={totalPlatos}
          cargando={cargando}
          error={error}
          alReintentar={cargarCarta}
        />

        <SeccionSistema
          totalCategorias={totalCategorias}
          totalPlatos={totalPlatos}
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

function SeccionMenu({ grupos, totalPlatos, cargando, error, alReintentar }) {
  const hayPlatos = totalPlatos > 0;

  return (
    <section id="menu" className="pub-seccion pub-menu-seccion">
      <div className="pub-contenedor">
        <Experiencia />

        {cargando && <MenuSkeleton />}

        {!cargando && error && (
          <div className="pub-menu-estado" role="alert">
            <strong>No pudimos cargar la carta</strong>
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

        {!cargando && !error && !hayPlatos && (
          <div className="pub-menu-estado" role="status">
            <strong>La carta de esta semana aún no está publicada</strong>
            <p>
              Vuelve a consultarla más tarde. Estamos preparando la próxima
              experiencia.
            </p>
          </div>
        )}

        {!cargando && !error && hayPlatos && (
          <>
            <div className="pub-cursos">
              {grupos.map((grupo) => (
                <Curso key={grupo.id} grupo={grupo} />
              ))}
            </div>

            <p className="pub-menu-nota">
              El precio del menú completo es por persona e incluye una opción
              de cada tiempo.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Experiencia() {
  return (
    <header className="pub-experiencia">
      <div className="pub-experiencia__contenido">
        <p className="pub-eyebrow">Nuestra carta</p>
        <h2>
          Una experiencia de <em>tres tiempos</em>
        </h2>
        <p className="pub-experiencia__intro">
          Una experiencia de 3 tiempos inspirada en los sabores de Bolivia.
          Elige una opción por cada etapa.
        </p>

        <ol className="pub-experiencia__pasos">
          {EXPERIENCIA.map((curso) => (
            <li key={curso.id}>
              <span className="pub-experiencia__paso-numero" aria-hidden="true">
                {curso.numero}
              </span>
              <span>
                <strong>{curso.titulo}</strong>
                <small>{curso.etiqueta}</small>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="pub-experiencia__precio">
        <span className="pub-experiencia__precio-eyebrow">
          Precio del menú completo
        </span>
        <strong className="pub-experiencia__precio-cifra">
          <span>Bs.</span> {PRECIO_MENU}
        </strong>
        <span className="pub-experiencia__precio-nota">
          por persona · 3 tiempos
        </span>
        <span
          className="pub-experiencia__precio-separador"
          aria-hidden="true"
        />
        <small>Entrada + plato fuerte + postre</small>
      </div>
    </header>
  );
}

function Curso({ grupo }) {
  const tituloId = `curso-${grupo.id}`;

  return (
    <section className="pub-curso-bloque" aria-labelledby={tituloId}>
      <header className="pub-curso-bloque__cabecera">
        <span className="pub-curso-bloque__numero" aria-hidden="true">
          {grupo.numero}
        </span>
        <div className="pub-curso-bloque__titulos">
          <p className="pub-curso-bloque__etiqueta">{grupo.etiqueta}</p>
          <h3 id={tituloId}>{grupo.titulo}</h3>
          <p>{grupo.descripcion}</p>
        </div>
      </header>

      {grupo.platos.length > 0 ? (
        <div className="pub-platos-grid">
          {grupo.platos.map((plato) => (
            <PlatoCard key={plato.id} plato={plato} etiqueta={grupo.etiqueta} />
          ))}
        </div>
      ) : (
        <p className="pub-curso-bloque__vacio">
          Las opciones de este tiempo se publican cada semana.
        </p>
      )}
    </section>
  );
}

function PlatoCard({ plato, etiqueta }) {
  const [imagenFallida, setImagenFallida] = useState(false);
  const mostrarImagen = Boolean(plato.imagen_url) && !imagenFallida;

  return (
    <article className="pub-plato-card">
      <div className="pub-plato-card__media">
        {mostrarImagen ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            loading="lazy"
            decoding="async"
            onError={() => setImagenFallida(true)}
          />
        ) : (
          <div className="pub-plato-card__fallback" aria-hidden="true">
            <span>{plato.nombre?.trim().charAt(0) || "P"}</span>
          </div>
        )}
        <span className="pub-plato-card__badge">{etiqueta}</span>
      </div>

      <div className="pub-plato-card__cuerpo">
        <h4>{plato.nombre}</h4>
        {plato.descripcion && <p>{plato.descripcion}</p>}
      </div>
    </article>
  );
}

function MenuSkeleton() {
  return (
    <div
      className="pub-cursos"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando la carta de la semana…</span>
      {EXPERIENCIA.map((curso) => (
        <section className="pub-curso-bloque" key={curso.id}>
          <header className="pub-curso-bloque__cabecera">
            <span className="pub-curso-bloque__numero" aria-hidden="true">
              <span className="pub-esqueleto pub-esqueleto--numero" />
            </span>
            <div className="pub-curso-bloque__titulos">
              <span className="pub-esqueleto pub-esqueleto--etiqueta" />
              <span className="pub-esqueleto pub-esqueleto--titulo" />
              <span className="pub-esqueleto pub-esqueleto--texto" />
            </div>
          </header>

          <div className="pub-platos-grid">
            {[0, 1].map((indice) => (
              <article
                className="pub-plato-card pub-plato-card--esqueleto"
                key={indice}
              >
                <div className="pub-plato-card__media pub-esqueleto" />
                <div className="pub-plato-card__cuerpo">
                  <span className="pub-esqueleto pub-esqueleto--nombre" />
                  <span className="pub-esqueleto pub-esqueleto--linea" />
                  <span className="pub-esqueleto pub-esqueleto--linea pub-esqueleto--corta" />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
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
            La carta y la disponibilidad que ves en esta página se consultan
            directamente en el sistema interno del restaurante. No mostramos
            platos de ejemplo.
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
              <span>Experiencia</span>
              <strong>3 tiempos</strong>
            </div>
            <div>
              <span>Tiempos publicados</span>
              <strong>{cargando ? "—" : totalCategorias}</strong>
            </div>
            <div>
              <span>Opciones disponibles</span>
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
