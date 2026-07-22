import assert from 'node:assert/strict';
import { onRequestPost, onRequestGet } from '../functions/api/admin/auth.js';

const req = (password) => new Request('https://example.pages.dev/api/admin/auth', {
  method: 'POST',
  headers: { 'X-Admin-Password': password },
});

let response = await onRequestPost({ request: req('Test2026!'), env: { ADMIN_PASSWORD: 'Test2026!' } });
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { ok: true });

response = await onRequestPost({ request: req(' Test 2026!\n'), env: { ADMIN_PASSWORD: '\uFEFFTest2026! ' } });
assert.equal(response.status, 200);

response = await onRequestPost({ request: req('wrong'), env: { ADMIN_PASSWORD: 'Test2026!' } });
assert.equal(response.status, 401);
assert.equal((await response.json()).code, 'INVALID_PASSWORD');

response = await onRequestPost({ request: req('anything'), env: {} });
assert.equal(response.status, 503);
assert.equal((await response.json()).code, 'ADMIN_PASSWORD_MISSING');

response = onRequestGet({ env: { ADMIN_PASSWORD: 'Test2026!' } });
assert.equal(response.status, 200);
assert.equal((await response.json()).passwordConfigured, true);

console.log('Admin auth tests passed.');
