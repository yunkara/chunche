/* =========================================================
   CHUNCHE — script.js
   Parte 1: el celular que se desarma con el scroll (GSAP).
   Parte 2: el botón flotante de WhatsApp.
   Parte 3: el cotizador (calcula precio y arma el WhatsApp).
   Parte 4: el mapa que carga solo si la persona lo pide.
   Parte 5: enlaces del menú con deslizamiento suave.

   El número de WhatsApp y la lista "CAMBIAR ANTES DE PUBLICAR"
   están en datos-negocio.js (se carga antes que este archivo).
   ========================================================= */

// Fecha de hoy en español, ej. "viernes 13 de noviembre".
// La usa la pantalla del celular (de CSS y de 3D) para que nunca quede vieja.
function fechaDeHoy() {
  return new Date()
    .toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })
    .replace(",", ""); // el navegador escribe "viernes, 13": le quitamos la coma
}
document.querySelectorAll(".fecha").forEach((f) => (f.textContent = fechaDeHoy()));

/* ---------------------------------------------------------
   PARTE 1: ANIMACIÓN DEL CELULAR
   --------------------------------------------------------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  // SOLO EN PANTALLAS TÁCTILES (celular / tablet):
  // En el celular, la barra de la dirección aparece y desaparece al deslizar.
  // Eso cambia el alto de la pantalla y la sección "pegada" daba brincos.
  // normalizeScroll: GSAP maneja el scroll del dedo, la barra se queda quieta
  // y la animación va sincronizada con el dedo.
  // (isTouch === 1 = solo táctil; las compus con pantalla táctil no entran)
  if (ScrollTrigger.isTouch === 1) {
    ScrollTrigger.normalizeScroll(true);
  }
  // No recalcular todo cada vez que la barra del celular cambia el alto
  ScrollTrigger.config({ ignoreMobileResize: true });

  // matchMedia: el código de adentro SOLO corre si la persona
  // no pidió "reducir movimiento" en su teléfono o compu.
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    document.documentElement.classList.add("js-anim"); // esconde las fichas (ver CSS)

    const esCelular = () => window.innerWidth < 760;

    // Las capas en el HTML van de abajo (tapa) hacia arriba (vidrio).
    const capas = gsap.utils.toArray(".capa");
    const bordes = capas.map((c) => c.querySelector(".capa__borde"));
    const fichas = gsap.utils.toArray(".ficha");
    const fichaFinal = fichas[fichas.length - 1];
    const segmentos = gsap.utils.toArray(".progreso i");

    // Separación entre capas según el tamaño de la pantalla
    const separacion = () => Math.min(esCelular() ? 34 : 70, window.innerHeight * 0.075);
    // Altura de cada capa ya desarmada (la de arriba queda más alta)
    const zDesarmado = (i) => i * separacion();
    const zArmado = (i) => i * 2;

    // Posición inicial: todo armado
    gsap.set(".plano", { rotationX: 56, rotationZ: -36 });
    gsap.set(capas, { z: zArmado });
    gsap.set(fichas, { autoAlpha: 0, y: 24 });
    gsap.set(".progreso", { autoAlpha: 0 });

    // --- Entrada al cargar la página (una sola vez) ---
    // Usamos elementos que la línea de tiempo del scroll NO toca, para no pelear.
    gsap.from(".telefono-caja", { y: -90, autoAlpha: 0, duration: 1.3, ease: "expo.out", delay: 0.1 });
    gsap.from(".hero__texto > *", { y: 28, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" });

    // ¿Estamos en un celular (pantalla angosta) al cargar la página?
    const enCelular = esCelular();

    // --- Línea de tiempo (las animaciones en orden) ---
    // Primero la armamos completa; al final (paso 4) la atamos al scroll.
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });

    // 1) Se esconde el texto, el celular se desarma y las herramientas se apartan
    tl.to(".hero__texto", { autoAlpha: 0, y: -30, duration: 0.4 })
      .to(capas, { z: zDesarmado, duration: 1, stagger: 0.04 }, 0.1)
      .to(".plano", { rotationZ: -26, rotationX: 52, duration: 1 }, 0.1)
      .to(".sombra", { opacity: 0.35, scale: 1.08, duration: 1 }, 0.1)
      .to(".herramienta", { opacity: 0.5, duration: 0.6 }, 0.1)
      // En compu bajamos la escena (las capas suben al separarse);
      // en celular la subimos (las fichas ocupan menos que el título).
      .to(".escena", { y: () => (esCelular() ? -window.innerHeight * 0.1 : separacion() * 1.6), duration: 1 }, 0.1)
      .to(".progreso", { autoAlpha: 1, duration: 0.3 }, 0.8);

    // 2) Pieza por pieza, de arriba (vidrio) hacia abajo (tapa)
    [...capas].reverse().forEach((capa, n) => {
      const i = capas.indexOf(capa);   // posición original de la capa
      const paso = "pieza" + n;

      tl.addLabel(paso)
        // Las demás piezas se apagan un poco; la activa queda brillante
        .to(capas, { opacity: (j) => (j === i ? 1 : 0.4), duration: 0.35 }, paso)
        // La pieza activa sube y se enciende su borde ámbar
        .to(capa, { z: zDesarmado(i) + 46, duration: 0.35 }, paso)
        .to(bordes[i], { opacity: 1, duration: 0.25 }, paso)
        // Se llena un segmento de la barra de progreso
        .fromTo(segmentos[n], { "--lleno": 0 }, { "--lleno": 1, duration: 0.35, ease: "none", immediateRender: false }, paso)
        // fromTo: "desde" escondida abajo "hasta" visible en su lugar
        .fromTo(fichas[n], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "expo.out", immediateRender: false }, paso + "+=0.05")
        .to({}, { duration: 0.5 })     // pausa para leer
        .fromTo(fichas[n], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -18, duration: 0.25, immediateRender: false })
        .to(capa, { z: zDesarmado(i), duration: 0.25 }, "<")
        .to(bordes[i], { opacity: 0, duration: 0.2 }, "<");
    });

    // 3) Se vuelve a armar y aparece la ficha final
    tl.addLabel("armar")
      .to(capas, { opacity: 1, z: zArmado, duration: 0.8, stagger: { each: 0.04, from: "end" } }, "armar")
      .to(".plano", { rotationZ: -36, rotationX: 56, duration: 0.8 }, "armar")
      .to(".sombra", { opacity: 1, scale: 1, duration: 0.8 }, "armar")
      .to(".herramienta", { opacity: 1, duration: 0.6 }, "armar")
      .to(".escena", { y: 0, duration: 0.8 }, "armar")
      .to(".grieta", { opacity: 0, duration: 0.4 }, "armar+=0.4") // ¡reparado! la grieta desaparece
      .to(".progreso", { autoAlpha: 0, duration: 0.2 }, "armar")
      .fromTo(fichaFinal, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "expo.out", immediateRender: false }, "armar+=0.45")
      .to({}, { duration: 0.3 });

    // 4) Atar la línea de tiempo al scroll
    // "Paradas": los momentos en que cada ficha ya se lee completa.
    // Cada pieza aparece en su etiqueta ("pieza0"...) y queda quieta hasta +0.85;
    // +0.6 es justo a la mitad de ese rato. Se escriben como avance de 0 a 1.
    // (Por eso se calculan aquí: la línea de tiempo ya está completa.)
    const total = tl.duration();
    const paradas = [
      0,                                                              // el título del inicio
      ...[0, 1, 2, 3, 4].map((n) => (tl.labels["pieza" + n] + 0.6) / total), // las 5 piezas
      1,                                                              // "Y lo volvemos a armar"
    ];

    ScrollTrigger.create({
      animation: tl,
      trigger: ".hero",
      start: "top top",
      // Cuánto hay que deslizar: en compu 3 pantallas; en celular 1.8,
      // porque con el dedo se sentía "trabado" (empujabas y la página no avanzaba)
      end: () => "+=" + window.innerHeight * (enCelular ? 1.8 : 3),
      pin: true,                 // la sección se queda quieta mientras bajas
      anticipatePin: 1,          // fija la sección un instante ANTES, para que no "brinque" al bajar rápido
      scrub: 0.5,                // la animación avanza o retrocede según bajes o subas
      invalidateOnRefresh: true, // recalcula si cambia el tamaño de la ventana
      // SNAP (solo en celular): al soltar el dedo, la animación se acomoda sola en una parada.
      // directional: va hacia donde deslizaste (bajando = la siguiente pieza,
      // subiendo = la anterior), aunque hayas deslizado poquito.
      snap: enCelular
        ? {
            snapTo: paradas,
            directional: true,
            duration: { min: 0.25, max: 0.7 }, // cuánto tarda en acomodarse
            delay: 0.05,                       // espera un poquito después de soltar
            ease: "power2.inOut",
          }
        : false,
    });

    // Compartimos la línea de tiempo para que escena3d.js agregue
    // sus propias animaciones en los mismos momentos (etiquetas "pieza0"... "armar").
    window.chuncheTL = tl;

    // Si la persona activa "reducir movimiento", quitamos la clase
    // para que las fichas se vean como lista normal.
    return () => {
      document.documentElement.classList.remove("js-anim");
      window.chuncheTL = null;
    };
  });

  // Las fuentes cambian el tamaño del texto: recalcular al terminar de cargar
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  /* -------------------------------------------------------
     PARTE 2: BOTÓN FLOTANTE
     Escondido mientras se ve el inicio, visible después.
     ------------------------------------------------------- */
  const flotante = document.querySelector(".flotante");
  let pasoElInicio = window.scrollY >= window.innerHeight;
  let seVeLaCotizacion = false;

  // Se ve solo si ya pasó el inicio Y no se ve la tarjeta de cotización
  // (la tarjeta ya tiene su propio botón de WhatsApp: no hace falta dos,
  // y en celular el flotante tapaba el contenido de la tarjeta).
  function actualizarFlotante() {
    // toggle(clase, condición): pone la clase si es true, la quita si es false
    flotante.classList.toggle("oculto", !pasoElInicio || seVeLaCotizacion);
  }

  ScrollTrigger.create({
    trigger: ".cotizar",
    start: "top bottom",          // cuando el cotizador asoma por abajo
    end: "max",
    onToggle: (self) => { pasoElInicio = self.isActive; actualizarFlotante(); },
  });

  // IntersectionObserver: avisa cuando un elemento entra o sale de la pantalla.
  // threshold 0.25 = cuando se ve al menos una cuarta parte de la tarjeta.
  new IntersectionObserver(([entrada]) => {
    seVeLaCotizacion = entrada.isIntersecting;
    actualizarFlotante();
  }, { threshold: 0.25 }).observe(document.querySelector(".orden"));

  actualizarFlotante();
}

