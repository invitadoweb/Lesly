/*
 * Motor propio de Bella Durmiente.
 * No depende de otro demo: carga datos, abre el sobre, controla música,
 * dibuja secciones, ornamentos y cuenta regresiva.
 */
(() => {
  "use strict";

  const ns = window.DemoInvitacion = window.DemoInvitacion || {};
  ns.state = ns.state || {};
  ns.secciones = ns.secciones || {};

  const byId = (id) => document.getElementById(id);
  const hasText = (value) => typeof value === "string" && value.trim().length > 0;
  const setText = (id, value = "") => {
    const node = byId(id);
    if (node) node.textContent = value || "";
  };
  const setOptionalText = (id, value, fallback = "") => {
    const node = byId(id);
    if (!node) return;
    const text = value ?? fallback;
    node.textContent = text || "";
    node.hidden = !text;
  };
  const setAttr = (id, attribute, value = "") => {
    const node = byId(id);
    if (!node) return;
    if (value === undefined || value === null || value === "") node.removeAttribute(attribute);
    else node.setAttribute(attribute, value);
  };
  const safeUrl = (value = "#") => /^javascript:/i.test(String(value || "").trim()) ? "#" : String(value || "#").trim();
  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const whatsappUrl = (phone, message) => {
    const number = String(phone || "").replace(/\D/g, "");
    if (!number) return "";
    return `https://wa.me/${number.startsWith("52") ? number : `52${number}`}?text=${encodeURIComponent(message || "")}`;
  };

  ns.helpers = {
    byId,
    setText,
    setOptionalText,
    setAttr,
    safeUrl,
    escapeHtml,
    whatsappUrl,
    hide: (id) => {
      const node = byId(id);
      if (node && !ns.state.preview) node.hidden = true;
    },
    setMeta: (id, attribute, value) => setAttr(id, attribute, value)
  };

  ns.datos = {
    async loadConfig() {
      const el = document.getElementById("invitacion-config");
      if (el && el.textContent.trim()) {
        try { return JSON.parse(el.textContent); } catch(e) { console.error("JSON invalido en #invitacion-config", e); }
      }
      const source = document.body?.dataset?.demoJson || "./data/objeto-xv.json?=cache01";
      const response = await fetch(source.includes("?") ? source : `${source}?=cache01`, { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo cargar la configuracion de Bella Durmiente.");
      return response.json();
    }
  };

  function renderDecorations(items = []) {
    const layer = document.querySelector(".decor-layer");
    if (!layer) return;
    layer.replaceChildren();
    items.filter((item) => item?.activo !== false && item?.src).forEach((item) => {
      const image = document.createElement("img");
      image.className = item.clase || "";
      image.src = item.src;
      image.alt = "";
      image.decoding = "async";
      image.setAttribute("aria-hidden", "true");
      layer.append(image);
    });
  }

  function renderPetalBreeze() {
    document.querySelectorAll(".bella-petal-breeze").forEach((node) => node.remove());
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.createElement("div");
    layer.className = "bella-petal-breeze";
    layer.setAttribute("aria-hidden", "true");
    const compact = window.matchMedia?.("(max-width: 520px)").matches;
    const petals = ["1", "4", "7"];
    const positions = compact ? [12, 47, 82] : [7, 27, 50, 73, 92];
    positions.forEach((position, index) => {
      const petal = document.createElement("img");
      petal.src = `https://pistachegirasol.com/Assets/bella-durmiente/petalos/${petals[index % petals.length]}.webp?=cache02`;
      petal.alt = "";
      petal.decoding = "async";
      petal.style.setProperty("--petal-left", `${position}%`);
      petal.style.setProperty("--petal-size", `${28 + (index % 4) * 7}px`);
      petal.style.setProperty("--petal-duration", `${15 + (index % 5) * 2.2}s`);
      petal.style.setProperty("--petal-delay", `${-(index * 2.15)}s`);
      const drift = index % 2 ? 72 : -68;
      const turn = index % 2 ? 132 : -148;
      petal.style.setProperty("--petal-drift", `${drift}px`);
      petal.style.setProperty("--petal-drift-soft", `${drift * .34}px`);
      petal.style.setProperty("--petal-drift-mid", `${drift * -.18}px`);
      petal.style.setProperty("--petal-turn", `${turn}deg`);
      petal.style.setProperty("--petal-turn-soft", `${turn * .35}deg`);
      petal.style.setProperty("--petal-turn-mid", `${turn * .7}deg`);
      layer.append(petal);
    });
    document.body.prepend(layer);
  }

  function renderFairyFlight(config = {}) {
    document.querySelectorAll(".bella-fairy-flight").forEach((node) => node.remove());
    if (config?.activo === false || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const fairies = (Array.isArray(config?.personajes) ? config.personajes : [])
      .filter((fairy) => fairy?.activo !== false && fairy?.src);
    if (!fairies.length) return;
    const layer = document.createElement("div");
    layer.className = "bella-fairy-flight";
    layer.setAttribute("aria-hidden", "true");
    fairies.forEach((fairy, index) => {
      const image = document.createElement("img");
      image.src = fairy.src;
      image.alt = "";
      image.decoding = "async";
      image.fetchPriority = "low";
      image.style.setProperty("--fairy-delay", `${index * -14}s`);
      image.style.setProperty("--fairy-size", fairy.tamano || "clamp(66px, 17vw, 112px)");
      const mirrorFlight = fairy.invertirVuelo === true;
      image.style.setProperty("--fairy-facing-out", mirrorFlight ? "1" : "-1");
      image.style.setProperty("--fairy-facing-back", mirrorFlight ? "-1" : "1");
      layer.append(image);
    });
    document.body.prepend(layer);
  }

  let scrollPerformanceBound = false;
  function setupScrollPerformance() {
    if (scrollPerformanceBound) return;
    scrollPerformanceBound = true;
    let settleTimer = 0;
    const pauseDecorations = () => {
      document.documentElement.classList.add("is-scrolling");
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        document.documentElement.classList.remove("is-scrolling");
      }, 150);
    };
    window.addEventListener("scroll", pauseDecorations, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) document.documentElement.classList.remove("is-scrolling");
    });
  }

  function targetIsHidden(target) {
    return !target || target.hidden || target.getAttribute("aria-hidden") === "true" || target.classList.contains("esconder") || window.getComputedStyle(target).display === "none";
  }

  function renderOrnaments(items = []) {
    document.querySelectorAll(".wonder-ornament, .rama-espiral").forEach((node) => node.remove());
    items.filter((item) => item?.activo !== false).forEach((item) => {
      const target = document.querySelector(item.after || "");
      const nextTarget = item.before ? document.querySelector(item.before) : null;
      if (targetIsHidden(target) || (item.before && targetIsHidden(nextTarget))) return;
      const ornament = document.createElement("div");
      ornament.className = `wonder-ornament ${item.clase || ""}`.trim();
      ornament.setAttribute("aria-hidden", "true");
      const [left, right] = Array.isArray(item.imagenes) ? item.imagenes : [];
      ornament.append(createOrnamentImage(left), document.createElement("span"), createOrnamentImage(right));
      target.insertAdjacentElement("afterend", ornament);
    });
  }

  function createOrnamentImage(source) {
    if (!source) return document.createElement("span");
    const image = document.createElement("img");
    image.src = source;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    return image;
  }

  ns.tema = {
    apply(data = {}) {
      const theme = data.theme || {};
      String(theme.bodyClass || "").split(/\s+/).filter(Boolean).forEach((className) => document.body.classList.add(className));
      const title = data.meta?.titulo || data.hero?.nombre || "Invitación XV";
      document.title = title;
      setAttr("meta-description", "content", data.meta?.descripcion || data.hero?.frase || title);
      setAttr("og-title", "content", title);
      setAttr("og-description", "content", data.meta?.descripcion || data.hero?.frase || "");
      setAttr("og-image", "content", data.meta?.imagen || data.hero?.foto || "");
      setAttr("twitter-image", "content", data.meta?.imagen || data.hero?.foto || "");
      renderDecorations(theme.decoraciones || []);
    },
    afterSections(data = {}) {
      renderOrnaments(data.ornamentos || []);
    }
  };

  let entryBound = false;
  ns.overlay = {
    setup(data = {}) {
      if (entryBound) return;
      entryBound = true;
      const screen = byId("entrada");
      const trigger = document.querySelector("[data-open]");
      const video = byId("entrada-video");
      const entry = data.entrada || {};
      setupScrollPerformance();
      setText("entrada-boton", entry.boton || entry.hint || "Abrir invitación");

      let opened = false;
      const openInvitation = () => {
        if (opened) return;
        opened = true;
        document.body.classList.add("is-open");
        ns.musica?.primeArtwork?.();
        renderPetalBreeze();
        renderFairyFlight(ns.state.config?.hadasVoladoras);
        window.dispatchEvent(new Event("entradaInteraccion"));
        window.dispatchEvent(new Event("invitacionAbierta"));
        ns.musica?.play?.();
      };
      const start = () => {
        if (opened) return;
        // Unlock audio context on direct user gesture (fixes autoplay policy)
        ns.musica?.unlockOnGesture?.();
        if (!video) return openInvitation();
        screen?.classList.add("is-video-playing");
        video.currentTime = 0;
        const done = () => openInvitation();
        video.addEventListener("ended", done, { once: true });
        video.addEventListener("error", done, { once: true });
        const play = video.play();
        if (play?.catch) play.catch(done);
      };

      trigger?.addEventListener("click", start);
      screen?.addEventListener("click", (event) => {
        if (!event.target.closest("[data-music], .music-button")) start();
      });
      setEntryViewportHeight();
      window.addEventListener("resize", setEntryViewportHeight, { passive: true });
      window.visualViewport?.addEventListener("resize", setEntryViewportHeight, { passive: true });
    }
  };

  function setEntryViewportHeight() {
    const height = Math.ceil(window.visualViewport?.height || window.innerHeight || 0);
    if (height) document.documentElement.style.setProperty("--entry-viewport-height", `${height}px`);
  }

  const musicState = { audio: null, toggle: null, userPaused: false, bound: false, artworkReady: false };
  function primeMusicArtwork() {
    if (musicState.artworkReady) return;
    const toggle = musicState.toggle || byId("music-toggle");
    toggle?.querySelectorAll("img[data-src]").forEach((image) => {
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
      image.decoding = "async";
    });
    musicState.artworkReady = true;
  }
  function updateMusicState() {
    const { audio, toggle } = musicState;
    if (!audio || !toggle) return;
    const active = !audio.paused;
    toggle.classList.toggle("is-playing", active);
    toggle.classList.toggle("is-muted", !active);
    toggle.setAttribute("aria-label", active ? "Pausar música" : "Activar música");
    toggle.setAttribute("aria-pressed", String(active));
  }
  function playMusic({ respectUserPause = true } = {}) {
    const audio = musicState.audio;
    if (!audio || document.hidden || (respectUserPause && musicState.userPaused)) return Promise.resolve(false);
    const play = audio.play();
    if (!play?.then) return Promise.resolve(!audio.paused);
    return play.then(() => {
      updateMusicState();
      return true;
    }).catch(() => {
      updateMusicState();
      return false;
    });
  }
  ns.musica = {
    setup(data = {}) {
      const audio = byId("music") || document.querySelector("audio");
      const toggle = byId("music-toggle") || document.querySelector("[data-music]");
      const source = data.musica?.src || "";
      if (!audio || !toggle || !source || data.musica?.activo === false) {
        if (toggle) toggle.hidden = true;
        return;
      }
      musicState.audio = audio;
      musicState.toggle = toggle;
      audio.src = source;
      audio.loop = true;
      audio.preload = "none";
      toggle.hidden = false;
      if (!musicState.bound) {
        musicState.bound = true;
        toggle.addEventListener("click", () => {
          if (audio.paused) {
            musicState.userPaused = false;
            // Spin wheel immediately (optimistic UI) before audio promise resolves
            toggle.classList.add("is-playing");
            toggle.classList.remove("is-muted");
            playMusic({ respectUserPause: false }).then((ok) => {
              if (!ok) {
                toggle.classList.remove("is-playing");
                toggle.classList.add("is-muted");
              }
            });
          } else {
            musicState.userPaused = true;
            audio.pause();
            toggle.classList.remove("is-playing");
            toggle.classList.add("is-muted");
          }
        });
        audio.addEventListener("play", updateMusicState);
        audio.addEventListener("pause", updateMusicState);
        audio.addEventListener("error", () => {
          toggle.classList.remove("is-playing");
          toggle.classList.add("is-muted");
        });
        window.addEventListener("entradaInteraccion", () => {
          // Start wheel spinning optimistically when invitation opens
          toggle.classList.add("is-playing");
          toggle.classList.remove("is-muted");
          playMusic().then((ok) => {
            if (!ok) {
              toggle.classList.remove("is-playing");
              toggle.classList.add("is-muted");
            }
          });
        });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) audio.pause();
        });
      }
      updateMusicState();
    },
    tryPlay: () => playMusic(),
    primeArtwork: primeMusicArtwork,
    play: () => playMusic({ respectUserPause: false }),
    pause: () => {
      musicState.userPaused = true;
      musicState.audio?.pause();
    },
    update: updateMusicState,
    unlockOnGesture: () => {
      // Called on direct user click to unlock autoplay policy
      const audio = musicState.audio;
      if (!audio || musicState._unlocked) return;
      musicState._unlocked = true;
      // Load the audio so browser considers it user-initiated
      audio.load();
    }
  };

  ns.reveal = {
    setup() {
      const nodes = Array.from(document.querySelectorAll(".portrait-frame, .memory-strip, .gallery-grid img, .event-card, .detalle-card, .timeline-list li, .wonder-ornament, .rama-espiral"));
      nodes.forEach((node, index) => {
        node.classList.add("magic-reveal");
        node.style.setProperty("--reveal-delay", `${Math.min(index * 85, 420)}ms`);
      });
      if (!("IntersectionObserver" in window)) return nodes.forEach((node) => node.classList.add("is-visible"));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: .18, rootMargin: "0px 0px -8% 0px" });
      nodes.forEach((node) => observer.observe(node));

      const motionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle("is-in-view", entry.isIntersecting));
      }, { rootMargin: "120px 0px", threshold: 0 });
      document.querySelectorAll(".wonder-ornament").forEach((node) => motionObserver.observe(node));
    }
  };

  function renderHero(data) {
    setText("hero-eyebrow", data.hero?.eyebrow);
    setText("hero-name", data.hero?.nombre);
    setText("hero-mood", data.hero?.frase);
    setAttr("foto-portada", "src", data.hero?.foto);
    setAttr("foto-portada", "alt", data.hero?.fotoAlt || data.hero?.nombre || "Foto principal");
    setOptionalText("nav-familia", data.navegacion?.familia, "Familia");
    setOptionalText("nav-ubicaciones", data.navegacion?.ubicaciones, "Mapa");
    setOptionalText("nav-confirmacion", data.navegacion?.confirmacion, "RSVP");
  }

  function renderMemory(data) {
    const memory = document.querySelector("#recuerdo.memory-strip");
    memory?.classList.toggle("is-gradient", data.memory?.gradient !== false);
    setAttr("foto-destacada", "src", data.memory?.src);
    setAttr("foto-destacada", "alt", data.memory?.alt || "Foto destacada");
    setText("memory-text", data.memory?.texto);
  }

  function renderFamily(data) {
    const list = byId("familia-lista");
    const groups = (data.familia || []).filter((group) => group?.activo !== false);
    if (!list) return;
    if (!groups.length) {
      list.innerHTML = "";
      return;
    }
    list.innerHTML = groups.map((group) => {
      const text = group.texto || group.frase || group.bendicion;
      const mediaSrc = group.media || group.foto || group.imagen || "";
      const media = mediaSrc ? `<figure class="family-group-media bella-section-icon"><img src="${escapeHtml(mediaSrc)}" alt="${escapeHtml(group.mediaAlt || group.fotoAlt || group.titulo || "")}" loading="lazy"></figure>` : "";
      if (text && !Array.isArray(group.nombres)) return `<div class="name-group name-group--frase">${media}<p class="family-message">${escapeHtml(text)}</p></div>`;
      const names = (group.nombres || []).map(escapeHtml).join('<span class="family-amp">&amp;</span>');
      return `<div class="name-group">${media}<h3>${escapeHtml(group.titulo || "")}</h3><p>${names}</p></div>`;
    }).join("");
  }

  function renderLocations(data) {
    const list = byId("ubicaciones-lista");
    if (!list) return;
    const label = data.labels?.ubicacionBoton || "Ver ubicación";
    list.innerHTML = (data.ubicaciones || []).map((item) => {
      const address = item.direccion || item.direccionTexto || item.address || "";
      const itemFoto = item.foto || item.media || item.imagen || "";
      return `<article class="event-card event-card--ubicacion">${itemFoto ? `<figure class="event-card-media"><img src="${escapeHtml(itemFoto)}" alt="${escapeHtml(item.fotoAlt || item.mediaAlt || item.lugar || item.tipo || "Ubicación")}" loading="lazy"></figure>` : ""}<div class="event-card-body"><span>${escapeHtml(item.tipo || item.titulo || "")}</span><strong>${escapeHtml(item.lugar || item.nombre || "")}</strong>${address ? `<p class="event-card-address">${escapeHtml(address)}</p>` : ""}${item.hora ? `<em>${escapeHtml(item.hora)}</em>` : ""}${item.url ? `<a class="mini-link" href="${escapeHtml(safeUrl(item.url))}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : ""}</div></article>`;
    }).join("");
  }

  function renderTimeline(data) {
    const list = byId("itinerario-lista");
    if (!list) return;
    list.dataset.estilo = data.itinerarioEstilo || "linea";
    list.innerHTML = (data.itinerario || []).filter((item) => item?.activo !== false).map((item) => `<li>${item.icono ? `<span class="timeline-icon"><img src="${escapeHtml(item.icono)}" alt="" loading="lazy"></span>` : ""}<time>${escapeHtml(item.hora || "")}</time><span>${escapeHtml(item.titulo || item.nombre || "")}</span></li>`).join("");
  }

  function mediaMarkup(item) {
    const values = Array.isArray(item?.media || item?.medias) ? item.media || item.medias : [item?.media || item?.medias];
    const entries = values.filter(Boolean).map((entry) => typeof entry === "string" ? { src: entry, alt: item?.alt || "" } : { src: entry.src || "", alt: entry.alt || item?.alt || "" }).filter((entry) => entry.src);
    const markup = entries.map((entry) => `<figure class="detalle-media"><img src="${escapeHtml(entry.src)}" alt="${escapeHtml(entry.alt)}" loading="lazy"></figure>`).join("");
    return entries.length > 1 ? `<div class="detalle-media-group">${markup}</div>` : markup;
  }

  function renderDetails(data) {
    const list = byId("detalles-lista");
    if (!list) return;
    const details = data.detalles || {};
    if (Array.isArray(details)) {
      list.innerHTML = details.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      return;
    }
    const cards = [];
    const rain = details.lluviaSobres;
    const mailbox = details.buzonDeseos || details.buzon || details["Buzón de deseos"];
    if (rain?.activo !== false && rain) cards.push(`<li class="detalle-card detalle-card--sobres">${mediaMarkup(rain)}<div class="detalle-body"><strong>${escapeHtml(rain.titulo || "")}</strong><span>${escapeHtml(rain.texto || "")}</span></div></li>`);
    if (mailbox?.activo !== false && mailbox) {
      const whatsApp = mailbox.whatsapp || {};
      const url = whatsApp.activo === false ? "" : whatsappUrl(whatsApp.numero || mailbox.telefono, whatsApp.mensajeBase || mailbox.texto || "");
      cards.push(`<li class="detalle-card detalle-card--buzon">${mediaMarkup(mailbox)}<div class="detalle-body"><strong>${escapeHtml(mailbox.titulo || "")}</strong><span>${escapeHtml(mailbox.texto || "")}</span>${url ? `<a class="map-button detalle-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(whatsApp.boton || "Enviar deseo")}</a>` : ""}</div></li>`);
    }
    list.innerHTML = cards.join("");
  }

  function renderDressCode(data) {
    const content = byId("vestimenta-contenido");
    if (!content) return;
    const dress = data.vestimenta || {};
    setText("vestimenta-titulo", dress.titulo || "Vestimenta");
    const forbidden = Array.isArray(dress.coloresNoPermitidos) ? dress.coloresNoPermitidos : [];
    content.innerHTML = `<article class="dress-card">${dress.media ? `<figure class="dress-media"><img src="${escapeHtml(dress.media)}" alt="${escapeHtml(dress.alt || "")}" loading="lazy"></figure>` : ""}<div class="dress-body"><p>${escapeHtml(dress.texto || "")}</p>${forbidden.length ? `<div class="dress-no"><strong>${escapeHtml(dress.coloresNoPermitidosTitulo || "Colores no permitidos")}</strong><div>${forbidden.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>` : ""}</div></article>`;
  }

  function renderGallery(data) {
    const list = byId("galeria-lista");
    if (!list) return;
    ns.state.galleryObserver?.disconnect?.();
    const items = data.galeria || [];
    ns.state.galleryItems = items.map((item) => typeof item === "string" ? { src: item, alt: "" } : item).filter((item) => item?.src);
    list.replaceChildren();
    const batchSize = window.matchMedia?.("(max-width: 680px)").matches ? 3 : 5;
    let rendered = 0;
    const sentinel = document.createElement("span");
    sentinel.className = "gallery-load-sentinel";
    sentinel.setAttribute("aria-hidden", "true");

    const appendBatch = () => {
      const fragment = document.createDocumentFragment();
      const end = Math.min(rendered + batchSize, ns.state.galleryItems.length);
      for (let index = rendered; index < end; index += 1) {
        const item = ns.state.galleryItems[index];
        const image = document.createElement("img");
        image.src = item.src;
        image.alt = item.alt || `Foto ${index + 1}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.fetchPriority = index < batchSize ? "auto" : "low";
        image.dataset.galleryIndex = String(index);
        fragment.append(image);
      }
      rendered = end;
      list.insertBefore(fragment, sentinel);
      if (rendered >= ns.state.galleryItems.length) {
        ns.state.galleryObserver?.disconnect?.();
        sentinel.remove();
      }
    };

    list.append(sentinel);
    appendBatch();
    if (rendered >= ns.state.galleryItems.length) return;

    let loadQueued = false;
    const loadNextWhenIdle = () => {
      if (loadQueued) return;
      loadQueued = true;
      const load = () => {
        loadQueued = false;
        appendBatch();
      };
      if ("requestIdleCallback" in window) window.requestIdleCallback(load, { timeout: 350 });
      else window.setTimeout(load, 0);
    };
    if (!("IntersectionObserver" in window)) {
      while (rendered < ns.state.galleryItems.length) appendBatch();
      return;
    }
    ns.state.galleryObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadNextWhenIdle();
    }, { rootMargin: "650px 0px" });
    ns.state.galleryObserver.observe(sentinel);
  }

  function renderNotes(data) {
    const notes = byId("notas-lista");
    if (notes) notes.innerHTML = (data.notas || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    const media = byId("notas-media");
    const image = byId("notas-media-image");
    if (image && hasText(data.notasMedia)) {
      image.src = data.notasMedia;
      image.alt = data.notasMediaAlt || "";
      if (media) media.hidden = false;
    } else {
      image?.removeAttribute("src");
      image?.removeAttribute("alt");
      if (media) media.hidden = true;
    }
  }

  function renderLabels(data) {
    const labels = data.labels || {};
    [["familia-eyebrow", labels.familiaEyebrow], ["familia-titulo", labels.familiaTitulo], ["ubicaciones-eyebrow", labels.ubicacionesEyebrow], ["ubicaciones-titulo", labels.ubicacionesTitulo], ["itinerario-eyebrow", labels.itinerarioEyebrow], ["itinerario-titulo", labels.itinerarioTitulo], ["detalles-eyebrow", labels.detallesEyebrow], ["detalles-titulo", labels.detallesTitulo], ["vestimenta-eyebrow", labels.vestimentaEyebrow], ["galeria-eyebrow", labels.galeriaEyebrow], ["galeria-titulo", labels.galeriaTitulo], ["notas-eyebrow", labels.notasEyebrow], ["notas-titulo", labels.notasTitulo], ["confirmacion-eyebrow", labels.confirmacionEyebrow]].forEach(([id, value]) => setText(id, value));
  }

  function renderConfirmation(data) {
    const confirmation = data.confirmacion || {};
    setText("confirmacion-titulo", confirmation.titulo || "Confirma tu asistencia");
    setAttr("rsvp-nombre", "placeholder", confirmation.nombrePlaceholder || "Nombre y apellido");
    setAttr("rsvp-mensaje", "placeholder", confirmation.mensajePlaceholder || "Mensaje opcional");
    setText("rsvp-boton", confirmation.boton || "Enviar confirmación");
    const visual = byId("confirmacion-visual");
    if (visual) visual.innerHTML = confirmation.media || confirmation.texto ? `<article class="confirmacion-card">${confirmation.media ? `<figure class="confirmacion-media"><img src="${escapeHtml(confirmation.media)}" alt="${escapeHtml(confirmation.alt || "")}" loading="lazy"></figure>` : ""}${confirmation.texto ? `<p>${escapeHtml(confirmation.texto)}</p>` : ""}</article>` : "";
    const button = byId("rsvp-boton");
    if (button && button.dataset.bellaBound !== "true") {
      button.dataset.bellaBound = "true";
      button.addEventListener("click", () => {
        const name = byId("rsvp-nombre")?.value?.trim() || "Invitado";
        const note = byId("rsvp-mensaje")?.value?.trim() || "";
        const base = confirmation.mensaje || `Hola, confirmo mi asistencia a los XV de ${data.hero?.nombre || "la festejada"}.`;
        const url = whatsappUrl(confirmation.telefono || confirmation.whatsapp?.numero, `${base} Nombre: ${name}.${note ? ` ${note}` : ""}`);
        if (url) window.open(url, "_blank", "noopener");
      });
    }
  }

  function renderAll(data) {
    renderHero(data);
    renderMemory(data);
    renderFamily(data);
    renderLocations(data);
    renderTimeline(data);
    renderDetails(data);
    renderDressCode(data);
    renderGallery(data);
    renderNotes(data);
    renderLabels(data);
    renderConfirmation(data);
    setText("cierre-nota", data.cierre?.nota);
    setText("cierre-titulo", data.cierre?.titulo);
  }

  let countdownTimer;
  function parseEventDate(data) {
    const value = String(data.fecha || "");
    if (!value) return null;
    const time = String(data.hora || "00:00").replace(/\./g, "").trim();
    const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.??m\.??|p\.??m\.??|am|pm)?/i);
    let hours = Number(match?.[1] || 0);
    const minutes = Number(match?.[2] || 0);
    const period = String(match?.[3] || "").toLowerCase().replace(/\./g, "");
    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    const date = new Date(`${value}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function renderClock(data) {
    const container = byId("countdown");
    if (!container) return;
    const labels = data.reloj?.unidades || {};
    setText("countdown-title", data.reloj?.titulo || "");
    container.innerHTML = [["dias", labels.dias || "Días"], ["horas", labels.horas || "Horas"], ["minutos", labels.minutos || "Min"], ["segundos", labels.segundos || "Seg"]].map(([key, label]) => `<div class="count-box"><strong data-count="${key}">00</strong><span>${escapeHtml(label)}</span></div>`).join("");
    const target = parseEventDate(data);
    if (countdownTimer) window.clearInterval(countdownTimer);
    const draw = () => {
      const total = Math.max(0, Math.floor(((target?.getTime() || Date.now()) - Date.now()) / 1000));
      const values = { dias: Math.floor(total / 86400), horas: Math.floor(total % 86400 / 3600), minutos: Math.floor(total % 3600 / 60), segundos: total % 60 };
      Object.entries(values).forEach(([key, value]) => {
        const node = document.querySelector(`[data-count="${key}"]`);
        if (node) node.textContent = key === "dias" ? String(value) : String(value).padStart(2, "0");
      });
    };
    draw();
    if (target) countdownTimer = window.setInterval(draw, 1000);
  }

  /* ---- AUTO-SCROLL ---- */
  ns.autoScroll = {
    _active: false,
    _raf: null,
    _paused: false,
    _pauseTimer: null,
    _target: null,

    setup(data = {}) {
      const cfg = data.autoScroll || {};
      if (cfg.activo === false) return;
      const speed = parseFloat(cfg.velocidad) || 0.6;  // px per frame
      const initMs = parseInt(cfg.inicioMs, 10) || 1200;
      const resumeMs = parseInt(cfg.reanudarMs, 10) || 4000;

      // Show notice banner
      let notice = document.querySelector('.auto-scroll-notice');
      if (!notice) {
        notice = document.createElement('p');
        notice.className = 'auto-scroll-notice';
        notice.textContent = 'Deslizando automáticamente…';
        document.body.appendChild(notice);
      }

      const scrollTarget = () => {
        // En desktop-phone-preview el scroll es el window (el shell escala pero window scrollea)
        // En mobile el scroll también es window
        return window;
      };

      const getScrollTop = () => window.scrollY;
      const getScrollHeight = () => document.documentElement.scrollHeight - window.innerHeight;
      const doScroll = (amount) => window.scrollBy(0, amount);

      let ticking = false;
      const tick = () => {
        if (!ns.autoScroll._active || ns.autoScroll._paused) {
          ns.autoScroll._raf = null;
          return;
        }
        const max = getScrollHeight();
        const cur = getScrollTop();
        if (cur < max) {
          doScroll(speed);
        } else {
          ns.autoScroll._active = false;
          notice.classList.remove('is-visible');
          ns.autoScroll._raf = null;
          return;
        }
        ns.autoScroll._raf = requestAnimationFrame(tick);
      };

      const pause = (ms) => {
        ns.autoScroll._paused = true;
        notice.classList.remove('is-visible');
        clearTimeout(ns.autoScroll._pauseTimer);
        ns.autoScroll._pauseTimer = setTimeout(() => {
          if (!ns.autoScroll._active) return;
          ns.autoScroll._paused = false;
          notice.classList.add('is-visible');
          if (!ns.autoScroll._raf) ns.autoScroll._raf = requestAnimationFrame(tick);
        }, ms);
      };

      window.addEventListener('invitacionAbierta', () => {
        setTimeout(() => {
          ns.autoScroll._active = true;
          ns.autoScroll._paused = false;
          notice.classList.add('is-visible');
          if (!ns.autoScroll._raf) ns.autoScroll._raf = requestAnimationFrame(tick);
        }, initMs);
      });

      // Pause on user interaction
      const onUserInteraction = () => {
        if (!ns.autoScroll._active) return;
        pause(resumeMs);
      };

      ['touchstart','mousedown','wheel','keydown'].forEach(evName => {
        window.addEventListener(evName, onUserInteraction, { passive: true });
      });
    }
  };

  ns.secciones.renderAll = renderAll;
  ns.secciones.reloj = { render: renderClock };
})();