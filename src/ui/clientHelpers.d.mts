export function escapeHtml(value: unknown): string;

export function deviceDisplayName(
  device: { alias?: unknown; device?: unknown } | null | undefined,
  unknownLabel?: string
): string;

export function deviceDisplayNameWithSuffix(
  device: { alias?: unknown; device?: unknown; deviceId?: unknown } | null | undefined,
  hasDuplicateName: boolean,
  unknownLabel?: string
): string;

export function deviceRecordLabel(count: unknown, singular: string, plural: string): string;

export function truncateId(value: unknown, head: number, tail: number): string;

export function deviceSharePercent(
  device: { records?: unknown; count?: unknown },
  devices: Array<{ records?: unknown; count?: unknown }>
): number;
