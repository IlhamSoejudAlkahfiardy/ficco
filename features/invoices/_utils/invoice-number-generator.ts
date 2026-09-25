/**
 * Utility functions for invoice number formatting, parsing, and sequential generation.
 */

export interface ParsedInvoiceNumber {
  raw: string;
  prefix: string;
  year?: number;
  sequence: number;
}

/**
 * Formats an invoice number based on prefix, year, and sequential number.
 * Standard format: PREFIX-YYYY-0001 (e.g. INV-2026-0001)
 */
export function formatInvoiceNumber(
  prefix: string = 'INV',
  sequenceNumber: number = 1,
  date: Date = new Date(),
  padding: number = 4
): string {
  const cleanPrefix = (prefix || 'INV').trim().toUpperCase();
  const year = date.getFullYear();
  const paddedSeq = String(Math.max(1, sequenceNumber)).padStart(padding, '0');
  return `${cleanPrefix}-${year}-${paddedSeq}`;
}

/**
 * Parses an invoice number string to extract prefix, year, and sequence.
 * Supports both PREFIX-YYYY-0001 and PREFIX-0001 formats.
 */
export function parseInvoiceNumber(invoiceNumber: string): ParsedInvoiceNumber | null {
  if (!invoiceNumber || typeof invoiceNumber !== 'string') return null;

  const trimmed = invoiceNumber.trim();

  // Pattern 1: PREFIX-YYYY-SEQ (e.g. INV-2026-0042)
  const patternWithYear = /^([A-Z0-9]+)-(\d{4})-(\d+)$/i;
  const matchWithYear = trimmed.match(patternWithYear);
  if (matchWithYear) {
    return {
      raw: trimmed,
      prefix: matchWithYear[1].toUpperCase(),
      year: parseInt(matchWithYear[2], 10),
      sequence: parseInt(matchWithYear[3], 10),
    };
  }

  // Pattern 2: PREFIX-SEQ (e.g. INV-0042)
  const patternSimple = /^([A-Z0-9]+)-(\d+)$/i;
  const matchSimple = trimmed.match(patternSimple);
  if (matchSimple) {
    return {
      raw: trimmed,
      prefix: matchSimple[1].toUpperCase(),
      sequence: parseInt(matchSimple[2], 10),
    };
  }

  return null;
}

/**
 * Generates the next sequential invoice number guaranteed to be higher than
 * any existing invoice number in the database for the given prefix and year.
 */
export function generateNextInvoiceNumber(
  existingInvoiceNumbers: string[],
  prefix: string = 'INV',
  fallbackNextNumber: number = 1,
  date: Date = new Date()
): string {
  const cleanPrefix = (prefix || 'INV').trim().toUpperCase();
  const currentYear = date.getFullYear();

  let maxSequenceFound = 0;

  for (const num of existingInvoiceNumbers) {
    const parsed = parseInvoiceNumber(num);
    if (!parsed) continue;

    // If prefix matches and (either year matches or no year specified)
    if (parsed.prefix === cleanPrefix) {
      if (parsed.year === undefined || parsed.year === currentYear) {
        if (parsed.sequence > maxSequenceFound) {
          maxSequenceFound = parsed.sequence;
        }
      }
    }
  }

  const nextSeq = Math.max(maxSequenceFound + 1, fallbackNextNumber || 1);
  return formatInvoiceNumber(cleanPrefix, nextSeq, date);
}
