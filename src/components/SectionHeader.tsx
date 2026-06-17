'use client';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export default function SectionHeader({ title, subtitle, badge }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sa-accent/20 text-sa-accent border border-sa-accent/30">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-sa-muted leading-relaxed max-w-3xl">{subtitle}</p>
    </div>
  );
}
