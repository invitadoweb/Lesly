/* Adaptación de viewport propia de Bella Durmiente. */
(() => {
  "use strict";

  const root = document.documentElement;
  const userAgent = navigator.userAgent || "";
  const isIphone = /iPhone|iPod/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.toggle("is-iphone", isIphone);
    document.body.classList.toggle("is-android", isAndroid);
    root.classList.toggle("is-iphone", isIphone);
    root.classList.toggle("is-android", isAndroid);
    if (isIphone) document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
    refresh();
    if ("ResizeObserver" in window) {
      const stage = document.querySelector(".phone-preview-stage");
      if (stage) new ResizeObserver(refresh).observe(stage);
    }
  }, { once: true });

  function refresh() {
    const viewport = window.visualViewport;
    const width = Math.max(320, viewport?.width || window.innerWidth);
    const height = Math.max(568, viewport?.height || window.innerHeight);
    const desktop = width >= 768 && width > height;
    const previewWidth = desktop ? Math.min(430, ((height - 36) * 9) / 16, width - 36) : width;
    const scale = desktop ? previewWidth / width : 1;
    root.style.setProperty("--app-height", `${height}px`);
    root.style.setProperty("--preview-width", `${previewWidth}px`);
    root.style.setProperty("--preview-height", `${desktop ? Math.min(height - 36, previewWidth * 16 / 9) : height}px`);
    root.style.setProperty("--preview-scale", String(scale));
    document.body.classList.toggle("desktop-phone-preview", desktop);
    const shell = document.querySelector(".phone-preview-shell");
    const stage = document.querySelector(".phone-preview-stage");
    if (shell && stage) shell.style.height = desktop ? `${Math.max(previewWidth * 16 / 9, stage.scrollHeight * scale)}px` : "auto";
  }

  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("orientationchange", () => window.setTimeout(refresh, 120));
  window.visualViewport?.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("invitacionAbierta", refresh);
})();
