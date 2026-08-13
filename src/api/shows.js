// src/api/shows.js
//
// The catalog, plus the aggregate ratings that make Encore feel like
// Letterboxd. avg_rating comes from the show_ratings VIEW (docs/encore-spec.md
// §3), computed from watch_logs — never from posts, and never computed here.
//
// IMPORTANT: avg_rating is null for a show nobody has logged. Postgres also
// serialises numeric/bigint columns as JSON strings, so every aggregate gets
// Number()'d before it reaches a component.

import { supabase } from '../client';

function withNumbers(row) {
  return {
    ...row,
    avg_rating: row.avg_rating == null ? null : Number(row.avg_rating),
    log_count: Number(row.log_count),
    rating_count: Number(row.rating_count),
    viewer_count: Number(row.viewer_count),
  };
}

/** The /shows directory. Best-rated first; unrated shows go last. */
export async function getShows() {
  const { data, error } = await supabase.from('show_ratings').select('*');
  if (error) throw error;

  return (data ?? []).map(withNumbers).sort((a, b) => {
    if (a.avg_rating === null && b.avg_rating === null) return a.title.localeCompare(b.title);
    if (a.avg_rating === null) return 1;
    if (b.avg_rating === null) return -1;
    return b.avg_rating - a.avg_rating;
  });
}

/** One show by its URL slug, with the aggregate attached. Null if it doesn't exist. */
export async function getShowBySlug(slug) {
  const { data, error } = await supabase
    .from('show_ratings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? withNumbers(data) : null;
}

/**
 * Every show, unsorted and without ratings — for the ShowPicker on the
 * create and log forms. Fetched once and filtered locally from there.
 */
export async function getShowOptions() {
  const { data, error } = await supabase.from('shows').select('id, slug, title');
  if (error) throw error;
  return data ?? [];
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
  const slug = slugify(title);
  if (!slug) throw new Error('A show needs a title.');

  const { data: existing, error: lookupError } = await supabase
    .from('shows')
    .select('id, slug, title')
    .eq('slug', slug)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('shows')
    .insert({ slug, title: title.trim(), poster_url: null })
    .select('id, slug, title')
    .single();

  if (error) throw error;
  return data;
}
