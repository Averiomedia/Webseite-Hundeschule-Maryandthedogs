import type { Context } from "@netlify/edge-functions";

const TOKEN_COOKIE  = "ch_token";
const CODE_COOKIE   = "ch_code";
const START_COOKIE  = "ch_start";
const ADMIN_COOKIE  = "ch_admin";
const PATH_PREFIX   = "/winter-challenge";
const MAX_AGE       = 60 * 60 * 24 * 90; // 90 days
const VIDEO_EXPIRY  = 60 * 60 * 4;       // 4 hours

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

function getCookie(header: string, name: string): string {
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return "";
}

// CHALLENGE_CODES format: "CODE1:2026-11-19,CODE2,CODE3:2026-11-25"
// Date is optional – no date means immediately available.
function parseCodes(raw: string): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.lastIndexOf(":");
    if (colonIdx > 0 && /^\d{4}-\d{2}-\d{2}$/.test(trimmed.slice(colonIdx + 1))) {
      const code = normalize(trimmed.slice(0, colonIdx));
      if (code) map.set(code, trimmed.slice(colonIdx + 1));
    } else {
      const code = normalize(trimmed);
      if (code) map.set(code, null);
    }
  }
  return map;
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const raw = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(raw)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacVerify(secret: string, data: string, expected: string): Promise<boolean> {
  const actual = await hmacSign(secret, data);
  if (actual.length !== expected.length) return false;
  let xor = 0;
  for (let i = 0; i < actual.length; i++) xor |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return xor === 0;
}

