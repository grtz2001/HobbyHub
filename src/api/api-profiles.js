// src/api/profiles.js
//
// Users, without authentication. A profile is created the first time someone
// visits: the browser makes a UUID, that goes in localStorage, and it's
// attached to everything they write.
//
// This is pseudo-auth, not security. Anyone can edit localStorage and pretend
// to be someone else, and with RLS off the database will accept it. That's
// expected — the rubric asks for exactly this. Don't call it authentication
// in your README.

import { profiles, posts } from '../data/dummy.js';

const DELAY = 300;
const wait = () => new Promise((r) => setTimeout(r, DELAY));

/** One profile. Returns null when the id doesn't exist. */
export async function getProfile(id) {
  await wait();
  return profiles.find((p) => p.id === id) ?? null;
}

/**
 * The three numbers on a profile page.
 *
 * `avg_rating_given` is how generous a reviewer someone is — the mean of the
 * ratings THEY gave, which is a different thing from any show's average.
 * Null when they haven't reviewed anything yet.
 */
export async function getProfileStats(id) {
  await wait();

  const mine = posts.filter((p) => p.author_id === id);
  const reviews = mine.filter((p) => p.type === 'review');

  const avg =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return {
    review_count: reviews.length,
    discussion_count: mine.length - reviews.length,
    avg_rating_given: avg,
  };
}

/**
 * Create a profile. Called once, by the name gate, on a visitor's first load.
 * `crypto.randomUUID()` is built into browsers — no uuid package needed.
 */
export async function createProfile(displayName) {
  await wait();

  const name = displayName?.trim();
  if (!name) throw new Error('Please choose a display name.');
  if (name.length > 30) throw new Error('That name is a little long — 30 characters max.');

  const profile = {
    id: crypto.randomUUID(),
    display_name: name,
    created_at: new Date().toISOString(),
  };

  profiles.push(profile);
  return profile;
}
