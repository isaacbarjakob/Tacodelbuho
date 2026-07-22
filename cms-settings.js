(() => {
  "use strict";
  fetch("/content/settings.json", { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error("settings"); return r.json(); })
    .then(data => {
      const el = document.querySelector("[data-cms-hours]");
      if (!el || !data.hours) return;
      el.innerHTML = `${escapeHtml(data.hours.line1 || "")}<br>${escapeHtml(data.hours.line2 || "")}`;
    })
    .catch(() => {});
  function escapeHtml(v){
    return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
})();