/* ---------------------------------------------------------
   PARTE 3: COTIZADOR
   Solo mostramos lo que el taller CONTROLA: su mano de obra.
   El precio de la pieza cambia según el proveedor y puede no
   haber en stock, así que se confirma por WhatsApp.
   pieza: true  = normalmente lleva pieza (se pide su precio)
   pieza: false = normalmente no lleva pieza
   --------------------------------------------------------- */
const REPARACIONES = {
  pantalla: { nombre: "Cambio de pantalla",   mano: "$15",       pieza: true,  tiempo: "1 a 2 horas" },
  bateria:  { nombre: "Cambio de batería",    mano: "$10",       pieza: true,  tiempo: "45 minutos" },
  carga:    { nombre: "Puerto de carga",      mano: "$10",       pieza: true,  tiempo: "1 hora" },
  agua:     { nombre: "Limpieza por agua",    mano: "desde $25", pieza: false, tiempo: "24 a 48 horas",
              notaPieza: "Si después de limpiarlo hace falta una pieza, te decimos el precio antes de cambiarla." },
  camara:   { nombre: "Cambio de cámara",     mano: "$10",       pieza: true,  tiempo: "1 a 2 horas" },
  software: { nombre: "Revisión del sistema", mano: "$10",       pieza: false, tiempo: "30 minutos",
              notaPieza: "No necesita pieza." },
};

