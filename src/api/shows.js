// src/api/shows.js
//
// The catalog, plus the aggregate ratings that make Encore feel like
// Letterboxd. In the real database `avg_rating` comes from the show_ratings
// VIEW (docs/encore-spec.md §3), computed from watch_logs — never from
// posts. Here we compute the same numbers in JavaScript, same field names,
// same nulls.
//
// IMPORTANT: avg_rating is null for a show nobody has logged. Render
// "Not yet rated", never NaN. The Suffs entry in dummy data has no poster
// AND no logs, on purpose — it's what a show added through the ShowPicker
// looks like before anyone rates it.

import { shows, watch_logs } from '../data/dummy.js';

const DELAY = 300;
const wait = () => new Promise((r) => setTimeout(r, DELAY));

// Mirrors one row of the show_ratings view.
function withRatings(show) {
  const logs = watch_logs.filter((w) => w.show_id === show.id);
  const rated = logs.filter((w) => w.rating != null);

  const avg =
    rated.length > 0
      ? Math.round((rated.reduce((sum, w) => sum + w.rating, 0) / rated.length) * 10) / 10
      : null;

  return {
    ...show,
    avg_rating: avg,
    log_count: logs.length,
    rating_count: rated.length,
    viewer_count: new Set(logs.map((w) => w.user_id)).size,
  };
}

/** The /shows directory. Best-rated first; unrated shows go last. */
export async function getShows() {
  await wait();
  return shows
    .map(withRatings)
    .sort((a, b) => {
      if (a.avg_rating === null && b.avg_rating === null) return a.title.localeCompare(b.title);
      if (a.avg_rating === null) return 1;
      if (b.avg_rating === null) return -1;
      return b.avg_rating - a.avg_rating;
    });
}

/** One show by its URL slug, with the aggregate attached. Null if it doesn't exist. */
export async function getShowBySlug(slug) {
  await wait();
  const show = shows.find((s) => s.slug === slug);
  return show ? withRatings(show) : null;
}

/**
 * Every show, unsorted and without ratings — for the ShowPicker on the
 * create and log forms. Synchronous and cheap, because it runs on every
 * keystroke.
 */
export function getShowOptions() {
  return shows.map((s) => ({ id: s.id, slug: s.slug, title: s.title }));
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Find a show by title, or add it. This is what lets someone log or post
 * about a show that isn't in the catalog yet.
 *
 * The slug is what stops "Hadestown" and "hadestown" becoming two shows
 * with two separate averages.
 */
export async function findOrCreateShow(title) {
  await wait();
  const slug = slugify(title);
  if (!slug) throw new Error('A show needs a title.');

  const existing = shows.find((s) => s.slug === slug);
  if (existing) return withRatings(existing);

  const show = {
    id: Math.max(0, ...shows.map((s) => s.id)) + 1,
    slug,
    title: title.trim(),
    opening_year: null,
    poster_url: null,
  };

  shows.push(show);
  return withRatings(show);
}
