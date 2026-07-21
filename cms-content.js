
(() => {
  "use strict";

  const section = document.querySelector("[data-cms-section]");
  if (!section) return;

  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && typeof value === "string") el.textContent = value;
  };

  const safeHref = (value) => {
    if (typeof value !== "string") return "#meny";
    const trimmed = value.trim();
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("/") ||
      /^https:\/\/.+/i.test(trimmed) ||
      /^tel:\+?[0-9 -]+$/i.test(trimmed)
    ) return trimmed;
    return "#meny";
  };

  fetch("/content/aktuellt.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Kunde inte läsa aktuellt innehåll");
      return response.json();
    })
    .then((data) => {
      if (data.visible === false) {
        section.hidden = true;
        return;
      }

      setText("#cms-offer-kicker", data.kicker || "AKTUELLT HOS OSS");
      setText("#cms-offer-title", data.title || "VECKANS LUNCH");
      setText("#cms-offer-text", data.text || "");

      const image = document.querySelector("#cms-offer-image");
      if (image && data.image) {
        image.src = data.image;
        image.alt = data.image_alt || data.title || "Aktuellt hos Taco del Búho";
      }

      const button = document.querySelector("#cms-offer-button");
      if (button) {
        button.textContent = data.button_text || "LÄS MER";
        button.href = safeHref(data.button_link);
        button.hidden = data.show_button === false;
        if (/^https:\/\//i.test(button.href)) {
          button.target = "_blank";
          button.rel = "noopener";
        }
      }

      section.hidden = false;
    })
    .catch((error) => {
      console.warn(error);
      section.hidden = true;
    });
})();
