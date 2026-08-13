// src/api/watchLogs.js
//
// The Letterboxd diary. Watch logs are independent of posts — see the three
// rules in CLAUDE.md's Data model section. They render in exactly one
// place: the Diary tab of the profile that owns them.

import { watch_logs, shows } from '../data/dummy.js';

const DELAY = 300;
const wait = () => new Promise((r) => setTimeout(r, DELAY));

function withShow(log) {
  const show = shows.find((s) => s.id === log.show_id) ?? null;
  return {
    id: log.id,
    created_at: log.created_at,
    watched_on: log.watched_on,
    venue: log.venue,
    rating: log.rating,
    note: log.note,
    show_id: log.show_id,
    shows: show
      ? { id: show.id, slug: show.slug, title: show.title, poster_url: show.poster_url }
      : null,
  };
}

/**
 * Numbers rewatches. Logs arrive newest-first, so the first time we meet a
 * show is its highest-numbered watch — "3rd watch", then "2nd", then "1st"
 * as you scroll down. A show seen once gets watchTotal: 1 and no badge.
 */
function withWatchNumbers(logs) {
  const totals = {};
  for (const log of logs) totals[log.show_id] = (totals[log.show_id] ?? 0) + 1;

  const seen = {};
  return logs.map((log) => {
    seen[log.show_id] = (seen[log.show_id] ?? 0) + 1;
    const total = totals[log.show_id];
    return {
      ...log,
      watchTotal: total,
      watchNumber: total - seen[log.show_id] + 1,
    };
  });
}

/** One user's diary, newest first, with rewatch numbers attached. */
export async function getWatchLogsByUser(userId) {
  await wait();
  const rows = watch_logs
    .filter((w) => w.user_id === userId)
    .sort((a, b) => {
      if (a.watched_on !== b.watched_on) return a.watched_on < b.watched_on ? 1 : -1;
      return b.id - a.id; // tiebreaker: newest entry first within a day
    })
    .map(withShow);

  return withWatchNumbers(rows);
}

/** Log a watch. Show and date are required; venue, rating, and note are not. */
export async function createWatchLog({ userId, showId, watchedOn, venue, rating, note }) {
  await wait();

  if (!userId) throw new Error('A watch log needs a user.');
  if (!showId) throw new Error('A watch log must name a show.');
  if (!watchedOn) throw new Error('A watch log needs a date.');
  if (rating != null && (rating < 1 || rating > 5)) {
    throw new Error('Rating must be between 1 and 5.');
  }

  const log = {
    id: Math.max(0, ...watch_logs.map((w) => w.id)) + 1,
    created_at: new Date().toISOString(),
    user_id: userId,
    show_id: Number(showId),
    watched_on: watchedOn,
    venue: venue?.trim() || null,
    rating: rating ? Number(rating) : null,
    note: note?.trim() || null,
  };

  watch_logs.push(log);
  return withShow(log);
}

/** Delete a watch log. Check ownership in the component before calling this. */
export async function deleteWatchLog(id) {
  await wait();
  const i = watch_logs.findIndex((w) => w.id === Number(id));
  if (i === -1) throw new Error('Watch log not found.');
  watch_logs.splice(i, 1);
}
