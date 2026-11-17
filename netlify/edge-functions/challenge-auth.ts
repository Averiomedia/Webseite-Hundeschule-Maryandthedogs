import type { Context } from "@netlify/edge-functions";

const TOKEN_COOKIE = "ch_token";
const CODE_COOKIE  = "ch_code";
const PATH_PREFIX  = "/winter-challenge";
const MAX_AGE      = 60 * 60 * 24 * 90; // 90 days

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

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
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

export default async function handler(req: Request, context: Context): Promise<Response> {
  const url      = new URL(req.url);
  const path     = url.pathname;
  const secret   = Deno.env.get("CHALLENGE_SECRET") ?? "dev-secret-change-me";
  const rawCodes = Deno.env.get("CHALLENGE_CODES")  ?? "";
  const valid    = new Set(rawCodes.split(",").map(normalize).filter(Boolean));

  const loginUrl = `${url.origin}${PATH_PREFIX}/login.html`;

  // ── 1. Login-Seite ist immer öffentlich
  if (path === `${PATH_PREFIX}/login.html`) {
    return context.next();
  }

  // ── 2. Auth-Endpunkt: POST mit Zugangscode
  if (path === `${PATH_PREFIX}/auth` && req.method === "POST") {
    let code = "";
    try {
      const fd = await req.formData();
      code = normalize(fd.get("code")?.toString() ?? "");
    } catch {
      return redirectTo(`${loginUrl}?error=1`);
    }

    if (!valid.has(code)) {
      return redirectTo(`${loginUrl}?error=1`);
    }

    const sig   = await hmacSign(secret, code);
    const token = btoa(`${code}:${sig}`);

    return redirectTo(`${url.origin}${PATH_PREFIX}/`, 303, [
      makeCookie(TOKEN_COOKIE, token,                        MAX_AGE, true),
      makeCookie(CODE_COOKIE,  encodeURIComponent(code),     MAX_AGE, false),
    ]);
  }

  // ── 3. Alle anderen Pfade: Cookie prüfen
  const cookies   = req.headers.get("cookie") ?? "";
  const rawToken  = getCookie(cookies, TOKEN_COOKIE);

  if (!rawToken) return redirectTo(loginUrl);

  let code: string, sig: string;
  try {
    const decoded = atob(rawToken);
    const sep = decoded.lastIndexOf(":");
    if (sep < 1) throw new Error("bad format");
    code = decoded.slice(0, sep);
    sig  = decoded.slice(sep + 1);
  } catch {
    return redirectTo(loginUrl, 302, [
      makeCookie(TOKEN_COOKIE, "", 0, true),
      makeCookie(CODE_COOKIE,  "", 0, false),
    ]);
  }

  // Code noch aktiv?
  if (!valid.has(code)) {
    return redirectTo(loginUrl, 302, [
      makeCookie(TOKEN_COOKIE, "", 0, true),
      makeCookie(CODE_COOKIE,  "", 0, false),
    ]);
  }

  // Signatur gültig?
  if (!(await hmacVerify(secret, code, sig))) {
    return redirectTo(loginUrl, 302, [
      makeCookie(TOKEN_COOKIE, "", 0, true),
      makeCookie(CODE_COOKIE,  "", 0, false),
    ]);
  }

  return context.next();
}
