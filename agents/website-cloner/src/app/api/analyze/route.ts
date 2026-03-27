import { NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/cloner-agent";
import { isValidUrl, normalizeUrl } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const { url } = body;

    if (!url?.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalized = normalizeUrl(url);
    if (!isValidUrl(normalized)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const analysis = await analyzeWebsite(normalized);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[analyze] error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
