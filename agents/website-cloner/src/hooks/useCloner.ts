"use client";

import { useState, useCallback } from "react";
import {
  CloneConfig,
  CloneResult,
  CloneStep,
  ProcessingStage,
  SiteAnalysis,
} from "@/lib/types";
import { normalizeUrl } from "@/lib/utils";

const DEFAULT_CONFIG: CloneConfig = {
  url: "",
  fidelity: "high-fidelity",
  framework: "html",
  pageScope: "homepage",
  specificPages: [],
  responsive: true,
  includeAssets: true,
  extractFonts: true,
  extractColors: true,
  preserveAnimations: true,
  preserveInteractions: true,
  includeComments: true,
  additionalNotes: "",
};

const INITIAL_STAGES: ProcessingStage[] = [
  { id: "fetch", label: "Fetching Content", description: "Retrieving website HTML, CSS, and assets", status: "pending", progress: 0 },
  { id: "tokens", label: "Extracting Tokens", description: "Analyzing colors, typography, and spacing", status: "pending", progress: 0 },
  { id: "components", label: "Identifying Components", description: "Mapping UI components and layout structure", status: "pending", progress: 0 },
  { id: "generate", label: "AI Generation", description: "Claude AI generating your clone in the chosen framework", status: "pending", progress: 0 },
  { id: "finalize", label: "Finalizing", description: "Optimizing and packaging the output", status: "pending", progress: 0 },
];

export function useCloner() {
  const [step, setStep] = useState<CloneStep>("url-input");
  const [config, setConfig] = useState<CloneConfig>(DEFAULT_CONFIG);
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);
  const [stages, setStages] = useState<ProcessingStage[]>(INITIAL_STAGES);
  const [result, setResult] = useState<CloneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const updateConfig = useCallback((updates: Partial<CloneConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const analyzeUrl = useCallback(async (url: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = (await res.json()) as SiteAnalysis;
        setAnalysis(data);
      }
    } catch {
      // non-critical — skip preview
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const startCloning = useCallback(async () => {
    setStep("processing");
    setStages(INITIAL_STAGES);
    setOverallProgress(0);
    setError(null);
    setResult(null);

    const normalizedConfig = { ...config, url: normalizeUrl(config.url) };

    try {
      const res = await fetch("/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedConfig),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to start cloning");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const update = JSON.parse(line.slice(6)) as {
              stage: string;
              progress: number;
              message: string;
              result?: CloneResult;
            };

            setOverallProgress(update.progress);

            setStages((prev) =>
              prev.map((stage) => {
                const stageIndex = prev.findIndex((s) => s.id === stage.id);
                const updateIndex = prev.findIndex((s) => s.id === update.stage);
                if (stage.id === update.stage) {
                  return { ...stage, status: "running" as const, progress: update.progress };
                }
                if (stageIndex < updateIndex) {
                  return { ...stage, status: "completed" as const, progress: 100 };
                }
                return stage;
              })
            );

            if (update.stage === "complete" && update.result) {
              setResult(update.result);
              setStages((prev) => prev.map((s) => ({ ...s, status: "completed" as const, progress: 100 })));
              setTimeout(() => setStep("results"), 600);
            }

            if (update.stage === "error") {
              throw new Error(update.message);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cloning failed";
      setError(message);
      setStages((prev) =>
        prev.map((s) =>
          s.status === "running" ? { ...s, status: "error" as const } : s
        )
      );
    }
  }, [config]);

  const reset = useCallback(() => {
    setStep("url-input");
    setConfig(DEFAULT_CONFIG);
    setAnalysis(null);
    setStages(INITIAL_STAGES);
    setResult(null);
    setError(null);
    setOverallProgress(0);
  }, []);

  return {
    step,
    setStep,
    config,
    updateConfig,
    analysis,
    isAnalyzing,
    analyzeUrl,
    stages,
    overallProgress,
    result,
    error,
    startCloning,
    reset,
  };
}
