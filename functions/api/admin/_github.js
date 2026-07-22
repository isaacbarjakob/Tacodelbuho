export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Cloudflare secrets copied from password managers can sometimes contain
// invisible Unicode marks or accidental spaces/newlines. Admin passwords in
// this project are intentionally compared without whitespace/invisible marks.
export function normalizePassword(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\u2060\uFEFF\s]/gu, '');
}

export function authorized(request, env) {
  const supplied = normalizePassword(request.headers.get('X-Admin-Password'));
  const expected = normalizePassword(env.ADMIN_PASSWORD);
  return expected.length > 0 && supplied.length > 0 && supplied === expected;
}

const clean = (value) => String(value ?? '').trim();

export function config(env) {
  let owner = clean(env.GITHUB_OWNER) || 'isaacbarjakob';
  let repo = clean(env.GITHUB_REPO) || 'Tacodelbuho';

  if (repo.includes('/')) {
    const parts = repo.split('/').filter(Boolean);
    if (parts.length >= 2) {
      owner = parts.at(-2);
      repo = parts.at(-1);
    }
  }

  return {
    owner,
    repo,
    branch: clean(env.GITHUB_BRANCH) || 'main',
    token: clean(env.GITHUB_TOKEN),
  };
}

export async function gh(env, path, options = {}) {
  const c = config(env);
  if (!c.token) throw new Error('GITHUB_TOKEN saknas i Cloudflare.');

  const response = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${c.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Taco-del-Buho-Admin',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `GitHub-fel ${response.status}`);
  return data;
}

export const decode = (base64) => {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const encode = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};
