'use client';

interface HeaderProps {
  activeSection: string;
  sections: { id: string; label: string; icon: string }[];
}

export default function Header({ activeSection, sections }: HeaderProps) {
  const current = sections.find(s => s.id === activeSection);
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-sa-surface border-b border-sa-border flex items-center px-6 z-10">
      <div className="flex items-center gap-3">
        <span className="text-lg">{current?.icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-white leading-none">
            {current?.label}
          </h2>
          <p className="text-xs text-sa-muted mt-0.5">
            SemiAnalysis AI Tokenomics Model • All figures illustrative
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-sa-muted">Last updated: Jun 2026</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sa-green animate-pulse" />
          <span className="text-xs text-sa-green font-medium">LIVE MODEL</span>
        </div>
      </div>
    </header>
  );
}
