export function extractApiError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message) return err.message;
    const body = (err as any).cause?.body;
    if (body && typeof body === 'object') {
      const messages = Object.entries(body)
        .flatMap(([key, val]) =>
          Array.isArray(val) ? val.map((v) => `${key}: ${v}`) : [`${key}: ${val}`]
        );
      if (messages.length) return messages.join('; ');
    }
  }
  return fallback;
}
