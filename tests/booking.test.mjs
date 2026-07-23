import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from '../functions/api/booking.js';

const requestFor = (overrides = {}) => {
  const fields = {
    name: 'Test Person',
    phone: '070-123 45 67',
    email: 'kund@example.com',
    date: '2099-07-23',
    time: '18:30',
    guests: '4',
    message: 'Glutenfritt',
    ...overrides,
  };
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.set(key, value));
  return new Request('https://tacodelbuho.pages.dev/api/booking', {
    method: 'POST',
    headers: { Origin: 'https://tacodelbuho.pages.dev' },
    body: form,
  });
};

test('bokningsmejl skickas alltid till Taco del Búho', async () => {
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'email-test-id' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const response = await onRequestPost({
      request: requestFor(),
      env: {
        RESEND_API_KEY: 'test-key',
        BOOKING_TO_EMAIL: 'fel-adress@example.com',
        RESEND_FROM_EMAIL: 'Taco del Búho <bokning@example.com>',
      },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(sent.to, ['tacodelbuho@hotmail.com']);
    assert.equal(sent.reply_to, 'kund@example.com');
    assert.match(sent.subject, /2099-07-23 kl\. 18:30/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('bokningen kräver en giltig e-postadress', async () => {
  const response = await onRequestPost({
    request: requestFor({ email: 'inte-en-epost' }),
    env: { RESEND_API_KEY: 'test-key' },
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /e-post/);
});

test('bokning på stängd måndag stoppas', async () => {
  const response = await onRequestPost({
    request: requestFor({ date: '2099-07-20' }),
    env: { RESEND_API_KEY: 'test-key' },
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /stängd på måndagar/);
});
