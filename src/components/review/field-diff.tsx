import { ArrowRight } from 'lucide-react';
import { fieldDiff } from '@/lib/diff';
export function FieldDiff({
  before,
  after,
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  return (
    <div className="field-diff">
      {fieldDiff(before, after).map((d) => (
        <div key={d.field}>
          <small>{d.field}</small>
          <span>{String(d.before ?? '—')}</span>
          <ArrowRight size={14} />
          <strong>{String(d.after ?? '—')}</strong>
        </div>
      ))}
    </div>
  );
}
