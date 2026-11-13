# Librerías (copias guardadas en el proyecto)

Descargadas el 2026-11-13. Antes se cargaban desde internet (CDN).
Tenerlas aquí: la página no avisa a terceros de cada visita y no se cae si el CDN falla.

| Archivo | Qué es | Versión | De dónde | Licencia |
|---|---|---|---|---|
| `gsap.min.js` | Animaciones | 3.12.5 | cdnjs | GSAP Standard License (gratis) |
| `ScrollTrigger.min.js` | Animar con el scroll (plugin de GSAP) | 3.12.5 | cdnjs | GSAP Standard License |
| `three.module.min.js` | 3D en la web | 0.160.0 | jsdelivr (npm `three`) | MIT |
| `RoomEnvironment.js` | Reflejos del 3D (parte de Three.js) | 0.160.0 | jsdelivr (npm `three`) | MIT |

**Cambio hecho a mano:** en `RoomEnvironment.js` el `import ... from 'three'` se cambió a
`'./three.module.min.js'` (marcado con el comentario `CHUNCHE`), para no necesitar un "importmap".