const form = document.getElementById("cotizador");
const $ = (id) => document.getElementById(id);

// Arma el nombre del celular sin repetir palabras:
//   "Samsung" + "Galaxy A54"       → "Samsung Galaxy A54"
//   "Samsung" + "Samsung S24"      → "Samsung S24"   (ya dice la marca)
//   "Huawei / Honor" + "Honor X8"  → "Honor X8"      (ya dice una de las dos)
//   "Otra" + "Tecno Spark 20"      → "Tecno Spark 20"
//   "Otra" + (vacío)               → "celular de otra marca"
function nombreDelEquipo(marca, modelo) {
  if (marca === "Otra") return modelo || "celular de otra marca";
  if (!modelo) return marca.replace(" / ", " o "); // "Huawei o Honor"
  // split(" / ") separa "Huawei / Honor" en ["Huawei", "Honor"]
  const partes = marca.toLowerCase().split(" / ");
  const yaDiceMarca = partes.some((p) => modelo.toLowerCase().includes(p));
  return yaDiceMarca ? modelo : `${marca.split(" / ")[0]} ${modelo}`;
}

function actualizarCotizacion() {
  const marca = form.marca.value;
  const modelo = form.modelo.value.trim();
  const r = REPARACIONES[form.problema.value];

  const equipo = nombreDelEquipo(marca, modelo);

  $("r-equipo").textContent = equipo;
  $("r-problema").textContent = r.nombre;
  $("r-tiempo").textContent = r.tiempo;
  $("r-si-pieza").hidden = !r.pieza; // "si tenemos la pieza" solo cuando lleva pieza
  $("r-mano").textContent = r.mano;
  $("r-pieza").textContent = r.pieza
    ? "+ la pieza: te confirmamos el precio y si la tenemos disponible, antes de reparar."
    : r.notaPieza;
  $("r-boton").textContent = r.pieza ? "Pedir precio de la pieza" : "Agendar por WhatsApp";

  // Mensaje listo para WhatsApp (encodeURIComponent convierte espacios y tildes)
  const pregunta = r.pieza
    ? "¿Cuánto cuesta la pieza y la tienen disponible?"
    : "¿Cuándo lo puedo llevar?";
  const mensaje =
    `Hola Chunche, tengo un ${equipo}.\n` +
    `Necesito: ${r.nombre}.\n` +
    pregunta;
  $("r-enviar").href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

/* ---------------------------------------------------------
   Sugerencias de modelos (los más comunes en El Salvador)
   --------------------------------------------------------- */
const MODELOS = {
  "Samsung": ["Galaxy A05", "Galaxy A15", "Galaxy A25", "Galaxy A35", "Galaxy A54", "Galaxy A55", "Galaxy S23", "Galaxy S24", "Galaxy S24 Ultra", "Galaxy Z Flip 5"],
  "iPhone": ["iPhone XR", "iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 15 Pro Max"],
  "Xiaomi / Redmi": ["Redmi A3", "Redmi 13C", "Redmi Note 12", "Redmi Note 13", "Poco X6", "Xiaomi 14"],
  "Motorola": ["Moto E13", "Moto G24", "Moto G54", "Moto G84", "Edge 40"],
  "Huawei / Honor": ["Huawei Y9", "Honor X6", "Honor X8", "Huawei P30", "Honor Magic 6"],
  "Otra": [],
};
const EJEMPLOS = {
  "Samsung": "Ej. Galaxy A54", "iPhone": "Ej. iPhone 13", "Xiaomi / Redmi": "Ej. Redmi Note 13",
  "Motorola": "Ej. Moto G84", "Huawei / Honor": "Ej. Honor X8", "Otra": "Ej. Tecno Spark 20",
};

function prepararMarca() {
  const marca = form.marca.value;
  form.modelo.placeholder = EJEMPLOS[marca];
  $("lista-modelos").innerHTML = MODELOS[marca].map((m) => `<option value="${m}">`).join("");
}

// "input" se dispara con cada cambio: al escribir o al escoger una opción
form.addEventListener("input", (e) => {
  if (e.target.name === "marca") prepararMarca();
  actualizarCotizacion();
});
form.addEventListener("submit", (e) => e.preventDefault()); // Enter no recarga la página

// En celular: al tocar "Listo" en el teclado, se cierra el teclado
// (blur = quitarle el foco al campo) para que se vea la cotización.
form.modelo.addEventListener("keydown", (e) => {
  if (e.key === "Enter") form.modelo.blur();
});

prepararMarca();
actualizarCotizacion();

/* ---------------------------------------------------------
   PARTE 4: MAPA QUE CARGA SOLO SI LA PERSONA LO PIDE
   El mapa de Google pone cookies y le avisa a Google de cada visita.
   Por eso no lo cargamos al abrir la página: solo al tocar el botón.
   --------------------------------------------------------- */
const botonMapa = document.getElementById("ver-mapa");
botonMapa?.addEventListener("click", () => {
  const mapa = document.createElement("iframe");
  mapa.title = "Mapa del taller";
  mapa.src = botonMapa.dataset.src; // la dirección está en data-src del HTML
  mapa.referrerPolicy = "strict-origin-when-cross-origin";
  document.getElementById("mapa").replaceChildren(mapa); // cambia el aviso por el mapa
  mapa.focus();
});

/* ---------------------------------------------------------
   PARTE 5: ENLACES DEL MENÚ CON DESLIZAMIENTO SUAVE
   (antes lo hacía el CSS "scroll-behavior: smooth", pero eso
   choca con GSAP; aquí lo hacemos solo al hacer clic)
   --------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach((enlace) => {
  enlace.addEventListener("click", (e) => {
    const destino = document.querySelector(enlace.getAttribute("href"));
    if (!destino) return;
    e.preventDefault();
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY, behavior: reducir ? "auto" : "smooth" });
    // Mover también el "foco" (dónde está el teclado) al destino.
    // Así, quien navega con Tab o con lector de pantalla sigue desde ahí.
    // tabindex -1: se puede enfocar con código, pero no entra en el recorrido de Tab.
    destino.setAttribute("tabindex", "-1");
    destino.focus({ preventScroll: true });
  });
});
