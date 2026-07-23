import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('mobilväljaren finns i den inloggade appen med alla adminsektioner', async () => {
  const html = await readFile(new URL('../admin/index.html', import.meta.url), 'utf8');
  const appStart = html.indexOf('<div id="app" hidden>');
  const pickerStart = html.indexOf('<div class="mobile-view-picker">');

  assert.ok(appStart >= 0);
  assert.ok(pickerStart > appStart);
  assert.match(html, /option value="aktuellt">Aktuellt &amp; lunch/);
  assert.match(html, /option value="events">Event/);
  assert.match(html, /option value="hours">Öppettider/);
});

test('mobilväljaren är sticky så sektionerna alltid går att nå', async () => {
  const css = await readFile(new URL('../admin/admin.css', import.meta.url), 'utf8');
  assert.match(css, /\.mobile-view-picker\{display:block;position:sticky;top:78px;z-index:35\}/);
  assert.match(css, /aside nav\{display:none\}/);
});
