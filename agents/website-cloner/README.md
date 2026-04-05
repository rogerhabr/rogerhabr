# Website Cloner Agent

An AI-powered website cloning dashboard. Enter any URL, answer a guided Q&A, and receive production-ready clone code — powered by Claude claude-opus-4-6.

## Features

- **Guided wizard** — 5-step flow from URL to code
- **Multiple frameworks** — HTML/CSS, React, Next.js 15, Vue 3
- **3 fidelity levels** — Pixel-perfect, High-fidelity, Structural
- **Design token extraction** — Colors, fonts, spacing, border-radius
- **Real-time progress** — SSE streaming with stage-by-stage updates
- **Advanced options** — Toggles for assets, animations, interactions, comments
- **Download** — Individual tabs or all-in-one bundled HTML file

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) + React 19 |
| Styling   | Tailwind CSS v3 |
| AI        | Anthropic Claude claude-opus-4-6 via `@anthropic-ai/sdk` |
| Language  | TypeScript (strict) |
| Streaming | Server-Sent Events (SSE) |

## Getting Started

### 1. Install dependencies

```bash
cd agents/website-cloner
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get a key from [console.anthropic.com](https://console.anthropic.com).

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage Flow

```
Step 1  →  Enter target URL
            - Auto-analyzes site complexity
            - Shows technology stack preview

Step 2  →  Configure clone
            - Fidelity: Pixel Perfect / High Fidelity / Structural
            - Framework: HTML · React · Next.js · Vue 3
            - Pages: Homepage / Full Site / Specific
            - Responsive: Yes / No

Step 3  →  Advanced options
            - Toggle: assets, fonts, colors, animations, interactions, comments
            - Free-text additional instructions

Step 4  →  Live progress
            - Real-time SSE streaming with 5 stages
            - Circular progress ring + stage indicators

Step 5  →  Results
            - Tabbed code viewer (HTML / CSS / JS)
            - Copy & download per tab, or download all-in-one
            - Design token palette
            - Component inventory
```

## Project Structure

```
agents/website-cloner/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Entry point → Dashboard
│   │   ├── globals.css             # Base styles
│   │   └── api/
│   │       ├── analyze/route.ts    # POST /api/analyze
│   │       └── clone/route.ts      # POST /api/clone  (SSE stream)
│   ├── components/
│   │   ├── Dashboard.tsx           # Main shell + step router
│   │   ├── StepUrlInput.tsx        # Step 1 — URL entry
│   │   ├── StepConfiguration.tsx   # Step 2 — Clone options
│   │   ├── StepAdvanced.tsx        # Step 3 — Advanced toggles
│   │   ├── StepProcessing.tsx      # Step 4 — Live progress
│   │   └── StepResults.tsx         # Step 5 — Code output
│   ├── hooks/
│   │   └── useCloner.ts            # Central state machine
│   └── lib/
│       ├── types.ts                # TypeScript interfaces
│       ├── utils.ts                # cn(), URL helpers
│       └── cloner-agent.ts         # Claude AI integration
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

## API Routes

### `POST /api/analyze`

Quick site analysis using Claude AI.

**Body:** `{ url: string }`

**Response:** `{ title, description, technologies, complexity }`

---

### `POST /api/clone`

Starts the cloning process. Returns a Server-Sent Events stream.

**Body:** `CloneConfig` object

**Stream events:**
```
data: { stage, progress, message }
data: { stage: "complete", progress: 100, result: CloneResult }
data: { stage: "error", message: "..." }
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |

## Deploy

The app is a standard Next.js project — deploy to Vercel, Railway, or any Node.js host.

Note: The `/api/clone` route has `maxDuration = 120` set for Vercel serverless. Adjust if using other platforms.

## License

MIT
