/** Lightweight helpers for Ciqual TABLE/XML blocks (no external XML parser). */

const XML_ENTITIES: Record<string, string> = {
  '&apos;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
};

function decodeXmlEntities(value: string): string {
  return value.replace(/&(?:apos|quot|amp|lt|gt);/g, (entity) => XML_ENTITIES[entity] ?? entity);
}

export function extractTagValue(block: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(regex);
  if (!match) {
    return undefined;
  }

  const value = decodeXmlEntities(match[1].trim());
  if (!value || value.toLowerCase() === 'missing') {
    return undefined;
  }

  return value;
}

export function hasMissingAttribute(block: string, tag: string): boolean {
  const regex = new RegExp(`<${tag}\\s+missing\\s*=\\s*["'][^"']*["']\\s*/>`, 'i');
  return regex.test(block);
}

export function parseBlocks(xml: string, blockTag: string): string[] {
  const regex = new RegExp(`<${blockTag}>([\\s\\S]*?)<\\/${blockTag}>`, 'gi');
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }

  return blocks;
}

export function parseNumericValue(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const normalized = raw.trim().replace(',', '.');
  if (!normalized) {
    return undefined;
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : undefined;
}

export function normalizeCode(raw: string | undefined): string | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
