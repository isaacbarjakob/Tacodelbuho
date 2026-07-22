(() => {
'use strict';
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
let password=sessionStorage.getItem('taco_admin_password')||''; let content={};
const api=async(path,options={})=>{const r=await fetch(path,{...options,headers:{...(options.headers||{}),'X-Admin-Password':password}});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||'Något gick fel');return data};
const setStatus=(text,error=false)=>{const el=$('#save-status');el.textContent=text;el.style.color=error?'#b42318':''};
async function login(){password=$('#password').value.trim();$('#login-status').textContent='Kontrollerar…';try{await api('/api/admin/auth',{method:'POST'});await load();sessionStorage.setItem('taco_admin_password',password);showApp()}catch(e){$('#login-status').textContent=e.message}}
async function load(){content=await api('/api/admin/content');fill()}
function showApp(){$('#login').hidden=true;$('#app').hidden=false;$('#logout').hidden=false}
function updatePreview(){const src=$('#offer-image').value.trim();const fit=$('#offer-image-fit').value;const pos=$('#offer-image-position').value;['#image-preview','#image-preview-mobile'].forEach(sel=>{const img=$(sel);img.src=src;img.style.objectPosition=pos});$$('.preview-frame').forEach(el=>{el.classList.toggle('fit-contain',fit==='contain');el.classList.toggle('fit-cover',fit==='cover')})}
function fill(){const a=content.aktuellt||{},e=content.events||{},s=content.settings||{};$('#offer-visible').checked=a.visible!==false;$('#offer-kicker').value=a.kicker||'';$('#offer-title').value=a.title||'';$('#offer-text').value=a.text||'';$('#offer-button-text').value=a.button_text||'';$('#offer-button-link').value=a.button_link||'';$('#offer-image').value=a.image||'';$('#offer-image-fit').value=a.image_fit==='cover'?'cover':'contain';$('#offer-image-position').value=['top','center','bottom'].includes(a.image_position)?a.image_position:'center';updatePreview();$('#events-visible').checked=e.visible!==false;renderEvents(e.events||[]);$('#hours-line1').value=s.hours?.line1||'';$('#hours-line2').value=s.hours?.line2||''}
function gather(){return {aktuellt:{visible:$('#offer-visible').checked,kicker:$('#offer-kicker').value,title:$('#offer-title').value,text:$('#offer-text').value,image:$('#offer-image').value,image_alt:$('#offer-title').value,image_fit:$('#offer-image-fit').value,image_position:$('#offer-image-position').value,show_button:true,button_text:$('#offer-button-text').value,button_link:$('#offer-button-link').value},events:{visible:$('#events-visible').checked,events:$$('.event-card').map(card=>({type:card.querySelector('[data-f=type]').value,date:card.querySelector('[data-f=date]').value,title:card.querySelector('[data-f=title]').value,text:card.querySelector('[data-f=text]').value,time:card.querySelector('[data-f=time]').value,note:card.querySelector('[data-f=note]').value}))},settings:{hours:{line1:$('#hours-line1').value,line2:$('#hours-line2').value}}}}
function renderEvents(events){const list=$('#event-list');list.innerHTML='';events.forEach(addEvent)}
function addEvent(e={}){const card=document.createElement('div');card.className='event-card';card.innerHTML=`<button class="remove-event" type="button">Ta bort</button><div class="grid"><label>Typ<input data-f="type" value="${esc(e.type||'EVENT')}"></label><label>Datum<input data-f="date" value="${esc(e.date||'')}"></label></div><label>Rubrik<input data-f="title" value="${esc(e.title||'')}"></label><label>Text<textarea data-f="text">${esc(e.text||'')}</textarea></label><div class="grid"><label>Tid<input data-f="time" value="${esc(e.time||'')}"></label><label>Notering<input data-f="note" value="${esc(e.note||'')}"></label></div>`;card.querySelector('.remove-event').onclick=()=>card.remove();$('#event-list').appendChild(card)}
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function save(){setStatus('Publicerar…');$('#save').disabled=true;try{await api('/api/admin/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(gather())});setStatus('Klart! Hemsidan uppdateras inom någon minut.')}catch(e){setStatus(e.message,true)}finally{$('#save').disabled=false}}
async function optimizeImage(file){
  if(!file.type.startsWith('image/'))throw new Error('Välj en bildfil.');
  const url=URL.createObjectURL(file);
  try{
    const img=new Image(); img.decoding='async'; img.src=url; await img.decode();
    const max=1600, scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
    const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,w,h);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.84));
    if(!blob)throw new Error('Kunde inte komprimera bilden.');
    return new File([blob],`bild-${Date.now()}.webp`,{type:'image/webp'});
  } finally {URL.revokeObjectURL(url)}
}
async function upload(){const original=$('#image-file').files[0];if(!original)return setStatus('Välj en bild först.',true);setStatus('Anpassar och komprimerar bilden…');$('#upload-btn').disabled=true;try{const file=await optimizeImage(original);const fd=new FormData();fd.append('file',file);setStatus('Laddar upp bilden…');const d=await api('/api/admin/upload',{method:'POST',body:fd});$('#offer-image').value=d.path;updatePreview();setStatus('Bilden är klar. Välj visningsläge och tryck Spara & publicera.')}catch(e){setStatus(e.message.includes('decode')?'Bilden kunde inte läsas. Spara den som JPG eller PNG och försök igen.':e.message,true)}finally{$('#upload-btn').disabled=false}}
$$('.nav').forEach(btn=>btn.onclick=()=>{$$('.nav').forEach(x=>x.classList.toggle('active',x===btn));$$('.view').forEach(v=>v.hidden=v.dataset.viewPanel!==btn.dataset.view);$('#page-title').textContent=btn.textContent});
$('#login-btn').onclick=login;$('#password').onkeydown=e=>{if(e.key==='Enter')login()};$('#logout').onclick=()=>{sessionStorage.clear();location.reload()};$('#save').onclick=save;$('#upload-btn').onclick=upload;$('#add-event').onclick=()=>addEvent();$('#offer-image').oninput=updatePreview;$('#offer-image-fit').onchange=updatePreview;$('#offer-image-position').onchange=updatePreview;
$('#logout').hidden=true;if(password){load().then(()=>showApp()).catch(()=>sessionStorage.clear())}
})();
