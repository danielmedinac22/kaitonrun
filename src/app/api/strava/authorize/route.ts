import { stravaAuthorizeUrl } from "@/lib/strava";

export async function GET() {
  const url = stravaAuthorizeUrl();
  return Response.redirect(url, 302);
}
