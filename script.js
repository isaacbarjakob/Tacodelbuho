const t=document.getElementById('toggle'),n=document.getElementById('nav');
t.onclick=()=>{const open=n.classList.toggle('open');t.setAttribute('aria-expanded',String(open))};
document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>{n.classList.remove('open');t.setAttribute('aria-expanded','false')});
document.getElementById('year').textContent=new Date().getFullYear();

const form=document.getElementById('form');
const status=document.getElementById('status');

const bookingDate=form?.querySelector('input[name="date"]');
if(bookingDate){
  const today=new Date();
  const local=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
  bookingDate.min=local;
}

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!form.checkValidity()){
    form.reportValidity();
    status.textContent='Kontrollera de markerade fälten.';
    return;
  }
  status.textContent='Skickar bokningsförfrågan...';
  const button=form.querySelector('button[type="submit"]');
  button.disabled=true;

  try{
    const response=await fetch('/api/booking',{
      method:'POST',
      body:new FormData(form),
      headers:{'Accept':'application/json'}
    });
    let result={};
    try{result=await response.json()}catch{}
    if(response.ok){
      status.textContent='Tack! Din bokningsförfrågan är skickad direkt till oss. Vi återkommer med bekräftelse.';
      form.reset();
    }else{
      status.textContent=result.error||'Något gick fel. Ring oss gärna på 08-410 441 02.';
    }
  }catch(error){
    status.textContent='Kunde inte skicka just nu. Ring oss gärna på 08-410 441 02.';
  }finally{
    button.disabled=false;
  }
});


// Premium hero slideshow
const heroSlides=[...document.querySelectorAll('.hero-slide')];
let heroIndex=0;
if(heroSlides.length>1){
  setInterval(()=>{
    heroSlides[heroIndex].classList.remove('active');
    heroIndex=(heroIndex+1)%heroSlides.length;
    heroSlides[heroIndex].classList.add('active');
  },5200);
}

// Food carousel controls and auto movement
const foodTrack=document.querySelector('.food-track');
const prevButton=document.querySelector('.slider-arrow.prev');
const nextButton=document.querySelector('.slider-arrow.next');
const moveFood=(direction)=>{
  if(!foodTrack)return;
  const card=foodTrack.querySelector('.food-card');
  const distance=(card?.getBoundingClientRect().width||420)+22;
  foodTrack.scrollBy({left:direction*distance,behavior:'smooth'});
};
prevButton?.addEventListener('click',()=>moveFood(-1));
nextButton?.addEventListener('click',()=>moveFood(1));

let foodTimer;
const startFoodAuto=()=>{
  clearInterval(foodTimer);
  foodTimer=setInterval(()=>{
    if(!foodTrack)return;
    const nearEnd=foodTrack.scrollLeft+foodTrack.clientWidth>=foodTrack.scrollWidth-40;
    if(nearEnd)foodTrack.scrollTo({left:0,behavior:'smooth'});
    else moveFood(1);
  },6200);
};
foodTrack?.addEventListener('pointerdown',()=>clearInterval(foodTimer),{passive:true});
foodTrack?.addEventListener('pointerup',startFoodAuto,{passive:true});
startFoodAuto();


// Cloudflare Premium V11 interactions
const progressBar=document.querySelector('.scroll-progress span');
const updateProgress=()=>{
  const max=document.documentElement.scrollHeight-window.innerHeight;
  const value=max>0?(window.scrollY/max)*100:0;
  if(progressBar)progressBar.style.width=`${value}%`;
};
window.addEventListener('scroll',updateProgress,{passive:true});
updateProgress();

// Hero dots
const heroDotsWrap=document.querySelector('.hero-dots');
if(heroDotsWrap && heroSlides.length){
  heroSlides.forEach((_,i)=>{
    const dot=document.createElement('button');
    dot.type='button';
    dot.className=`hero-dot${i===0?' active':''}`;
    dot.setAttribute('aria-label',`Visa bild ${i+1}`);
    dot.addEventListener('click',()=>{
      heroSlides[heroIndex].classList.remove('active');
      heroDotsWrap.children[heroIndex]?.classList.remove('active');
      heroIndex=i;
      heroSlides[heroIndex].classList.add('active');
      heroDotsWrap.children[heroIndex]?.classList.add('active');
    });
    heroDotsWrap.appendChild(dot);
  });
  const heroObserver=new MutationObserver(()=>{
    [...heroDotsWrap.children].forEach((dot,i)=>dot.classList.toggle('active',heroSlides[i].classList.contains('active')));
  });
  heroSlides.forEach(slide=>heroObserver.observe(slide,{attributes:true,attributeFilter:['class']}));
}

// Scroll reveals
const revealObserver=new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

// Menu filters + search
const categories=[...document.querySelectorAll('.menu-category')];
const filterButtons=[...document.querySelectorAll('[data-menu-filter]')];
const searchInput=document.getElementById('menu-search');
const menuCount=document.getElementById('menu-count');
let activeFilter='all';

