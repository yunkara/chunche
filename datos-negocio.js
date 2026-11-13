/* =========================================================
   CHUNCHE — datos-negocio.js
   Los datos del negocio, en UN SOLO LUGAR. Lo cargan todas las
   páginas (inicio, garantía, privacidad y 404).

   ✏️ CAMBIAR ANTES DE PUBLICAR (si es para un cliente real):
   1. NUMERO_WHATSAPP (abajo): 503 + el número, sin guiones ni espacios.
      → se cambia solo en todos los botones de WhatsApp de todas las páginas.
   2. index.html → sección "UBICACIÓN": la dirección y el horario.
   3. index.html → el mapa: la dirección en data-src del botón "Ver el mapa aquí"
      y en el enlace "Abrir en Google Maps".
   4. index.html → "Lo que dicen los clientes": opiniones REALES
      (con permiso del cliente). Las de ahora son inventadas.
   5. index.html → la "ficha para Google" (<script type="application/ld+json">):
      mismo teléfono, dirección y horario que la página.
   6. index.html → vista previa: en og:image la dirección completa del sitio ya
      publicado (ej. https://chunche.netlify.app/vista-previa.jpg) y agregar og:url
      (el comentario en index.html dice cómo).
   7. script.js → REPARACIONES: precios de mano de obra y tiempos.
   8. garantia.html → que el dueño lea y acepte las condiciones (son SUS reglas).
   9. privacidad.html → nombre del responsable y fecha. Si se agregan estadísticas
      de visitas u otro servicio, anotarlo ahí también.
   ========================================================= */

const NUMERO_WHATSAPP = "50370000000"; // ← cambiar por el número real del cliente

// Pone el número en TODOS los botones de WhatsApp de la página.
// Así no hay que buscarlo en el HTML.
document.querySelectorAll('a[href^="https://wa.me/"]').forEach((enlace) => {
  enlace.href = enlace.href.replace(/wa\.me\/\d+/, "wa.me/" + NUMERO_WHATSAPP);
});

// Donde diga data-telefono, escribe el número bonito: "50370000000" → "7000-0000"
document.querySelectorAll("[data-telefono]").forEach((el) => {
  const local = NUMERO_WHATSAPP.replace(/^503/, ""); // quita el 503
  el.textContent = local.slice(0, 4) + "-" + local.slice(4);
});