async function sha256hex(data: string): Promise<string> {
  const raw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return [...new Uint8Array(raw)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function makeCookie(name: string, value: string, maxAge: number, httpOnly = false): string {
  let s = `${name}=${value}; Secure; SameSite=Lax; Path=${PATH_PREFIX}; Max-Age=${maxAge}`;
  if (httpOnly) s += "; HttpOnly";
  return s;
}

function redirectTo(url: string, status = 302, cookies: string[] = []): Response {
  const h = new Headers({ Location: url });
  cookies.forEach(c => h.append("Set-Cookie", c));
  return new Response(null, { status, headers: h });
}

function notYetPage(): Response {
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Noch nicht freigeschaltet</title>
<style>body{font-family:system-ui,sans-serif;background:#FAF8F3;color:#1E1A14;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;margin:0}
.card{background:#fff;border-radius:16px;padding:40px 32px;max-width:400px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(139,94,60,.12)}
h1{font-size:1.4rem;margin-bottom:12px;font-weight:600}p{color:#8A7A68;line-height:1.6;margin:0 0 12px}a{color:#8B5E3C}</style></head>
<body><div class="card"><div style="font-size:2.5rem;margin-bottom:16px">🔒</div>
<h1>Deine Challenge startet bald</h1>
<p>Du bekommst eine Nachricht von mir, sobald dein Zugang aktiv ist.</p>
<p style="font-size:.85rem"><a href="mailto:info@maryandthedogs.de">info@maryandthedogs.de</a></p>
</div></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html;charset=utf-8", "Cache-Control": "no-store" }
  });
}

const clearCookies = [
  makeCookie(TOKEN_COOKIE, "", 0, true),
  makeCookie(CODE_COOKIE,  "", 0, false),
  makeCookie(START_COOKIE, "", 0, false),
  makeCookie(ADMIN_COOKIE, "", 0, false),
];

export default async function handler(req: Request, context: Context): Promise<Response> {
  const url       = new URL(req.url);
  const path      = url.pathname;
  const secret    = Deno.env.get("CHALLENGE_SECRET")     ?? "dev-secret-change-me";
  const rawCodes  = Deno.env.get("CHALLENGE_CODES")      ?? "";
  const adminCode = normalize(Deno.env.get("CHALLENGE_ADMIN_CODE") ?? "");
  const bunnyLib  = Deno.env.get("BUNNY_LIBRARY_ID")     ?? "";
  const bunnyKey  = Deno.env.get("BUNNY_TOKEN_KEY")      ?? "";
  const valid     = parseCodes(rawCodes);
  const loginUrl  = `${url.origin}${PATH_PREFIX}/login.html`;

  // ── 1. Login-Seite ist immer öffentlich
  if (path === `${PATH_PREFIX}/login.html`) return context.next();

  // ── 2. Auth-Endpunkt: POST mit Zugangscode
  if (path === `${PATH_PREFIX}/auth` && req.method === "POST") {
    let code = "";
    try { const fd = await req.formData(); code = normalize(fd.get("code")?.toString() ?? ""); }
    catch { return redirectTo(`${loginUrl}?error=1`); }

    // Admin-Code
    if (adminCode && code === adminCode) {
      const sig   = await hmacSign(secret, code);
      const token = btoa(`${code}:${sig}`);
      return redirectTo(`${url.origin}${PATH_PREFIX}/`, 303, [
        makeCookie(TOKEN_COOKIE, token,                    MAX_AGE, true),
        makeCookie(CODE_COOKIE,  encodeURIComponent(code), MAX_AGE, false),
        makeCookie(START_COOKIE, "admin",                  MAX_AGE, false),
        makeCookie(ADMIN_COOKIE, "1",                      MAX_AGE, false),
      ]);
    }

    if (!valid.has(code)) return redirectTo(`${loginUrl}?error=1`);

    const startDate = valid.get(code) ?? new Date().toISOString().split("T")[0];
    const sig   = await hmacSign(secret, code);
    const token = btoa(`${code}:${sig}`);

    return redirectTo(`${url.origin}${PATH_PREFIX}/`, 303, [
      makeCookie(TOKEN_COOKIE, token,                    MAX_AGE, true),
      makeCookie(CODE_COOKIE,  encodeURIComponent(code), MAX_AGE, false),
      makeCookie(START_COOKIE, startDate,                MAX_AGE, false),
    ]);
  }

  // ── 3. Alle anderen Pfade: Cookie prüfen
  const cookies  = req.headers.get("cookie") ?? "";
  const rawToken = getCookie(cookies, TOKEN_COOKIE);

  if (!rawToken) return redirectTo(loginUrl);

  let code: string, sig: string;
  try {
    const decoded = atob(rawToken);
    const sep = decoded.lastIndexOf(":");
    if (sep < 1) throw new Error("bad format");
    code = decoded.slice(0, sep);
    sig  = decoded.slice(sep + 1);
  } catch {
    return redirectTo(loginUrl, 302, clearCookies);
  }

  // Admin-Bypass: immer Zugang
  const isAdmin = !!(adminCode && code === adminCode);

  if (!isAdmin) {
    if (!valid.has(code))                           return redirectTo(loginUrl, 302, clearCookies);
    if (!(await hmacVerify(secret, code, sig)))     return redirectTo(loginUrl, 302, clearCookies);

    // Server-seitig: vor Startdatum → Warteseite
    const startDate = valid.get(code);
    if (startDate) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (todayStr < startDate) {
        const isIndexPage = path === `${PATH_PREFIX}/` || path === `${PATH_PREFIX}/index.html`;
        if (isIndexPage) return notYetPage();
      }
    }
  }

  // ── 4. Video-Token-Endpunkt (hinter Auth)
  if (path === `${PATH_PREFIX}/video-token` && req.method === "GET") {
    const videoId = url.searchParams.get("v");
    if (!videoId || !bunnyLib || !bunnyKey) {
      return new Response(JSON.stringify({ error: "not configured" }), {
        status: 404, headers: { "Content-Type": "application/json" }
      });
    }
    const iframeUrl = `https://player.mediadelivery.net/embed/${bunnyLib}/${videoId}?autoplay=false&responsive=true`;
    return new Response(JSON.stringify({ url: iframeUrl }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }

  return context.next();
}
