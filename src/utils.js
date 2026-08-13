// src/utils.js
//
// Pure display-formatting helpers. No data access, so they don't belong in
// src/api/ — they just turn timestamps into words. See docs/encore-spec.md §7.

/** timestamptz -> '2 hours ago' */
export function timeAgo(timestamp) {
  const secs = (Date.now() - new Date(timestamp)) / 1000;
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, size] of units) {
    const n = Math.floor(secs / size);
    if (n >= 1) return `${n} ${name}${n === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

/**
 * 'YYYY-MM-DD' -> '3 March 2026'
 *
 * Splits the string by hand rather than `new Date(isoDate)` because a bare
 * date parses as UTC midnight, which renders as the previous day in any
 * negative-offset timezone. Building it from parts keeps it in local time.
 */
export function formatWatchDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** 1 -> '1st', 2 -> '2nd', 3 -> '3rd', 4 -> '4th' ... */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
