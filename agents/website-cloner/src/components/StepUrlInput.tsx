"use client";

import { useState, useEffect } from "react";
import {
  Globe, ArrowRight, Clipboard, CheckCircle,
  AlertCircle, Loader2, Code2, Layers, Zap, ExternalLink,
} from "lucide-react";
import { cn, isValidUrl, normalizeUrl, getDomain } from "@/lib/utils";
import { CloneConfig, SiteAnalysis } from "@/lib/types";

interface Props {
  config: CloneConfig;
  updateConfig: (updates: Partial<CloneConfig>) => void;
  analysis: SiteAnalysis | null;
  isAnalyzing: boolean;
  analyzeUrl: (url: string) => void;
  onNext: () => void;
}

const EXAMPLES = ["stripe.com", "linear.app", "vercel.com", "tailwindcss.com"];

export default function StepUrlInput({
  config, updateConfig, analysis, isAnalyzing, analyzeUrl, onNext,
}: Props) {
  const [inputValue, setInputValue] = useState(config.url);
  const [isFocused,  setIsFocused]  = useState(false);
  const [analyzed,   setAnalyzed]   = useState(false);

  const normalized = normalizeUrl(inputValue);
  const isValid    = inputValue.trim().length > 3 && isValidUrl(normalized);

  // Debounced auto-analyze
  useEffect(() => {
    if (!isValid || analyzed) return;
    const t = setTimeout(() => {
      updateConfig({ url: normalized });
      analyzeUrl(normalized);
      setAnalyzed(true);
    }, 900);
    return () => clearTimeout(t);
  }, [inputValue, isValid, analyzed, normalized, updateConfig, analyzeUrl]);

  const handleChange = (val: string) => { setInputValue(val); setAnalyzed(false); };

  const handlePaste = async () => {
    try { handleChange((await navigator.clipboard.readText()).trim()); } catch { /* denied */ }
  };

  const handleContinue = () => {
    if (isValid) { updateConfig({ url: normalized }); onNext(); }
  };

  const complexityClass: Record<string, string> = {
    simple:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    moderate: "text-amber-400   bg-amber-400/10   border-amber-400/20",
    complex:  "text-red-400     bg-red-400/10     border-red-400/20",
  };

  return (
    <div className="animate-slide-up">
      {/* Hero */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-cyan-400 text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          AI-Powered Website Cloner
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          Clone{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Any Website
          </span>
        </h1>
        <p className="text-white/40 text-lg max-w-md mx-auto leading-relaxed">
          Enter a URL, answer a few questions, and get production-ready clone code powered by Claude AI.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Input */}
        <div className={cn(
          "rounded-2xl border transition-all duration-300 bg-white/3",
          isFocused && isValid  ? "border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.07)]"
          : isFocused           ? "border-white/20"
          : isValid             ? "border-cyan-500/25"
          : "border-white/8"
        )}>
          <div className="flex items-center gap-3 p-4">
            <Globe className={cn("w-5 h-5 shrink-0 transition-colors", isValid ? "text-cyan-400" : "text-white/20")} />
            <input
              type="url"
              value={inputValue}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              placeholder="https://example.com"
              autoFocus
              className="flex-1 bg-transparent text-white placeholder:text-white/20 text-lg outline-none min-w-0"
            />
            <div className="flex items-center gap-1 shrink-0">
              {isAnalyzing && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
              {!isAnalyzing && isValid && <CheckCircle className="w-4 h-4 text-cyan-400" />}
              <button
                onClick={handlePaste}
                title="Paste from clipboard"
                className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/60 transition-colors"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Validation error */}
        {inputValue.trim().length > 3 && !isValid && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-red-400 px-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Enter a valid URL (e.g., https://stripe.com)
          </p>
        )}

        {/* Site analysis preview */}
        {analysis && isValid && !isAnalyzing && (
          <div className="mt-3 rounded-xl border border-white/8 bg-white/2 p-4 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-white text-sm truncate">{analysis.title}</p>
                  <ExternalLink className="w-3 h-3 text-white/25 shrink-0" />
                </div>
                <p className="text-xs text-white/40 mb-2">{analysis.description}</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.technologies.map((tech) => (
                    <span key={tech} className="px-1.5 py-0.5 rounded bg-white/5 text-xs text-white/45">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-white/25 mb-1">Complexity</p>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                  complexityClass[analysis.complexity]
                )}>
                  {analysis.complexity}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={cn(
            "w-full mt-4 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200",
            isValid
              ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/20"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          Configure Clone
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Example URLs */}
        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-white/20">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => handleChange(`https://${ex}`)}
              className="text-xs text-white/30 hover:text-cyan-400 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mt-10">
          {[
            { icon: Globe,  label: "Any Framework", desc: "HTML, React, Next.js, Vue" },
            { icon: Layers, label: "Design Tokens",  desc: "Colors, fonts & spacing" },
            { icon: Code2,  label: "Clean Output",   desc: "Production-ready code" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/2 p-4 text-center">
              <Icon className="w-4 h-4 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-white mb-0.5">{label}</p>
              <p className="text-xs text-white/30">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
