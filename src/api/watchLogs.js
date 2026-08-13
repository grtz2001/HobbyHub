// src/api/watchLogs.js
//
// The Letterboxd diary. Watch logs are independent of posts — see the three
// rules in CLAUDE.md's Data model section. They render in exactly one
// place: the Diary tab of the profile that owns them.

import { supabase } from '../client';

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
  const { data, error } = await supabase
    .from('watch_logs')
    .select('id, created_at, watched_on, venue, rating, note, show_id, shows(id, slug, title, poster_url)')
    .eq('user_id', userId)
    .order('watched_on', { ascending: false })
    .order('id', { ascending: false }); // tiebreaker: newest entry first within a day

  if (error) throw error;
  return withWatchNumbers(data ?? []);
}

/** Log a watch. Show and date are required; venue, rating, and note are not. */
export async function createWatchLog({ userId, showId, watchedOn, venue, rating, note }) {
  if (!showId) throw new Error('A watch log must name a show.');
  if (!watchedOn) throw new Error('A watch log needs a date.');
  if (rating != null && (rating < 1 || rating > 5)) {
    throw new Error('Rating must be between 1 and 5.');
  }

  const { data, error } = await supabase
    .from('watch_logs')
    .insert({
      user_id: userId,
      show_id: Number(showId),
      watched_on: watchedOn, // 'YYYY-MM-DD' straight from <input type="date">
      venue: venue?.trim() || null,
      rating: rating ? Number(rating) : null,
      note: note?.trim() || null,
    })
    .select('id, created_at, watched_on, venue, rating, note, show_id, shows(id, slug, title, poster_url)')
    .single();

  if (error) throw error;
  return data;
}

/** Delete a watch log. Check ownership in the component before calling this. */
export async function deleteWatchLog(id) {
  const { error } = await supabase.from('watch_logs').delete().eq('id', Number(id));
  if (error) throw error;
}
