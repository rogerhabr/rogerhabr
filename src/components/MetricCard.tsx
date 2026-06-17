'use client';

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  subtext?: string;
  accent?: boolean;
  icon?: string;
}

export default function MetricCard({
  label, value, change, changePositive, subtext, accent, icon,
}: MetricCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${
      accent
        ? 'bg-sa-accent/10 border-sa-accent/40'
        : 'bg-sa-card border-sa-border'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-sa-muted font-medium uppercase tracking-wider leading-tight">
          {label}
        </p>
        {icon && <span className="text-lg">{icon}</span>}
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
    </div>
  );
}
