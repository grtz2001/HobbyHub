// src/api/posts.js
//
// The public forum. The only place that knows where posts come from.
// Components import these functions and never touch the data source
// directly. Right now this reads from src/data/dummy.js; at the end of the
// project every body gets rewritten to call Supabase, and NO COMPONENT
// CHANGES, because the arguments and return shapes stay identical.
//
// Posts never carry a rating — ratings live on watch logs. See
// docs/encore-spec.md §1 and CLAUDE.md's "three rules that define this model".

import { posts, shows, profiles, comments } from '../data/dummy.js';

const DELAY = 300;
const wait = () => new Promise((r) => setTimeout(r, DELAY));

function sortRows(rows, orderBy) {
  return [...rows].sort((a, b) => {
    if (a[orderBy] === b[orderBy]) return 0;
    return a[orderBy] < b[orderBy] ? 1 : -1;
  });
}

// The three-field feed shape: creation time, title, bravos. Nothing else —
// no body, no image, no show tag, no author byline, no rating squares.
function toCardShape({ id, created_at, title, upvotes }) {
  return { id, created_at, title, upvotes };
}

function withRelations(post) {
  const show = post.show_id ? (shows.find((s) => s.id === post.show_id) ?? null) : null;
  const author = profiles.find((p) => p.id === post.author_id) ?? null;

  return {
    id: post.id,
    created_at: post.created_at,
    title: post.title,
    content: post.content,
    image_url: post.image_url,
    upvotes: post.upvotes,
    author_id: post.author_id,
    shows: show
      ? { id: show.id, slug: show.slug, title: show.title, poster_url: show.poster_url }
      : null,
    profiles: author ? { id: author.id, display_name: author.display_name } : null,
  };
}

/** The home feed. Sort by newest or most bravos. */
export async function getPosts({ orderBy = 'created_at' } = {}) {
  await wait();
  return sortRows(posts, orderBy).map(toCardShape);
}

/** One post, with its show and author attached. Null when the id doesn't exist. */
export async function getPost(id) {
  await wait();
  const post = posts.find((p) => p.id === Number(id));
  return post ? withRelations(post) : null;
}

/** The three-field rows tagged to one show, for the show page's discussion section. */
export async function getPostsByShow(showId) {
  await wait();
  const rows = posts.filter((p) => p.show_id === Number(showId));
  return sortRows(rows, 'created_at').map(toCardShape);
}

/** The three-field rows written by one user, for the profile Posts tab. */
export async function getPostsByAuthor(authorId) {
  await wait();
  const rows = posts.filter((p) => p.author_id === authorId);
  return sortRows(rows, 'created_at').map(toCardShape);
}

/** Create a post. Title required; show, body, and image are all optional. */
export async function createPost({ authorId, showId, title, content, imageUrl }) {
  await wait();

  if (!title?.trim()) throw new Error('A title is required.');
  if (!authorId) throw new Error('A post needs an author.');

  const post = {
    id: Math.max(0, ...posts.map((p) => p.id)) + 1,
    created_at: new Date().toISOString(),
    author_id: authorId,
    show_id: showId ? Number(showId) : null,
    title: title.trim(),
    content: content?.trim() || null,
    image_url: imageUrl?.trim() || null,
    upvotes: 0,
  };

  posts.push(post);
  return withRelations(post);
}

/** Update an existing post. Only the fields passed in are changed. */
export async function updatePost(id, changes) {
  await wait();
  const post = posts.find((p) => p.id === Number(id));
  if (!post) throw new Error('Post not found.');

  if ('title' in changes && !changes.title?.trim()) {
    throw new Error('A title is required.');
  }

  Object.assign(post, changes);
  return withRelations(post);
}

/** Delete a post. Comments cascade, same as the real foreign key. */
export async function deletePost(id) {
  await wait();
  const i = posts.findIndex((p) => p.id === Number(id));
  if (i === -1) throw new Error('Post not found.');
  posts.splice(i, 1);

  for (let j = comments.length - 1; j >= 0; j--) {
    if (comments[j].post_id === Number(id)) comments.splice(j, 1);
  }
}

/**
 * Add one bravo and return the new total.
 *
 * The caller updates its own state RELATIVELY — setUpvotes(n => n + 1) — and
 * doesn't wait on this to render. The rubric wants unlimited rapid clicking,
 * so several of these can be in flight at once. Absolute math loses counts.
 */
export async function upvotePost(id) {
  const post = posts.find((p) => p.id === Number(id));
  if (!post) throw new Error('Post not found.');
  post.upvotes += 1;
  return post.upvotes;
}
