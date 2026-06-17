// All data is illustrative and based on publicly available estimates and analyst forecasts.
// Sources: Company filings, earnings calls, SemiAnalysis research, Omdia, IDC, analyst reports.

export const YEARS = ['2022', '2023', '2024', '2025E', '2026E', '2027E', '2028E'];
export const FORECAST_YEARS = ['2025E', '2026E', '2027E', '2028E'];

// ─── Hardware Installed Base ────────────────────────────────────────────────
// H100-equivalent GPU units (thousands), normalized by FP8 throughput

export const hyperscalerGPUs = [
  { year: '2022', Microsoft: 50,  Google: 80,  Amazon: 40,  Meta: 50,  Oracle: 5  },
  { year: '2023', Microsoft: 150, Google: 210, Amazon: 95,  Meta: 105, Oracle: 18 },
  { year: '2024', Microsoft: 490, Google: 590, Amazon: 340, Meta: 360, Oracle: 75 },
  { year: '2025E',Microsoft: 920, Google:1050, Amazon: 680, Meta: 650, Oracle:190 },
  { year: '2026E',Microsoft:1380, Google:1640, Amazon:1090, Meta:1020, Oracle:340 },
  { year: '2027E',Microsoft:1960, Google:2320, Amazon:1560, Meta:1450, Oracle:510 },
  { year: '2028E',Microsoft:2650, Google:3100, Amazon:2080, Meta:1980, Oracle:720 },
];

export const hyperscalerColors: Record<string, string> = {
  Microsoft: '#0078d4',
  Google:    '#4285f4',
  Amazon:    '#ff9900',
  Meta:      '#0668e1',
  Oracle:    '#f80000',
};

export const foundationLabGPUs = [
  { year: '2022', OpenAI: 20, Anthropic: 5,  xAI: 0,  DeepSeek: 2,  'Thinking Machines': 0 },
  { year: '2023', OpenAI: 30, Anthropic: 10, xAI: 8,  DeepSeek: 5,  'Thinking Machines': 2 },
  { year: '2024', OpenAI: 95, Anthropic: 28, xAI: 40, DeepSeek: 48, 'Thinking Machines': 8 },
  { year: '2025E',OpenAI:190, Anthropic: 65, xAI:130, DeepSeek:140, 'Thinking Machines':25 },
  { year: '2026E',OpenAI:310, Anthropic:125, xAI:250, DeepSeek:230, 'Thinking Machines':55 },
  { year: '2027E',OpenAI:440, Anthropic:195, xAI:400, DeepSeek:340, 'Thinking Machines':90 },
];

export const foundationLabColors: Record<string, string> = {
  OpenAI:               '#10b981',
  Anthropic:            '#f97316',
  xAI:                  '#8b5cf6',
  DeepSeek:             '#3b82f6',
  'Thinking Machines':  '#f59e0b',
};

export const neocloudGPUs = [
  { year: '2022', CoreWeave: 15,  Nebius: 2,  Crusoe: 2,  'Lambda Labs': 5  },
  { year: '2023', CoreWeave: 45,  Nebius: 5,  Crusoe: 5,  'Lambda Labs': 12 },
  { year: '2024', CoreWeave: 195, Nebius: 18, Crusoe: 14, 'Lambda Labs': 35 },
  { year: '2025E',CoreWeave: 480, Nebius: 75, Crusoe: 48, 'Lambda Labs': 85 },
  { year: '2026E',CoreWeave: 780, Nebius:145, Crusoe: 98, 'Lambda Labs':160 },
  { year: '2027E',CoreWeave:1080, Nebius:240, Crusoe:175, 'Lambda Labs':260 },
];

export const neocloudColors: Record<string, string> = {
  CoreWeave:     '#06b6d4',
  Nebius:        '#8b5cf6',
  Crusoe:        '#10b981',
  'Lambda Labs': '#f59e0b',
};

