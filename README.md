# Chunche — reparación de celulares (página de muestra)

Página de muestra hecha por **Yunkara**. "Chunche" es un negocio inventado.

- Un celular en 3D se desarma pieza por pieza al bajar (Three.js + GSAP ScrollTrigger).
- Cotizador que arma el mensaje y lo manda por WhatsApp (no guarda datos).
- Sin cookies y sin servicios de terceros al cargar. El mapa de Google carga solo si se pide.
- Páginas de garantía, privacidad y 404.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página principal |
| `garantia.html`, `privacidad.html`, `404.html` | Páginas legales y de error |
| `estilos.css` | Todo el diseño |
| `datos-negocio.js` | **Número de WhatsApp y lista "cambiar antes de publicar"** |
| `script.js` | Animación con el scroll, cotizador, mapa |
| `escena3d.js` | El celular en 3D |
| `librerias/`, `fuentes/` | Copias locales de Three.js, GSAP y la letra |
| `_headers` | Reglas de seguridad para Netlify |

## Verla en tu compu

Por el 3D (`type="module"`) no funciona con doble clic. En esta carpeta:

```
python -m http.server 8000
```

y abrir http://localhost:8000

Derechos: ver [DERECHOS.md](DERECHOS.md).
