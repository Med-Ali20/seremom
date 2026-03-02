export function sanitizeSearch(value?: string): string | undefined {
  if (!value) return undefined;

  return value
    .trim()
    .slice(0, 100)                        // hard cap at 100 chars
    .replace(/[%_\\]/g, (c) => `\\${c}`) // escape LIKE special chars
    .replace(/\s+/g, ' ');               // normalize whitespace
}

export function sanitizePagination(skip?: number, take?: number) {
  return {
    skip: Math.max(0, Math.min(skip ?? 0, 10000)),   // 0–10000
    take: Math.max(1, Math.min(take ?? 10, 50)),      // 1–50
  };
}