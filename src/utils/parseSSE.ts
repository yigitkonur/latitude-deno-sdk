export function parseSSE(data?: string): Record<string, string> | undefined {
  if (!data) return undefined;

  const lines = data.split(/\r\n|\r|\n/);
  const event: Record<string, string> = {};
  let field = '';
  let value = '';

  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      field = line;
      value = '';
    } else if (colonIndex === 0) {
      continue;
    } else {
      field = line.slice(0, colonIndex);
      value = line.slice(colonIndex + 1).trim();
    }

    if (event[field]) {
      event[field] += '\n' + value;
    } else {
      event[field] = value;
    }
  }

  return Object.keys(event).length > 0 ? event : undefined;
}