// CapEx by hyperscaler ($B)
export const hyperscalerCapex = [
  { year: '2022', Microsoft: 22, Google: 25, Amazon: 32, Meta: 15, Oracle: 4  },
  { year: '2023', Microsoft: 28, Google: 32, Amazon: 48, Meta: 28, Oracle: 8  },
  { year: '2024', Microsoft: 53, Google: 52, Amazon: 75, Meta: 38, Oracle: 14 },
  { year: '2025E',Microsoft: 80, Google: 75, Amazon:105, Meta: 65, Oracle: 30 },
  { year: '2026E',Microsoft:115, Google:108, Amazon:138, Meta: 92, Oracle: 50 },
  { year: '2027E',Microsoft:150, Google:143, Amazon:175, Meta:120, Oracle: 70 },
  { year: '2028E',Microsoft:190, Google:185, Amazon:215, Meta:155, Oracle: 90 },
];

// ─── Hardware Specs ──────────────────────────────────────────────────────────

export interface HardwareSpec {
  name: string;
  vendor: string;
  chip: string;
  fp8TFLOPS: number;
  hbmTB: number;
  hbmBWTBs: number;
  powerW: number;
  h100Equiv: number;
  releaseYear: number;
}

export const hardwareSpecs: HardwareSpec[] = [
  { name: 'H100 SXM5',       vendor: 'NVIDIA', chip: 'H100',    fp8TFLOPS: 1979,  hbmTB: 0.080, hbmBWTBs: 3.35, powerW: 700,    h100Equiv: 1.0,  releaseYear: 2022 },
  { name: 'H200 SXM5',       vendor: 'NVIDIA', chip: 'H200',    fp8TFLOPS: 1979,  hbmTB: 0.141, hbmBWTBs: 4.80, powerW: 700,    h100Equiv: 1.4,  releaseYear: 2024 },
  { name: 'B200 SXM',        vendor: 'NVIDIA', chip: 'B200',    fp8TFLOPS: 4500,  hbmTB: 0.192, hbmBWTBs: 8.00, powerW: 1000,   h100Equiv: 3.2,  releaseYear: 2025 },
  { name: 'GB200 NVL72',     vendor: 'NVIDIA', chip: 'GB200',   fp8TFLOPS:13900,  hbmTB: 8.064, hbmBWTBs:576.0, powerW: 120000, h100Equiv: 40.0, releaseYear: 2025 },
  { name: 'TPU v5p',         vendor: 'Google', chip: 'TPUv5p',  fp8TFLOPS: 459,   hbmTB: 0.095, hbmBWTBs: 2.76, powerW: 175,    h100Equiv: 0.9,  releaseYear: 2023 },
  { name: 'TPU v7 Ironwood', vendor: 'Google', chip: 'TPUv7',   fp8TFLOPS: 4614,  hbmTB: 0.192, hbmBWTBs: 7.37, powerW: 200,    h100Equiv: 4.5,  releaseYear: 2025 },
  { name: 'Trainium 2',      vendor: 'Amazon', chip: 'Trn2',    fp8TFLOPS: 2832,  hbmTB: 0.096, hbmBWTBs: 5.12, powerW: 700,    h100Equiv: 1.5,  releaseYear: 2024 },
  { name: 'Trainium 3',      vendor: 'Amazon', chip: 'Trn3',    fp8TFLOPS: 5664,  hbmTB: 0.192, hbmBWTBs: 9.60, powerW: 700,    h100Equiv: 3.0,  releaseYear: 2026 },
  { name: 'MI300X',          vendor: 'AMD',    chip: 'MI300X',  fp8TFLOPS: 2610,  hbmTB: 0.192, hbmBWTBs: 5.30, powerW: 750,    h100Equiv: 1.8,  releaseYear: 2024 },
  { name: 'MI350X',          vendor: 'AMD',    chip: 'MI350X',  fp8TFLOPS: 5220,  hbmTB: 0.288, hbmBWTBs: 9.60, powerW: 750,    h100Equiv: 3.5,  releaseYear: 2025 },
];

// ─── Model Architectures ─────────────────────────────────────────────────────

export interface ModelSpec {
  name: string;
  provider: string;
  params: number;
  activeParams: number;
  contextK: number;
  type: 'dense' | 'moe';
  released: string;
}

