"use client";

import { useState } from "react";
import {
  Copy, Check, Download, RotateCcw, Palette, Layers,
  ChevronDown, FileCode, FileCode2, Braces,
} from "lucide-react";
import { cn, getDomain } from "@/lib/utils";
import { CloneConfig, CloneResult } from "@/lib/types";

interface Props {
  result: CloneResult;
  config: CloneConfig;
  onReset: () => void;
}

type Tab = "html" | "css" | "js";

const TAB_META: Record<Tab, { label: string; icon: React.ElementType; empty: string }> = {
  html: { label: "HTML",       icon: FileCode,  empty: "<!-- No HTML generated -->" },
  css:  { label: "CSS",        icon: FileCode2, empty: "/* No CSS generated */" },
  js:   { label: "JavaScript", icon: Braces,    empty: "// No JavaScript generated" },
};

export default function StepResults({ result, config, onReset }: Props) {
  const [activeTab,      setActiveTab]      = useState<Tab>("html");
  const [copied,         setCopied]         = useState(false);
  const [showTokens,     setShowTokens]     = useState(true);
  const [showComponents, setShowComponents] = useState(true);

  const content: Record<Tab, string> = {
    html: result.html || TAB_META.html.empty,
    css:  result.css  || TAB_META.css.empty,
    js:   result.js   || TAB_META.js.empty,
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTab = () => {
    const ext = activeTab;
    const blob = new Blob([content[activeTab]], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `${getDomain(config.url)}-clone.${ext}`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadAll = () => {
    const fullHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${getDomain(config.url)} — Clone</title>\n<style>\n${result.css}\n</style>\n</head>\n<body>\n${result.html}\n${result.js ? `\n<script>\n${result.js}\n</script>` : ""}\n</body>\n</html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `${getDomain(config.url)}-clone.html`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Clone Complete!
          </h2>
          <p className="text-white/40 text-sm mt-1">{result.summary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/18 text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/8 bg-white/3 text-white/50 hover:text-white text-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clone Another
          </button>
        </div>
      </div>

      {/* Code viewer */}
      <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden mb-5">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-white/6 px-1">
          <div className="flex">
            {(["html", "css", "js"] as Tab[]).map((tab) => {
              const { label, icon: Icon } = TAB_META[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all",
                    activeTab === tab
                      ? "border-cyan-400 text-cyan-400"
                      : "border-transparent text-white/30 hover:text-white/55"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 pr-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-white/35 hover:text-white text-xs transition-all"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5 text-cyan-400" /> Copied!</>
                : <><Copy className="w-3.5 h-3.5" /> Copy</>
              }
            </button>
            <button
              onClick={handleDownloadTab}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-white/5 text-white/35 hover:text-white text-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="h-96 overflow-auto bg-black/20">
          <pre className="p-5 text-xs font-mono text-white/75 whitespace-pre-wrap leading-relaxed">
            <code>{content[activeTab]}</code>
          </pre>
        </div>
      </div>

      {/* Design tokens + components */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Design tokens */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <button
            onClick={() => setShowTokens(!showTokens)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">Design Tokens</span>
              <span className="text-xs text-white/25">
                {result.designTokens.colors.length} colors · {result.designTokens.fonts.length} fonts
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-white/25 transition-transform duration-200", showTokens && "rotate-180")} />
          </button>
          {showTokens && (
            <div className="px-4 pb-4 border-t border-white/5 space-y-4 pt-3">
              {result.designTokens.colors.length > 0 && (
                <div>
                  <p className="text-xs text-white/25 mb-2">Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {result.designTokens.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1.5" title={color.value}>
                        <div
                          className="w-4 h-4 rounded border border-white/10 shrink-0"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-xs text-white/50">{color.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.designTokens.fonts.length > 0 && (
                <div>
                  <p className="text-xs text-white/25 mb-2">Fonts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.designTokens.fonts.map((font, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/55">{font}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.designTokens.spacing.length > 0 && (
                <div>
                  <p className="text-xs text-white/25 mb-2">Spacing Scale</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.designTokens.spacing.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/55 font-mono">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Components */}
        <div className="rounded-xl border border-white/8 bg-white/2 overflow-hidden">
          <button
            onClick={() => setShowComponents(!showComponents)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Components</span>
              <span className="text-xs text-white/25">{result.components.length} identified</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-white/25 transition-transform duration-200", showComponents && "rotate-180")} />
          </button>
          {showComponents && (
            <div className="px-4 pb-4 border-t border-white/5 pt-3">
              {result.components.length === 0 ? (
                <p className="text-xs text-white/25">No components identified.</p>
              ) : (
                <div className="space-y-2.5">
                  {result.components.map((comp, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm text-white/80 font-medium leading-tight">{comp.name}</p>
                        <p className="text-xs text-white/30 mt-0.5">{comp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
