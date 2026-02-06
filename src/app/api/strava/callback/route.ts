import { NextRequest } from "next/server";
import { exchangeCode, saveTokens } from "@/lib/strava";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    const msg = error || "No authorization code received";
    return Response.redirect(`${appUrl}/strava?error=${encodeURIComponent(msg)}`, 302);
  }

  try {
    const tokens = await exchangeCode(code);
    await saveTokens(tokens);
    return Response.redirect(`${appUrl}/strava?connected=1`, 302);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Token exchange failed";
    return Response.redirect(`${appUrl}/strava?error=${encodeURIComponent(msg)}`, 302);
  }
}
