/* =========================================================
   CHUNCHE — escena3d.js
   El celular en 3D real (Three.js) sobre la mesa de trabajo.
   Se "engancha" a la línea de tiempo del scroll que crea script.js.

   Piezas de Three.js que usamos:
   - Scene (escena): el "mundo" donde ponemos los objetos.
   - Camera (cámara): desde dónde miramos.
   - Renderer: dibuja la escena en un <canvas>.
   - Mesh = forma (Geometry) + material (cómo refleja la luz).
   - Group: una caja invisible para mover varias cosas juntas.
   ========================================================= */

import * as THREE from "./librerias/three.module.min.js";
import { RoomEnvironment } from "./librerias/RoomEnvironment.js";

const hero = document.querySelector(".hero");

// ¿El navegador puede dibujar 3D? Si no, se queda el celular de CSS.
function hayWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

if (hero && hayWebGL()) {
  iniciar().catch((error) => console.warn("Chunche: 3D no disponible, se usa el respaldo CSS.", error));
}

async function iniciar() {
  await document.fonts.ready; // las texturas usan la letra Archivo

  /* ---------------------------------------------------------
     1. RENDERER, ESCENA Y CÁMARA
     --------------------------------------------------------- */
  // En celular gastamos menos: los celulares baratos se calientan con el 3D
  const esCelular = window.innerWidth < 760;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: fondo transparente (se ve el tapete de CSS)
  // Pixel ratio = cuántos puntos reales dibuja por cada punto de la página.
  // En celular 1.5 ya se ve nítido y dibuja casi la mitad de puntos que 2.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, esCelular ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; // colores más "de cine"
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;   // sombras suaves
  renderer.domElement.className = "lienzo-3d";
  renderer.domElement.setAttribute("aria-hidden", "true");

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  // Reflejos: una "habitación" virtual que se refleja en el metal y el vidrio
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------------------------------------------------------
     2. LUCES
     --------------------------------------------------------- */
  escena.add(new THREE.HemisphereLight(0xcff3ef, 0x0b2b2c, 0.7)); // luz ambiente: cielo verdoso, piso oscuro

  const lampara = new THREE.DirectionalLight(0xfff4e0, 2.4); // la "lámpara" del taller
  lampara.position.set(-9, 22, 7);
  lampara.castShadow = true;
  // Tamaño de la "foto" de la sombra: más grande = más fina pero más pesada
  const tamSombra = esCelular ? 1024 : 2048;
  lampara.shadow.mapSize.set(tamSombra, tamSombra);
  lampara.shadow.camera.left = -16;
  lampara.shadow.camera.right = 16;
  lampara.shadow.camera.top = 16;
  lampara.shadow.camera.bottom = -16;
  lampara.shadow.radius = 6;
  lampara.shadow.bias = -0.0004;
  escena.add(lampara);

  const contraluz = new THREE.PointLight(0xf2b33d, 30, 40); // reflejo ámbar desde atrás
  contraluz.position.set(10, 6, -10);
  escena.add(contraluz);

  // Piso invisible que SOLO muestra sombras (encima del tapete de CSS)
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ color: 0x041c1d, opacity: 0.38 })
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  escena.add(piso);

  /* ---------------------------------------------------------
     3. AYUDANTES PARA HACER FORMAS
     --------------------------------------------------------- */
  // Rectángulo con esquinas redondeadas (la forma de un celular visto desde arriba)
  function rectRedondo(ancho, largo, radio) {
    const s = new THREE.Shape();
    const x = -ancho / 2, y = -largo / 2;
    s.moveTo(x + radio, y);
    s.lineTo(x + ancho - radio, y);
    s.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
    s.lineTo(x + ancho, y + largo - radio);
    s.quadraticCurveTo(x + ancho, y + largo, x + ancho - radio, y + largo);
    s.lineTo(x + radio, y + largo);
    s.quadraticCurveTo(x, y + largo, x, y + largo - radio);
    s.lineTo(x, y + radio);
    s.quadraticCurveTo(x, y, x + radio, y);
    return s;
  }

  // "Losa": una forma con grosor (como galleta). Queda acostada, de y=0 a y=grosor.
  function losa(forma, grosor, material, bisel = 0.04) {
    const g = new THREE.ExtrudeGeometry(forma, {
      depth: Math.max(grosor - bisel * 2, 0.001),
      bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 3, curveSegments: 14,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bisel, 0);
    const m = new THREE.Mesh(g, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // "Cara": una superficie plana (sin grosor) para pegar una imagen encima
  function cara(ancho, largo, radio, material) {
    const g = new THREE.ShapeGeometry(rectRedondo(ancho, largo, radio), 14);
    // Ajustamos las coordenadas de la imagen (UV) para que cubra de 0 a 1
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + ancho / 2) / ancho, (p.getY(i) + largo / 2) / largo);
    g.rotateX(-Math.PI / 2);
    return new THREE.Mesh(g, material);
  }

  // Aro: un borde con hueco (para marcar la pieza activa)
  function aro(ancho, largo, radio, grosorBorde) {
    const s = rectRedondo(ancho + grosorBorde * 2, largo + grosorBorde * 2, radio + grosorBorde);
    s.holes.push(rectRedondo(ancho, largo, radio));
    const mat = new THREE.MeshBasicMaterial({ color: 0xf2b33d, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 14), mat);
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // Dibuja en un <canvas> y lo convierte en textura (imagen para 3D)
  function textura(ancho, alto, dibujar) {
    const c = document.createElement("canvas");
    c.width = ancho;
    c.height = alto;
    dibujar(c.getContext("2d"), ancho, alto);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  // Números "al azar" pero siempre iguales (así la grieta no cambia al recargar)
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);

  /* ---------------------------------------------------------
     4. TEXTURAS (imágenes dibujadas con código)
     --------------------------------------------------------- */
  function fondoPantalla(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
    g.addColorStop(0, "#58b9bd");
    g.addColorStop(0.5, "#165257");
    g.addColorStop(1, "#06201f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = ctx.createRadialGradient(w * 0.85, h * 0.95, 0, w * 0.85, h * 0.95, w * 0.9);
    r.addColorStop(0, "rgba(242,179,61,0.75)");
    r.addColorStop(1, "rgba(242,179,61,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, w, h);
  }

  const texPantalla = textura(512, 1104, (ctx, w, h) => {
    fondoPantalla(ctx, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.textAlign = "center";
    ctx.font = "300 190px Archivo";
    ctx.fillText("10:24", w / 2, 330);
    ctx.font = "500 34px Archivo";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(fechaDeHoy(), w / 2, 390); // la fecha de hoy (función en script.js)
  });

  const texListo = textura(512, 1104, (ctx, w, h) => {
    fondoPantalla(ctx, w, h);
    ctx.fillStyle = "#f2b33d";
    ctx.beginPath();
    ctx.arc(w / 2, 470, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1b2426";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(w / 2 - 52, 472);
    ctx.lineTo(w / 2 - 12, 512);
    ctx.lineTo(w / 2 + 58, 428);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "750 76px Archivo";
    ctx.fillText("Reparado", w / 2, 690);
    ctx.font = "500 34px Archivo";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillText("Listo para entregar", w / 2, 745);
  });

  const texGrieta = textura(512, 1104, (ctx) => {
    // Grieta: líneas que salen de un punto de golpe, con quiebres
    const cx = 370, cy = 250;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineCap = "round";
    for (let i = 0; i < 11; i++) {
      let ang = (i / 11) * Math.PI * 2 + azar() * 0.4;
      let x = cx, y = cy;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const pasos = 5 + Math.floor(azar() * 6);
      for (let k = 0; k < pasos; k++) {
        ang += (azar() - 0.5) * 0.6;
        const largo = 30 + azar() * 90;
        x += Math.cos(ang) * largo;
        y += Math.sin(ang) * largo;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Anillos rotos alrededor del golpe
    ctx.lineWidth = 1.6;
    for (const radio of [34, 70]) {
      for (let a = 0; a < Math.PI * 2; a += 0.7) {
        ctx.beginPath();
        ctx.arc(cx, cy, radio + azar() * 6, a, a + 0.35 + azar() * 0.3);
        ctx.stroke();
      }
    }
  });

  const texPlaca = textura(512, 432, (ctx, w, h) => {
    ctx.fillStyle = "#1f4a3e";
    ctx.fillRect(0, 0, w, h);
    // Pistas doradas en ángulo recto
    ctx.strokeStyle = "rgba(242,179,61,0.55)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 46; i++) {
      let x = azar() * w, y = azar() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        if (k % 2) x += (azar() - 0.5) * 160; else y += (azar() - 0.5) * 160;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(242,179,61,0.8)";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 20px Archivo";
    ctx.fillText("CHN-0427  REV B", 24, h - 22);
  });

  const texEtiqueta = textura(512, 752, (ctx, w, h) => {
    ctx.fillStyle = "#f2b33d";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "#1b2426";
    ctx.textAlign = "center";
    ctx.font = "800 96px Archivo";
    ctx.fillText("Li-ion", 0, -40);
    ctx.font = "600 40px Archivo";
    ctx.fillText("3.85V  5000mAh  19.25Wh", 0, 30);
    ctx.font = "500 26px Archivo";
    ctx.fillText("No perforar. No exponer al fuego.", 0, 90);
    ctx.restore();
  });

  /* ---------------------------------------------------------
     5. MATERIALES (cómo se ve cada superficie con la luz)
     --------------------------------------------------------- */
  const M = {
    tapa: new THREE.MeshPhysicalMaterial({ color: 0x2b3638, metalness: 0.5, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    marco: new THREE.MeshStandardMaterial({ color: 0x9aa6a8, metalness: 1, roughness: 0.22 }),
    oscuro: new THREE.MeshStandardMaterial({ color: 0x121718, metalness: 0.2, roughness: 0.5 }),
    placa: new THREE.MeshStandardMaterial({ color: 0x1f4a3e, roughness: 0.55 }),
    caraPlaca: new THREE.MeshStandardMaterial({ map: texPlaca, roughness: 0.5 }),
    chip: new THREE.MeshStandardMaterial({ color: 0x0d1313, metalness: 0.3, roughness: 0.35 }),
    blindaje: new THREE.MeshStandardMaterial({ color: 0xc3ccce, metalness: 1, roughness: 0.28 }),
    tornillo: new THREE.MeshStandardMaterial({ color: 0xdfe5e6, metalness: 1, roughness: 0.18 }),
    etiqueta: new THREE.MeshStandardMaterial({ map: texEtiqueta, roughness: 0.6 }),
    pantalla: new THREE.MeshBasicMaterial({ map: texPantalla }),             // "Basic" = brilla sola, no le afecta la luz
    listo: new THREE.MeshBasicMaterial({ map: texListo, transparent: true, opacity: 0 }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false }),
    grieta: new THREE.MeshBasicMaterial({ map: texGrieta, transparent: true, depthWrite: false }),
    lente: new THREE.MeshPhysicalMaterial({ color: 0x0a0e12, metalness: 0.3, roughness: 0.05, clearcoat: 1 }),
    ambar: new THREE.MeshPhysicalMaterial({ color: 0xf2b33d, roughness: 0.42, clearcoat: 0.3 }),
    goma: new THREE.MeshStandardMaterial({ color: 0xc9d2d3, roughness: 0.4 }),
    bandeja: new THREE.MeshStandardMaterial({ color: 0x173a3c, roughness: 0.7 }),
  };

  /* ---------------------------------------------------------
     6. EL CELULAR (5 capas, de abajo hacia arriba)
     Medidas en "unidades": el celular mide 7.4 de ancho y 15.4 de largo.
     La parte de arriba del celular está hacia -z.
     --------------------------------------------------------- */
  const ANCHO = 7.4, LARGO = 15.4, RADIO = 1.15;

  const inclinacion = new THREE.Group(); // se inclina con el mouse
  const mesa = new THREE.Group();        // todo lo que está sobre el tapete
  mesa.rotation.y = 0.55;                // celular en diagonal
  inclinacion.add(mesa);
  escena.add(inclinacion);

  // --- Capa 0: tapa trasera + marco de metal ---
  const tapa = new THREE.Group();
  tapa.add(losa(rectRedondo(ANCHO, LARGO, RADIO), 0.3, M.tapa));
  const formaMarco = rectRedondo(ANCHO, LARGO, RADIO);
  formaMarco.holes.push(rectRedondo(ANCHO - 0.7, LARGO - 0.7, RADIO - 0.35));
  const marco = losa(formaMarco, 0.55, M.marco, 0.05);
  marco.position.y = 0.3;
  tapa.add(marco);
  // Isla de cámaras
  const isla = losa(rectRedondo(2.7, 2.7, 0.75), 0.14, M.oscuro);
  isla.position.set(-1.75, 0.3, -5.6);
  tapa.add(isla);
  for (const [x, z] of [[-2.35, -6.2], [-1.15, -6.2], [-2.35, -5.0]]) {
    const anillo = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 32), M.marco);
    anillo.position.set(x, 0.5, z);
    const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 32), M.lente);
    lente.position.set(x, 0.52, z);
    tapa.add(anillo, lente);
  }

  // --- Capa 1: batería ---
  const bateria = new THREE.Group();
  const cuerpoBat = losa(rectRedondo(5.6, 8.0, 0.45), 0.32, M.oscuro);
  const etiqueta = cara(3.6, 5.3, 0.12, M.etiqueta);
  etiqueta.position.y = 0.325;
  bateria.add(cuerpoBat, etiqueta);
  bateria.children.forEach((m) => (m.position.z = 2.6));

  // --- Capa 2: placa con chips ---
  const placa = new THREE.Group();
  const cuerpoPlaca = losa(rectRedondo(6.4, 5.4, 0.5), 0.16, M.placa);
  const caraPlaca = cara(6.2, 5.2, 0.45, M.caraPlaca);
  caraPlaca.position.y = 0.165;
  placa.add(cuerpoPlaca, caraPlaca);
  const piezasPlaca = [
    [1.9, 0.16, 1.9, 0.9, -0.2, M.blindaje], // escudo metálico del procesador
    [1.0, 0.12, 0.7, -1.7, -1.2, M.chip],
    [0.6, 0.12, 1.4, -1.9, 0.8, M.chip],
    [1.3, 0.1, 0.5, 1.2, 1.7, M.chip],
    [0.5, 0.1, 0.5, 2.4, -1.6, M.chip],
  ];
  for (const [w, h, d, x, z, mat] of piezasPlaca) {
    const caja = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    caja.position.set(x, 0.16 + h / 2, z);
    caja.castShadow = true;
    placa.add(caja);
  }
  placa.children.forEach((m) => (m.position.z += -4.3));

  // --- Capa 3: pantalla encendida ---
  const pantalla = new THREE.Group();
  pantalla.add(losa(rectRedondo(ANCHO - 0.1, LARGO - 0.1, RADIO - 0.05), 0.12, M.oscuro));
  const imagen = cara(ANCHO - 0.55, LARGO - 0.55, RADIO - 0.3, M.pantalla);
  imagen.position.y = 0.125;
  const imagenListo = cara(ANCHO - 0.55, LARGO - 0.55, RADIO - 0.3, M.listo);
  imagenListo.position.y = 0.128;
  pantalla.add(imagen, imagenListo);

  // --- Capa 4: vidrio quebrado ---
  const vidrio = new THREE.Group();
  vidrio.add(losa(rectRedondo(ANCHO, LARGO, RADIO), 0.08, M.vidrio, 0.03));
  const grieta = cara(ANCHO - 0.2, LARGO - 0.2, RADIO - 0.1, M.grieta);
  grieta.position.y = 0.085;
  vidrio.add(grieta);

  const capas = [tapa, bateria, placa, pantalla, vidrio];
  const alturaArmado = [0, 0.3, 0.3, 0.85, 0.97];
  capas.forEach((c, i) => {
    c.position.y = alturaArmado[i];
    mesa.add(c);
  });

  // Aros ámbar (uno por capa) para marcar la pieza activa
  const huellas = [ // [ancho, largo, radio, z, altura de la cara de arriba]
    [ANCHO, LARGO, RADIO, 0, 0.88],
    [5.6, 8.0, 0.45, 2.6, 0.36],
    [6.4, 5.4, 0.5, -4.3, 0.36],
    [ANCHO, LARGO, RADIO, 0, 0.16],
    [ANCHO, LARGO, RADIO, 0, 0.12],
  ];
  const aros = huellas.map(([w, l, r, z, y], i) => {
    const a = aro(w + 0.25, l + 0.25, r + 0.12, 0.22);
    a.position.set(0, y, z);
    capas[i].add(a);
    return a;
  });

  // --- Tornillos (sujetan la placa) ---
  function hacerTornillo() {
    const t = new THREE.Group();
    const cabeza = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 28), M.tornillo);
    cabeza.castShadow = true;
    const rayaA = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.06), M.oscuro);
    rayaA.position.y = 0.065;
    const rayaB = rayaA.clone();
    rayaB.rotation.y = Math.PI / 2;
    t.add(cabeza, rayaA, rayaB);
    return t;
  }
  const ALTURA_TORNILLO = 0.3 + 0.22; // sobre la placa armada
  const lugaresTornillos = [[-2.75, -6.55], [2.75, -6.55], [-2.75, -2.05], [2.75, -2.05]];
  const tornillos = lugaresTornillos.map(([x, z]) => {
    const t = hacerTornillo();
    t.position.set(x, ALTURA_TORNILLO, z);
    mesa.add(t);
    return t;
  });

  /* ---------------------------------------------------------
     7. HERRAMIENTAS SOBRE LA MESA
     --------------------------------------------------------- */
  const espatula = losa(rectRedondo(0.95, 9.5, 0.47), 0.2, M.ambar);
  espatula.position.set(-7.4, 0, 1.2);
  espatula.rotation.y = 0.22;

  const pinzaA = losa(rectRedondo(0.36, 10.5, 0.18), 0.14, M.marco);
  pinzaA.position.set(7.2, 0, -2.2);
  pinzaA.rotation.y = -0.1;
  const pinzaB = pinzaA.clone();
  pinzaB.position.set(7.75, 0, -2.2);
  pinzaB.rotation.y = 0.0;

  const ventosa = new THREE.Group();
  const copa = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.7, 0.35, 48), M.goma);
  copa.position.y = 0.175;
  const mango = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.9, 32), M.ambar);
  mango.position.y = 0.75;
  copa.castShadow = mango.castShadow = true;
  ventosa.add(copa, mango);
  ventosa.position.set(6.9, 0, 6.2);

  // Bandeja magnética donde caen los tornillos
  const bandeja = losa(rectRedondo(3.4, 3.4, 0.8), 0.14, M.bandeja);
  bandeja.position.set(-6.8, 0, -6.6);
  const lugaresBandeja = [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]].map(
    ([dx, dz]) => new THREE.Vector3(-6.8 + dx, 0.2, -6.6 + dz)
  );

  mesa.add(espatula, pinzaA, pinzaB, ventosa, bandeja);

  /* ---------------------------------------------------------
     8. TAMAÑO Y ENCUADRE (se recalcula si cambia la ventana)
     --------------------------------------------------------- */
  // sube: cuánto sube la mirada al desarmar
  // baja: 0 = cámara alta (armado), 1 = cámara baja y de lado (desarmado)
  const camaraRig = { sube: 0, baja: 0 };
  const VISTA = new THREE.Vector3(0, 21, 19);      // cámara alta: ~48° desde la mesa
  const VISTA_BAJA = new THREE.Vector3(0, 13, 26); // cámara baja: ~27° (se ven las capas de lado)
  const vistaActual = new THREE.Vector3();
  const FOV = 30;
  let anchoV = 1, altoV = 1;
  let firmaAnterior = ""; // ver la parte 11 (DIBUJAR)

  function medir() {
    anchoV = hero.clientWidth;
    altoV = hero.clientHeight;
    renderer.setSize(anchoV, altoV, false);
    firmaAnterior = ""; // setSize borra el dibujo: obligamos a dibujar de nuevo
    camara.aspect = anchoV / altoV;
    encuadrar();
  }

  // Calcula el zoom y hacia dónde "correr" la imagen.
  // En celular depende de camaraRig.baja: armado va abajo y chico
  // (debajo de los botones); desarmado sube y crece (las fichas ocupan menos).
  function encuadrar() {
    const celular = anchoV < 760;
    const t = camaraRig.baja;
    const tamano = celular
      ? Math.min(anchoV * 1.1, altoV * (0.44 + 0.18 * t))
      : Math.min(anchoV * 0.52, altoV * 1.0);
    const cx = celular ? anchoV / 2 : anchoV / 2 + Math.min(anchoV, 1160) * 0.26;
    const cy = celular ? altoV * (0.81 - 0.1 * t) : altoV * 0.53;

    // Cuántas unidades se ven de alto con zoom 1, para calcular el zoom
    const visibles = 2 * VISTA.length() * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camara.zoom = tamano / (29 * (altoV / visibles)); // 29 = unidades que debe ocupar la mesa
    // setViewOffset "corre" la imagen para que el celular quede donde queremos
    camara.setViewOffset(anchoV, altoV, anchoV / 2 - cx, altoV / 2 - cy, anchoV, altoV);
    camara.updateProjectionMatrix();
  }
  medir();
  new ResizeObserver(medir).observe(hero);

  /* ---------------------------------------------------------
     9. ANIMACIONES CON EL SCROLL
     Se agregan a la línea de tiempo de script.js, en sus etiquetas.
     --------------------------------------------------------- */
  const tl = window.chuncheTL;
  const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (tl && window.gsap) {
    const E = tl.labels;
    const SEPARACION = 2.4;
    const alturaDesarmado = (i) => alturaArmado[i] + i * SEPARACION;
    const ordenDesarme = [4, 3, 2, 1, 0]; // vidrio, pantalla, placa, batería, tapa

    // Desarmar: cada capa sube a su altura, la mesa gira un poco y la cámara sube
    capas.forEach((c, i) => tl.to(c.position, { y: alturaDesarmado(i), duration: 1, ease: "power2.inOut" }, 0.1 + i * 0.04));
    tl.to(tornillos.map((t) => t.position), { y: alturaDesarmado(2) + 0.22, duration: 1, ease: "power2.inOut" }, 0.18)
      .to(mesa.rotation, { y: 0.32, duration: 1, ease: "power2.inOut" }, 0.1)
      .to(camaraRig, { sube: SEPARACION * 2.1, baja: 1, duration: 1, ease: "power2.inOut" }, 0.1);

    ordenDesarme.forEach((i, n) => {
      const inicio = E["pieza" + n];
      let espera = 0;

      // Antes de levantar la placa: ¡destornillar!
      if (i === 2) {
        espera = 0.25;
        const arriba = alturaDesarmado(2) + 0.22;
        // Giran 3 vueltas mientras suben (como si los sacara el destornillador)
        tl.to(tornillos.map((t) => t.rotation), { y: -Math.PI * 6, duration: 0.25, ease: "power1.in" }, inicio)
          .to(tornillos.map((t) => t.position), { y: arriba + 0.8, duration: 0.25, ease: "power1.in" }, inicio);
        // Vuelan a la bandeja, uno tras otro, haciendo un arco
        tornillos.forEach((t, k) => {
          const destino = lugaresBandeja[k];
          const salida = inicio + 0.25 + k * 0.03;
          tl.to(t.position, { x: destino.x, z: destino.z, duration: 0.3, ease: "power2.inOut" }, salida)
            .to(t.position, { y: arriba + 2.4, duration: 0.13, ease: "power2.out" }, salida)
            .to(t.position, { y: destino.y, duration: 0.17, ease: "power2.in" }, salida + 0.13);
        });
      }

      // La pieza sube un poco y se enciende su aro ámbar.
      // La placa además sale hacia adelante "como cajón", porque la pantalla la tapa.
      const cajon = i === 2 ? 11 : 0;
      tl.to(capas[i].position, { y: alturaDesarmado(i) + 1.3, z: cajon, duration: 0.35, ease: "power2.out" }, inicio + espera)
        .to(aros[i].material, { opacity: 1, duration: 0.25 }, inicio + espera)
        // ...y después vuelve a su lugar
        .to(capas[i].position, { y: alturaDesarmado(i), z: 0, duration: 0.25, ease: "power2.inOut" }, inicio + 0.85)
        .to(aros[i].material, { opacity: 0, duration: 0.2 }, inicio + 0.85);
    });

    // Armar de nuevo
    const armar = E.armar;
    capas.forEach((c, i) => tl.to(c.position, { y: alturaArmado[i], duration: 0.8, ease: "power2.inOut" }, armar + (4 - i) * 0.04));
    tl.to(mesa.rotation, { y: 0.55, duration: 0.8, ease: "power2.inOut" }, armar)
      .to(camaraRig, { sube: 0, baja: 0, duration: 0.8, ease: "power2.inOut" }, armar);
    // Los tornillos regresan y se atornillan
    tornillos.forEach((t, k) => {
      const [x, z] = lugaresTornillos[k];
      tl.to(t.position, { x, z, duration: 0.4, ease: "power2.inOut" }, armar)
        .to(t.position, { y: 3, duration: 0.2, ease: "power2.out" }, armar)
        .to(t.position, { y: ALTURA_TORNILLO, duration: 0.3, ease: "power2.in" }, armar + 0.2)
        .to(t.rotation, { y: 0, duration: 0.3, ease: "power1.out" }, armar + 0.5);
    });
    // ¡Reparado! La grieta desaparece y la pantalla lo confirma
    tl.to(M.grieta, { opacity: 0, duration: 0.4 }, armar + 0.4)
      .to(M.listo, { opacity: 1, duration: 0.3 }, armar + 0.55);
  }

  /* ---------------------------------------------------------
     10. INCLINACIÓN CON EL MOUSE
     --------------------------------------------------------- */
  const mouse = { x: 0, y: 0 };
  if (!reducir) {
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return; // en celular no (el dedo está haciendo scroll)
      mouse.x = e.clientX / anchoV - 0.5;
      mouse.y = e.clientY / altoV - 0.5;
    });
    hero.addEventListener("pointerleave", () => (mouse.x = mouse.y = 0));
  }

  /* ---------------------------------------------------------
     11. DIBUJAR (solo mientras el hero se ve, para ahorrar batería)
     Además, solo dibujamos si algo CAMBIÓ. Si la persona no baja
     ni mueve el mouse, la imagen es la misma: no hace falta
     volver a dibujarla 60 o 144 veces por segundo.
     --------------------------------------------------------- */
  const objetivo = new THREE.Vector3();

  function dibujar() {
    // "lerp": acercarse poco a poco al valor deseado = movimiento suave
    inclinacion.rotation.y += (mouse.x * 0.28 - inclinacion.rotation.y) * 0.06;
    inclinacion.rotation.x += (mouse.y * 0.14 - inclinacion.rotation.x) * 0.06;

    // "Firma" = los números que deciden cómo se ve la escena.
    // Si es igual a la del cuadro anterior, no dibujamos nada.
    const firma = [
      tl ? tl.time().toFixed(4) : 0,           // avance del scroll
      mesa.position.y.toFixed(3),              // animación de entrada
      inclinacion.rotation.x.toFixed(4),       // mouse
      inclinacion.rotation.y.toFixed(4),
      anchoV, altoV,                           // tamaño de la ventana
    ].join("|");
    if (firma === firmaAnterior) return;
    firmaAnterior = firma;

    objetivo.set(0, 0.5 + camaraRig.sube, 0);
    vistaActual.lerpVectors(VISTA, VISTA_BAJA, camaraRig.baja); // mezcla entre las dos vistas
    if (anchoV < 760) encuadrar(); // en celular el encuadre cambia con el scroll
    camara.position.copy(objetivo).add(vistaActual);
    camara.lookAt(objetivo);
    renderer.render(escena, camara);
  }

  new IntersectionObserver(([entrada]) => {
    renderer.setAnimationLoop(entrada.isIntersecting ? dibujar : null);
  }).observe(hero);

  // ¡Listo! Mostramos el 3D y escondemos el celular de CSS
  hero.prepend(renderer.domElement);
  document.documentElement.classList.add("con-3d");
  dibujar();

  if (window.gsap && !reducir) {
    gsap.from(renderer.domElement, { opacity: 0, duration: 0.8, ease: "power1.out" });
    gsap.from(mesa.position, { y: 7, duration: 1.4, ease: "expo.out" });
  }
}
