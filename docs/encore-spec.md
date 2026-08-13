# ENCORE — Project Spec (v3)

**WEB102 Unit 8 Final Project · HobbyHub**
A musical theatre community: keep a diary of shows you've seen, and argue about them in public.

> **v3 changes:** the data model is rebuilt around **three separate entities** — shows, watch logs, and posts. The `type` discriminator and the `review_shape` constraint are gone. Ratings have moved off posts entirely and live only on watch logs. See §13 for the full diff.
>
> The design system (§8), the identity scheme (§6), and the Supabase patterns (§7) are carried over from v2 unchanged. Only the model and the screens moved.

---

## 1. Concept

Encore is two products sharing one catalog.

### The catalog — shows

*Hadestown*, *Merrily We Roll Along*, *Company*. Each show has a page with its poster, its aggregate rating, and the public posts tagged to it.

### Product one — the diary (watch logs)

A personal record of attending a show. Date, venue, a 1–5 rating, and an optional note.

- **Repeatable.** Many logs per user per show. Seeing *Sunday in the Park* three times produces three entries, and that is the entire point — rewatches are the feature, not an edge case.
- **Profile-only.** A watch log never appears in the public feed, and never on a show page. The only place individual logs render is the Diary tab on the owner's profile. (Profile-*scoped*, not secret — see §3.)
- *"Saw Company on 3 March at the Bernard B. Jacobs. 4 stars."*

### Product two — the forum (posts)

A public broadcast. Blog-length or one line.

- **Title required.** Body and image optional. Upvotes and comments.
- **No rating. Ever.** Ratings belong to watch logs.
- **Public.** This is the feed, and it is the entire graded surface.
- *"In the Heights needs a revival."* / *"Company is a 10/10, would rewatch."*

### They are independent

A user can log fifty watches and never post. A user can post daily and never log a watch. **Neither implies the other**, and no feature may assume it does. In particular: creating a post does not create a log, and logging a watch does not create a post.

### Why this is the right shape

The v2 model merged both into one `posts` table split by a `type` column. That was a mistake, and undoing it makes the project *smaller*:

- `posts` becomes exactly what the rubric describes — no type column, no conditional constraint, no rating. The create form has no toggle. The feed has no tabs.
- Everything Letterboxd-shaped moves into `watch_logs`, which the rubric doesn't touch, so it can be as simple or as rich as time allows.
- The two halves can be built and debugged independently. If the diary runs late, the graded features are already finished.

### Three numbers, kept visually distinct

| | What it measures | Who sets it | Where it appears |
|---|---|---|---|
| **Rating** (1–5 squares) | How good the *show* was | The person who logged the watch | On a diary entry, profile only |
| **Bravos** (upvotes) | How much the community likes the *post* | Anyone, unlimited clicks | On posts — feed and post page |
| **Average** (e.g. `4.2`) | How good the *show* is, across everyone | Computed from watch logs | Show page and shows directory |

The rubric requires unlimited repeat upvoting, so bravos can never be a quality score. Keeping the three apart is what lets the diary coexist with the assignment.

**Squares never appear on a post or in the feed.** If you see rating squares on a `PostCard`, the model has leaked.

---

## 2. Tech stack

- **Vite + React 18** (JavaScript, not TypeScript)
- **react-router-dom v6**
- **Supabase** (`@supabase/supabase-js` v2) — Postgres, so everything below is standard SQL
- **Plain CSS** with custom properties, one file per component. No Tailwind; the Playbill look is rules, type, and spacing.

```bash
npm create vite@latest encore -- --template react
cd encore
npm install @supabase/supabase-js react-router-dom
```

That is the complete dependency list. No `uuid` package — browsers have `crypto.randomUUID()`. No date library — §7 has the two formatting helpers you need, in fifteen lines.

**Build order:** dummy data first, Supabase wired at the very end. §7.0 explains the `src/api/` boundary that makes the swap a one-folder change.

---

## 3. Database schema

Run this in the Supabase **SQL Editor** in one go — but not until the dummy-data build is finished (§7.0).

