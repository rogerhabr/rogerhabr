"use client";

import { ArrowLeft, ArrowRight, Target, Code2, Layout, Monitor } from "lucide-react";
import { cn, getDomain } from "@/lib/utils";
import { CloneConfig, FidelityLevel, Framework, PageScope } from "@/lib/types";

interface Props {
  config: CloneConfig;
  updateConfig: (updates: Partial<CloneConfig>) => void;
  onBack: () => void;
  onNext: () => void;
}

function RadioCard<T extends string>({
  value, selected, onSelect, label, description, badge,
}: {
  value: T;
  selected: boolean;
  onSelect: (v: T) => void;
  label: string;
  description: string;
  badge?: string;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={cn(
        "relative text-left p-4 rounded-xl border w-full transition-all duration-150",
        selected
          ? "border-cyan-500/40 bg-cyan-500/8 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]"
          : "border-white/8 bg-white/2 hover:border-white/15 hover:bg-white/3"
      )}
    >
      {badge && (
        <span className="absolute top-2.5 right-2.5 text-xs px-1.5 py-0.5 rounded bg-purple-500/12 text-purple-400 border border-purple-500/20">
          {badge}
        </span>
      )}
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors",
          selected ? "border-cyan-400 bg-cyan-400" : "border-white/20"
        )} />
        <div>
          <p className={cn("text-sm font-medium leading-tight", selected ? "text-white" : "text-white/60")}>
            {label}
          </p>
          <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

function Section({ icon: Icon, title, hint, children }: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-sm text-white">{title}</h3>
        {hint && <span className="text-xs text-white/25">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export default function StepConfiguration({ config, updateConfig, onBack, onNext }: Props) {
  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/30 hover:text-white text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Configure Clone
        </h2>
        <p className="text-white/40 mt-1.5 text-sm">
          Cloning{" "}
          <span className="text-cyan-400 font-medium">{getDomain(config.url)}</span>
          {" "}— tell us exactly what you need
        </p>
      </div>

      <div className="space-y-8">
        {/* Fidelity */}
        <Section icon={Target} title="Clone Fidelity" hint="How closely should the clone match?">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <RadioCard<FidelityLevel>
              value="pixel-perfect" selected={config.fidelity === "pixel-perfect"}
              onSelect={(v) => updateConfig({ fidelity: v })}
              label="Pixel Perfect" description="Exact colors, spacing, fonts, and all animations" badge="Best" />
            <RadioCard<FidelityLevel>
              value="high-fidelity" selected={config.fidelity === "high-fidelity"}
              onSelect={(v) => updateConfig({ fidelity: v })}
              label="High Fidelity" description="Accurate look & feel with minor variations" />
            <RadioCard<FidelityLevel>
              value="structural" selected={config.fidelity === "structural"}
              onSelect={(v) => updateConfig({ fidelity: v })}
              label="Structural" description="Layout only, generic styling and placeholder content" />
          </div>
        </Section>

        {/* Framework */}
        <Section icon={Code2} title="Output Framework">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(
              [
                { value: "html",   label: "HTML / CSS",  description: "Vanilla, zero dependencies" },
                { value: "react",  label: "React",        description: "Functional components + hooks" },
                { value: "nextjs", label: "Next.js",      description: "App Router + Tailwind CSS",  badge: "Popular" },
                { value: "vue",    label: "Vue 3",         description: "Composition API + scoped CSS" },
              ] as Array<{ value: Framework; label: string; description: string; badge?: string }>
            ).map((opt) => (
              <RadioCard<Framework>
                key={opt.value}
                value={opt.value}
                selected={config.framework === opt.value}
                onSelect={(v) => updateConfig({ framework: v })}
                label={opt.label}
                description={opt.description}
                badge={opt.badge}
              />
            ))}
          </div>
        </Section>

        {/* Pages */}
        <Section icon={Layout} title="Pages to Clone">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <RadioCard<PageScope>
              value="homepage" selected={config.pageScope === "homepage"}
              onSelect={(v) => updateConfig({ pageScope: v })}
              label="Homepage Only" description="Just the main landing page" />
            <RadioCard<PageScope>
              value="full-site" selected={config.pageScope === "full-site"}
              onSelect={(v) => updateConfig({ pageScope: v })}
              label="Full Site" description="All pages discovered via links" />
            <RadioCard<PageScope>
              value="specific" selected={config.pageScope === "specific"}
              onSelect={(v) => updateConfig({ pageScope: v })}
              label="Specific Pages" description="You choose which pages to include" />
          </div>
        </Section>

        {/* Responsive */}
        <Section icon={Monitor} title="Responsive Design">
          <div className="grid grid-cols-2 gap-2.5">
            <RadioCard<"yes" | "no">
              value="yes" selected={config.responsive}
              onSelect={() => updateConfig({ responsive: true })}
              label="Responsive" description="Mobile (320px), tablet (768px) & desktop (1280px)" badge="Recommended" />
            <RadioCard<"yes" | "no">
              value="no" selected={!config.responsive}
              onSelect={() => updateConfig({ responsive: false })}
              label="Desktop Only" description="Single fixed 1280px layout" />
          </div>
        </Section>
      </div>

      <button
        onClick={onNext}
        className="w-full mt-10 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-cyan-500/15"
      >
        Advanced Options
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
