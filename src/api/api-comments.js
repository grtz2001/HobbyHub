// src/api/comments.js
//
// Comments belong to a post and are written by a profile. In Supabase you
// fetch them with .select('*, profiles(id, display_name)') so the author
// arrives attached — that's the shape these functions return.

import { comments, profiles } from '../data/dummy.js';

const DELAY = 300;
const wait = () => new Promise((r) => setTimeout(r, DELAY));

function withAuthor(comment) {
  const author = profiles.find((p) => p.id === comment.author_id) ?? null;
  return {
    ...comment,
    profiles: author ? { id: author.id, display_name: author.display_name } : null,
  };
}

/** A post's comments, oldest first — conversations read top to bottom. */
export async function getComments(postId) {
  await wait();
  return comments
    .filter((c) => c.post_id === Number(postId))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(withAuthor);
}

/**
 * Add a comment.
 *
 * Returns the new row with its author already attached, so the caller can
 * append it to state instead of refetching the whole list:
 *   setComments(cs => [...cs, created]);
 */
export async function createComment({ post_id, author_id, content }) {
  await wait();

  if (!content?.trim()) throw new Error('A comment cannot be empty.');
  if (!author_id) throw new Error('A comment needs an author.');

  const comment = {
    id: Math.max(0, ...comments.map((c) => c.id)) + 1,
    post_id: Number(post_id),
    author_id,
    content: content.trim(),
    created_at: new Date().toISOString(),
  };

  comments.push(comment);
  return withAuthor(comment);
}

/** Delete a comment. Check ownership in the component before calling this. */
export async function deleteComment(id) {
  await wait();
  const i = comments.findIndex((c) => c.id === Number(id));
  if (i === -1) throw new Error('Comment not found.');
  comments.splice(i, 1);
}
