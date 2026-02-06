import { loadProfile } from "@/lib/athlete";

export async function GET() {
  try {
    const profile = await loadProfile();
    return Response.json({ ok: true, profile: profile || {} });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Profile error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
