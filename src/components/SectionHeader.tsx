'use client';

import { SOURCE_TYPE_CONFIG, SourceType } from '@/lib/sources';

interface SourceMeta {
  type: SourceType;
  label: string;
  url?: string;
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  sources?: SourceMeta[];
}

export default function SectionHeader({ title, subtitle, badge, sources }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sa-accent/20 text-sa-accent border border-sa-accent/30">
            {badge}
          </span>
        )}
        {sources?.map((s, i) => {
          const cfg = SOURCE_TYPE_CONFIG[s.type];
          const inner = (
            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {s.label}
            </span>
          );
          return s.url
            ? <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">{inner}</a>
            : inner;
        })}
      </div>
      <p className="text-sm text-sa-muted leading-relaxed max-w-3xl">{subtitle}</p>
    </div>
  );
}
