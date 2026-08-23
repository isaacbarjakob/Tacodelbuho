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