```sql
-- ------------------------------------------------------------------ SHOWS
create table shows (
  id           bigint generated always as identity primary key,
  slug         text        not null unique,
  title        text        not null,
  opening_year smallint,
  poster_url   text,
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- PROFILES
-- id is made in the browser with crypto.randomUUID() and kept in
-- localStorage. No passwords, no Supabase Auth.
create table profiles (
  id           uuid        primary key,
  display_name text        not null,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------- WATCH LOGS (Letterboxd diary)
-- Profile-only. Never rendered in the public feed.
-- Deliberately NO unique constraint on (user_id, show_id) — rewatches are
-- the point, and a user logging the same show five times is correct.
create table watch_logs (
  id         bigint      generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    uuid        not null references profiles(id) on delete cascade,
  show_id    bigint      not null references shows(id)    on delete cascade,
  watched_on date        not null,
  venue      text,                    -- "Walter Kerr Theatre", "Proshot at home"
  rating     smallint    check (rating between 1 and 5),
  note       text
);

-- ------------------------------------------------- POSTS (HobbyHub forum)
-- Public. This is the entire graded surface.
-- show_id is an optional tag; deleting a show must NOT delete forum posts
-- that merely mention it, hence set null rather than cascade.
create table posts (
  id         bigint      generated always as identity primary key,
  created_at timestamptz not null default now(),
  author_id  uuid        references profiles(id) on delete set null,
  show_id    bigint      references shows(id)    on delete set null,
  title      text        not null,
  content    text,
  image_url  text,
  upvotes    integer     not null default 0
);

-- ---------------------------------------------------------------- COMMENTS
create table comments (
  id         bigint      generated always as identity primary key,
  created_at timestamptz not null default now(),
  post_id    bigint      not null references posts(id) on delete cascade,
  author_id  uuid        references profiles(id) on delete set null,
  content    text        not null
);

create index on watch_logs (user_id);
create index on watch_logs (show_id);
create index on posts      (author_id);
create index on posts      (created_at desc);
create index on comments   (post_id);

-- ------------------------------------- AGGREGATE RATINGS (from watch logs)
create view show_ratings as
select
  s.id, s.slug, s.title, s.opening_year, s.poster_url,
  round(avg(w.rating), 1)   as avg_rating,
  count(w.id)               as log_count,
  count(w.rating)           as rating_count,
  count(distinct w.user_id) as viewer_count
from shows s
left join watch_logs w on w.show_id = s.id
group by s.id;

-- ------------------------------------------------------------------- RLS
-- No real auth, so RLS would block every write.
alter table shows      disable row level security;
alter table profiles   disable row level security;
alter table watch_logs disable row level security;
alter table posts      disable row level security;
alter table comments   disable row level security;

-- ---------------------------------------------------------- ATOMIC UPVOTES
create or replace function increment_upvotes(post_id bigint)
returns void language sql as $$
  update posts set upvotes = upvotes + 1 where id = post_id;
$$;
```

### Settled: log ratings **do** aggregate publicly

This was the open question in `PROJECT-CONTEXT.md`. **Maria confirmed on 11 August 2026: yes**, matching Letterboxd.

- **Profile-scoped:** every individual watch log — its date, venue, rating, and note. These render in exactly one place, the Diary tab of the profile that owns them.
- **Catalog-wide:** the aggregate. `/show/:slug` and `/shows` display `avg_rating`, `rating_count`, and `viewer_count`.

A word on "private": `/user/:id` is a public, unauthenticated route, so a diary is *scoped*, not secret — anyone with the link can read anyone's logs, and with no real auth that's unavoidable. The distinction that matters is about product shape, not confidentiality: **a log is something you write for yourself, and it appears where your identity is the frame.** A show page is the opposite frame.

Which gives the rule: **the show page must never list individual logs**, not even anonymously. "Rated 5 by someone on 3 March" is a diary entry wearing a hat — it turns the catalog into a second, worse feed and quietly re-merges the two products. Show pages get numbers.

This is the easiest boundary to break by accident, because the rows are right there in the same table and the query is two lines away.

If Maria reverses this later, it's a two-line change: drop `avg_rating` from the view and render `log_count` alone. Nothing else depends on the average existing — §7 already handles it being `null`.

### Notes on the schema

- **No unique constraint on `(user_id, show_id)`.** This is deliberate and it is the whole diary feature. If you ever find yourself adding one to "fix duplicates", stop — those aren't duplicates, they're rewatches.
- **The two `show_id` columns behave differently, on purpose.** `watch_logs.show_id` cascades: a log about a deleted show is meaningless, delete it. `posts.show_id` sets null: a post is a piece of writing that stands on its own, and deleting a show shouldn't silently destroy graded content. Consequence: `post.shows` can be `null`, so always optional-chain.
- **`rating_count` is an addition to the view.** `watch_logs.rating` is nullable — you can log that you saw something without scoring it, which Letterboxd allows and which is nice for "saw it, no strong opinion." But that means `log_count` and the number of ratings behind the average can differ. Printing "4.2 · 14 logs" when only 6 carried a rating is a small lie. Use `rating_count` next to the average and `log_count` for "seen by" style copy.
- **`show_ratings` is a view, not a table.** Query it with `.from('show_ratings').select('*')` exactly like a table. The average is always current and you never compute it in JavaScript.
- **The `left join` is what keeps unlogged shows in the directory.** A show nobody has logged comes back with `avg_rating: null` and `log_count: 0`, which is what the UI wants. Render "Not yet rated", never `NaN`.
- **`avg_rating` comes back as a string from PostgREST.** Postgres `numeric` serialises to JSON as `"4.2"`, not `4.2`. It prints fine, but `avg_rating.toFixed(1)` will throw. Either print it raw or `Number(avg_rating)` first.

---

## 4. Routes

| Path | Component | Purpose |
|---|---|---|
| `/` | `HomeFeed` | Public post feed. Sort by date or bravos, search by title |
| `/post/:id` | `PostPage` | One post: body, image, bravos, comments, owner edit/delete |
| `/new` | `CreatePost` | Create a post |
| `/post/:id/edit` | `EditPost` | Edit a post (author only) |
| `/shows` | `ShowsDirectory` | Poster grid of the catalog, with averages |
| `/show/:slug` | `ShowPage` | Poster, average, and the posts tagged to it |
| `/log` | `LogWatch` | Log a watch — show, date, venue, rating, note |
| `/user/:id` | `ProfilePage` | Two tabs: **Diary** (watch logs) and **Posts** |
| `*` | `NotFound` | "This show has closed." |

Two things to notice.

