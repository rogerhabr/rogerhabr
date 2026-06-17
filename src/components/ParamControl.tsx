'use client';

interface ParamControlProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

export default function ParamControl({ label, value, options, onChange }: ParamControlProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-sa-muted">{label}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs bg-sa-card border border-sa-border text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-sa-accent"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
