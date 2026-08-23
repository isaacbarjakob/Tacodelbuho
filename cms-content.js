(() => {
  "use strict";

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "/site-upgrades.css?v=20260823-2";
  document.head.appendChild(css);

  const loader = document.getElementById("site-loader");
  if (loader && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const started = performance.now();
    const minimum = 950;
    const observer = new MutationObserver(() => {
      if (!loader.classList.contains("hide")) return;
      const remaining = minimum - (performance.now() - started);
      if (remaining > 0) {
        loader.classList.remove("hide");
        setTimeout(() => { observer.disconnect(); loader.classList.add("hide"); }, remaining);
      } else {
        observer.disconnect();
      }
    });
    observer.observe(loader, { attributes:true, attributeFilter:["class"] });
  }

  const upgrades = document.createElement("script");
  upgrades.src = "/site-upgrades.js?v=20260823-2";
  document.head.appendChild(upgrades);
})();

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
      const media = document.querySelector(".current-offer-media");
      if (image && data.image) {
        image.src = data.image;
        image.alt = data.image_alt || data.title || "Aktuellt hos Taco del Búho";
        const fit = data.image_fit === "cover" ? "cover" : "contain";
        const position = ["top", "center", "bottom"].includes(data.image_position) ? data.image_position : "center";
        image.style.objectPosition = position;
        if (media) {
          media.classList.toggle("fit-cover", fit === "cover");
          media.classList.toggle("fit-contain", fit === "contain");
        }
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