export const modelSpecs: ModelSpec[] = [
  { name: 'GPT-4o',          provider: 'OpenAI',    params: 87,   activeParams: 87,  contextK: 128, type: 'dense', released: '2024-05' },
  { name: 'GPT-5',           provider: 'OpenAI',    params: 500,  activeParams: 500, contextK: 200, type: 'dense', released: '2025-02' },
  { name: 'Claude Sonnet 4', provider: 'Anthropic', params: 70,   activeParams: 70,  contextK: 200, type: 'dense', released: '2025-02' },
  { name: 'Claude Opus 4.8', provider: 'Anthropic', params: 200,  activeParams: 200, contextK: 200, type: 'dense', released: '2025-06' },
  { name: 'DeepSeek V3',     provider: 'DeepSeek',  params: 671,  activeParams: 37,  contextK: 128, type: 'moe',   released: '2024-12' },
  { name: 'DeepSeek R2',     provider: 'DeepSeek',  params: 800,  activeParams: 40,  contextK: 128, type: 'moe',   released: '2025-06' },
  { name: 'Kimi K2',         provider: 'Moonshot',  params: 1000, activeParams: 32,  contextK: 128, type: 'moe',   released: '2025-07' },
  { name: 'Llama 4 Maverick',provider: 'Meta',      params: 400,  activeParams: 17,  contextK: 256, type: 'moe',   released: '2025-04' },
  { name: 'Gemini 2.5 Pro',  provider: 'Google',    params: 175,  activeParams: 175, contextK: 128, type: 'dense', released: '2025-03' },
];

// ─── Token Throughput Matrix ─────────────────────────────────────────────────
// Tokens/second per chip for inference (output tokens, batchsize ~32, fp8)

export const throughputMatrix: Record<string, Record<string, number>> = {
  'H100 SXM5':       { 'GPT-4o': 320, 'GPT-5': 88,  'Claude Sonnet 4': 385, 'DeepSeek V3': 430, 'Kimi K2': 400, 'Gemini 2.5 Pro': 260 },
  'H200 SXM5':       { 'GPT-4o': 460, 'GPT-5': 125, 'Claude Sonnet 4': 555, 'DeepSeek V3': 620, 'Kimi K2': 575, 'Gemini 2.5 Pro': 375 },
  'B200 SXM':        { 'GPT-4o': 780, 'GPT-5': 210, 'Claude Sonnet 4': 940, 'DeepSeek V3':1050, 'Kimi K2': 970, 'Gemini 2.5 Pro': 635 },
  'GB200 NVL72':     { 'GPT-4o':1850, 'GPT-5': 495, 'Claude Sonnet 4':2230, 'DeepSeek V3':2490, 'Kimi K2':2300, 'Gemini 2.5 Pro':1510 },
  'TPU v5p':         { 'GPT-4o': 290, 'GPT-5': 79,  'Claude Sonnet 4': 350, 'DeepSeek V3': 390, 'Kimi K2': 360, 'Gemini 2.5 Pro': 235 },
  'TPU v7 Ironwood': { 'GPT-4o': 640, 'GPT-5': 172, 'Claude Sonnet 4': 770, 'DeepSeek V3': 860, 'Kimi K2': 795, 'Gemini 2.5 Pro': 520 },
  'Trainium 2':      { 'GPT-4o': 280, 'GPT-5': 76,  'Claude Sonnet 4': 340, 'DeepSeek V3': 375, 'Kimi K2': 348, 'Gemini 2.5 Pro': 228 },
  'Trainium 3':      { 'GPT-4o': 525, 'GPT-5': 141, 'Claude Sonnet 4': 635, 'DeepSeek V3': 705, 'Kimi K2': 655, 'Gemini 2.5 Pro': 428 },
  'MI300X':          { 'GPT-4o': 410, 'GPT-5': 110, 'Claude Sonnet 4': 495, 'DeepSeek V3': 555, 'Kimi K2': 513, 'Gemini 2.5 Pro': 334 },
  'MI350X':          { 'GPT-4o': 720, 'GPT-5': 193, 'Claude Sonnet 4': 870, 'DeepSeek V3': 970, 'Kimi K2': 898, 'Gemini 2.5 Pro': 586 },
};

// ─── Workload Characteristics ────────────────────────────────────────────────

