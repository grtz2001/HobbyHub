// src/api/comments.js
//
// Comments belong to a post and are written by a profile. Fetched with
// .select('*, profiles(id, display_name)') so the author arrives attached.

import { supabase } from '../client';

/** A post's comments, oldest first — conversations read top to bottom. */
export async function getComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(id, display_name)')
    .eq('post_id', Number(postId))
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Add a comment. Returns the new row with its author already attached, so
 * the caller can append it to state instead of refetching the whole list.
 */
export async function createComment({ postId, authorId, content }) {
  if (!content?.trim()) throw new Error('A comment cannot be empty.');

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: Number(postId), author_id: authorId, content: content.trim() })
    .select('*, profiles(id, display_name)')
    .single();

  if (error) throw error;
  return data;
}

/** Delete a comment. Check ownership in the component before calling this. */
export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', Number(id));
  if (error) throw error;
}
