(() => {
  "use strict";

  const removeLegacyOrderUi = () => {
    document.querySelectorAll(".desktop-order-dock, .mobile-actions").forEach((element) => element.remove());
  };

  removeLegacyOrderUi();

  // Skydd mot äldre script/cache som skulle försöka lägga tillbaka de gamla knapparna.
  const legacyObserver = new MutationObserver(removeLegacyOrderUi);
  legacyObserver.observe(document.documentElement, { childList: true, subtree: true });

  if (document.getElementById("floating-order-cta")) return;

  const style = document.createElement("style");
  style.textContent = `
    .desktop-order-dock,.mobile-actions{display:none!important;visibility:hidden!important}
    .floating-order-cta{
      position:fixed;
      right:22px;
      bottom:max(22px, env(safe-area-inset-bottom));
      z-index:5200;
      display:flex;
      align-items:center;
      gap:13px;
      min-width:220px;
      padding:14px 17px 14px 19px;
      border:1px solid rgba(255,255,255,.22);
      border-radius:18px;
      background:#ef5b25;
      color:#fff!important;
      text-decoration:none!important;
      box-shadow:0 18px 50px rgba(0,0,0,.32),0 7px 22px rgba(239,91,37,.3);
      font-family:Montserrat,Arial,sans-serif;
      transition:transform .2s ease,box-shadow .2s ease,background .2s ease;
      -webkit-tap-highlight-color:transparent;
    }
    .floating-order-cta:hover{
      transform:translateY(-3px);
      background:#ff6730;
      box-shadow:0 22px 58px rgba(0,0,0,.36),0 9px 28px rgba(239,91,37,.35);
    }
    .floating-order-cta:focus-visible{outline:3px solid #f4d78e;outline-offset:4px}
    .floating-order-cta__copy{display:flex;flex-direction:column;gap:2px;line-height:1.05}
    .floating-order-cta__copy strong{font-size:.88rem;font-weight:900;letter-spacing:.055em}
    .floating-order-cta__copy small{font-size:.62rem;font-weight:700;opacity:.86;letter-spacing:.035em}
    .floating-order-cta__arrow{
      margin-left:auto;
      display:grid;
      place-items:center;
      width:34px;
      height:34px;
      flex:0 0 34px;
      border-radius:50%;
      background:rgba(0,0,0,.18);
      font-size:1.05rem;
      font-weight:900;
    }
    body.lunch-viewer-open .floating-order-cta{display:none!important}
    @media(max-width:800px){
      body{padding-bottom:92px!important}
      .floating-order-cta{
        left:12px;
        right:12px;
        bottom:calc(10px + env(safe-area-inset-bottom));
        min-width:0;
        min-height:58px;
        padding:10px 13px 10px 17px;
        border-radius:16px;
        box-shadow:0 14px 40px rgba(0,0,0,.38),0 6px 20px rgba(239,91,37,.3);
      }
      .floating-order-cta__copy strong{font-size:.9rem}
      .floating-order-cta__copy small{font-size:.61rem}
    }
    @media(prefers-reduced-motion:reduce){.floating-order-cta{transition:none}}
  `;
  document.head.appendChild(style);

  const link = document.createElement("a");
  link.id = "floating-order-cta";
  link.className = "floating-order-cta";
  link.href = "https://www.foodora.se/restaurant/ziwk/taco-del-buho-ziwk";
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "Beställ online från Taco del Búho via Foodora");
  link.innerHTML = `
    <span class="floating-order-cta__copy">
      <strong>BESTÄLL ONLINE</strong>
      <small>Beställ via Foodora</small>
    </span>
    <span class="floating-order-cta__arrow" aria-hidden="true">↗</span>`;

  document.body.appendChild(link);
})();
