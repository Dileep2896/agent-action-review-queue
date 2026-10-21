export type FieldChange = { field: string; before: unknown; after: unknown };
export function fieldDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): FieldChange[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map((field) => ({ field, before: before[field], after: after[field] }));
}