**`/log` is a route, not a modal.** Take the route. A modal needs a portal, focus trapping, scroll locking, and an escape handler — that's an afternoon of accessibility plumbing for a screen that isn't graded. A route is a component you already know how to write, it's linkable from the show page as `/log?show=hadestown`, and the browser back button works for free.

**The profile page is where the two products meet.** It is the *only* place watch logs render. Everything else in the app either ignores them or reads the aggregate.

Both `/log` and `/new` read a `?show=` param, so the two buttons on a show page land with the picker already filled:

```jsx
const [params] = useSearchParams();
const presetSlug = params.get('show');   // null when opened from the nav
```

Look the slug up in the catalog you've already loaded for the `ShowPicker` and seed `initialValues` with it. If the slug doesn't match anything, ignore it — a hand-typed URL shouldn't error.

### The header

`Marquee` is a **sibling** of `<Routes>`, so anything it touches lives in `App`. It holds: the wordmark, a link to `/shows`, the search input, a **WRITE** button (`/new`), a **LOG** button (`/log`), the avatar linking to `/user/:id`, and the theme toggle.

Hide the search input off `/` with `useLocation().pathname === '/'`, or an inert search box sits on every page.

---

## 5. Component tree

```
App                            — owns currentUser, search, theme
├── NameGate                   — full-page gate, rendered *instead of* <Routes>
│                                 on first visit. Not a modal.
├── Marquee (header)           — wordmark, search, WRITE, LOG, avatar, theme
└── <Routes>
    ├── HomeFeed                — owns orderBy
    │   ├── FeedControls        — sort select only (no tabs)
    │   ├── Loader
    │   └── PostCard × n        — time, title, bravos. Nothing else.
    ├── PostPage
    │   ├── BravoButton
    │   ├── OwnerActions        — Edit/Delete, only if author_id matches
    │   ├── CommentForm
    │   └── CommentList → CommentItem × n
    ├── ShowsDirectory → ShowTile × n
    ├── ShowPage
    │   ├── ShowHeader          — poster, title, year, average, counts
    │   │                          + [LOG A WATCH] and [START A DISCUSSION]
    │   └── PostCard × n        — posts tagged to this show
    ├── LogWatch → WatchLogForm
    ├── ProfilePage              — owns tab
    │   ├── ProfileHeader        — name, joined, four stats
    │   ├── ProfileTabs          — Diary | Posts
    │   ├── DiaryList → DiaryEntry × n   — the only place logs render
    │   └── PostCard × n
    ├── CreatePost → PostForm
    ├── EditPost   → PostForm
    └── NotFound

Shared: RatingSquares (read + edit modes), ShowPicker, Loader, EmptyState
```

Compared with v2: `FeedControls` loses its All/Reviews/Discussions tabs, `PostForm` loses its type toggle and rating field, and `LogWatch`, `WatchLogForm`, `ProfileTabs`, `DiaryList`, and `DiaryEntry` are new.

### Where state lives

| State | Owner | Why |
|---|---|---|
| `currentUser` | `App` | Needed by the header, every form, every ownership check |
| `search` | `App` | The input is in the header |
| `theme` | `App` | Sets `data-theme` on `<html>` |
| `orderBy` | `HomeFeed` | The control lives inside the feed |
| `tab` | `ProfilePage` | Diary vs Posts, local to the page |

Prop drilling is fine at this size. `currentUser` reaches four or five components; that does not justify a context provider, and it certainly doesn't justify a state library.

**Fetch both halves of the profile on mount**, then let the tab switch between two arrays already in state. Refetching on every tab click makes the page feel broken and adds a loading state you don't need.

### Two shared forms

**`PostForm`** — used by `CreatePost` and `EditPost`. Props: `initialValues`, `onSubmit`, `submitLabel`. Fields: show (optional tag, seeded from `?show=`), title (required), body, image URL. No rating, no type.

**`WatchLogForm`** — used by `LogWatch`, and by the edit-a-log flow if you build one. Props: `initialValues`, `onSubmit`. Fields: show (required), date (required, defaults to today), venue, rating, note.

Both get internal `submitting` state so the button can disable and the loader can show during the write.

### Editing and deleting watch logs

Not graded, so scope it by time remaining:

- **Minimum:** delete, from the diary entry. One button, one confirm.
- **If there's time:** `/log/:id/edit`, reusing `WatchLogForm` with `initialValues`.

Ownership is the same string comparison as posts — and since logs only ever render on their owner's profile, `currentUser.id === profileId` gates the whole controls block at once.

---

## 6. Identity — profiles without auth

On first visit the user picks a display name. You generate a UUID, insert a profile, and keep it in `localStorage`. That's the whole system, and it is verbatim the rubric's pseudo-auth stretch feature.

`src/identity.js` — note that it calls the API layer, never Supabase directly:

```js
import { createProfile } from './api/profiles';

const KEY = 'encore.user';

export function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? null;
  } catch {
    return null;   // corrupted value — treat as a new visitor
  }
}

export async function createLocalUser(displayName) {
  const profile = await createProfile(displayName.trim());
  localStorage.setItem(KEY, JSON.stringify(profile));
  return profile;
}
```

In `App`, load the user once on mount and render `NameGate` if there isn't one. Everything downstream reads `currentUser` from props.

Ownership is a string comparison:

```jsx
const isAuthor = currentUser && post.author_id === currentUser.id;
{isAuthor && <OwnerActions post={post} />}
```