export interface WorkloadSpec {
  name: string;
  icon: string;
  avgInputTokens: number;
  avgOutputTokens: number;
  sessionsPerUserPerDay: number;
  adoptionShare2025: number;
  adoptionShare2027: number;
  color: string;
}

export const workloads: WorkloadSpec[] = [
  { name: 'Chat / Q&A',          icon: '💬', avgInputTokens: 200,   avgOutputTokens: 500,  sessionsPerUserPerDay: 4,   adoptionShare2025: 38, adoptionShare2027: 30, color: '#3b82f6' },
  { name: 'Coding',              icon: '⌨️', avgInputTokens: 600,   avgOutputTokens: 1200, sessionsPerUserPerDay: 8,   adoptionShare2025: 22, adoptionShare2027: 28, color: '#10b981' },
  { name: 'Document Analysis',   icon: '📄', avgInputTokens: 12000, avgOutputTokens: 600,  sessionsPerUserPerDay: 2,   adoptionShare2025: 18, adoptionShare2027: 20, color: '#f97316' },
  { name: 'Agentic / Reasoning', icon: '🤖', avgInputTokens: 3000,  avgOutputTokens: 2500, sessionsPerUserPerDay: 2,   adoptionShare2025: 12, adoptionShare2027: 15, color: '#8b5cf6' },
  { name: 'Image / Multimodal',  icon: '🖼️', avgInputTokens: 800,   avgOutputTokens: 400,  sessionsPerUserPerDay: 1.5, adoptionShare2025: 10, adoptionShare2027: 7,  color: '#f59e0b' },
];

// ─── Token Economy TAM ───────────────────────────────────────────────────────
// Revenue ($B)

export const tokenEconomyTAM = [
  { year: '2022', consumerApps: 0.4,  apiInference: 0.3, tokenSoftware: 0.1 },
  { year: '2023', consumerApps: 1.5,  apiInference: 1.2, tokenSoftware: 0.3 },
  { year: '2024', consumerApps: 5.2,  apiInference: 4.8, tokenSoftware: 2.0 },
  { year: '2025E',consumerApps: 14.5, apiInference:13.8, tokenSoftware: 7.2 },
  { year: '2026E',consumerApps: 36.0, apiInference:36.5, tokenSoftware:18.5 },
  { year: '2027E',consumerApps: 79.0, apiInference:82.0, tokenSoftware:40.0 },
  { year: '2028E',consumerApps:158.0, apiInference:165.0,tokenSoftware:80.0 },
];

// Key consumer applications
export interface TokenApp {
  name: string;
  provider: string;
  type: 'consumer' | 'api' | 'software';
  mau2024M: number;
  mau2025M: number;
  tokensPerUserPerDay: number;
  pricingModel: string;
  revenueRunRate2025B: number;
  color: string;
}

export const tokenApps: TokenApp[] = [
  { name: 'ChatGPT',             provider: 'OpenAI',    type: 'consumer', mau2024M: 180, mau2025M: 400,  tokensPerUserPerDay: 8000,  pricingModel: '$20/mo + API', revenueRunRate2025B: 11.6, color: '#10b981' },
  { name: 'Google AI Overviews', provider: 'Google',    type: 'consumer', mau2024M:1200, mau2025M:2200,  tokensPerUserPerDay: 2000,  pricingModel: 'Ad-supported',  revenueRunRate2025B: 0,    color: '#4285f4' },
  { name: 'Grok',                provider: 'xAI',       type: 'consumer', mau2024M: 45,  mau2025M: 120,  tokensPerUserPerDay: 6000,  pricingModel: '$8-16/mo',      revenueRunRate2025B: 1.0,  color: '#8b5cf6' },
  { name: 'Meta AI',             provider: 'Meta',      type: 'consumer', mau2024M: 400, mau2025M: 800,  tokensPerUserPerDay: 1500,  pricingModel: 'Free (bundled)', revenueRunRate2025B: 0,    color: '#0668e1' },
  { name: 'Gemini',              provider: 'Google',    type: 'consumer', mau2024M: 90,  mau2025M: 220,  tokensPerUserPerDay: 7500,  pricingModel: '$20/mo + API',  revenueRunRate2025B: 4.0,  color: '#4285f4' },
  { name: 'Claude (API)',        provider: 'Anthropic', type: 'api',      mau2024M: 25,  mau2025M: 75,   tokensPerUserPerDay: 25000, pricingModel: 'Per token',     revenueRunRate2025B: 3.0,  color: '#f97316' },
  { name: 'Perplexity',         provider: 'Perplexity',type: 'software', mau2024M: 15,  mau2025M: 40,   tokensPerUserPerDay: 5000,  pricingModel: '$20/mo',        revenueRunRate2025B: 0.5,  color: '#f59e0b' },
  { name: 'Cursor',             provider: 'Cursor',    type: 'software', mau2024M: 1.5, mau2025M: 5,    tokensPerUserPerDay: 40000, pricingModel: '$20/mo',        revenueRunRate2025B: 0.5,  color: '#06b6d4' },
  { name: 'Windsurf',           provider: 'Codeium',   type: 'software', mau2024M: 0.8, mau2025M: 2.5,  tokensPerUserPerDay: 38000, pricingModel: '$15/mo',        revenueRunRate2025B: 0.2,  color: '#6366f1' },
  { name: 'Harvey',             provider: 'Harvey',    type: 'software', mau2024M: 0.05,mau2025M: 0.15, tokensPerUserPerDay: 60000, pricingModel: 'Enterprise',    revenueRunRate2025B: 0.1,  color: '#ec4899' },
];

