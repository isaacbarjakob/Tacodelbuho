export function authorized(request, env) {
  const supplied=request.headers.get('X-Admin-Password')||'';
  return Boolean(env.ADMIN_PASSWORD) && supplied===env.ADMIN_PASSWORD;
}
export function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
export function config(env){return {owner:env.GITHUB_OWNER||'isaacbarjakob',repo:env.GITHUB_REPO||'Tacodelbuho',branch:env.GITHUB_BRANCH||'main',token:env.GITHUB_TOKEN}}
export async function gh(env,path,options={}){const c=config(env);if(!c.token)throw new Error('GITHUB_TOKEN saknas i Cloudflare.');const r=await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}${path}`,{...options,headers:{'Accept':'application/vnd.github+json','Authorization':`Bearer ${c.token}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'Taco-del-Buho-Admin',...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||`GitHub-fel ${r.status}`);return d}
export const decode=b64=>decodeURIComponent(escape(atob(b64.replace(/\n/g,''))));
export const encode=text=>btoa(unescape(encodeURIComponent(text)));