**This is pseudo-auth, not security.** Anyone can edit `localStorage` and impersonate a user, and with RLS off the database will accept it. That's fine and expected — the rubric asks for exactly this. Don't call it authentication in your README.

---

## 7. The tricky parts, written out

### 7.0 The `src/api/` boundary — read this before writing any component

You are building against dummy data and swapping in Supabase at the end. That only works if **no component ever imports Supabase or the dummy arrays**. Everything goes through `src/api/`.

```
src/api/
  client.js      — the Supabase client. Doesn't exist yet during the dummy phase
  shows.js
  watchLogs.js
  posts.js
  profiles.js
  comments.js
src/data/
  dummy.js       — in-memory arrays, seed data
```

Components import `{ getPosts } from '../api/posts'`. They never learn where the data came from, so the final swap is one folder rewritten and zero components touched.

Every API function is **async and artificially slow** during the dummy phase, so loading states actually render:

```js
// src/api/posts.js — DUMMY VERSION
import { posts } from '../data/dummy';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// The feed is allowed exactly three fields. See §9.
export async function getPosts({ orderBy = 'created_at' } = {}) {
  await delay();
  return [...posts]
    .sort((a, b) =>
      a[orderBy] < b[orderBy] ? 1 : a[orderBy] > b[orderBy] ? -1 : 0)
    .map(({ id, created_at, title, upvotes }) => ({ id, created_at, title, upvotes }));
}
```

```js
// src/api/posts.js — SUPABASE VERSION, same signature, same return shape
import { supabase } from '../client';

export async function getPosts({ orderBy = 'created_at' } = {}) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, created_at, title, upvotes')
    .order(orderBy, { ascending: false });

  if (error) throw error;
  return data ?? [];
}
```

Three rules that make the swap painless:

1. **Shape the dummy data like Supabase shapes it.** Same field list, snake_case keys, nested `shows` / `profiles` objects where the real select has them, `null` not `undefined` for a missing relation. Project the fields explicitly rather than spreading `...p` — a spread quietly hands the feed `content` and `image_url`, which is the one thing §9 forbids.
2. **Throw on error, don't return it.** Components `try/catch` once. Mixing `{ data, error }` tuples into component code spreads Supabase's API surface everywhere.
3. **Sort comparators must return `0` for ties.** `(a, b) => b[x] > a[x] ? 1 : -1` never does, so equal values compare as "both less than each other" and the order goes non-deterministic. Most seed posts have `upvotes: 0`, so you'd hit this immediately on the sort-by-bravos path.

Dummy writes mutate in-memory arrays and reset on refresh. That's by design — don't add persistence.

### Fetching a post with its show and author in one query

The payoff for using Supabase rather than raw SQL — nested selects follow the foreign keys automatically. This is for `getPostById`, **not** the feed:

```js
.select(`
  id, created_at, title, content, image_url, upvotes, author_id,
  shows    ( slug, title, poster_url ),
  profiles ( id, display_name )
`)
```

The row arrives with `post.shows.title` and `post.profiles.display_name` attached — no second query, no manual join.

The relationship names are the **table** names, not the column names: `shows(...)`, never `show_id(...)`. And `post.shows` is `null` for an untagged post, so always optional-chain: `post.shows?.title`. The post page has to survive an untagged post without leaving a stray separator dot in the byline.

### The home feed

No type tabs any more — just sorting:

```jsx
const [posts, setPosts]     = useState([]);
const [loading, setLoading] = useState(true);
const [orderBy, setOrderBy] = useState('created_at');  // or 'upvotes'

useEffect(() => {
  let cancelled = false;

  (async () => {
    setLoading(true);
    try {
      const data = await getPosts({ orderBy });
      if (!cancelled) setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, [orderBy]);
```

The `cancelled` flag prevents a state update after unmount if you navigate away mid-fetch. `finally` means a thrown error still clears the loader — otherwise a failed fetch spins forever.

### Search by title

Filter the fetched array. Instant, no debounce, no extra round trip:

```jsx
const q = search.trim().toLowerCase();
const visible = q
  ? posts.filter(p => p.title.toLowerCase().includes(q))
  : posts;
```

Post title only. Render `visible`, not `posts`, and give the empty result its own `EmptyState` — a blank page with a search box on it looks like a crash.

### Bravos — relative updates, always

The rubric wants unlimited rapid clicking, so several requests can be in flight at once. Both the optimistic update **and** the rollback must be relative:

```jsx
const [upvotes, setUpvotes] = useState(post.upvotes);

async function handleBravo() {
  setUpvotes(n => n + 1);
  try {
    await upvotePost(post.id);          // → rpc('increment_upvotes')
  } catch {
    setUpvotes(n => n - 1);
  }
}
```

Writing `setUpvotes(post.upvotes + 1)` has two bugs: three fast clicks all read the same stale number and land as `+1`, and a rollback throws away the successes of other in-flight requests.

```js
// src/api/posts.js
export async function upvotePost(postId) {
  const { error } = await supabase.rpc('increment_upvotes', { post_id: postId });
  if (error) throw error;
}
```

**The RPC argument key must be exactly `post_id`.**

### Creating a post

