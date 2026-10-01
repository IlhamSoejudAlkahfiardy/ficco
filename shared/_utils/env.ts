/**
 * Utility to check whether DEVELOPMENT mode is active.
 * Checked against process.env.DEVELOPMENT and process.env.NEXT_PUBLIC_DEVELOPMENT.
 *
 * When TRUE:
 * - Shows quick dummy data generator buttons on all create/add forms and lists
 * When FALSE:
 * - Hides all dummy data generator buttons (production mode)
 */
export function isDevelopmentMode(): boolean {
  const val = process.env.DEVELOPMENT || process.env.NEXT_PUBLIC_DEVELOPMENT;
  if (!val) return false;
  const normalized = val.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}
