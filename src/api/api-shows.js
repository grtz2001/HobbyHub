// src/api/shows.js
//
// The catalog, plus the aggregate ratings that make Encore feel like
// Letterboxd. In the real database `avg_rating` comes from the show_ratings
// VIEW (docs/spec.md §3), so Postgres does the maths. Here we compute the
// same numbers in JavaScript — same field names, same nulls.
//
// IMPORTANT: avg_rating is null for a show nobody has reviewed. Render
// "Not yet rated", never NaN or 0.0. Two shows in the seed data
// (Floyd Collins, Bat Boy) exist specifically to catch this.

import { shows, posts } from '../data/dummy.js';

const DELAY = 300;
const wait = () => new Promise((r) => setTimeout(r, DELAY));

// Mirrors one row of the show_ratings view.
function withRatings(show) {
  const mine = posts.filter((p) => p.show_id === show.id);
  const reviews = mine.filter((p) => p.type === 'review');

  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return {
    ...show,
    avg_rating: avg,
    review_count: reviews.length,
    discussion_count: mine.length - reviews.length,
  };
}

/**
 * The /shows directory. Best-rated first; unrated shows go last rather than
 * being treated as zero.
 */
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

/** One show by its URL slug. Returns null when it doesn't exist. */
export async function getShowBySlug(slug) {
  await wait();
  const show = shows.find((s) => s.slug === slug);
  return show ? withRatings(show) : null;
}

/**
 * Every show, unsorted and without ratings — for the ShowPicker on the
 * create form. Cheap, no delay, because it runs on every keystroke.
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
 * Find a show by title, or add it. This is what lets someone review a show
 * that isn't in the catalog yet.
 *
 * The slug is what stops "Hadestown" and "hadestown" becoming two shows —
 * both slugify to the same key and match the existing row.
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