```js
export async function createPost({ authorId, showId, title, content, imageUrl }) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      show_id:   showId  || null,
      title:     title.trim(),
      content:   content?.trim()  || null,
      image_url: imageUrl?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Coerce empty strings to `null`.** Form inputs start as `''`, and `show_id: ''` fails against a `bigint`. Without `.select()`, `data` comes back `null` and you won't have the new id to navigate to.

### Creating a watch log

```js
export async function createWatchLog({ userId, showId, watchedOn, venue, rating, note }) {
  const { data, error } = await supabase
    .from('watch_logs')
    .insert({
      user_id:    userId,
      show_id:    showId,               // required — the form must enforce this
      watched_on: watchedOn,            // 'YYYY-MM-DD' straight from <input type="date">
      venue:      venue?.trim() || null,
      rating:     rating ? Number(rating) : null,
      note:       note?.trim()  || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

`<input type="date">` gives you `'2026-03-03'`, which is exactly what a Postgres `date` column wants — pass it through untouched. Do **not** run it through `new Date()` first.

`rating ? Number(rating) : null` handles both `''` (nothing selected) and the fact that `Number('')` is `0`, which would fail the `between 1 and 5` check with a confusing error.

Default the date field to today:

```js
const today = new Date().toLocaleDateString('en-CA');   // 'YYYY-MM-DD', local time
```

`toLocaleDateString('en-CA')` is the shortest correct way to get a local ISO-style date. `toISOString().slice(0,10)` converts to UTC first and gives yesterday's date all evening in the Americas.

### Dates without a date library

Two helpers, and you're done:

```js
// 'YYYY-MM-DD' → '3 March 2026'
export function formatWatchDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// timestamptz → '2 hours ago'
export function timeAgo(timestamp) {
  const secs = (Date.now() - new Date(timestamp)) / 1000;
  const units = [['year', 31536000], ['month', 2592000], ['day', 86400],
                 ['hour', 3600], ['minute', 60]];
  for (const [name, size] of units) {
    const n = Math.floor(secs / size);
    if (n >= 1) return `${n} ${name}${n === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}
```

**Why `formatWatchDate` splits the string manually:** `new Date('2026-03-03')` parses a bare date as **UTC midnight**, and rendering that in a negative-offset timezone gives you 2 March. Passing the parts to `new Date(y, m-1, d)` builds it in local time and sidesteps it entirely. `new Date(timestamp)` in `timeAgo` is fine, because a `timestamptz` carries its own offset.

### The diary — rewatches numbered

Logs come back newest-first. To label repeats, count each show's total, then walk the list:

```js
export function withWatchNumbers(logs) {
  const totals = {};
  for (const log of logs) totals[log.show_id] = (totals[log.show_id] ?? 0) + 1;

  const seen = {};
  return logs.map(log => {
    seen[log.show_id] = (seen[log.show_id] ?? 0) + 1;
    const total = totals[log.show_id];
    return {
      ...log,
      watchTotal:  total,
      // newest-first, so the first one we meet is the highest-numbered watch
      watchNumber: total - seen[log.show_id] + 1,
    };
  });
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
```

Render the badge only when it means something:

```jsx
{log.watchTotal > 1 && (
  <span className="rewatch">{ordinal(log.watchNumber)} watch</span>
)}
```

A show seen once gets no badge. A show seen three times reads **"3rd watch", "2nd watch", "1st watch"** as you scroll down — the diary is newest-first, so the numbering counts backwards down the page. Make sure your seed data includes a user who logged the same show three times, or you'll never see this render.

### The profile page — both halves, one mount

```js
const [logs, posts] = await Promise.all([
  getWatchLogsByUser(userId),
  getPostsByUser(userId),
]);
```

The watch-log query, inside `api/watchLogs.js`, needs a tiebreaker — two shows seen on the same day would otherwise come back in arbitrary order:

```js
.from('watch_logs')
.select('id, watched_on, venue, rating, note, show_id, shows(slug, title, poster_url)')
.eq('user_id', userId)
.order('watched_on', { ascending: false })
.order('id',         { ascending: false });   // newest entry first within a day
```

The four header stats all come off arrays you already have — no extra query:

```js
const showsSeen  = new Set(logs.map(l => l.show_id)).size;
const rated      = logs.filter(l => l.rating != null);
const avgGiven   = rated.length
  ? (rated.reduce((sum, l) => sum + l.rating, 0) / rated.length).toFixed(1)
  : null;

// → logs.length · showsSeen · posts.length · avgGiven ?? '—'
```

### Show page — the aggregate, and only the aggregate

```js
const show  = await getShowBySlug(slug);         // from show_ratings
if (!show) return <NotFound />;
const posts = await getPostsByShow(show.id);     // tagged posts only
```

```js
// src/api/shows.js
export async function getShowBySlug(slug) {
  const { data, error } = await supabase
    .from('show_ratings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data;                    // null when the slug doesn't exist
}
```

`.maybeSingle()` returns `null` instead of throwing when nothing matches — so a bad slug renders your 404 instead of an error boundary. `.single()` would throw. `null` means "no such show" (render `NotFound`); a thrown error means "the request broke" (render an error state).

**Do not query `watch_logs` from this page.** The average and the counts come from the view; individual logs stay on profiles.

`avg_rating` is `null` for a show nobody has logged. Render "Not yet rated":

```jsx
{show.avg_rating
  ? <><span className="avg">{show.avg_rating}</span> <RatingSquares value={Math.round(show.avg_rating)} /></>
  : <span className="unrated">Not yet rated</span>}
```

### ShowPicker — choosing or adding a show

Both forms need a show, so the picker is shared. Load the catalog once, filter locally, and allow creating one that isn't listed:

```js
export async function findOrCreateShow(title) {
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const { data: existing, error: lookupError } = await supabase
    .from('shows').select('*').eq('slug', slug).maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('shows')
    .insert({ slug, title: title.trim(), poster_url: null })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

The slug is what stops "Hadestown" and "hadestown" becoming two shows with two separate averages.

**Throw the lookup error too.** If you only destructure `data`, a failed lookup gives you `undefined`, the function falls through to the insert, and you get a unique-violation on `shows.slug`.

**A show created this way has no poster.** `/shows` is a poster grid, so it needs a fallback tile: a solid `var(--ink)` block with the title reversed out in display type.

### Where show titles come from

- **`encore-show-titles.json`** holds a list of Broadway and West End titles for the picker's autocomplete. Optional, but it's the difference between a picker that feels like a catalog and an empty text box.
- **IBDB (ibdb.com) cannot be scraped.** Their Terms of Use prohibit harvesting "using an automated software tool or manually on a mass basis", with no educational exception.
- **Legitimate sources:** Wikidata (CC0, SPARQL endpoint at `query.wikidata.org`) and Wikipedia's category API. Show titles are facts and free to use regardless of source.
- **Posters in seed data use `placehold.co`** in the Playbill palette, not real poster art.

### Comments, attributed

```js
// src/api/comments.js
export async function createComment({ postId, authorId, content }) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: authorId, content: content.trim() })
    .select('*, profiles(id, display_name)')
    .single();

  if (error) throw error;
  return data;
}
```

```jsx
// CommentForm
async function handleSubmit(e) {
  e.preventDefault();
  const comment = await createComment({
    postId: post.id, authorId: currentUser.id, content: body,
  });
  setComments(cs => [...cs, comment]);
  setBody('');
}
```

Requesting the nested profile on the insert means the new comment renders with its author immediately, no refetch.

### Delete

```jsx
async function handleDelete() {
  if (!window.confirm('Delete this post? This cannot be undone.')) return;
  await deletePost(post.id);
  navigate('/');
}
```

Comments cascade automatically. Deleting a post has **no effect on watch logs** — they're unrelated rows, which is the whole point of the model.

---

## 8. Design system — Playbill Classic

A theatre program: cream stock, hard rules, condensed display type. No rounded corners, no shadows. Depth comes from rules and type weight.

### Tokens

```css
:root {
  --paper:        #F5F1E6;
  --paper-deep:   #EAE3D2;   /* inputs, inset panels */

  --ink:          #14110E;   /* text AND every rule/border */
  --ink-soft:     #5C5548;
  --ink-faint:    #9C9484;

  --marquee:      #F2C230;   /* Playbill yellow — wordmark, active states */
  --accent:       #8C1C13;   /* curtain red */
  --danger:       var(--accent);

  --rule:         2px solid var(--ink);
  --rule-hair:    1px solid var(--ink);

  --font-display: 'Anton', 'Oswald', Impact, sans-serif;
  --font-body:    'Libre Baskerville', Georgia, serif;
  --font-ui:      'Archivo', 'Helvetica Neue', sans-serif;
}

[data-theme='night'] {
  --paper:      #14110E;
  --paper-deep: #1F1B16;
  --ink:        #F5F1E6;
  --ink-soft:   #B8AE9A;
  --ink-faint:  #6B6353;
  --danger:     #E8705F;   /* #8C1C13 on near-black is ~2:1 — unreadable */
}
```

**Never write a literal color.** Every border is `var(--ink)`, every surface `var(--paper)`. Write `#000` for the header and the night theme ships with a black bar on a black page and invisible dividers.

### Type scale

| Use | Font | Size | Treatment |
|---|---|---|---|
| Wordmark | display | 40px | uppercase, `letter-spacing: 0.08em` |
| Post title (page) | display | 34px | uppercase |
| Show title (show page) | display | 44px | uppercase |
| Average rating | display | 40px | one decimal, e.g. `4.2` |
| Post title (card) | display | 20px | uppercase |
| Show title (diary entry) | display | 18px | uppercase |
| Rewatch badge | ui | 11px | uppercase, `0.1em`, `--ink-faint`, hairline border |
| Show name / byline | ui | 13px | uppercase, `0.14em`, `--ink-soft` |
| Body | body | 17px | `line-height: 1.65`, `max-width: 62ch` |
| Meta / timestamp | ui | 12px | uppercase, `0.1em`, `--ink-faint` |

Google Fonts: `Anton`, `Libre Baskerville` (400/700), `Archivo` (400/600).

### Rules of the house

- **No `border-radius`.** Anywhere.
- **No `box-shadow`.** Ever.
- Cards separated by one `--rule-hair` divider, not gaps and shadows.
- Header is a solid `var(--ink)` bar, wordmark in `--marquee`.
- Ratings are filled/empty **squares**, not stars.
- Averages print as one decimal in display type: `4.2`, never `4.2/5`.
- Content column caps at 720px.
- Focus rings: `outline: 2px solid var(--ink); outline-offset: 2px`.

**Rating squares appear in exactly two places** — diary entries, and the aggregate on show pages and tiles. Never on a `PostCard`, never on a `PostPage`. The rewatch badge is `--font-ui`, 11px, uppercase, `--ink-faint`, with a hairline border.

```css
.btn {
  font: 600 13px/1 var(--font-ui);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 12px 20px;
  background: var(--ink);
  color: var(--paper);
  border: 2px solid transparent;   /* reserves the hover border's space */
  cursor: pointer;
}
.btn:hover {
  background: var(--paper);
  color: var(--ink);
  border-color: var(--ink);
}
```

### Loader — marquee bulbs

```css
.loader { display: flex; gap: 10px; }
.loader span {
  width: 14px; height: 14px;
  background: var(--marquee);
  border: var(--rule-hair);
  animation: bulb 1.1s infinite ease-in-out;
}
.loader span:nth-child(2) { animation-delay: 0.18s; }
.loader span:nth-child(3) { animation-delay: 0.36s; }

@keyframes bulb {
  0%, 80%, 100% { opacity: 0.22; }
  40%           { opacity: 1; }
}
```

---

## 9. Screen layouts

### Home feed (`/`)

Full-width `var(--ink)` header bar: wordmark in `--marquee`, a link to Shows, a search input, WRITE and LOG buttons, avatar + name linking to the profile, theme toggle. Below it, a sort control only, right-aligned. Then feed rows, each separated by a hairline rule.

**The rubric line, and the easiest point to lose:** a feed row shows creation time, title, and bravo count. **Three fields. Nothing else.** No body, no image, no rating squares, no show tag, no author byline. The feed query doesn't fetch `shows(...)` or `profiles(...)` at all — less data over the wire, and no way for the wrong field to leak into the markup.

### Shows directory (`/shows`)

Three-column grid of poster tiles: poster with a 2px `var(--ink)` border, title beneath in display type, then the average and count. `avg_rating` is `null` until someone logs a watch — render "Not yet rated". `poster_url` is `null` for any show a user minted through the `ShowPicker` — render a solid ink block with the title reversed out, never a broken image icon.

This is the Letterboxd wall, and it lives on its own route so the feed constraint doesn't apply to it.

### Show page (`/show/:slug`)

"← All shows" link. Two columns: poster left, details right — show title, opening year, "seen by N people · N logs", the average with rating squares and "from N ratings", then two buttons: LOG A WATCH (`/log?show=slug`) and START A DISCUSSION (`/new?show=slug`). Below that, one "Discussion (n)" section of tagged posts.

**No list of individual watch logs on this page.** Numbers only.

### Post page (`/post/:id`)

Single column, max-width 720px, centered. "← Back" link. Show name (a link) + "Posted by [name]" (a link) — reads cleanly with no leading separator dot when untagged. Post title, timestamp. No rating anywhere on this page. Optional image, optional body in serif at 62ch. Then a hairline rule, the bravo button left and Edit/Delete right (owner only), another hairline rule, then Comments: a form and the list, oldest first.

### Profile page (`/user/:id`)

Display name, "Joined [month year]", then four stats in a row — Logs / Shows / Posts / Avg given — separated by vertical hairline rules. "Avg given" reads "—" for a user who hasn't rated anything. Below that, two tabs: Diary | Posts, Diary active by default, underlined in `--marquee` when active.

**Diary tab** — newest-first list of watch logs. Each entry: a small poster thumbnail, show title (a link), a rewatch badge ("3rd watch") shown only when that show appears more than once in this diary, a date + venue meta line (no dangling separator dot when venue is absent), rating squares (omitted entirely when unrated, never five empty squares), an optional note, and — own profile only — a delete control.

**Posts tab** — the same three-field feed rows used on the home feed.

Empty states: "No watches logged yet." / "Nothing posted yet."

### Create post (`/new`)

Single column, 560px. No type toggle. Fields: show (optional, `ShowPicker`, prefilled from `?show=`), title (required), body (optional), image URL (optional). Edit is the same form, prefilled, heading changed to "Revise".

### Log a watch (`/log`)

Single column, 560px, a full page, not a modal. Fields: show (required, `ShowPicker`, prefilled from `?show=`), date watched (required, defaults to today), venue (optional), rating (optional, clickable squares with a way to clear), note (optional, 3 rows). Submit: "Save to diary". On save, navigate to `/user/:id` with the Diary tab active.

**Nothing on this form creates a post.** No "also share this" checkbox — that would re-merge the two products.

---

## 10. Rubric mapping

Every graded requirement lands on `posts`. Nothing graded touches `watch_logs`, which is why the diary can slip without costing points.

### Required

| Requirement | Where |
|---|---|
| Create form for posts | `/new` → `PostForm` |
| Title required | `required` on the input + `not null` on the column |
| Optional body text and external image URL | `content`, `image_url` — both nullable |
| Home feed of previous posts | `HomeFeed` |
| Feed shows **only** time, title, upvotes | `PostCard` — §9 |
| Clicking a post opens its own page | `PostCard` wraps its title in a `<Link>` to `/post/:id` |
| Sort by creation time **or** upvote count | `orderBy` → `.order()` |
| Search posts by title | `search` in `App` → client-side filter |
| Post page with content, image, comments | `PostPage` |
| Users can comment on the post page | `comments` table + `CommentForm` |
| Upvote button, each click +1, unlimited | `BravoButton` + `increment_upvotes` |
| Edit a post from its post page | `/post/:id/edit` |
| Delete a post from its post page | `handleDelete` |

### Stretch being targeted

| Feature | Implementation |
|---|---|
| Pseudo-auth — random user ID, only the author can edit/delete | `identity.js` + `OwnerActions` (§6) |
| Loading animation while fetching | Marquee-bulb `Loader` (§8) |

### Not graded at all

The shows catalog, the watch-log diary, aggregate ratings, and profile pages. These are the reason this project goes beyond a generic forum — but if week two gets tight, **the required list above finishes first.**

---

## 11. Gotchas that will cost you an evening

1. **RLS.** If writes silently do nothing, this is why about 90% of the time. `watch_logs` is new and easy to forget to disable it on.
2. **The feed renders three fields.** Time, title, bravos. No body, no image, no show tag, no byline.
3. **Absolute upvote math breaks under rapid clicking.** Always `setUpvotes(n => n + 1)`, never `setUpvotes(post.upvotes + 1)`.
4. **`post.shows` is `null`** when a post isn't tagged. Optional-chain everywhere: `post.shows?.title`.
5. **`avg_rating` is `null`** for shows nobody has logged. Render "Not yet rated", never `NaN` or `0.0`.
6. **`avg_rating` arrives as a string.** Postgres `numeric` → JSON string. `Number()` it before doing arithmetic.
7. **`useParams()` returns strings.** `id` is `"12"`, not `12`. Fine for `.eq()`, fatal for `===`.
8. **Header state can't live in a page component.** `Marquee` is a sibling of `<Routes>`, so `currentUser`, `search`, and `theme` belong in `App`.
9. **Never write a literal color.** Every border `var(--ink)`, every surface `var(--paper)`, or the night theme breaks.
10. **Empty form fields send `''`, not `null`** — type errors on `smallint` and `bigint`, CHECK violations on `rating`. Coerce with `|| null`.
11. **Missing `.select()` after an insert** — `data` comes back `null` and you have no id to navigate to.
12. **`VITE_` prefix required** on env vars, and restart the dev server after editing `.env`.
13. **Dummy-data writes reset on refresh.** In-memory arrays, by design.
14. **`new Date('2026-03-03')` is UTC midnight** and renders as the previous day in the Americas. Use the `formatWatchDate` helper in §7.
15. **`toISOString().slice(0,10)` for "today" is wrong** for the same reason. Use `toLocaleDateString('en-CA')`.
16. **Don't add a unique constraint on `(user_id, show_id)`.** Those aren't duplicates, they're rewatches.
17. **Don't render individual watch logs on a show page.** Aggregate only.
18. **No rating squares on posts.** If they appear, the merged model has crept back in.
19. **Components must not import Supabase or `dummy.js`.** Everything through `src/api/` (§7.0), or the final swap becomes a rewrite.
20. **`poster_url` is `null`** for any show a user added through the picker. `/shows` needs a fallback tile or you get a grid of broken images.
21. **RPC argument names must match the SQL parameter.** `rpc('increment_upvotes', { post_id })`, not `{ postId }`.
22. **Sort comparators must return `0` for ties**, or the feed reorders itself between renders once several posts share an upvote count.
23. **Don't scrape IBDB.** Their terms prohibit it with no educational exception. Wikidata and Wikipedia are the sanctioned sources; posters are `placehold.co`.
24. **Check the README boxes.** `[ ]` → `[x]`.

---

## 12. Submission checklist

- [ ] Repo **private**, `codepathreview` added as collaborator
- [ ] README follows the Project 8 template exactly
- [ ] Every implemented feature checked `[x]`
- [ ] GIF walkthrough covering every required feature in one take: feed → sort → search → open a post → bravo → comment → create → edit → delete. Append shows, the diary, and the theme toggle after.
- [ ] Commits spread across both weeks
- [ ] `.env` gitignored
- [ ] Submitted through the course portal

---

## 13. What changed from v2

### The model

**Removed:** the `type` column, the `review_shape` constraint, and `posts.rating`. The words "review" and "discussion" no longer appear as data — there are just posts.

**Added:** the `watch_logs` table, with no unique constraint on `(user_id, show_id)`.

**Changed:** `show_ratings` now aggregates `watch_logs` instead of reviews, and reports `log_count`, `rating_count`, and `viewer_count` rather than `review_count` / `discussion_count`. `posts.show_id` changed from `on delete cascade` to `on delete set null`, so deleting a show no longer destroys graded content.

**Settled:** log ratings **do** roll up into a public average. Individual entries stay scoped to the profile.

### The screens

**Removed:** the All/Reviews/Discussions tabs on the feed, the type toggle on the create form, and the rating field on posts.

**Added:** `/log` and the `WatchLogForm`; the Diary tab and `DiaryEntry` on profiles; rewatch badges; `LOG A WATCH` on the show page; null-poster tiles on `/shows`.

**Changed — a rubric fix, not a model change:** the feed row is now **three fields only**. v2 kept a show tag and an author byline on each card. The byline and tag are gone, and `getPosts` no longer fetches the relations that would let them come back by accident.

**Changed:** the show page lists posts in one section rather than two and leads with the aggregate. Profile stats now count logs, distinct shows, posts, and average rating given.

### The plumbing

**Added:** §7.0, the `src/api/` boundary. Every data operation is now an API-layer function that throws on error.

**Added:** the two date helpers, replacing a date library.

**Added:** the show-title sourcing constraints — `encore-show-titles.json`, the IBDB scraping prohibition, and `placehold.co` posters.

### Unchanged

The entire design system (§8), the identity scheme (§6), the stack (§2), every graded feature, and the loading animation.
