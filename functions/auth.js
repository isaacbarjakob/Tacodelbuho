function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.GITHUB_CLIENT_ID) {
    return new Response("GITHUB_CLIENT_ID saknas i Cloudflare.", { status: 500 });
  }

  const requestUrl = new URL(request.url);
  const state = randomState();
  const callbackUrl = `${requestUrl.origin}/callback`;

  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set("redirect_uri", callbackUrl);
  githubUrl.searchParams.set("scope", "repo");
  githubUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: githubUrl.toString(),
      "Set-Cookie": `decap_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store",
    },
  });
}
