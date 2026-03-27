import Anthropic from "@anthropic-ai/sdk";
import { CloneConfig, CloneResult, SiteAnalysis } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWebsite(url: string): Promise<SiteAnalysis> {
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze the website at ${url}.
Based on the URL and domain name, respond with only a valid JSON object (no markdown):
{
  "title": "estimated or inferred page title",
  "description": "one sentence describing what kind of website this is",
  "technologies": ["likely tech 1", "likely tech 2"],
  "complexity": "simple" | "moderate" | "complex"
}`,
      },
    ],
  });

  try {
    const content = response.content[0];
    if (content.type === "text") {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as SiteAnalysis;
    }
  } catch {
    // fallback below
  }

  return {
    title: new URL(url).hostname,
    description: "Website",
    technologies: ["HTML", "CSS", "JavaScript"],
    complexity: "moderate",
  };
}

const FRAMEWORK_INSTRUCTIONS: Record<CloneConfig["framework"], string> = {
  html: "vanilla HTML5 and CSS3 with no external frameworks or dependencies",
  react: "React 18 with functional components, hooks, and CSS modules",
  nextjs: "Next.js 15 App Router with TypeScript and Tailwind CSS",
  vue: "Vue 3 Composition API with scoped CSS styles",
};

const FIDELITY_INSTRUCTIONS: Record<CloneConfig["fidelity"], string> = {
  "pixel-perfect": "match every pixel — exact colors (use hex/rgb values), exact font sizes, line heights, spacing, border-radius, shadows, and all animations",
  "high-fidelity": "closely match the visual design — accurate colors, typography, layout, and spacing with minor acceptable variations",
  structural: "replicate the layout structure only — use placeholder colors, generic typography, and lorem ipsum content",
};

export async function* cloneWebsite(
  config: CloneConfig
): AsyncGenerator<{ stage: string; progress: number; message: string; result?: CloneResult }> {
  yield { stage: "fetch", progress: 10, message: "Fetching website content..." };

  let websiteHtml = "";
  try {
    const res = await fetch(config.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    websiteHtml = await res.text();
    // Truncate to a reasonable size for the AI
    if (websiteHtml.length > 12000) {
      websiteHtml = websiteHtml.slice(0, 12000) + "\n<!-- [truncated for analysis] -->";
    }
  } catch {
    websiteHtml = `<!-- Could not fetch ${config.url} directly. Generating clone based on URL and configuration. -->`;
  }

  yield { stage: "fetch", progress: 30, message: "Analyzing page structure..." };
  yield { stage: "tokens", progress: 45, message: "Extracting design tokens..." };
  yield { stage: "components", progress: 55, message: "Identifying UI components..." };
  yield { stage: "generate", progress: 65, message: "Generating clone with Claude AI..." };

  const prompt = `You are an expert web developer. Clone the following website.

Target URL: ${config.url}
Website HTML source:
\`\`\`html
${websiteHtml}
\`\`\`

Clone Requirements:
- Framework: ${FRAMEWORK_INSTRUCTIONS[config.framework]}
- Fidelity: ${FIDELITY_INSTRUCTIONS[config.fidelity]}
- Responsive: ${config.responsive ? "Yes — implement mobile (320px), tablet (768px), and desktop (1280px) breakpoints" : "Desktop only (1280px)"}
- Animations: ${config.preserveAnimations ? "Include CSS transitions and keyframe animations" : "No animations"}
- Hover effects: ${config.preserveInteractions ? "Include all hover and focus states" : "Skip hover effects"}
- Code comments: ${config.includeComments ? "Add meaningful comments explaining sections and key decisions" : "Minimal comments"}
${config.additionalNotes ? `- Extra instructions: ${config.additionalNotes}` : ""}

Generate a complete, functional clone. Respond with ONLY a valid JSON object, no markdown fences:
{
  "html": "complete HTML markup (full document for html framework, or component JSX for react/nextjs/vue)",
  "css": "complete stylesheet with all styles",
  "js": "JavaScript/TypeScript code (empty string if not needed)",
  "designTokens": {
    "colors": [{"name": "primary", "value": "#hex"}],
    "fonts": ["Font Family Name"],
    "spacing": ["4px", "8px", "16px", "24px", "32px"],
    "borderRadius": ["4px", "8px", "12px"]
  },
  "components": [
    {"name": "Component Name", "description": "What it does"}
  ],
  "summary": "One sentence describing what was cloned"
}`;

  const aiResponse = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  yield { stage: "generate", progress: 88, message: "Processing AI output..." };

  let result: CloneResult = {
    html: "",
    css: "",
    js: "",
    designTokens: { colors: [], fonts: [], spacing: [], borderRadius: [] },
    components: [],
    summary: "Clone generated successfully.",
  };

  try {
    const text = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "";
    // Strip potential markdown fences
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as CloneResult;
      result = { ...result, ...parsed };
    } else {
      result.html = text;
      result.summary = "Clone generated — raw AI output shown in HTML tab.";
    }
  } catch {
    const text = aiResponse.content[0].type === "text" ? aiResponse.content[0].text : "Error parsing response";
    result.html = text;
    result.summary = "Clone generated (JSON parse error — raw output in HTML tab).";
  }

  yield { stage: "finalize", progress: 96, message: "Packaging output..." };
  yield { stage: "complete", progress: 100, message: "Clone complete!", result };
}
