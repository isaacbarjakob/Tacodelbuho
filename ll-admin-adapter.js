(() => {
  "use strict";

  const LL_ADMIN_ORIGIN = "https://ll-admin.pages.dev";
  const READY_MESSAGE = "LL_ADMIN_ADAPTER_READY";
  const CONTENT_MESSAGE = "LL_ADMIN_PREVIEW_CONTENT";
  const isEmbedded = window.self !== window.top;
  const isPreviewPage = window.location.pathname.endsWith("/ll-admin-preview.html");

  if (!isPreviewPage) return;

  const normalize = (value = "") =>
    String(value)
      .toLocaleLowerCase("sv-SE")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9åäö]+/gi, " ")
      .trim();

  const safeImageUrl = (value) => {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (trimmed.startsWith("/") || /^https:\/\/[^\s]+$/i.test(trimmed)) return trimmed;
    return "";
  };

  const setText = (selector, value) => {
    if (typeof value !== "string" || !value.trim()) return;
    const element = document.querySelector(selector);
    if (element) element.textContent = value.trim();
  };

  const setMultilineHeading = (selector, value) => {
    if (typeof value !== "string" || !value.trim()) return;
    const element = document.querySelector(selector);
    if (!element) return;
    const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    element.replaceChildren();
    lines.forEach((line, index) => {
      if (index) element.append(document.createElement("br"));
      element.append(document.createTextNode(line));
    });
  };

  const showPreviewBanner = () => {
    if (document.getElementById("ll-admin-preview-banner")) return;
    const banner = document.createElement("div");
    banner.id = "ll-admin-preview-banner";
    banner.setAttribute("role", "status");
    banner.textContent = "LL ADMIN · PRIVAT TEST · LIVESIDAN ÄR ORÖRD";
    Object.assign(banner.style, {
      position: "fixed",
      inset: "0 0 auto 0",
      zIndex: "2147483647",
      padding: "9px 14px",
      background: "#6f5cf5",
      color: "#fff",
      font: "800 11px/1.3 system-ui, sans-serif",
      letterSpacing: ".08em",
      textAlign: "center",
      boxShadow: "0 8px 30px rgba(0,0,0,.25)",
    });
    document.body.appendChild(banner);
  };

  const lockInteractions = () => {
    document.addEventListener("submit", (event) => {
      event.preventDefault();
      showPreviewBanner();
    }, true);

    document.addEventListener("click", (event) => {
      const link = event.target.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) return;
      event.preventDefault();
      showPreviewBanner();
    }, true);
  };

  const applyOpeningHours = (hours) => {
    if (!hours || typeof hours !== "object") return;
    const labels = {
      monday: "Måndag",
      tuesday: "Tisdag",
      wednesday: "Onsdag",
      thursday: "Torsdag",
      friday: "Fredag",
      saturday: "Lördag",
      sunday: "Söndag",
    };
    const rows = Object.entries(labels)
      .map(([key, label]) => {
        const value = typeof hours[key] === "string" ? hours[key].trim() : "";
        return value ? `${label}: ${value}` : "";
      })
      .filter(Boolean);

    const target = document.querySelector("[data-cms-hours]");
    if (target && rows.length) {
      target.replaceChildren();
      rows.forEach((row, index) => {
        if (index) target.append(document.createElement("br"));
        target.append(document.createTextNode(row));
      });
    }
  };

  const applyOffer = (content) => {
    const firstOffer = Array.isArray(content.offers) ? content.offers[0] : null;
    const announcement = content.general?.announcement?.trim?.() || "";
    if (!firstOffer && !announcement) return;

    const section = document.querySelector("[data-cms-section]");
    if (!section) return;
    const title = firstOffer?.title?.trim?.() || announcement || "AKTUELLT";
    const description = firstOffer?.description?.trim?.() || announcement;
    setText("#cms-offer-kicker", "AKTUELLT HOS OSS");
    setText("#cms-offer-title", title);
    setText("#cms-offer-text", description);
    section.hidden = false;

    if (announcement) {
      const statement = document.querySelector(".statement p");
      if (statement) statement.textContent = announcement;
    }
  };

  const applyEvents = (events) => {
    if (!Array.isArray(events) || !events.length) return;
    const section = document.querySelector("[data-events-section]");
    const grid = document.querySelector("#cms-events-grid");
    if (!section || !grid) return;

    grid.replaceChildren();
    events.slice(0, 6).forEach((event) => {
      const article = document.createElement("article");
      article.className = "event-card reveal visible";
      const top = document.createElement("div");
      top.className = "event-top";
      const type = document.createElement("span");
      type.className = "event-type";
      type.textContent = "EVENT";
      const date = document.createElement("span");
      date.className = "event-date";
      date.textContent = event.date || "KOMMANDE";
      top.append(type, date);
      const title = document.createElement("h3");
      title.textContent = event.title || "Kommande event";
      const description = document.createElement("p");
      description.textContent = event.description || "";
      const timeWrap = document.createElement("div");
      timeWrap.className = "event-time";
      const time = document.createElement("strong");
      time.textContent = event.time || "—";
      const note = document.createElement("span");
      note.textContent = "Privat testversion";
      timeWrap.append(time, note);
      article.append(top, title, description, timeWrap);
      grid.appendChild(article);
    });
    section.hidden = false;
  };

  const createMenuItem = (item) => {
    const row = document.createElement("div");
    row.className = "menu-item ll-admin-added";
    const copy = document.createElement("div");
    const name = document.createElement("h4");
    name.textContent = item.name || "Ny rätt";
    const description = document.createElement("p");
    description.textContent = item.description || "";
    copy.append(name, description);
    const price = document.createElement("strong");
    price.textContent = item.price || "";
    row.append(copy, price);
    return row;
  };

  const applyMenu = (menu) => {
    if (!Array.isArray(menu) || !menu.length) return;
    const existingRows = [...document.querySelectorAll(".menu-item")];
    const categories = [...document.querySelectorAll(".menu-category")];

    menu.forEach((item) => {
      const itemName = normalize(item.name);
      if (!itemName) return;
      const existing = existingRows.find((row) => normalize(row.querySelector("h4")?.textContent) === itemName);
      if (existing) {
        const name = existing.querySelector("h4");
        const description = existing.querySelector("p");
        const price = existing.querySelector("strong");
        if (name && item.name) name.textContent = item.name;
        if (description && typeof item.description === "string") description.textContent = item.description;
        if (price && typeof item.price === "string") price.textContent = item.price;
        return;
      }

      const wantedCategory = normalize(item.category);
      let category = categories.find((card) => {
        const heading = normalize(card.querySelector("h3")?.textContent);
        return wantedCategory && (heading === wantedCategory || heading.includes(wantedCategory) || wantedCategory.includes(heading));
      });

      if (!category) {
        const grid = document.querySelector(".menu-grid");
        if (!grid) return;
        category = document.createElement("article");
        category.className = "menu-category reveal visible ll-admin-added";
        category.dataset.category = wantedCategory.replace(/\s+/g, "-") || "ovrigt";
        const heading = document.createElement("h3");
        heading.textContent = item.category || "Övrigt";
        category.appendChild(heading);
        grid.appendChild(category);
        categories.push(category);
      }
      category.appendChild(createMenuItem(item));
    });
  };

  const applyImages = (images) => {
    if (!Array.isArray(images) || !images.length) return;
    const heroSlides = [...document.querySelectorAll(".hero-slide")];
    const foodImages = [...document.querySelectorAll(".food-card img")];
    let heroIndex = 0;
    let galleryIndex = 0;

    images.forEach((item) => {
      const url = safeImageUrl(item.url);
      if (!url) return;
      const label = normalize(item.label);
      const alt = item.alt || item.label || "Bild från Taco del Búho";
      let image;
      if (label.includes("aktuellt") || label.includes("erbjudande")) {
        image = document.querySelector("#cms-offer-image");
      } else if (label.includes("hero") || label.includes("start")) {
        image = heroSlides[heroIndex++] || heroSlides[0];
      } else {
        image = foodImages[galleryIndex++] || foodImages[0];
      }
      if (image) {
        image.src = url;
        image.alt = alt;
      }
    });
  };

  const applyContent = (content) => {
    if (!content || typeof content !== "object") return;
    setMultilineHeading(".hero-copy h1", content.general?.hero_title || "");
    setText(".hero-copy > p:not(.kicker)", content.general?.intro_text || "");
    applyOpeningHours(content.opening_hours);
    applyOffer(content);
    applyEvents(content.events);
    applyMenu(content.menu);
    applyImages(content.images);
    showPreviewBanner();
    document.documentElement.dataset.llAdminPreview = "active";
  };

  window.addEventListener("message", (event) => {
    if (event.origin !== LL_ADMIN_ORIGIN) return;
    const data = event.data;
    if (!data || data.source !== "ll-admin" || data.type !== CONTENT_MESSAGE) return;
    applyContent(data.content);
  });

  lockInteractions();
  showPreviewBanner();

  if (isEmbedded) {
    const announceReady = () => {
      window.parent.postMessage(
        { source: "taco-ll-adapter", type: READY_MESSAGE, version: 2 },
        LL_ADMIN_ORIGIN,
      );
    };
    announceReady();
    window.addEventListener("load", announceReady, { once: true });
    window.setTimeout(announceReady, 500);
    window.setTimeout(announceReady, 1500);
  }
})();
