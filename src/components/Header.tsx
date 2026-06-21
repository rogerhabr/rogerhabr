'use client';

import { useGlobalParams } from '@/contexts/ParamsContext';

interface HeaderProps {
  activeSection: string;
  sections: { id: string; label: string; icon: string }[];
}

export default function Header({ activeSection, sections }: HeaderProps) {
  const current = sections.find(s => s.id === activeSection);
  const { setPanelOpen } = useGlobalParams();

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-sa-surface border-b border-sa-border flex items-center px-6 z-10">
      <div className="flex items-center gap-3">
        <span className="text-lg">{current?.icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-white leading-none">
            {current?.label}
          </h2>
          <p className="text-xs text-sa-muted mt-0.5">
            AI Tokenomics Model · All figures illustrative
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-sa-muted hidden sm:block">Updated: Jun 2026</span>
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sa-card border border-sa-border text-xs font-medium text-slate-400 hover:text-white hover:border-sa-accent transition-colors"
        >
          <span>⚙</span>
          <span>Tune Model</span>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sa-green animate-pulse" />
          <span className="text-xs text-sa-green font-medium">LIVE MODEL</span>
        </div>
      </div>
    </header>
  );
}
