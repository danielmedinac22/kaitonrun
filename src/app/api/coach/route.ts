import { NextRequest } from "next/server";
import { chat, type ChatMessage } from "@/lib/coach";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: ChatMessage[] = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ ok: false, error: "Missing messages array" }, { status: 400 });
    }

    const result = await chat(messages);

    return Response.json({
      ok: true,
      reply: result.reply,
      toolsUsed: result.toolsUsed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Coach error";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
