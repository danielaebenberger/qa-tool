/**
 * TestRail run names follow a 3-part convention:
 *   "AE - <configName> - <date>"
 *
 * In practice the separators between parts vary (spaces optional, hyphen vs.
 * underscore, sometimes the date is just appended without a separator), and
 * the config name itself often contains hyphens (e.g. `jahia-8.2-mariadb-tomcat`).
 * The date appears in either YYYYMMDD or YYYY-MM-DD form, sometimes with `_`
 * or `.` separators.
 *
 * We need to recover `configName` reliably so that runs from the same pipeline
 * group together, regardless of which day they ran on.
 *
 * Strategy:
 *   1. Trim, strip the mandatory leading `AE` prefix (case-insensitive).
 *   2. Strip a trailing date token in any common format.
 *   3. Trim leftover separators/whitespace.
 *   4. If anything is left, that is the config name; otherwise fall back to
 *      the full original name so the run is still visible in the UI.
 */

const LEADING_AE_RE = /^\s*AE\s*[-_\s]+/i;

// Matches a trailing timestamp token, optionally preceded by a separator.
// Anchored on a YYYY-MM-DD or YYYYMMDD date; everything after that date —
// times, timezone offsets, named zones in parentheses — is consumed too.
//
// Supported tails (all optional after the date):
//   - " 17:32:16"
//   - " 17:32"
//   - " GMT+02:00", " UTC", " Z"
//   - " (CEST)"
//
// Date forms:
//   - YYYYMMDD               (e.g. 20260427)
//   - YYYY[-_./]MM[-_./]DD   (e.g. 2026-04-27, 2026_04_27, 2026.04.27)
const TRAILING_DATE_RE = new RegExp(
  // separator before the date (optional)
  '[-_\\s.]?' +
    // capture group 1: the date itself
    '(\\d{8}|\\d{4}[-_./]\\d{2}[-_./]\\d{2})' +
    // optional time portion: " HH:MM" or " HH:MM:SS"
    '(?:[\\s_T]\\d{2}:\\d{2}(?::\\d{2})?)?' +
    // optional timezone: " GMT+02:00", " +0200", " UTC", " Z"
    '(?:\\s*(?:GMT|UTC)?\\s*[+-]\\d{2}:?\\d{2}|\\s*UTC|\\s*Z)?' +
    // optional named zone in parentheses: " (CEST)"
    '(?:\\s*\\([A-Za-z0-9+\\-/_ ]+\\))?' +
    '\\s*$'
);

// Trailing punctuation/whitespace left over after stripping the date.
const TRAILING_SEP_RE = /[-_\s.]+$/;

export interface ParsedRunName {
  configName: string;
  date: string;
}

export function parseRunName(rawName: string): ParsedRunName {
  const original = rawName.trim();
  if (!original) return { configName: '', date: '' };

  // 1. Strip the AE prefix; if it isn't present we still try to recover a date.
  const withoutPrefix = original.replace(LEADING_AE_RE, '');

  // 2. Try to peel off the trailing date.
  const dateMatch = withoutPrefix.match(TRAILING_DATE_RE);
  const date = dateMatch ? dateMatch[1] : '';

  let core = dateMatch
    ? withoutPrefix.slice(0, withoutPrefix.length - dateMatch[0].length)
    : withoutPrefix;

  // 3. Clean up trailing separators left behind by date removal.
  core = core.replace(TRAILING_SEP_RE, '').trim();

  // 4. Fallback — never lose the run entirely.
  const configName = core || original;

  return { configName, date };
}
