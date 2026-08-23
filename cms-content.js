
(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = `
    /* Renare premium-intro */
    .site-loader{background:#000!important;transition:opacity .45s ease .55s,visibility 0s linear 1s!important}
    .site-loader:before,.site-loader .loader-inner strong,.site-loader .loader-inner span,.site-loader .loader-line{display:none!important}
    .site-loader .loader-inner img{width:112px!important;height:112px!important;box-shadow:0 0 0 9px rgba(225,184,90,.06),0 22px 55px rgba(0,0,0,.5)!important}

    /* Lunch/aktuellt: professionell tvåspaltslayout på dator, text först på mobil */
    @media(max-width:850px){
      .current-offer-copy{order:1;padding-top:48px!important;padding-bottom:42px!important}
      .current-offer-media{order:2}
      .current-offer-copy>p:not(.kicker){margin-bottom:24px!important}
    }

    /* Ny mobilnavigation */
    @media(max-width:800px){
      body{padding-bottom:0!important}
      body.nav-open{overflow:hidden!important}
      .topbar{display:none!important}
      header{top:0!important;height:74px!important;z-index:300!important;background:rgba(10,8,7,.97)!important;border-bottom:1px solid rgba(225,184,90,.2)!important}
      #toggle{position:relative;z-index:302!important;font-size:0!important}
      #toggle:after{content:'☰';font-size:26px;line-height:1}
      body.nav-open #toggle:after{content:'×';font-size:34px;font-weight:300}
      #nav{position:fixed!important;inset:74px 0 0 0!important;width:100%!important;height:calc(100dvh - 74px)!important;padding:20px 22px 38px!important;background:radial-gradient(circle at 85% 10%,rgba(225,184,90,.11),transparent 28%),#0b0907!important;box-shadow:none!important;overflow-y:auto!important;z-index:301!important;gap:0!important}
      #nav.open{display:flex!important;flex-direction:column!important}
      #nav a{display:flex!important;align-items:center!important;min-height:68px!important;padding:10px 4px!important;border-bottom:1px solid rgba(255,255,255,.11)!important;font-family:Anton,Impact,sans-serif!important;font-size:clamp(2rem,9vw,3.25rem)!important;font-weight:400!important;letter-spacing:.02em!important;color:#fff!important}
      #nav a:after{content:'→';margin-left:auto;font-family:Montserrat,sans-serif;font-size:1.15rem;color:#e1b85a}
      #nav a.nav-order{margin-top:18px!important;padding:0 18px!important;min-height:58px!important;justify-content:center!important;border:1px solid #e1b85a!important;border-radius:14px!important;background:#e1b85a!important;color:#17110b!important;font-family:Montserrat,sans-serif!important;font-size:.85rem!important;font-weight:900!important;letter-spacing:.08em!important}
      #nav a.nav-order:after{display:none}
      .mobile-actions{display:none!important}
      section[id]{scroll-margin-top:76px!important}
      .menu-shortcuts{top:74px!important}
    }
  `;
  document.head.appendChild(style);

  const nav = document.querySelector("#nav");
  let lunchNavLink = null;
  if (nav) {
    nav.querySelector('a[href="#galleri"]')?.remove();
    lunchNavLink = nav.querySelector('a[href="#aktuellt"]');
    if (!lunchNavLink) {
      lunchNavLink = document.createElement("a");
      lunchNavLink.href = "#aktuellt";
      lunchNavLink.textContent = "Veckans lunch";
      const menuLink = nav.querySelector('a[href="#meny"]');
      menuLink?.after(lunchNavLink);
    }
    if (!nav.querySelector(".nav-order")) {
      const order = document.createElement("a");
      order.className = "nav-order";
      order.href = "https://www.foodora.se/restaurant/ziwk/taco-del-buho-ziwk";
      order.target = "_blank";
      order.rel = "noopener";
      order.textContent = "BESTÄLL ONLINE";
      nav.appendChild(order);
    }
    const desired = ["#start", "#meny", "#aktuellt", "#event", "#boka", "#kontakt"];
    desired.forEach(href => {
      const link = nav.querySelector(`a[href="${href}"]`);
      if (link) nav.insertBefore(link, nav.querySelector(".nav-order"));
    });
    const toggle = document.querySelector("#toggle");
    new MutationObserver(() => {
      document.body.classList.toggle("nav-open", nav.classList.contains("open"));
    }).observe(nav, { attributes: true, attributeFilter: ["class"] });
    toggle?.addEventListener("click", () => requestAnimationFrame(() => document.body.classList.toggle("nav-open", nav.classList.contains("open"))));
  }
  document.querySelector(".mobile-actions")?.remove();

  const section = document.querySelector("[data-cms-section]");
  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && typeof value === "string") el.textContent = value;
  };
  const safeHref = (value) => {
    if (typeof value !== "string") return "#meny";
    const trimmed = value.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("/") || /^https:\/\/.+/i.test(trimmed) || /^tel:\+?[0-9 -]+$/i.test(trimmed)) return trimmed;
    return "#meny";
  };

  if (section) {
    fetch("/content/aktuellt.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Kunde inte läsa aktuellt innehåll");
        return response.json();
      })
      .then((data) => {
        if (data.visible === false) {
          section.hidden = true;
          if (lunchNavLink) lunchNavLink.hidden = true;
          return;
        }
        if (lunchNavLink) lunchNavLink.hidden = false;
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
        if (lunchNavLink) lunchNavLink.hidden = true;
      });
  }

  const normalizeText = (value = "") => value.toLocaleLowerCase("sv-SE").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const renderMenu = (data) => {
    const grid = document.querySelector("#meny .menu-grid");
    const shortcuts = document.querySelector(".menu-shortcuts-inner");
    const search = document.querySelector("#menu-search");
    const count = document.querySelector("#menu-count");
    if (!grid || !shortcuts || !Array.isArray(data?.categories)) return;

    const categories = data.categories.filter(category => category?.visible !== false && Array.isArray(category.items) && category.items.some(item => item?.visible !== false));
    if (!categories.length) return;
    grid.innerHTML = "";
    categories.forEach(category => {
      const article = document.createElement("article");
      article.className = "menu-category";
      article.dataset.category = category.id || "kategori";
      if (category.badge) {
        const heading = document.createElement("div");
        heading.className = "category-heading";
        const h3 = document.createElement("h3"); h3.textContent = category.title || "Kategori";
        const badge = document.createElement("span"); badge.textContent = category.badge;
        heading.append(h3, badge); article.appendChild(heading);
      } else {
        const h3 = document.createElement("h3"); h3.textContent = category.title || "Kategori"; article.appendChild(h3);
      }
      category.items.filter(item => item?.visible !== false).forEach(item => {
        const row = document.createElement("div"); row.className = "menu-item";
        const copy = document.createElement("div");
        const h4 = document.createElement("h4"); h4.textContent = item.name || "";
        const p = document.createElement("p"); p.textContent = item.description || "";
        const price = document.createElement("strong"); price.textContent = item.price || "";
        copy.append(h4, p); row.append(copy, price); article.appendChild(row);
      });
      if (category.note) {
        const note = document.createElement("p"); note.className = "note menu-note-inside"; note.textContent = category.note; article.appendChild(note);
      }
      grid.appendChild(article);
    });

    shortcuts.querySelectorAll("button[data-menu-filter]").forEach(button => button.remove());
    const all = document.createElement("button"); all.type = "button"; all.dataset.menuFilter = "all"; all.className = "active"; all.textContent = "ALLT"; shortcuts.appendChild(all);
    categories.forEach(category => {
      const button = document.createElement("button"); button.type = "button"; button.dataset.menuFilter = category.id || "kategori"; button.textContent = String(category.title || "Kategori").toLocaleUpperCase("sv-SE"); shortcuts.appendChild(button);
    });

    let active = "all";
    const apply = () => {
      const term = normalizeText(search?.value.trim() || "");
      let shown = 0;
      [...grid.querySelectorAll(".menu-category")].forEach(card => {
        const visible = (active === "all" || card.dataset.category === active) && (!term || normalizeText(card.textContent).includes(term));
        card.classList.toggle("is-hidden", !visible);
        if (visible) shown++;
      });
      if (count) count.textContent = term || active !== "all" ? `${shown} kategorier visas` : "";
    };
    [...shortcuts.querySelectorAll("button[data-menu-filter]")].forEach(button => button.addEventListener("click", () => {
      active = button.dataset.menuFilter;
      shortcuts.querySelectorAll("button[data-menu-filter]").forEach(btn => btn.classList.toggle("active", btn === button));
      apply();
      document.querySelector("#meny")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    search?.addEventListener("input", apply);
  };

  fetch("/content/menu.json", { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error("Kunde inte läsa menyn");
      return response.json();
    })
    .then(renderMenu)
    .catch(error => console.warn(error));
})();
