(() => {
  "use strict";
  const section=document.querySelector("[data-events-section]");
  const grid=document.querySelector("#cms-events-grid");
  if(!section||!grid)return;
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  fetch("/content/events.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("events");return r.json()}).then(data=>{
    if(data.visible===false||!Array.isArray(data.events)||!data.events.length){section.hidden=true;return;}
    grid.innerHTML=data.events.slice(0,6).map(e=>`<article class="event-card reveal"><div class="event-top"><span class="event-type">${esc(e.type)}</span><span class="event-date">${esc(e.date)}</span></div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><div class="event-time"><strong>${esc(e.time)}</strong><span>${esc(e.note)}</span></div></article>`).join("");
    section.hidden=false;
    if(window.IntersectionObserver){grid.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));}
  }).catch(()=>{section.hidden=true});
})();
