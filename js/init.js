/* Orquestación principal de Bella Durmiente */
(() => {
  "use strict";

  const ns = window.DemoInvitacion = window.DemoInvitacion || {};

  async function boot() {
    try {
      const data = await ns.datos.loadConfig();
      ns.state.config = data;

      // Tema y metas
      ns.tema?.apply?.(data);

      // Secciones
      ns.secciones?.renderAll?.(data);

      // Reloj
      ns.secciones?.reloj?.render?.(data.fecha || {});

      // Secciones ocultas/visibles por config
      applySectionVisibility(data.secciones || {});

      // Calendario en hero
      renderCalendar(data.fecha || {});

      // Foto destacada
      renderFotoDestacada(data);

      // Memory strip 2 (entre vestimenta y rsvp)
      renderMemoryVestimenta(data);

      // Crédito
      renderContacto(data.contacto || {});

      // Sobre / entrada
      ns.overlay?.setup?.(data);

      // Música
      ns.musica?.setup?.(data);

      // Auto-scroll
      ns.autoScroll?.setup?.(data);

      // Reveal (intersection observer)
      ns.reveal?.setup?.();

      // Ornamentos (después de secciones)
      ns.tema?.afterSections?.(data);

    } catch (err) {
      console.error("Error al cargar Bella Durmiente:", err);
    }
  }

  function applySectionVisibility(secciones) {
    const map = {
      "heroFoto": "#recuerdo",
      "fotoDestacada": "#recuerdo",
      "familia": "#familia",
      "ubicaciones": "#ubicaciones",
      "itinerario": "#itinerario",
      "regalos": "#detalles",
      "vestimenta": "#vestimenta",
      "recuerdoVestimenta": "#recuerdo-vestimenta",
      "notas": "#notas",
      "galeria": "#galeria",
      "qrFotos": "#qr-fotos",
      "qrPases": "#qr-pases",
      "pases": "#pases",
      "confirmacion": "#confirmacion",
      "final": "#cierre"
    };
    Object.entries(map).forEach(([key, selector]) => {
      const el = document.querySelector(selector);
      if (!el) return;
      if (secciones[key] === false) el.hidden = true;
      else el.hidden = false;
    });
  }

  function renderCalendar(fechaData) {
    // Render simple del calendario
    const monthEl = document.getElementById("hero-calendar-month");
    const daysEl = document.getElementById("hero-calendar-days");
    const weekdayEl = document.getElementById("date-weekday");
    const mainEl = document.getElementById("date-main");
    const timeEl = document.getElementById("time-main");

    const ts = fechaData.timestamp || fechaData.fecha || "";
    if (!ts) return;

    const date = new Date(ts.includes("T") ? ts : `${ts}T12:00:00`);
    if (isNaN(date)) return;

    const locale = "es-MX";
    if (monthEl) monthEl.textContent = date.toLocaleDateString(locale, { month: "long", year: "numeric" });
    if (weekdayEl) weekdayEl.textContent = date.toLocaleDateString(locale, { weekday: "long" });
    if (mainEl) mainEl.textContent = date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    if (timeEl) timeEl.textContent = fechaData.hora || "";

    if (daysEl) {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const targetDay = date.getDate();
      let html = "";
      for (let i = 0; i < firstDay; i++) html += `<span></span>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const active = d === targetDay ? ' class="is-active"' : "";
        html += `<span${active}>${d}</span>`;
      }
      daysEl.innerHTML = html;
    }
  }

  function renderFotoDestacada(data) {
    const img = document.getElementById("foto-destacada");
    const text = document.getElementById("memory-text");
    if (img) {
      const src = data.memory?.src || data.imagenes?.destacada || data.hero?.foto || "";
      if (src) img.src = src;
      img.alt = data.memory?.alt || data.imagenes?.destacadaAlt || "";
    }
    if (text) text.textContent = data.memory?.texto || data.imagenes?.destacadaTexto || "";
  }

  function renderMemoryVestimenta(data) {
    const sec = document.getElementById("recuerdo-vestimenta");
    if (!sec) return;
    if (!data.secciones?.recuerdoVestimenta) { sec.hidden = true; return; }
    const img = document.getElementById("foto-recuerdo-vestimenta");
    const text = document.getElementById("recuerdo-vestimenta-text");
    if (img && data.memoria2?.src) img.src = data.memoria2.src;
    if (text) text.textContent = data.memoria2?.texto || "";
    sec.hidden = false;
  }

  function renderContacto(contacto) {
    const link = document.getElementById("pistache-credit-link");
    const textEl = document.getElementById("pistache-credit-text");
    const brandEl = document.getElementById("pistache-credit-brand");
    if (!link) return;
    if (!contacto.activo) { link.hidden = true; return; }
    if (contacto.url) link.href = contacto.url;
    if (textEl) textEl.textContent = contacto.texto || "";
    if (brandEl) brandEl.textContent = contacto.marca || "";
    link.hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
