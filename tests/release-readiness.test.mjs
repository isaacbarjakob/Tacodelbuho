import assert from 'node:assert/strict';
import test from 'node:test';
import { access, readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

test('SEO pekar endast på den primära domänen', async () => {
  const [html, robots, sitemap] = await Promise.all([
    read('index.html'),
    read('robots.txt'),
    read('sitemap.xml'),
  ]);
  const releaseFiles = `${html}\n${robots}\n${sitemap}`;

  assert.doesNotMatch(releaseFiles, /https:\/\/tacodelbuho\.pages\.dev/);
  assert.match(html, /rel="canonical" href="https:\/\/tacodelbuho\.com\/"/);
  assert.match(html, /property="og:url" content="https:\/\/tacodelbuho\.com\/"/);
  assert.match(html, /"url":"https:\/\/tacodelbuho\.com\/"/);
  assert.match(html, /og:image:width" content="1200"/);
  assert.match(html, /og:image:height" content="630"/);
  assert.match(robots, /https:\/\/tacodelbuho\.com\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/tacodelbuho\.com\/<\/loc>/);
});

test('alla lokala bilder, skript och stilmallar som HTML-filerna länkar till finns', async () => {
  for (const htmlPath of ['index.html', '404.html', 'admin/index.html']) {
    const html = await read(htmlPath);
    const base = dirname(resolve(root, htmlPath));
    const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(match => match[1]);

    for (const reference of references) {
      if (/^(?:https?:|#|tel:|mailto:)/.test(reference) || reference === '/') continue;
      const clean = reference.split(/[?#]/)[0];
      const target = clean.startsWith('/') ? resolve(root, clean.slice(1)) : resolve(base, clean);
      await assert.doesNotReject(access(target), `${htmlPath} länkar till en fil som saknas: ${reference}`);
    }
  }
});

test('bokningsflödet har rätt mottagare och domänfri reservavsändare', async () => {
  const source = await read('functions/api/booking.js');

  assert.match(source, /const BOOKING_TO_EMAIL = 'tacodelbuho@hotmail\.com'/);
  assert.match(source, /Taco del Búho <onboarding@resend\.dev>/);
  assert.doesNotMatch(source, /bokning@tacodelbuho\.com/);
});

test('optimerade varumärkes- och delningsbilder håller rimlig storlek', async () => {
  const limits = new Map([
    ['assets/logo-512.webp', 30_000],
    ['assets/og-taco-del-buho.jpg', 100_000],
    ['assets/quesadilla-optimized.webp', 80_000],
    ['assets/smash-story-optimized.webp', 150_000],
  ]);

  for (const [path, maxBytes] of limits) {
    const info = await stat(resolve(root, path));
    assert.ok(info.size <= maxBytes, `${path} är större än ${maxBytes} bytes`);
  }
});

test('404-sidan hjälper besökaren vidare', async () => {
  const html = await read('404.html');
  assert.match(html, /href="\/">TILL STARTSIDAN/);
  assert.match(html, /href="\/#meny">SE MENYN/);
  assert.match(html, /href="\/#boka">BOKA BORD/);
});