// ─── SAAS Disruption Tracker ─────────────────────────────────────────────────

export interface SaasDisruption {
  company: string;
  sector: string;
  revenue2024B: number;
  revenueAtRiskPct: number;
  seatModel: boolean;
  aiResponse: string;
  threatLevel: 'Adapting' | 'Medium' | 'High' | 'Critical';
  disruptors: string[];
  timelineYears: number;
}

export const saasDisruptions: SaasDisruption[] = [
  { company: 'Salesforce',  sector: 'CRM',          revenue2024B: 34.9, revenueAtRiskPct: 35, seatModel: true,  aiResponse: 'Agentforce platform', threatLevel: 'High',     disruptors: ['Decagon', 'Salesforce Agentforce', 'Anthropic agents'], timelineYears: 3 },
  { company: 'ServiceNow',  sector: 'IT Workflows',  revenue2024B: 10.9, revenueAtRiskPct: 50, seatModel: true,  aiResponse: 'Now Assist AI agents', threatLevel: 'Critical', disruptors: ['Moveworks', 'Aisera', 'OpenAI GPTs'], timelineYears: 2 },
  { company: 'Adobe',       sector: 'Creative',      revenue2024B: 21.5, revenueAtRiskPct: 45, seatModel: true,  aiResponse: 'Adobe Firefly & Gen AI', threatLevel: 'Critical', disruptors: ['Midjourney', 'Sora', 'OpenAI', 'Runway'], timelineYears: 2 },
  { company: 'Atlassian',   sector: 'Dev Tools',     revenue2024B: 4.4,  revenueAtRiskPct: 55, seatModel: true,  aiResponse: 'Rovo AI, Jira AI', threatLevel: 'Critical', disruptors: ['Cursor', 'GitHub Copilot', 'Linear AI'], timelineYears: 2 },
  { company: 'Workday',     sector: 'HCM / ERP',     revenue2024B: 7.3,  revenueAtRiskPct: 30, seatModel: true,  aiResponse: 'Workday AI agents', threatLevel: 'Medium',   disruptors: ['Rippling', 'TriNet', 'AI HR agents'], timelineYears: 4 },
  { company: 'SAP',         sector: 'ERP',           revenue2024B: 35.4, revenueAtRiskPct: 25, seatModel: true,  aiResponse: 'SAP Business AI', threatLevel: 'Medium',   disruptors: ['AI-native ERP startups', 'Microsoft Copilot'], timelineYears: 5 },
  { company: 'Microsoft',   sector: 'Productivity',  revenue2024B:211.9, revenueAtRiskPct: 15, seatModel: true,  aiResponse: 'Copilot across all products', threatLevel: 'Adapting', disruptors: ['Internal disruption'], timelineYears: 5 },
  { company: 'Oracle',      sector: 'Database / ERP',revenue2024B: 53.0, revenueAtRiskPct: 20, seatModel: true,  aiResponse: 'Oracle AI Data Platform', threatLevel: 'Adapting', disruptors: ['Snowflake', 'AI-native databases'], timelineYears: 4 },
];

