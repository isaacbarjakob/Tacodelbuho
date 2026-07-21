import { authorized, json, normalizePassword } from './_github.js';

export async function onRequestPost({ request, env }) {
  const configured = normalizePassword(env.ADMIN_PASSWORD);
  if (!configured) {
    return json({
      error: 'ADMIN_PASSWORD saknas i Cloudflare Production. Lägg till den och starta en ny deployment.',
      code: 'ADMIN_PASSWORD_MISSING',
    }, 503);
  }

  if (!authorized(request, env)) {
    return json({
      error: 'Fel lösenord. Kontrollera att du använder exakt samma lösenord som i Cloudflare och att en ny deployment gjordes efter att variabeln sparades.',
      code: 'INVALID_PASSWORD',
    }, 401);
  }

  return json({ ok: true });
}

export function onRequestGet({ env }) {
  return json({
    ok: true,
    passwordConfigured: normalizePassword(env.ADMIN_PASSWORD).length > 0,
  });
}
