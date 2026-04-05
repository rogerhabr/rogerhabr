"use client";

import { ArrowLeft, Play, Image, Type, Palette, Sparkles, MousePointer, MessageSquare } from "lucide-react";
import { cn, getDomain } from "@/lib/utils";
import { CloneConfig } from "@/lib/types";

interface Props {
  config: CloneConfig;
  updateConfig: (updates: Partial<CloneConfig>) => void;
  onBack: () => void;
  onStart: () => void;
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
        enabled ? "bg-cyan-500" : "bg-white/12"
      )}
    >
      <span className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
        enabled ? "left-4" : "left-0.5"
      )} />
    </button>
  );
}

function ToggleRow({
  icon: Icon, label, description, enabled, onToggle,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === " " && onToggle()}
      className={cn(
        "flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
        enabled ? "border-white/10 bg-white/3" : "border-white/5 bg-transparent hover:border-white/8 hover:bg-white/2"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          enabled ? "bg-cyan-500/15" : "bg-white/5"
        )}>
          <Icon className={cn("w-4 h-4", enabled ? "text-cyan-400" : "text-white/25")} />
        </div>
        <div>
          <p className={cn("text-sm font-medium", enabled ? "text-white" : "text-white/40")}>{label}</p>
          <p className="text-xs text-white/25">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );
}

export default function StepAdvanced({ config, updateConfig, onBack, onStart }: Props) {
  const toggles: Array<{ key: keyof CloneConfig; icon: React.ElementType; label: string; description: string }> = [
    { key: "includeAssets",        icon: Image,         label: "Download Assets",       description: "Fetch images, icons, and media files" },
    { key: "extractFonts",         icon: Type,          label: "Extract Fonts",          description: "Identify and embed typography styles" },
    { key: "extractColors",        icon: Palette,       label: "Extract Color Palette",  description: "Generate a design token color system" },
    { key: "preserveAnimations",   icon: Sparkles,      label: "Preserve Animations",    description: "Replicate CSS transitions & keyframe animations" },
    { key: "preserveInteractions", icon: MousePointer,  label: "Preserve Interactions",  description: "Include hover states and click behaviors" },
    { key: "includeComments",      icon: MessageSquare, label: "Code Comments",           description: "Add explanatory comments throughout the output" },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/30 hover:text-white text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Advanced Options
        </h2>
        <p className="text-white/40 mt-1.5 text-sm">Fine-tune what gets included in your clone</p>
      </div>

      {/* Toggles */}
      <div className="space-y-2 mb-8">
        {toggles.map(({ key, icon, label, description }) => (
          <ToggleRow
            key={key}
            icon={icon}
            label={label}
            description={description}
            enabled={config[key] as boolean}
            onToggle={() => updateConfig({ [key]: !(config[key] as boolean) })}
          />
        ))}
      </div>

      {/* Additional instructions */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-white/35 mb-2">
          Additional Instructions <span className="text-white/18">(optional)</span>
        </label>
        <textarea
          value={config.additionalNotes}
          onChange={(e) => updateConfig({ additionalNotes: e.target.value })}
          placeholder={`e.g. "Use dark mode only", "Replace images with placeholders", "Skip the footer section"...`}
          className="w-full h-24 rounded-xl border border-white/8 bg-white/3 p-4 text-sm text-white placeholder:text-white/15 outline-none focus:border-cyan-500/30 resize-none transition-colors leading-relaxed"
        />
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-4 mb-6">
        <p className="text-xs font-medium text-white/30 mb-3 uppercase tracking-wider">Clone Summary</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {[
            ["Target",     getDomain(config.url)],
            ["Fidelity",   config.fidelity],
            ["Framework",  config.framework],
            ["Pages",      config.pageScope],
            ["Responsive", config.responsive ? "Yes" : "No"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className="text-white/25 w-20 shrink-0">{label}</span>
              <span className="text-cyan-400 font-medium capitalize truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-cyan-500/15"
      >
        <Play className="w-4 h-4" />
        Start Cloning
      </button>
    </div>
  );
}