const normalizeText=(value='')=>value.toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const updateMenu=()=>{
  const term=normalizeText(searchInput?.value.trim()||'');
  let shown=0;
  categories.forEach(card=>{
    const matchesFilter=activeFilter==='all'||card.dataset.category===activeFilter;
    const matchesSearch=!term||normalizeText(card.textContent).includes(term);
    const visible=matchesFilter&&matchesSearch;
    card.classList.toggle('is-hidden',!visible);
    if(visible)shown++;
  });
  if(menuCount)menuCount.textContent=term||activeFilter!=='all'?`${shown} kategorier visas`:'';
};
filterButtons.forEach(button=>button.addEventListener('click',()=>{
  activeFilter=button.dataset.menuFilter;
  filterButtons.forEach(btn=>btn.classList.toggle('active',btn===button));
  updateMenu();
  document.getElementById('meny')?.scrollIntoView({behavior:'smooth',block:'start'});
}));
searchInput?.addEventListener('input',updateMenu);

// Food lightbox
const cards=[...document.querySelectorAll('.food-card')];
const lightbox=document.getElementById('lightbox');
const lightboxImg=lightbox?.querySelector('img');
const lightboxCaption=lightbox?.querySelector('figcaption');
let lightboxIndex=0;

const showLightbox=(index)=>{
  if(!lightbox||!cards.length)return;
  lightboxIndex=(index+cards.length)%cards.length;
  const image=cards[lightboxIndex].querySelector('img');
  const caption=cards[lightboxIndex].querySelector('figcaption');
  lightboxImg.src=image.currentSrc||image.src;
  lightboxImg.alt=image.alt;
  lightboxCaption.textContent=caption?.textContent||'';
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  lightbox.querySelector('.lightbox-close')?.focus();
};
const closeLightbox=()=>{
  if(!lightbox)return;
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
};
cards.forEach((card,index)=>{
  card.addEventListener('click',()=>showLightbox(index));
  card.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();showLightbox(index);
    }
  });
});
lightbox?.querySelector('.lightbox-close')?.addEventListener('click',closeLightbox);
lightbox?.querySelector('.lightbox-prev')?.addEventListener('click',()=>showLightbox(lightboxIndex-1));
lightbox?.querySelector('.lightbox-next')?.addEventListener('click',()=>showLightbox(lightboxIndex+1));
lightbox?.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox()});
document.addEventListener('keydown',event=>{
  if(!lightbox?.classList.contains('open'))return;
  if(event.key==='Escape')closeLightbox();
  if(event.key==='ArrowLeft')showLightbox(lightboxIndex-1);
  if(event.key==='ArrowRight')showLightbox(lightboxIndex+1);
});


// Ultimate V12 loader
window.addEventListener('load',()=>{
  setTimeout(()=>document.getElementById('site-loader')?.classList.add('hide'),450);
});

// Desktop order dock
const orderDock=document.querySelector('.desktop-order-dock');
const dockToggle=document.querySelector('.dock-toggle');
dockToggle?.addEventListener('click',()=>{
  const open=orderDock.classList.toggle('open');
  dockToggle.setAttribute('aria-expanded',String(open));
});
document.addEventListener('click',event=>{
  if(orderDock && !orderDock.contains(event.target)){
    orderDock.classList.remove('open');
    dockToggle?.setAttribute('aria-expanded','false');
  }
});

// Animated trust number
const countTargets=[...document.querySelectorAll('[data-count]')];
const countObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const el=entry.target;
    const target=Number(el.dataset.count||0);
    let current=0;
    const step=Math.max(1,Math.ceil(target/28));
    const timer=setInterval(()=>{
      current=Math.min(target,current+step);
      el.textContent=current+'+';
      if(current>=target)clearInterval(timer);
    },45);
    countObserver.unobserve(el);
  });
},{threshold:.5});
countTargets.forEach(el=>countObserver.observe(el));

// Gentle 3D tilt for food cards on pointer devices
if(window.matchMedia('(pointer:fine)').matches){
  document.querySelectorAll('.food-card').forEach(card=>{
    card.addEventListener('mousemove',event=>{
      const rect=card.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width-.5;
      const y=(event.clientY-rect.top)/rect.height-.5;
      card.style.transform=`translateY(-8px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*3).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave',()=>{card.style.transform=''});
  });
}

// Slutversion: toppmenyn göms vid nedscrollning och visas direkt vid uppscrollning.
(() => {
  const siteHeader = document.querySelector('header');
  if (!siteHeader) return;
  let lastY = window.scrollY;
  let ticking = false;
  const updateHeader = () => {
    const y = window.scrollY;
    const mobileMenuOpen = document.getElementById('nav')?.classList.contains('open');
    siteHeader.classList.toggle('nav-scrolled', y > 16);
    if (!mobileMenuOpen && y > 180 && y > lastY + 6) siteHeader.classList.add('nav-hidden');
    if (y < lastY - 4 || y < 120 || mobileMenuOpen) siteHeader.classList.remove('nav-hidden');
    lastY = Math.max(0, y);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => siteHeader.classList.remove('nav-hidden'));
  });
})();
