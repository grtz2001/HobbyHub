// src/api/posts.js
//
// The only file that knows where posts come from. Components import these
// functions and never touch the data source directly.
//
// Right now these read from src/data/dummy.js. At the end of the project each
// body gets rewritten to call Supabase and NO COMPONENT CHANGES, because the
// arguments and return shapes stay identical.
//
// Every function is async with a small delay on purpose. Without it your
// loading states never render during development and you ship a spinner that
// was never actually wired up.

import { posts, shows, profiles, comments } from '../data/dummy.js';

const DELAY = 300;
const wait = () => new Promise((r) => setTimeout(r, DELAY));

// Rebuilds the nested shape Supabase returns from a query like:
//   .select('*, shows(id,slug,title,poster_url), profiles(id,display_name)')
// Components read post.shows?.title and post.profiles.display_name.
// `shows` is null for general discussions — always optional-chain it.
function withRelations(post) {
  const show = shows.find((s) => s.id === post.show_id) ?? null;
  const author = profiles.find((p) => p.id === post.author_id) ?? null;

  return {
    ...post,
    shows: show
      ? { id: show.id, slug: show.slug, title: show.title, poster_url: show.poster_url }
      : null,
    profiles: author ? { id: author.id, display_name: author.display_name } : null,
  };
}

function sortRows(rows, orderBy) {
  return [...rows].sort((a, b) =>
    orderBy === 'upvotes'
      ? b.upvotes - a.upvotes
      : new Date(b.created_at) - new Date(a.created_at)
  );
}

/**
 * The home feed.
 * @param {object} opts
 * @param {'created_at'|'upvotes'} opts.orderBy
 * @param {'all'|'review'|'discussion'} opts.type
 */
export async function getPosts({ orderBy = 'created_at', type = 'all' } = {}) {
  await wait();
  const rows = type === 'all' ? posts : posts.filter((p) => p.type === type);
  return sortRows(rows, orderBy).map(withRelations);
}

/** One post. Returns null when the id doesn't exist — don't throw, the page renders a 404. */
export async function getPost(id) {
  await wait();
  const post = posts.find((p) => p.id === Number(id));
  return post ? withRelations(post) : null;
}

/** Everything written about one show, newest first. */
export async function getPostsByShow(showId) {
  await wait();
  const rows = posts.filter((p) => p.show_id === Number(showId));
  return sortRows(rows, 'created_at').map(withRelations);
}

/** Everything one user has written, newest first. */
export async function getPostsByAuthor(authorId) {
  await wait();
  const rows = posts.filter((p) => p.author_id === authorId);
  return sortRows(rows, 'created_at').map(withRelations);
}

/**
 * Create a review or a discussion.
 *
 * Mirrors the review_shape CHECK constraint in the real database:
 *   review     -> must have show_id and rating
 *   discussion -> must not have a rating; show_id optional
 * Validating here means the dummy version fails the same way Supabase will,
 * so you find form bugs now instead of on swap day.
 */
export async function createPost({
  type = 'review',
  author_id,
  show_id = null,
  title,
  content = null,
  image_url = null,
  rating = null,
}) {
  await wait();

  if (!title?.trim()) throw new Error('A title is required.');
  if (!author_id) throw new Error('A post needs an author.');

  if (type === 'review') {
    if (!show_id) throw new Error('A review must name a show.');
    if (!rating) throw new Error('A review must have a rating.');
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.');
  }
  if (type === 'discussion' && rating != null) {
    throw new Error('A discussion cannot have a rating.');
  }

  const post = {
    id: Math.max(0, ...posts.map((p) => p.id)) + 1,
    type,
    author_id,
    show_id: show_id ? Number(show_id) : null,
    title: title.trim(),
    content: content?.trim() || null,
    image_url: image_url?.trim() || null,
    rating: type === 'review' ? Number(rating) : null,
    upvotes: 0,
    created_at: new Date().toISOString(),
  };

  posts.push(post);
  return withRelations(post);
}

/** Update an existing post. Only the fields you pass are changed. */
export async function updatePost(id, changes) {
  await wait();
  const post = posts.find((p) => p.id === Number(id));
  if (!post) throw new Error('Post not found.');

  if ('title' in changes && !changes.title?.trim()) {
    throw new Error('A title is required.');
  }
  if (post.type === 'review' && 'rating' in changes && !changes.rating) {
    throw new Error('A review must have a rating.');
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

  // In Supabase this happens automatically via ON DELETE CASCADE.
  for (let j = comments.length - 1; j >= 0; j--) {
    if (comments[j].post_id === Number(id)) comments.splice(j, 1);
  }
}

/**
 * Add one bravo and return the new total.
 *
 * The caller should update its own state RELATIVELY — setUpvotes(n => n + 1) —
 * and not wait on this to render. The rubric wants unlimited rapid clicking,
 * so several of these can be in flight at once. Absolute math loses counts.
 */
export async function upvotePost(id) {
  const post = posts.find((p) => p.id === Number(id));
  if (!post) throw new Error('Post not found.');
  post.upvotes += 1;
  return post.upvotes;
}
