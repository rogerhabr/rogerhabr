"use client";

import { CheckCircle2, Circle, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn, getDomain } from "@/lib/utils";
import { CloneConfig, ProcessingStage } from "@/lib/types";

interface Props {
  stages: ProcessingStage[];
  overallProgress: number;
  error: string | null;
  config: CloneConfig;
}

const STAGE_ORDER = ["fetch", "tokens", "components", "generate", "finalize"];

export default function StepProcessing({ stages, overallProgress, error, config }: Props) {
  const currentStage = stages.find((s) => s.status === "running");

  return (
    <div className="max-w-lg mx-auto text-center animate-slide-up">
      <div className="mb-10">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Cloning in Progress
        </h2>
        <p className="text-white/40 text-sm">
          Analyzing{" "}
          <span className="text-cyan-400">{getDomain(config.url)}</span>
          {" "}and generating your clone...
        </p>
      </div>

      {/* Circular progress ring */}
      <div className="relative w-36 h-36 mx-auto mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
          {/* Track */}
          <circle cx="72" cy="72" r="62" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="72" cy="72" r="62"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={String(2 * Math.PI * 62)}
            strokeDashoffset={String(2 * Math.PI * 62 * (1 - overallProgress / 100))}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white tabular-nums">{overallProgress}</span>
          <span className="text-xs text-white/30">%</span>
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-2.5 text-left">
        {stages
          .slice()
          .sort((a, b) => STAGE_ORDER.indexOf(a.id) - STAGE_ORDER.indexOf(b.id))
          .map((stage) => (
          <div
            key={stage.id}
            className={cn(
              "flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300",
              stage.status === "running"   && "border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]",
              stage.status === "completed" && "border-white/5 bg-white/1",
              stage.status === "error"     && "border-red-500/30 bg-red-500/5",
              stage.status === "pending"   && "border-white/4 bg-transparent opacity-40"
            )}
          >
            <div className="shrink-0 w-5 h-5 flex items-center justify-center">
              {stage.status === "completed" && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
              {stage.status === "running"   && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
              {stage.status === "pending"   && <Circle className="w-5 h-5 text-white/20" />}
              {stage.status === "error"     && <AlertCircle className="w-5 h-5 text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-sm",
                stage.status === "running"   && "text-white",
                stage.status === "completed" && "text-white/50",
                stage.status === "pending"   && "text-white/25",
                stage.status === "error"     && "text-red-400"
              )}>
                {stage.label}
              </p>
              <p className="text-xs text-white/25 truncate">{stage.description}</p>
              {stage.status === "running" && (
                <div className="mt-1.5 h-0.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse-slow" style={{ width: "60%" }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current stage message */}
      {currentStage && !error && (
        <p className="mt-5 text-xs text-white/35 flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {currentStage.description}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-6 flex items-start gap-2.5 p-4 rounded-xl border border-red-500/25 bg-red-500/8 text-left">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Cloning failed</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
