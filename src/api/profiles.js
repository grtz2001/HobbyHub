// src/api/profiles.js
//
// Users, without authentication. A profile is created the first time someone
// visits: the browser makes a UUID, that goes in localStorage, and it's
// attached to everything they write.
//
// This is pseudo-auth, not security. Anyone can edit localStorage and
// pretend to be someone else, and with RLS off the database will accept it.
// That's expected — the rubric asks for exactly this. Don't call it
// authentication in the README.

import { supabase } from '../client';

/** One profile. Returns null when the id doesn't exist. */
export async function getProfile(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Create a profile. Called once, by the name gate, on a visitor's first load.
 * `crypto.randomUUID()` is built into browsers — no uuid package needed, and
 * profiles.id has no database default, so it's generated here.
 */
export async function createProfile(displayName) {
  const name = displayName?.trim();
  if (!name) throw new Error('Please choose a display name.');
  if (name.length > 30) throw new Error('That name is a little long — 30 characters max.');

  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: crypto.randomUUID(), display_name: name })
    .select()
    .single();

  if (error) throw error;
  return data;
}
