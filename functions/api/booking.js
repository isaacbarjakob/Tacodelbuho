const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});

const clean = (value, max = 200) => String(value ?? '').trim().slice(0, max);
const escapeHtml = (value) => clean(value, 2000).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const validEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizeDate = (value) => {
  const raw = clean(value, 20);
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 8) return `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
  return raw;
};
const normalizeTime = (value) => {
  const raw = clean(value, 10);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(y,m-1,d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m-1 && parsed.getUTCDate() === d;
};
const validTime = (value) => {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const h = Number(match[1]), m = Number(match[2]);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
};

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return json({ error: 'Mailfunktionen är inte konfigurerad ännu.' }, 500);

  const origin = request.headers.get('Origin');
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin) return json({ error: 'Ogiltig förfrågan.' }, 403);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Formuläret kunde inte läsas.' }, 400);
  }

  // Honeypot: bots fill this hidden field. Return success without sending.
  if (clean(form.get('website'), 200)) return json({ ok: true });

  const name = clean(form.get('name'), 80);
  const phone = clean(form.get('phone'), 30);
  const email = clean(form.get('email'), 120);
  const date = normalizeDate(form.get('date'));
  const time = normalizeTime(form.get('time'));
  const guestsRaw = Number(form.get('guests'));
  const guests = Number.isInteger(guestsRaw) ? guestsRaw : 0;
  const message = clean(form.get('message'), 1000);

  const errors = [];
  if (!name) errors.push('namn');
  if (!phone) errors.push('telefon');
  if (!validEmail(email)) errors.push('e-post');
  if (!validDate(date)) errors.push('datum');
  if (!validTime(time)) errors.push('tid');
  if (guests < 1 || guests > 50) errors.push('antal personer');
  if (errors.length) {
    return json({ error: `Kontrollera följande fält: ${errors.join(', ')}.` }, 400);
  }

  const to = env.BOOKING_TO_EMAIL || 'tacodelbuho@hotmail.com';
  const from = env.RESEND_FROM_EMAIL || 'Taco del Búho <bokning@tacodelbuho.com>';
  const subject = `Ny bokningsförfrågan: ${date} kl. ${time} – ${guests} personer`;
  const text = [
    'NY BOKNINGSFÖRFRÅGAN', '',
    `Namn: ${name}`,
    `Telefon: ${phone}`,
    `E-post: ${email || 'Ej angiven'}`,
    `Datum: ${date}`,
    `Tid: ${time}`,
    `Antal personer: ${guests}`,
    `Övrigt: ${message || 'Inga önskemål'}`,
    '',
    'Detta är en bokningsförfrågan och behöver bekräftas av restaurangen.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#17130f">
      <div style="background:#17130f;color:#fff4d8;padding:22px 26px;border-radius:14px 14px 0 0">
        <div style="font-size:13px;letter-spacing:2px;color:#f6ad18;font-weight:700">TACO DEL BÚHO</div>
        <h1 style="margin:8px 0 0;font-size:26px">Ny bokningsförfrågan</h1>
      </div>
      <div style="border:1px solid #eadfc8;border-top:0;padding:24px 26px;border-radius:0 0 14px 14px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;font-weight:700">Namn</td><td style="padding:8px 0">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Telefon</td><td style="padding:8px 0"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
          <tr><td style="padding:8px 0;font-weight:700">E-post</td><td style="padding:8px 0">${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : 'Ej angiven'}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Datum</td><td style="padding:8px 0">${escapeHtml(date)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Tid</td><td style="padding:8px 0">${escapeHtml(time)}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700">Antal</td><td style="padding:8px 0">${guests} personer</td></tr>
        </table>
        <div style="margin-top:18px;padding:16px;background:#fff8e8;border-radius:10px">
          <strong>Övriga önskemål</strong>
          <p style="white-space:pre-wrap;margin:8px 0 0">${escapeHtml(message || 'Inga önskemål')}</p>
        </div>
        <p style="margin-top:20px;color:#6d6258;font-size:13px">Bokningen är inte bekräftad förrän ni har svarat kunden.</p>
      </div>
    </div>`;

  const payload = { from, to: [to], subject, html, text };
  if (email) payload.reply_to = email;

  let resendResponse;
  try {
    resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json({ error: 'Kunde inte kontakta mailtjänsten. Ring oss gärna istället.' }, 502);
  }

  const result = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    console.error('Resend error', result);
    return json({ error: 'Mailet kunde inte skickas just nu. Ring oss gärna på 08-410 441 02.' }, 502);
  }

  return json({ ok: true, id: result.id });
}

export function onRequestGet() {
  return json({ error: 'Method not allowed' }, 405);
}
