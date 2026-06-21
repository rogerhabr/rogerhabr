'use client';

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  subtext?: string;
  accent?: boolean;
  icon?: string;
  onClick?: () => void;
  linkTo?: string;
}

export default function MetricCard({
  label, value, change, changePositive, subtext, accent, icon, onClick,
}: MetricCardProps) {
  const cls = `rounded-xl p-4 border transition-colors ${
    accent
      ? 'bg-sa-accent/10 border-sa-accent/40'
      : 'bg-sa-card border-sa-border'
  } ${onClick ? 'cursor-pointer hover:border-sa-accent/60 hover:bg-sa-surface group' : ''}`;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-sa-muted font-medium uppercase tracking-wider leading-tight">
          {label}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          {icon && <span className="text-lg">{icon}</span>}
          {onClick && <span className="text-sa-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>}
        </div>
      </div>
      <p className={`text-2xl font-bold mt-2 number-cell ${accent ? 'text-sa-accent' : 'text-white'}`}>
        {value}
      </p>
      {change && (
        <p className={`text-xs mt-1 font-medium ${changePositive ? 'text-sa-green' : 'text-sa-red'}`}>
          {change}
        </p>
      )}
      {subtext && <p className="text-xs text-sa-muted mt-1">{subtext}</p>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`w-full text-left ${cls}`}>
        {inner}
      </button>
    );
  }

  return <div className={cls}>{inner}</div>;
}