// Token-consuming software companies (emerging)
export interface TokenConsumer {
  name: string;
  category: string;
  founded: number;
  arr2025M: number;
  revenueModel: string;
  tokensPerDollarRevenue: number;
  growthPctYoY: number;
  clusterMaxRating: string;
}

export const tokenConsumers: TokenConsumer[] = [
  { name: 'Cursor',            category: 'AI Coding',     founded: 2022, arr2025M: 500,  revenueModel: 'Subscription + usage', tokensPerDollarRevenue: 4200000, growthPctYoY: 400, clusterMaxRating: 'A+' },
  { name: 'Windsurf (Codeium)',category: 'AI Coding',     founded: 2021, arr2025M: 200,  revenueModel: 'Subscription',         tokensPerDollarRevenue: 3800000, growthPctYoY: 350, clusterMaxRating: 'A'  },
  { name: 'Harvey',            category: 'Legal AI',      founded: 2022, arr2025M: 100,  revenueModel: 'Enterprise seat + usage', tokensPerDollarRevenue: 8500000, growthPctYoY: 300, clusterMaxRating: 'B+' },
  { name: 'Perplexity',        category: 'AI Search',     founded: 2022, arr2025M: 150,  revenueModel: 'Sub + ads',            tokensPerDollarRevenue: 5200000, growthPctYoY: 280, clusterMaxRating: 'A'  },
  { name: 'Glean',             category: 'Enterprise AI', founded: 2019, arr2025M: 120,  revenueModel: 'Enterprise SaaS',      tokensPerDollarRevenue: 6100000, growthPctYoY: 250, clusterMaxRating: 'B+' },
  { name: 'Sierra',            category: 'AI Agents',     founded: 2023, arr2025M: 80,   revenueModel: 'Usage-based',          tokensPerDollarRevenue: 9800000, growthPctYoY: 500, clusterMaxRating: 'A'  },
  { name: 'Aisera',            category: 'IT Support AI', founded: 2017, arr2025M: 70,   revenueModel: 'Enterprise SaaS',      tokensPerDollarRevenue: 7200000, growthPctYoY: 180, clusterMaxRating: 'B'  },
  { name: 'Writer',            category: 'Enterprise AI', founded: 2020, arr2025M: 90,   revenueModel: 'Enterprise seat',      tokensPerDollarRevenue: 4900000, growthPctYoY: 220, clusterMaxRating: 'B+' },
];

// ─── Compute Supply vs Demand ─────────────────────────────────────────────────
// H100-equivalent EFLOPS (millions), annualized

export const supplyDemand = [
  { year: '2022', inferenceSupply: 0.8, trainingSupply: 0.4, inferenceDemand: 0.6, trainingDemand: 0.5 },
  { year: '2023', inferenceSupply: 2.2, trainingSupply: 1.1, inferenceDemand: 1.8, trainingDemand: 1.4 },
  { year: '2024', inferenceSupply: 6.8, trainingSupply: 3.2, inferenceDemand: 5.9, trainingDemand: 3.8 },
  { year: '2025E',inferenceSupply:16.5, trainingSupply: 7.5, inferenceDemand:14.8, trainingDemand: 9.2 },
  { year: '2026E',inferenceSupply:34.0, trainingSupply:15.0, inferenceDemand:32.5, trainingDemand:18.5 },
  { year: '2027E',inferenceSupply:64.0, trainingSupply:27.0, inferenceDemand:61.0, trainingDemand:32.0 },
  { year: '2028E',inferenceSupply:115.0,trainingSupply:48.0, inferenceDemand:112.0,trainingDemand:52.0 },
];

