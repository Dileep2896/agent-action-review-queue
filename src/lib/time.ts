export const NOW = '2026-10-21T08:30:00-07:00';
export function localHour(timezone: string, at = NOW): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(new Date(at)),
  );
}
