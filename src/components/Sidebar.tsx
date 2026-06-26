'use client';

interface Section {
  id: string;
  label: string;
  icon: string;
  group?: string;
}

interface SidebarProps {
  sections: Section[];
  active: string;
  onSelect: (id: string) => void;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ sections, active, onSelect, open = false, onClose }: SidebarProps) {
  let lastGroup = '';

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-10 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`fixed top-0 left-0 w-64 h-screen bg-sa-surface border-r border-sa-border flex flex-col z-20 transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-sa-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-sa-accent flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              AI
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Tokenomics</div>
              <div className="text-sa-muted text-xs leading-tight">AI Value Chain Model</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {sections.map(section => {
            const showDivider = section.group && section.group !== lastGroup;
            if (section.group) lastGroup = section.group;

            return (
              <div key={section.id}>
                {showDivider && (
                  <div className="px-3 pt-4 pb-1">
                    <span className="text-xs font-semibold text-sa-muted uppercase tracking-wider">
                      {section.group}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => handleSelect(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 text-left ${
                    active === section.id
                      ? 'bg-sa-accent/15 text-sa-accent font-medium border border-sa-accent/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{section.icon}</span>
                  <span className="truncate">{section.label}</span>
                  {active === section.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sa-accent flex-shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sa-border">
          <div className="text-xs text-sa-muted text-center leading-relaxed">
            © 2026 AI Tokenomics Model<br />
            <span className="text-sa-accent">SEC EDGAR · Yahoo Finance · Azure APIs</span>
          </div>
        </div>
      </aside>
    </>
  );
}