// Supply breakdown by provider type
export const supplyByType = [
  { year: '2022', hyperscalers: 0.9, foundationLabs: 0.2, neoclouds: 0.1 },
  { year: '2023', hyperscalers: 2.4, foundationLabs: 0.6, neoclouds: 0.3 },
  { year: '2024', hyperscalers: 7.5, foundationLabs: 1.8, neoclouds: 0.7 },
  { year: '2025E',hyperscalers:17.8, foundationLabs: 4.5, neoclouds: 1.7 },
  { year: '2026E',hyperscalers:37.0, foundationLabs: 9.0, neoclouds: 3.0 },
  { year: '2027E',hyperscalers:70.0, foundationLabs:15.0, neoclouds: 6.0 },
  { year: '2028E',hyperscalers:126.0,foundationLabs:26.0, neoclouds:11.0 },
];

// ─── ROIC Data ───────────────────────────────────────────────────────────────

export const roicByEntity = [
  { year: '2022', hyperscalers: -8,  foundationLabs: -55, neoclouds: 12 },
  { year: '2023', hyperscalers: -3,  foundationLabs: -42, neoclouds: 17 },
  { year: '2024', hyperscalers:  9,  foundationLabs: -28, neoclouds: 22 },
  { year: '2025E',hyperscalers: 19,  foundationLabs: -12, neoclouds: 26 },
  { year: '2026E',hyperscalers: 26,  foundationLabs:   4, neoclouds: 30 },
  { year: '2027E',hyperscalers: 29,  foundationLabs:  17, neoclouds: 34 },
  { year: '2028E',hyperscalers: 31,  foundationLabs:  25, neoclouds: 36 },
];

// ─── Revenue & Profit ────────────────────────────────────────────────────────
// Revenue by business model ($B)

export const revenueByModel = [
  { year: '2022', rental: 4,    model: 0.5, software: 1    },
  { year: '2023', rental: 8,    model: 2,   software: 5    },
  { year: '2024', rental: 22,   model: 10,  software: 18   },
  { year: '2025E',rental: 48,   model: 30,  software: 55   },
  { year: '2026E',rental: 95,   model: 70,  software: 130  },
  { year: '2027E',rental: 175,  model: 145, software: 280  },
  { year: '2028E',rental: 300,  model: 280, software: 520  },
];

// Operating margins by revenue type (%)
export const marginsByModel = [
  { year: '2022', rental: 28, model: -80, software: 45 },
  { year: '2023', rental: 31, model: -65, software: 40 },
  { year: '2024', rental: 35, model: -30, software: 38 },
  { year: '2025E',rental: 38, model:  -5, software: 42 },
  { year: '2026E',rental: 40, model:  18, software: 48 },
  { year: '2027E',rental: 42, model:  28, software: 52 },
  { year: '2028E',rental: 43, model:  35, software: 56 },
];

// ─── Hardware Demand Forecast ─────────────────────────────────────────────────
// GPU units shipped (H100-eq, thousands) for inference vs training

export const hardwareDemandForecast = [
  { year: '2022', inferenceGPUs: 180,  trainingGPUs: 120,  total: 300   },
  { year: '2023', inferenceGPUs: 480,  trainingGPUs: 320,  total: 800   },
  { year: '2024', inferenceGPUs: 1300, trainingGPUs: 700,  total: 2000  },
  { year: '2025E',inferenceGPUs: 3100, trainingGPUs: 1400, total: 4500  },
  { year: '2026E',inferenceGPUs: 6200, trainingGPUs: 2300, total: 8500  },
  { year: '2027E',inferenceGPUs:11500, trainingGPUs: 3500, total:15000  },
  { year: '2028E',inferenceGPUs:19500, trainingGPUs: 5000, total:24500  },
];

// By accelerator vendor market share (%)
export const vendorMarketShare = [
  { year: '2022', NVIDIA: 92, AMD: 4, Google: 2, Amazon: 1, Other: 1 },
  { year: '2023', NVIDIA: 90, AMD: 5, Google: 3, Amazon: 1, Other: 1 },
  { year: '2024', NVIDIA: 85, AMD: 8, Google: 4, Amazon: 2, Other: 1 },
  { year: '2025E',NVIDIA: 80, AMD:10, Google: 6, Amazon: 3, Other: 1 },
  { year: '2026E',NVIDIA: 75, AMD:12, Google: 7, Amazon: 4, Other: 2 },
  { year: '2027E',NVIDIA: 70, AMD:14, Google: 9, Amazon: 5, Other: 2 },
  { year: '2028E',NVIDIA: 65, AMD:16, Google:11, Amazon: 6, Other: 2 },
];

