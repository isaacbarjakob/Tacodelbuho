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
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value) => /^[+()\d\s-]{6,30}$/.test(value);
const BOOKING_TO_EMAIL = 'tacodelbuho@hotmail.com';
const normalizeDate = (value) => {
  const raw = clean(value, 20);
  const digits = raw.replace(/\D/g, '');
  return digits.length === 8 ? `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}` : raw;
};
const normalizeTime = (value) => {
  const raw = clean(value, 10);
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : raw;
};
const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};
const todayLocal = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
};
const openingHours = (date) => {
  const day = date.getDay();
  if (day === 1) return null;
  if (day === 5 || day === 6) return { open: '11:00', close: '23:00' };
  return { open: '11:00', close: '20:00' };
};
const validBookingTime = (time, hours) => {
  if (!/^\d{2}:\d{2}$/.test(time) || !hours) return false;
  const [hour, minute] = time.split(':').map(Number);
  if (minute !== 0 && minute !== 30) return false;
  return time >= hours.open && time < hours.close && hour >= 0 && hour <= 23;
};

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_API_KEY) return json({ error: 'Mailfunktionen är inte konfigurerad ännu.' }, 500);

  const origin = request.headers.get('Origin');
  const requestOrigin = new URL(request.url).origin;
  if (origin && origin !== requestOrigin) return json({ error: 'Ogiltig förfrågan.' }, 403);

  let form;
  try { form = await request.formData(); }
  catch { return json({ error: 'Formuläret kunde inte läsas.' }, 400); }

  if (clean(form.get('website'), 200)) return json({ ok: true });

  const name = clean(form.get('name'), 80);
  const phone = clean(form.get('phone'), 30);
  const email = clean(form.get('email'), 120).toLowerCase();
  const date = normalizeDate(form.get('date'));
  const time = normalizeTime(form.get('time'));
  const guestsValue = clean(form.get('guests'), 3);
  const guests = Number(guestsValue);
  const highchair = clean(form.get('highchair'), 10) === 'Ja';
  const birthday = clean(form.get('birthday'), 10) === 'Ja';
  const message = clean(form.get('message'), 1000);

  const bookingDate = parseDate(date);
  const hours = bookingDate ? openingHours(bookingDate) : null;
  const errors = [];
  if (name.length < 2) errors.push('namn');
  if (!validPhone(phone)) errors.push('telefon');
  if (!validEmail(email)) errors.push('e-post');
  if (!bookingDate || bookingDate < todayLocal()) errors.push('datum');
  if (bookingDate && !hours) errors.push('datum – restaurangen är stängd på måndagar');
  if (!validBookingTime(time, hours)) errors.push('tid');
  if (!Number.isInteger(guests) || guests < 1 || guests > 9) errors.push('antal personer');
  if (errors.length) return json({ error: `Kontrollera följande fält: ${errors.join(', ')}.` }, 400);

  const guestLabel = guests === 9 ? '9+ personer' : `${guests} ${guests === 1 ? 'person' : 'personer'}`;
  const extras = [highchair && 'Barnstol', birthday && 'Födelsedagsfirande'].filter(Boolean);
  const to = BOOKING_TO_EMAIL;
  // Keep the verified fallback sender unless RESEND_FROM_EMAIL is configured.
  const from = env.RESEND_FROM_EMAIL || 'Taco del Búho <onboarding@resend.dev>';
  const subject = `Ny bokningsförfrågan: ${date} kl. ${time} – ${guestLabel}`;
  const text = [
    'NY BOKNINGSFÖRFRÅGAN', '',
    `Namn: ${name}`, `Telefon: ${phone}`, `E-post: ${email}`,
    `Datum: ${date}`, `Tid: ${time}`, `Antal personer: ${guestLabel}`,
    `Extra: ${extras.length ? extras.join(', ') : 'Inga'}`,
    `Allergier/önskemål: ${message || 'Inga angivna'}`, '',
    'VIKTIGT: Detta är en bokningsförfrågan och behöver bekräftas av restaurangen.',
    'Svara på detta mejl för att kontakta kunden direkt.',
  ].join('\n');

  const html = `
  <div style="background:#f4eee5;padding:24px;font-family:Arial,sans-serif;color:#17130f">
    <div style="max-width:640px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 16px 45px rgba(0,0,0,.12)">
      <div style="background:#17130f;color:#fff4d8;padding:24px 28px">
        <div style="font-size:12px;letter-spacing:2px;color:#f6ad18;font-weight:700">TACO DEL BÚHO · STRÄNGNÄS</div>
        <h1 style="margin:8px 0 0;font-size:27px">Ny bokningsförfrågan</h1>
      </div>
      <div style="padding:26px 28px">
        <div style="padding:14px 16px;margin-bottom:20px;background:#fff2d1;border:1px solid #efcf7c;border-radius:12px;font-size:14px"><strong>Inte bekräftad ännu.</strong> Svara kunden via e-post eller telefon för att bekräfta bokningen.</div>
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr><td style="padding:9px 0;font-weight:700;width:38%">Namn</td><td style="padding:9px 0">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:9px 0;font-weight:700">Telefon</td><td style="padding:9px 0"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>
          <tr><td style="padding:9px 0;font-weight:700">E-post</td><td style="padding:9px 0"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:9px 0;font-weight:700">Datum</td><td style="padding:9px 0">${escapeHtml(date)}</td></tr>
          <tr><td style="padding:9px 0;font-weight:700">Tid</td><td style="padding:9px 0">${escapeHtml(time)}</td></tr>
          <tr><td style="padding:9px 0;font-weight:700">Antal</td><td style="padding:9px 0">${escapeHtml(guestLabel)}</td></tr>
          <tr><td style="padding:9px 0;font-weight:700">Extra</td><td style="padding:9px 0">${escapeHtml(extras.length ? extras.join(', ') : 'Inga')}</td></tr>
        </table>
        <div style="margin-top:20px;padding:17px;background:#f8f4ee;border-radius:12px">
          <strong>Allergier eller övriga önskemål</strong>
          <p style="white-space:pre-wrap;margin:9px 0 0;line-height:1.55">${escapeHtml(message || 'Inga angivna')}</p>
        </div>
        <a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent(`Bekräftelse av bokning hos Taco del Búho ${date} kl. ${time}`)}" style="display:inline-block;margin-top:22px;padding:14px 20px;border-radius:999px;background:#f05a18;color:#fff;text-decoration:none;font-weight:700">Svara kunden</a>
      </div>
    </div>
  </div>`;

  const payload = { from, to: [to], subject, html, text, reply_to: email };
  let resendResponse;
  try {
    resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
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

export function onRequestGet() { return json({ error: 'Method not allowed' }, 405); }
