import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
} from "../api-zod";
import { db, usersTable } from "../db";
import { eq, sql } from "drizzle-orm";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value) return "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const u = new URL(value);
    const allowed = (process.env.REPLIT_DOMAINS ?? "").split(",").map(d => d.trim()).filter(Boolean);
    allowed.push("pockettaskpictou.vercel.app", "pockettask-3.onrender.com");
    if (allowed.some(d => u.hostname === d)) {
      return u.pathname + u.search + u.hash || "/";
    }
  } catch {}
  return "/";
}

function buildUserFromClaims(claims: Record<string, unknown>, role: "admin" | "user" = "user") {
  const sub = claims.sub as string;
  const email = (claims.email as string) || null;
  const username =
    (claims.preferred_username as string) ||
    (claims.username as string) ||
    (email ? email.split("@")[0] : sub);
  return {
    id: sub,
    username,
    firstName: ((claims.given_name || claims.first_name) as string) || null,
    lastName: ((claims.family_name || claims.last_name) as string) || null,
    profileImage: ((claims.picture || claims.profile_image_url) as string) || null,
    role,
  };
}

function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

async function upsertUserAndGetRole(
  claims: Record<string, unknown>,
): Promise<"admin" | "user"> {
  const sub = claims.sub as string;
  const email = (claims.email as string) || null;
  const firstName = ((claims.given_name || claims.first_name) as string) || null;
  const lastName = ((claims.family_name || claims.last_name) as string) || null;
  const profileImageUrl = ((claims.picture || claims.profile_image_url) as string) || null;

  const defaultRole = isAdminEmail(email) ? "admin" : "user";

  await db.execute(sql`
    INSERT INTO users (id, email, first_name, last_name, profile_image_url, role)
    VALUES (${sub}, ${email}, ${firstName}, ${lastName}, ${profileImageUrl}, ${defaultRole})
    ON CONFLICT (id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      first_name = COALESCE(EXCLUDED.first_name, users.first_name),
      last_name = COALESCE(EXCLUDED.last_name, users.last_name),
      profile_image_url = COALESCE(EXCLUDED.profile_image_url, users.profile_image_url),
      role = CASE
        WHEN ${defaultRole} = 'admin' THEN 'admin'
        ELSE users.role
      END,
      updated_at = NOW()
  `);

  const [row] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, sub));

  return (row?.role as "admin" | "user") ?? "user";
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", async (req: Request, res: Response) => {
  let config: Awaited<ReturnType<typeof getOidcConfig>>;
  try {
    config = await getOidcConfig();
  } catch (err) {
    console.error("[login] OIDC discovery failed:", err);
    res.status(500).json({ error: "Auth configuration error. Check GOOGLE_CLIENT_ID env var." });
    return;
  }

  const callbackUrl =
    process.env.CALLBACK_URL ?? `${getOrigin(req)}/api/callback`;
  console.log("[login] using callbackUrl:", callbackUrl);
  const returnTo = getSafeReturnTo(req.query.returnTo ?? req.query.redirect);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    access_type: "offline",
    prompt: "consent",
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);

  res.redirect(redirectTo.href);
});

router.get("/callback", async (req: Request, res: Response) => {
  try {
    let config: Awaited<ReturnType<typeof getOidcConfig>>;
    try {
      config = await getOidcConfig();
    } catch (err) {
      console.error("[callback] OIDC discovery failed:", err);
      res.status(500).json({ error: "Auth configuration error." });
      return;
    }

    const callbackUrl =
      process.env.CALLBACK_URL ?? `${getOrigin(req)}/api/callback`;
    console.log("[callback] callbackUrl:", callbackUrl, "req.url:", req.url);

    const codeVerifier = req.cookies?.code_verifier;
    const nonce = req.cookies?.nonce;
    const expectedState = req.cookies?.state;

    if (!codeVerifier || !expectedState) {
      console.warn("[callback] Missing code_verifier or state cookie, redirecting to login");
      res.redirect("/api/login");
      return;
    }

    // Build the full callback URL with query params from the request
    const reqUrl = new URL(req.url, `https://${req.headers.host}`);
    const currentUrl = new URL(callbackUrl);
    reqUrl.searchParams.forEach((v, k) => currentUrl.searchParams.set(k, v));
    console.log("[callback] currentUrl:", currentUrl.toString());

    let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
    try {
      tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedNonce: nonce,
        expectedState,
        idTokenExpected: true,
      });
    } catch (err) {
      console.error("[callback] Token exchange failed:", err);
      res.redirect("/api/login");
      return;
    }

    const returnTo = getSafeReturnTo(req.cookies?.return_to);

    res.clearCookie("code_verifier", { path: "/" });
    res.clearCookie("nonce", { path: "/" });
    res.clearCookie("state", { path: "/" });
    res.clearCookie("return_to", { path: "/" });

    const claims = tokens.claims();
    if (!claims) {
      console.error("[callback] No claims in token response");
      res.redirect("/api/login");
      return;
    }

    const rawClaims = claims as unknown as Record<string, unknown>;
    const role = await upsertUserAndGetRole(rawClaims);
    const user = buildUserFromClaims(rawClaims, role);

    const now = Math.floor(Date.now() / 1000);
    const sessionData: SessionData = {
      user,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : (claims.exp as number | undefined),
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.redirect(returnTo);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[callback] Unhandled error:", err);
    res.status(500).json({ error: "Login failed.", detail: msg });
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect(getOrigin(req));
});

export default router;