// ─── ROIC Calculator Defaults ─────────────────────────────────────────────────

export interface ROICInputs {
  hardware: string;
  numGPUs: number;
  costPerGPU: number;
  utilizationPct: number;
  revenuePerMTokens: number;
  tokensPerGPUPerSec: number;
  powerW: number;
  powerCostPerKWh: number;
  opexPctCapex: number;
  amortizationYears: number;
}

export const defaultROICInputs: ROICInputs = {
  hardware: 'GB200 NVL72',
  numGPUs: 72,
  costPerGPU: 65000,
  utilizationPct: 82,
  revenuePerMTokens: 1.50,
  tokensPerGPUPerSec: 800,
  powerW: 1667,
  powerCostPerKWh: 0.04,
  opexPctCapex: 10,
  amortizationYears: 3,
};

export const hardwareDefaults: Record<string, Partial<ROICInputs>> = {
  'H100 SXM5':       { costPerGPU: 30000, tokensPerGPUPerSec: 350, powerW: 700,    revenuePerMTokens: 2.50 },
  'H200 SXM5':       { costPerGPU: 40000, tokensPerGPUPerSec: 510, powerW: 700,    revenuePerMTokens: 2.00 },
  'B200 SXM':        { costPerGPU: 55000, tokensPerGPUPerSec: 860, powerW: 1000,   revenuePerMTokens: 1.75 },
  'GB200 NVL72':     { costPerGPU: 65000, tokensPerGPUPerSec: 800, powerW: 1667,   revenuePerMTokens: 1.50 },
  'TPU v7 Ironwood': { costPerGPU: 35000, tokensPerGPUPerSec: 700, powerW: 200,    revenuePerMTokens: 2.00 },
  'Trainium 3':      { costPerGPU: 30000, tokensPerGPUPerSec: 580, powerW: 700,    revenuePerMTokens: 2.20 },
  'MI300X':          { costPerGPU: 25000, tokensPerGPUPerSec: 460, powerW: 750,    revenuePerMTokens: 2.80 },
  'MI350X':          { costPerGPU: 38000, tokensPerGPUPerSec: 790, powerW: 750,    revenuePerMTokens: 2.00 },
};

export function calcROIC(inputs: ROICInputs) {
  const capex = inputs.numGPUs * inputs.costPerGPU;
  const secPerDay = 86400;
  const tokensPerGPUPerDay = inputs.tokensPerGPUPerSec * secPerDay;
  const totalTokensPerDay = inputs.numGPUs * tokensPerGPUPerDay * (inputs.utilizationPct / 100);
  const annualTokens = totalTokensPerDay * 365;
  const annualRevenue = (annualTokens / 1e6) * inputs.revenuePerMTokens;

  const totalPowerW = inputs.numGPUs * inputs.powerW;
  const annualPowerKWh = (totalPowerW / 1000) * 24 * 365;
  const annualPowerCost = annualPowerKWh * inputs.powerCostPerKWh;
  const annualOpex = (inputs.opexPctCapex / 100) * capex;
  const annualAmortization = capex / inputs.amortizationYears;
  const annualTotalCost = annualPowerCost + annualOpex + annualAmortization;
  const annualProfit = annualRevenue - annualTotalCost;
  const roic = (annualProfit / capex) * 100;
  const paybackMonths = annualProfit > 0 ? (capex / annualProfit) * 12 : Infinity;

  return {
    capex,
    annualRevenue,
    annualPowerCost,
    annualOpex,
    annualAmortization,
    annualTotalCost,
    annualProfit,
    roic,
    paybackMonths,
    annualTokensB: annualTokens / 1e9,
    grossMarginPct: ((annualRevenue - annualPowerCost - annualOpex) / annualRevenue) * 100,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(n: number, decimals = 0): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(decimals);
}

export function fmtB(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}T`;
  if (Math.abs(n) >= 1) return `$${n.toFixed(1)}B`;
  return `$${(n * 1000).toFixed(0)}M`;
}

export function fmtPct(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export const CHART_COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1', '#14b8a6',
];
