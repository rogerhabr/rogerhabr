'use client';

import { SOURCE_TYPE_CONFIG, SourceType } from '@/lib/sources';

interface Props {
  type: SourceType;
  compact?: boolean;
}

export default function SourceTag({ type, compact = false }: Props) {
  const cfg = SOURCE_TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {compact ? cfg.label[0] : cfg.label}
    </span>
  );
}
