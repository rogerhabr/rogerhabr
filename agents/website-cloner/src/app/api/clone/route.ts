import { NextResponse } from "next/server";
import { cloneWebsite } from "@/lib/cloner-agent";
import { CloneConfig } from "@/lib/types";
import { isValidUrl, normalizeUrl } from "@/lib/utils";

export const maxDuration = 120; // 2-minute timeout for Vercel

export async function POST(request: Request) {
  try {
    const config = (await request.json()) as CloneConfig;

    if (!config.url?.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalized = normalizeUrl(config.url);
    if (!isValidUrl(normalized)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    config.url = normalized;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const update of cloneWebsite(config)) {
            const line = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(line));
          }
        } catch (error) {
          const errLine = `data: ${JSON.stringify({
            stage: "error",
            progress: 0,
            message: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`;
          controller.enqueue(encoder.encode(errLine));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[clone] error:", error);
    return NextResponse.json({ error: "Failed to start cloning" }, { status: 500 });
  }
}
