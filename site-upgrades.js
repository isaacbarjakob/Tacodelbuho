(() => {
  'use strict';

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug = (v='') => String(v).toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'kategori';
  const normalize = (v='') => String(v).toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g,'');

  const nav = $('#nav');
  if (nav) {
    nav.innerHTML = `
      <a href="#start">Start</a>
      <a href="#meny" data-open-menu>Meny</a>
      <a href="#aktuellt">Veckans lunch</a>
      <a href="#event">Event</a>
      <a href="#boka">Boka bord</a>
      <a href="#kontakt">Kontakt</a>
      <a data-order-online href="https://www.foodora.se/restaurant/ziwk/taco-del-buho-ziwk" target="_blank" rel="noopener">Beställ online</a>`;
  }
  $('.mobile-actions')?.remove();

  const overlay = document.createElement('section');
  overlay.id = 'buho-menu-view';
  overlay.className = 'buho-menu-view';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML = `
    <div class="buho-menu-top">
      <div class="buho-menu-brand"><img src="/assets/logo-512.webp" alt="" width="44" height="44"><span>TACO DEL BÚHO · MENY</span></div>
      <button class="buho-menu-close" type="button" aria-label="Stäng menyn">← TILLBAKA</button>
    </div>
    <div class="buho-menu-shell">
      <div class="buho-menu-head">
        <div><p class="kicker">HUNGRIG?</p><h2>VÅR MENY</h2><p>Välj kategori eller sök efter en rätt. Priser och innehåll uppdateras direkt från vår meny.</p></div>
        <input class="buho-menu-search" type="search" placeholder="Sök i menyn…" aria-label="Sök i menyn" autocomplete="off">
      </div>
      <div class="buho-menu-filters" role="group" aria-label="Menyval"></div>
      <div class="buho-menu-grid" aria-live="polite"><p class="buho-menu-empty">Laddar menyn…</p></div>
    </div>`;
  document.body.appendChild(overlay);

  const closeButton = $('.buho-menu-close', overlay);
  const filters = $('.buho-menu-filters', overlay);
  const grid = $('.buho-menu-grid', overlay);
  const search = $('.buho-menu-search', overlay);
  let menuData = {categories:[]};
  let active = 'all';
  let lastFocus = null;

  const renderFilters = () => {
    const seen = new Map();
    (menuData.categories || []).filter(cat => cat.visible !== false).forEach((cat, index) => {
      const id = cat.id || slug(cat.title || `kategori-${index+1}`);
      if (!seen.has(id)) seen.set(id, cat.title || id);
    });
    filters.innerHTML = `<button type="button" data-filter="all" class="active">ALLT</button>` +
      [...seen].map(([id,title]) => `<button type="button" data-filter="${esc(id)}">${esc(title)}</button>`).join('');
  };

  const renderMenu = () => {
    const term = normalize(search.value.trim());
    const cats = (menuData.categories || []).filter(cat => cat.visible !== false).filter((cat, index) => {
      const id = cat.id || slug(cat.title || `kategori-${index+1}`);
      const matchesFilter = active === 'all' || id === active;
      const text = normalize([cat.title, cat.note, ...(cat.items || []).filter(item => item.visible !== false).flatMap(item => [item.name,item.description,item.price])].join(' '));
      return matchesFilter && (!term || text.includes(term));
    });
    if (!cats.length) {
      grid.innerHTML = `<p class="buho-menu-empty">Inga rätter matchar din sökning.</p>`;
      return;
    }
    grid.innerHTML = cats.map(cat => `
      <article class="buho-menu-category">
        <div class="buho-menu-category-title"><h3>${esc(cat.title || 'Meny')}</h3>${cat.badge ? `<span>${esc(cat.badge)}</span>` : ''}</div>
        ${(cat.items || []).filter(item => item.visible !== false).map(item => `
          <div class="buho-menu-item">
            <div><h4>${esc(item.name || '')}</h4>${item.description ? `<p>${esc(item.description)}</p>` : ''}</div>
            <strong>${esc(item.price || '')}</strong>
          </div>`).join('')}
        ${cat.note ? `<p class="buho-menu-note">${esc(cat.note)}</p>` : ''}
      </article>`).join('');
  };

  const loadMenu = async () => {
    try {
      const r = await fetch('/content/menu.json', {cache:'no-store'});
      if (!r.ok) throw new Error('menu');
      const data = await r.json();
      if (!Array.isArray(data.categories)) throw new Error('menu');
      menuData = data;
      renderFilters();
      renderMenu();
    } catch {
      const categories = $$('#meny .menu-category').map((card, index) => ({
        id: card.dataset.category || `kategori-${index+1}`,
        title: card.querySelector('h3')?.textContent.trim() || 'Meny',
        note: card.querySelector('.menu-note-inside')?.textContent.trim() || '',
        items: $$('.menu-item', card).map(item => ({
          name: item.querySelector('h4')?.textContent.trim() || '',
          description: item.querySelector('p')?.textContent.trim() || '',
          price: item.querySelector('strong')?.textContent.trim() || ''
        }))
      }));
      menuData = {categories};
      renderFilters();
      renderMenu();
    }
  };

  const openMenu = () => {
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('buho-menu-open');
    $('#nav')?.classList.remove('open');
    $('#toggle')?.setAttribute('aria-expanded','false');
    closeButton.focus({preventScroll:true});
    if (!menuData.categories.length) loadMenu();
  };
  const closeMenu = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('buho-menu-open');
    if (lastFocus instanceof HTMLElement) lastFocus.focus({preventScroll:true});
  };

  document.addEventListener('click', e => {
    const menuLink = e.target.closest('a[href="#meny"], [data-open-menu]');
    if (menuLink) {
      e.preventDefault();
      openMenu();
    }
  }, true);
  closeButton.addEventListener('click', closeMenu);
  overlay.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  filters.addEventListener('click', e => {
    const button = e.target.closest('button[data-filter]');
    if (!button) return;
    active = button.dataset.filter || 'all';
    $$('button[data-filter]', filters).forEach(b => b.classList.toggle('active', b === button));
    renderMenu();
    overlay.scrollTo({top:0,behavior:'smooth'});
  });
  search.addEventListener('input', renderMenu);

  if (location.hash === '#meny') {
    history.replaceState(null,'',location.pathname + location.search);
    setTimeout(openMenu, 50);
  }

  nav?.addEventListener('click', e => {
    if (e.target.closest('a') && !e.target.closest('a[href="#meny"]')) {
      nav.classList.remove('open');
      $('#toggle')?.setAttribute('aria-expanded','false');
    }
  });

  const lunchSection = $('#aktuellt');
  if (lunchSection) {
    const syncLunchNav = () => {
      const link = nav?.querySelector('a[href="#aktuellt"]');
      if (link) link.hidden = lunchSection.hidden;
    };
    syncLunchNav();
    new MutationObserver(syncLunchNav).observe(lunchSection,{attributes:true,attributeFilter:['hidden']});
  }

  loadMenu();
})();

