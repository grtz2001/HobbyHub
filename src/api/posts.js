// src/api/posts.js
//
// The public forum. The only place that knows where posts come from.
// Components import these functions and never touch Supabase directly.
//
// Posts never carry a rating — ratings live on watch logs. See
// docs/encore-spec.md §1 and CLAUDE.md's "three rules that define this model".

import { supabase } from '../client';

/** The home feed. Sort by newest or most bravos. */
export async function getPosts({ orderBy = 'created_at' } = {}) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, created_at, title, upvotes')
    .order(orderBy, { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** One post, with its show and author attached. Null when the id doesn't exist. */
export async function getPost(id) {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, created_at, title, content, image_url, upvotes, author_id, shows(id, slug, title, poster_url), profiles(id, display_name)'
    )
    .eq('id', Number(id))
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** The three-field rows tagged to one show, for the show page's discussion section. */
export async function getPostsByShow(showId) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, created_at, title, upvotes')
    .eq('show_id', Number(showId))
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** The three-field rows written by one user, for the profile Posts tab. */
export async function getPostsByAuthor(authorId) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, created_at, title, upvotes')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Create a post. Title required; show, body, and image are all optional. */
export async function createPost({ authorId, showId, title, content, imageUrl }) {
  if (!title?.trim()) throw new Error('A title is required.');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      show_id: showId ? Number(showId) : null,
      title: title.trim(),
      content: content?.trim() || null,
      image_url: imageUrl?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing post. Only the fields passed in are changed. */
export async function updatePost(id, changes) {
  const { data, error } = await supabase
    .from('posts')
    .update(changes)
    .eq('id', Number(id))
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete a post. Comments cascade via the foreign key. */
export async function deletePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', Number(id));
  if (error) throw error;
}

/**
 * Add one bravo via the atomic increment_upvotes RPC.
 *
 * The caller updates its own state RELATIVELY — setUpvotes(n => n + 1) — and
 * doesn't wait on this to render. The rubric wants unlimited rapid clicking,
 * so several of these can be in flight at once.
 */
export async function upvotePost(id) {
  const { error } = await supabase.rpc('increment_upvotes', { post_id: Number(id) });
  if (error) throw error;
}
