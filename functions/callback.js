function readCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) return decodeURIComponent(valueParts.join("="));
  }
  return null;
}

function escapeForInlineScript(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

function callbackPage(status, content) {
  const statusJson = escapeForInlineScript(status);
  const contentJson = escapeForInlineScript(content);

  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex,nofollow">
  <title>GitHub-inloggning</title>
</head>
<body>
  <p>Inloggningen behandlas. Det här fönstret stängs automatiskt.</p>
  <script>
    (() => {
      const status = ${statusJson};
      const content = ${contentJson};

      const receiveMessage = (message) => {
        if (!window.opener) return;
        window.opener.postMessage(
          "authorization:github:" + status + ":" + JSON.stringify(content),
          message.origin
        );
        window.removeEventListener("message", receiveMessage, false);
      };

      window.addEventListener("message", receiveMessage, false);

      if (window.opener) {
        window.opener.postMessage("authorizing:github", "*");
      } else {
        document.body.innerHTML = "<p>Adminfönstret kunde inte hittas. Stäng detta fönster och försök igen.</p>";
      }
    })();
  </script>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const savedState = readCookie(request, "decap_oauth_state");

  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Set-Cookie": "decap_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
    "X-Content-Type-Options": "nosniff",
  };

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response(
      callbackPage("error", { message: "GitHub-variabler saknas i Cloudflare." }),
      { status: 500, headers }
    );
  }

  if (!code || !returnedState || !savedState || returnedState !== savedState) {
    return new Response(
      callbackPage("error", { message: "Ogiltig eller utgången inloggning. Försök igen." }),
      { status: 400, headers }
    );
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Taco-del-Buho-Decap-CMS",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/callback`,
        state: returnedState,
      }),
    });

    const result = await tokenResponse.json();

    if (!tokenResponse.ok || !result.access_token) {
      const message = result.error_description || result.error || "GitHub returnerade ingen åtkomstnyckel.";
      return new Response(callbackPage("error", { message }), {
        status: 400,
        headers,
      });
    }

    return new Response(
      callbackPage("success", {
        token: result.access_token,
        provider: "github",
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      callbackPage("error", {
        message: error instanceof Error ? error.message : "Okänt autentiseringsfel.",
      }),
      { status: 500, headers }
    );
  }
}
