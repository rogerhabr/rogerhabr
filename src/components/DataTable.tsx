'use client';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (v: unknown, row: Record<string, unknown>) => React.ReactNode;
  highlight?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  title?: string;
  compact?: boolean;
}

export default function DataTable({ columns, data, title, compact }: DataTableProps) {
  return (
    <div className="rounded-xl border border-sa-border bg-sa-card overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-sa-border">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sa-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-xs font-semibold text-sa-muted uppercase tracking-wider whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-sa-border/50 hover:bg-white/2 transition-colors"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.highlight ? 'text-sa-accent font-semibold number-cell' : 'text-slate-300 number-cell'}`}
                  >
                    {col.format
                      ? col.format(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
