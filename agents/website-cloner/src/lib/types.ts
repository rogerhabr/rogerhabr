export type FidelityLevel = "pixel-perfect" | "high-fidelity" | "structural";
export type Framework = "html" | "react" | "nextjs" | "vue";
export type PageScope = "homepage" | "full-site" | "specific";
export type CloneStep = "url-input" | "configuration" | "advanced" | "processing" | "results";

export interface CloneConfig {
  url: string;
  fidelity: FidelityLevel;
  framework: Framework;
  pageScope: PageScope;
  specificPages: string[];
  responsive: boolean;
  includeAssets: boolean;
  extractFonts: boolean;
  extractColors: boolean;
  preserveAnimations: boolean;
  preserveInteractions: boolean;
  includeComments: boolean;
  additionalNotes: string;
}

export interface ProcessingStage {
  id: string;
  label: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  progress: number;
}

export interface DesignTokens {
  colors: Array<{ name: string; value: string }>;
  fonts: string[];
  spacing: string[];
  borderRadius: string[];
}

export interface CloneResult {
  html: string;
  css: string;
  js: string;
  designTokens: DesignTokens;
  components: Array<{ name: string; description: string }>;
  summary: string;
}

export interface SiteAnalysis {
  title: string;
  description: string;
  technologies: string[];
  complexity: "simple" | "moderate" | "complex";
}