(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    .current-offer-media{position:relative;cursor:zoom-in!important}
    .current-offer-media:after{content:'TRYCK FÖR ATT FÖRSTORA';position:absolute;right:18px;bottom:18px;padding:9px 12px;border:1px solid rgba(255,255,255,.32);border-radius:999px;background:rgba(7,5,4,.78);color:#fff;font:800 .66rem Montserrat,sans-serif;letter-spacing:.08em;pointer-events:none;backdrop-filter:blur(10px)}
    .current-offer-media.fit-contain{min-height:520px!important}
    .current-offer-media.fit-contain img{min-height:0!important;height:520px!important;object-fit:contain!important;padding:12px!important}
    .lunch-image-viewer{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,.94);backdrop-filter:blur(9px)}
    .lunch-image-viewer.open{display:flex}
    .lunch-image-viewer img{display:block;max-width:min(1200px,96vw);max-height:91vh;width:auto;height:auto;object-fit:contain;box-shadow:0 28px 90px rgba(0,0,0,.55);touch-action:pinch-zoom}
    .lunch-image-viewer button{position:fixed;z-index:2;top:max(15px,env(safe-area-inset-top));right:16px;width:48px;height:48px;border:1px solid rgba(255,255,255,.3);border-radius:50%;background:rgba(20,16,13,.88);color:#fff;font-size:28px;line-height:1;cursor:pointer}
    .lunch-image-viewer-hint{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);padding:9px 13px;border-radius:999px;background:rgba(20,16,13,.82);color:#fff;font:700 .68rem Montserrat,sans-serif;white-space:nowrap}
    body.lunch-viewer-open{overflow:hidden!important}
    @media(max-width:800px){
      .current-offer-media{height:auto!important;min-height:360px!important;padding:8px!important}
      .current-offer-media.fit-contain{min-height:400px!important}
      .current-offer-media.fit-contain img{height:auto!important;min-height:0!important;max-height:68vh!important;width:100%!important;padding:0!important}
      .current-offer-media:after{right:12px;bottom:12px;font-size:.6rem;padding:8px 10px}
      .lunch-image-viewer{padding:8px}
      .lunch-image-viewer img{max-width:98vw;max-height:88vh}
    }
  `;
  document.head.appendChild(style);

  const image = document.getElementById('cms-offer-image');
  const media = document.querySelector('.current-offer-media');
  if (!image || !media) return;

  image.tabIndex = 0;
  image.setAttribute('role','button');
  image.setAttribute('aria-label','Förstora veckans lunchbild');

  const viewer = document.createElement('div');
  viewer.className = 'lunch-image-viewer';
  viewer.setAttribute('aria-hidden','true');
  viewer.innerHTML = `<button type="button" aria-label="Stäng förstorad bild">×</button><img alt=""><span class="lunch-image-viewer-hint">Nyp för att zooma · tryck utanför för att stänga</span>`;
  document.body.appendChild(viewer);
  const viewerImage = viewer.querySelector('img');
  const close = viewer.querySelector('button');
  let lastFocus = null;

  const openViewer = () => {
    if (!image.src) return;
    lastFocus = document.activeElement;
    viewerImage.src = image.currentSrc || image.src;
    viewerImage.alt = image.alt || 'Veckans lunch';
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden','false');
    document.body.classList.add('lunch-viewer-open');
    close.focus({preventScroll:true});
  };
  const closeViewer = () => {
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden','true');
    document.body.classList.remove('lunch-viewer-open');
    if (lastFocus instanceof HTMLElement) lastFocus.focus({preventScroll:true});
  };

  media.addEventListener('click', openViewer);
  image.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openViewer();
    }
  });
  close.addEventListener('click', closeViewer);
  viewer.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && viewer.classList.contains('open')) closeViewer(); });
})();
