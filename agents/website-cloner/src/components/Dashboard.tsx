"use client";

import { useCloner } from "@/hooks/useCloner";
import StepUrlInput from "./StepUrlInput";
import StepConfiguration from "./StepConfiguration";
import StepAdvanced from "./StepAdvanced";
import StepProcessing from "./StepProcessing";
import StepResults from "./StepResults";
import { Globe, Settings, Zap, Code2, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "url-input",      label: "URL",      icon: Globe },
  { id: "configuration",  label: "Configure", icon: Settings },
  { id: "advanced",       label: "Options",   icon: Zap },
  { id: "processing",     label: "Cloning",   icon: Code2 },
  { id: "results",        label: "Results",   icon: CheckCircle2 },
] as const;

export default function Dashboard() {
  const cloner = useCloner();
  const currentIndex = STEPS.findIndex((s) => s.id === cloner.step);

  return (
    <div className="min-h-screen bg-[#080c18] text-white">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 backdrop-blur-xl bg-black/20 sticky top-0">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Website Cloner</span>
            <span className="hidden sm:inline text-xs text-white/25 ml-1">powered by Claude AI</span>
          </div>

          {/* Step breadcrumb — desktop */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Progress">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const done    = index < currentIndex;
              const current = index === currentIndex;
              return (
                <div key={step.id} className="flex items-center gap-1">
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                    current && "bg-cyan-500/15 text-cyan-400 ring-1 ring-inset ring-cyan-500/25",
                    done    && "text-white/50",
                    !current && !done && "text-white/18"
                  )}>
                    {done
                      ? <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      : <Icon className="w-3 h-3" />
                    }
                    {step.label}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn("w-3 h-px", done ? "bg-cyan-500/30" : "bg-white/8")} />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile counter */}
          <p className="md:hidden text-xs text-white/30">Step {currentIndex + 1}/{STEPS.length}</p>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 pb-24">
        {cloner.step === "url-input" && (
          <StepUrlInput
            config={cloner.config}
            updateConfig={cloner.updateConfig}
            analysis={cloner.analysis}
            isAnalyzing={cloner.isAnalyzing}
            analyzeUrl={cloner.analyzeUrl}
            onNext={() => cloner.setStep("configuration")}
          />
        )}
        {cloner.step === "configuration" && (
          <StepConfiguration
            config={cloner.config}
            updateConfig={cloner.updateConfig}
            onBack={() => cloner.setStep("url-input")}
            onNext={() => cloner.setStep("advanced")}
          />
        )}
        {cloner.step === "advanced" && (
          <StepAdvanced
            config={cloner.config}
            updateConfig={cloner.updateConfig}
            onBack={() => cloner.setStep("configuration")}
            onStart={cloner.startCloning}
          />
        )}
        {cloner.step === "processing" && (
          <StepProcessing
            stages={cloner.stages}
            overallProgress={cloner.overallProgress}
            error={cloner.error}
            config={cloner.config}
          />
        )}
        {cloner.step === "results" && cloner.result && (
          <StepResults
            result={cloner.result}
            config={cloner.config}
            onReset={cloner.reset}
          />
        )}
      </main>
    </div>
  );
}
