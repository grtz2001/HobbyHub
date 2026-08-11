# ENCORE — Project Spec (v2)

**WEB102 Unit 8 Final Project · HobbyHub**
A musical theatre community: rate and review shows like Letterboxd, discuss them like a forum.

> **v2 changes:** shows and user profiles are now real entities. Reviews and discussion posts share one table. Poster grid and flag filtering are cut to make room. See §13 for what moved.

---

## 1. Concept

Encore has four things in it:

- **Shows** — the catalog. *Hadestown*, *Merrily We Roll Along*, and so on. Each has a page with its average rating and everything written about it.
- **Reviews** — a user's rating (1–5) and write-up of one show.
- **Discussions** — forum posts. Can hang off a show ("Anyone else confused by the *Company* ending?") or be general.
- **Profiles** — who wrote what. Every review and comment is attributable, and each user has a page showing their history.

### The one architectural decision that makes this fit in two weeks

**Reviews and discussions are the same table.** A review is a post that has a show and a rating attached. One `posts` table with a `type` discriminator means the detail page, comment system, upvote button, edit form, and delete flow are each built once and work for both. Two separate tables would mean building all of it twice — that's the difference between ambitious and undoable.

They stay distinct wherever the user can see: separate create forms, different cards, tabs on the feed.

### Ratings vs. Bravos vs. Averages

Three numbers, easy to confuse, so keep them visually distinct:

| | What it measures | Who sets it | Where it shows |
|---|---|---|---|
| **Rating** (1–5 squares) | How good the *show* is | The review's author | On the review |
| **Bravos** (upvotes) | How much the community likes the *write-up* | Anyone, unlimited clicks | On reviews and discussions |
| **Average** (e.g. 4.2) | How good the *show* is, across all reviews | Computed | On the show page and shows directory |

The rubric requires unlimited repeat upvoting, so bravos can never be a rating. Keeping them separate is what lets the Letterboxd idea coexist with the assignment.

---

## 2. Tech stack

- **Vite + React** (JavaScript, not TypeScript)
- **react-router-dom v6**
- **Supabase** (`@supabase/supabase-js` v2) — Postgres, so everything below is standard SQL
- **Plain CSS** with custom properties. No Tailwind; the Playbill look is rules, type, and spacing.

```bash
npm create vite@latest encore -- --template react
cd encore
npm install @supabase/supabase-js react-router-dom
```

No `uuid` package needed — browsers have `crypto.randomUUID()` built in.

---

## 3. Database schema

Run this in the Supabase **SQL Editor** in one go.

```sql
-- ---------------------------------------------------------------- SHOWS
create table shows (
  id           bigint generated always as identity primary key,
  slug         text        not null unique,
  title        text        not null,
  opening_year smallint,
  poster_url   text,
  synopsis     text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------- PROFILES
-- id is generated in the browser with crypto.randomUUID() and kept in
-- localStorage. No passwords, no Supabase Auth.
create table profiles (
  id           uuid        primary key,
  display_name text        not null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------- POSTS (both types)
create table posts (
  id         bigint      generated always as identity primary key,
  created_at timestamptz not null default now(),
  type       text        not null default 'review'
                         check (type in ('review', 'discussion')),
  author_id  uuid        references profiles(id) on delete set null,
  show_id    bigint      references shows(id)    on delete cascade,
  title      text        not null,
  content    text,
  image_url  text,
  rating     smallint    check (rating between 1 and 5),
  upvotes    integer     not null default 0,

  -- A review must name a show and carry a rating.
  -- A discussion may name a show, but never carries a rating.
  constraint review_shape check (
       (type = 'review'     and show_id is not null and rating is not null)
    or (type = 'discussion' and rating is null)
  )
);

-- ------------------------------------------------------------- COMMENTS
create table comments (
  id         bigint      generated always as identity primary key,
  created_at timestamptz not null default now(),
  post_id    bigint      not null references posts(id) on delete cascade,
  author_id  uuid        references profiles(id) on delete set null,
  content    text        not null
);

create index on posts (show_id);
create index on posts (author_id);
create index on posts (created_at desc);
create index on comments (post_id);

-- ------------------------------------------- AGGREGATE RATINGS (a view)
create view show_ratings as
select
  s.id,
  s.slug,
  s.title,
  s.opening_year,
  s.poster_url,
  round(avg(p.rating) filter (where p.type = 'review'), 1) as avg_rating,
  count(*) filter (where p.type = 'review')                as review_count,
  count(*) filter (where p.type = 'discussion')            as discussion_count
from shows s
left join posts p on p.show_id = s.id
group by s.id;

-- ------------------------------------------------------------------ RLS
-- This app has no real auth, so RLS would block every write.
alter table shows    disable row level security;
alter table profiles disable row level security;
alter table posts    disable row level security;
alter table comments disable row level security;

-- ------------------------------------------- ATOMIC UPVOTES (see §7)
create or replace function increment_upvotes(post_id bigint)
returns void language sql as $$
  update posts set upvotes = upvotes + 1 where id = post_id;
$$;
```

### Notes on the schema

- **The `review_shape` constraint is the whole design in four lines.** It's what lets one table hold two kinds of thing without the data going soft. If your insert fails with `violates check constraint "review_shape"`, you sent a review without a rating or a discussion with one.
- **`show_id` cascades, `author_id` sets null.** Deleting a show removes its posts (correct — they're about nothing now). Deleting a profile leaves the posts standing as anonymous rather than nuking someone's contributions.
- **`show_ratings` is a view, not a table.** Query it with `supabase.from('show_ratings').select('*')` exactly like a table. Averages are always current, and you never compute them in JavaScript.
- **`filter (where ...)` beats a `WHERE` clause here** because the left join has to keep shows that have zero reviews. A show with no reviews yet gets `avg_rating: null` and `review_count: 0`, which is what the UI wants.
- **No `flag` column.** Production type was cut with flag filtering (§13). If you want it back later it's one nullable text column.

---

## 4. Routes

| Path | Component | Purpose |
|---|---|---|
| `/` | `HomeFeed` | All posts. Tabs: All / Reviews / Discussions |
| `/post/:id` | `PostPage` | One review or discussion, with comments |
| `/new` | `CreatePost` | Create — form switches on type |
| `/post/:id/edit` | `EditPost` | Edit (author only) |
| `/shows` | `ShowsDirectory` | Poster grid of the catalog, with averages |
| `/show/:slug` | `ShowPage` | Poster, average rating, its reviews and discussions |
| `/user/:id` | `ProfilePage` | Someone's reviews, discussions, and stats |
| `*` | `NotFound` | "This show has closed." |

The Letterboxd poster grid lives on `/shows`, not the home feed. That sidesteps the rubric constraint in §9 entirely — the feed stays a clean list, and you still get the wall of posters.

---

## 5. Component tree

```
App                            — owns currentUser, search, theme
├── NameGate                   — one-time modal on first visit
├── Marquee (header)           — wordmark, search, nav, "Write", avatar, theme toggle
└── <Routes>
    ├── HomeFeed               — owns typeTab, orderBy
    │   ├── FeedControls       — All/Reviews/Discussions tabs, sort select
    │   ├── Loader
    │   └── PostCard × n
    ├── PostPage
    │   ├── BravoButton
    │   ├── OwnerActions       — Edit/Delete, only if author_id matches
    │   ├── CommentForm
    │   └── CommentList → CommentItem × n
    ├── ShowsDirectory → ShowTile × n
    ├── ShowPage
    │   ├── ShowHeader         — poster, title, year, average, review count
    │   └── PostCard × n       — its reviews, then its discussions
    ├── ProfilePage
    │   ├── ProfileHeader      — name, joined date, counts, average given
    │   └── PostCard × n
    ├── CreatePost → PostForm
    ├── EditPost   → PostForm
    └── NotFound

Shared: RatingSquares (read + edit modes), ShowPicker, Loader, EmptyState
```

### Where state lives

`Marquee` is a **sibling** of `<Routes>`, so anything the header touches must live in `App`.

| State | Owner | Why |
|---|---|---|
| `currentUser` | `App` | Needed by the header, every form, and every ownership check |
| `search` | `App` | Input is in the header |
| `theme` | `App` | Sets `data-theme` on `<html>` |
| `typeTab`, `orderBy` | `HomeFeed` | Controls live inside the feed |

Hide the search input off `/` — `useLocation().pathname === '/'` — or an inert search box sits on every page.

**`PostForm` is shared** by create and edit. Props: `initialValues`, `onSubmit`, and `type`. Give it internal `submitting` state so the loader can show during the write.

---

## 6. Identity — profiles without auth

On first visit the user picks a display name. You generate a UUID, insert a profile, and keep it in `localStorage`. That's the entire system, and it's verbatim the rubric's pseudo-auth stretch feature.

`src/identity.js`:

```js
import { supabase } from './client';

const KEY = 'encore.user';

export function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? null;
  } catch {
    return null;   // corrupted value — treat as a new visitor
  }
}

export async function createLocalUser(displayName) {
  const id = crypto.randomUUID();

  const { data, error } = await supabase
    .from('profiles')
    .insert({ id, display_name: displayName.trim() })
    .select()
    .single();

  if (error) throw error;
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}
```

In `App`, load the user once on mount and render `NameGate` if there isn't one. Everything downstream reads `currentUser` from context or props.

Ownership is a string comparison:

```jsx
const isAuthor = currentUser && post.author_id === currentUser.id;
{isAuthor && <OwnerActions post={post} />}
```

**This is pseudo-auth, not security.** Anyone can edit `localStorage` and impersonate a user, and with RLS off the database will accept it. That's fine and expected — the rubric asks for exactly this. Don't describe it as authentication in your README.

`localStorage` is fine here because this is your own Vite app running in a normal browser.

---

## 7. The tricky parts, written out

### Fetching posts with their show and author in one query

This is the payoff for using Supabase rather than raw SQL. Nested selects follow the foreign keys automatically:

```jsx
const { data, error } = await supabase
  .from('posts')
  .select(`
    id, created_at, type, title, rating, upvotes, author_id,
    shows    ( slug, title, poster_url ),
    profiles ( id, display_name )
  `)
  .order('created_at', { ascending: false });
```

Each row comes back with `post.shows.title` and `post.profiles.display_name` already attached — no second query, no manual join. `post.shows` is `null` for a general discussion, so always optional-chain it: `post.shows?.title`.

The relationship names are the **table** names, not the column names. It's `shows(...)`, not `show_id(...)`.

### The home feed, with type tabs and sorting

```jsx
const [posts, setPosts]     = useState([]);
const [loading, setLoading] = useState(true);
const [typeTab, setTypeTab] = useState('all');        // all | review | discussion
const [orderBy, setOrderBy] = useState('created_at'); // or 'upvotes'

useEffect(() => {
  let cancelled = false;

  (async () => {
    setLoading(true);

    let query = supabase
      .from('posts')
      .select('id, created_at, type, title, rating, upvotes, shows(slug,title), profiles(id,display_name)')
      .order(orderBy, { ascending: false });

    if (typeTab !== 'all') query = query.eq('type', typeTab);

    const { data, error } = await query;
    if (cancelled) return;
    if (error) console.error(error);
    setPosts(data ?? []);
    setLoading(false);
  })();

  return () => { cancelled = true; };
}, [typeTab, orderBy]);
```

The `cancelled` flag prevents a state update after unmount if you navigate away mid-fetch.

### Search by title

Filter the fetched array — instant, no debounce, no extra round trip:

```jsx
const q = search.trim().toLowerCase();
const visible = q
  ? posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.shows?.title.toLowerCase().includes(q))
  : posts;
```

### Show page — averages come free from the view

```jsx
const { slug } = useParams();

// 1. the show, with its average already computed
const { data: show } = await supabase
  .from('show_ratings')
  .select('*')
  .eq('slug', slug)
  .single();

// 2. everything written about it
const { data: posts } = await supabase
  .from('posts')
  .select('id, created_at, type, title, rating, upvotes, profiles(id,display_name)')
  .eq('show_id', show.id)
  .order('created_at', { ascending: false });
```

Split `posts` into reviews and discussions in JavaScript — one pass over an array beats a second network call.

`avg_rating` is `null` when a show has no reviews. Render "Not yet rated", not `NaN`.

### Bravos — relative updates, always

The rubric wants unlimited rapid clicking, so several requests can be in flight at once. Both the UI update and the rollback must be relative:

```jsx
const [upvotes, setUpvotes] = useState(post.upvotes);

async function handleBravo() {
  setUpvotes(n => n + 1);
  const { error } = await supabase.rpc('increment_upvotes', { post_id: post.id });
  if (error) setUpvotes(n => n - 1);
}
```

Computing `post.upvotes + 1` and writing that absolute value has two bugs: three fast clicks all read the same stale number and land as `+1`, and a failed rollback throws away the successes. The RPC in §3 does the increment inside Postgres, which fixes the database side.

### Creating a review

```jsx
const { data, error } = await supabase
  .from('posts')
  .insert({
    type:      'review',
    author_id: currentUser.id,
    show_id:   selectedShow.id,
    title,
    content:   content   || null,
    image_url: image_url || null,
    rating:    Number(rating),      // required for reviews
  })
  .select()
  .single();

if (!error) navigate(`/post/${data.id}`);
```

For a discussion, send `type: 'discussion'`, `rating: null`, and `show_id` either a real id or `null`.

**Coerce empty strings to `null`.** Form inputs start as `''`. Sending `rating: ''` to a `smallint` throws a type error and `rating: 0` fails the range check. Without `.select()`, `data` comes back `null` and you won't have the new id.

### ShowPicker — choosing or adding a show

Reviews need a `show_id`, so the form needs a picker. Load the catalog once, filter locally, and allow creating one that isn't listed:

```jsx
async function findOrCreateShow(title) {
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const { data: existing } = await supabase
    .from('shows').select('*').eq('slug', slug).maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('shows').insert({ slug, title: title.trim() }).select().single();

  if (error) throw error;
  return data;
}
```

`.maybeSingle()` returns `null` instead of erroring when nothing matches — `.single()` would throw. The slug is what stops "Hadestown" and "hadestown" becoming two shows.

### Comments, attributed

```jsx
const { data, error } = await supabase
  .from('comments')
  .insert({ post_id: id, author_id: currentUser.id, content: body })
  .select('*, profiles(id, display_name)')
  .single();

if (!error) {
  setComments(cs => [...cs, data]);
  setBody('');
}
```

Requesting the nested profile on insert means the new comment renders with its author immediately, no refetch.

### Delete

```jsx
async function handleDelete() {
  if (!window.confirm('Delete this? This cannot be undone.')) return;
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (!error) navigate('/');
}
```

Comments cascade automatically.

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
| Post title (card) | display | 20px | uppercase |
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

### Home feed

```
┌──────────────────────────────────────────────────┐
│ ENCORE   SHOWS   [search…]   WRITE   ○ maria     │  ← ink bar, yellow wordmark
├──────────────────────────────────────────────────┤
│ All │ Reviews │ Discussions      Sort: [Newest ▾]│
├──────────────────────────────────────────────────┤
│ 2 HOURS AGO                                      │
│ A HADESTOWN THAT FINALLY EARNS ITS ENDING        │
│ HADESTOWN · ellis_w  ■■■■■            ▲ 91       │
├──────────────────────────────────────────────────┤
│ 5 HOURS AGO                            DISCUSSION│
│ IS THE SWEENEY PROSHOT WORTH IT?                 │
│ SWEENEY TODD · quietriot              ▲ 21       │
└──────────────────────────────────────────────────┘
```

**Rubric constraint:** the feed shows creation time, title, and bravo count. No body text, no images. Show name, author, and the review's rating squares are metadata on the title — fine, and they're what make the feed readable. What must never appear here is `content` or `image_url`.

### Shows directory (`/shows`)

3-column grid of poster tiles: poster image with a 2px `var(--ink)` border, show title beneath in display type, average rating and review count under that. Shows with no reviews yet read "Not yet rated". This is the Letterboxd wall, and it's on its own route so the feed constraint doesn't apply.

### Show page (`/show/:slug`)

```
← ALL SHOWS

┌────────┐  HADESTOWN
│        │  2019 · 14 REVIEWS
│ poster │
│        │  4.2          ■■■■□
└────────┘  [ WRITE A REVIEW ]  [ START A DISCUSSION ]
──────────────────────────────────────────────
REVIEWS (14)
  ...PostCards...
──────────────────────────────────────────────
DISCUSSIONS (3)
  ...PostCards...
```

### Post page (`/post/:id`)

```
← BACK

HADESTOWN · REVIEW BY ellis_w              ← show is a Link, author is a Link
A HADESTOWN THAT FINALLY EARNS ITS ENDING
2 HOURS AGO                     ■■■■■
──────────────────────────────────────────────
[ image, full width, 2px var(--ink) border ]

Body copy, Libre Baskerville, 62ch measure…
──────────────────────────────────────────────
[ ▲ BRAVO · 91 ]              [ EDIT ]  [ DELETE ]   ← owner only
──────────────────────────────────────────────
COMMENTS (3)
[ your comment…                          ] [ POST ]

ellis_w · 1 HOUR AGO
Completely disagree about act two, but…
```

### Profile page (`/user/:id`)

Name in display type, "Joined March 2026", then three stats in a row: reviews written, discussions started, average rating given. Below that, their posts as `PostCard`s, newest first.

### Create form (`/new`)

Single column, 560px. A type toggle at the top — **Review** | **Discussion** — swaps the fields:

| Field | Review | Discussion |
|---|---|---|
| Show | required (`ShowPicker`) | optional |
| Rating | required (5 squares) | hidden |
| Title | required | required |
| Body | optional | optional |
| Image URL | optional | optional |

Edit is the same form, prefilled, heading changed to "Revise". The type toggle is disabled on edit — changing a review into a discussion would violate `review_shape` and isn't worth handling.

---

## 10. Rubric mapping

### Required

| Requirement | Where |
|---|---|
| Create form for posts | `/new` → `PostForm` |
| Title required | `required` on input + NOT NULL |
| Optional body text and external image URL | `content`, `image_url` — nullable |
| Home feed of previous posts | `HomeFeed` |
| Feed shows only time, title, upvotes | `PostCard` — §9 constraint |
| Click post → new page | `<Link to={\`/post/${id}\`}>` |
| Sort by creation time or upvotes | `orderBy` → `.order()` |
| Search posts by title | `search` in `App` → client filter |
| Post page with content, image, comments | `PostPage` |
| Comments on the post page | `comments` table + `CommentForm` |
| Upvote button, unlimited clicks | `BravoButton` + `increment_upvotes` |
| Edit from the post page | `/post/:id/edit` |
| Delete from the post page | `handleDelete` |

### Stretch

| Feature | Implementation |
|---|---|
| Pseudo-auth — random user ID, only the author can edit/delete | `identity.js` + `OwnerActions` (§6) |
| Loading animation while fetching | Marquee-bulb `Loader` (§8) |

Not on the rubric at all, but the reason you're building this: the shows catalog, aggregate ratings, and profile pages.

---

## 11. Gotchas that will cost you an evening

1. **RLS.** If writes silently do nothing, this is why ~90% of the time. The SQL in §3 disables it on all four tables.
2. **`review_shape` violations.** A review without a rating, or a discussion with one. Read the constraint name in the error — it tells you exactly which.
3. **Nested select names are table names.** `shows(...)` and `profiles(...)`, never `show_id(...)`.
4. **`post.shows` is null for general discussions.** Optional-chain everywhere: `post.shows?.title`.
5. **`.single()` throws when nothing matches.** Use `.maybeSingle()` for "does this show exist yet?"
6. **Missing `.select()`** after insert → `data` is `null`.
7. **No `VITE_` prefix** on env vars → `undefined` URL. Restart the dev server after editing `.env`.
8. **Empty form fields send `''`, not `null`** → type errors on `smallint`, CHECK violations on `rating`.
9. **Absolute upvote math breaks under rapid clicking.** Always `setUpvotes(n => n + 1)`.
10. **`useParams()` returns strings.** `id` is `"12"`. Fine for `.eq()`, fatal for `===`.
11. **Header state can't live in `HomeFeed`.** `currentUser`, `search`, `theme` belong in `App`.
12. **Literal `#000` anywhere kills the night theme.**
13. **`avg_rating` is `null` for unreviewed shows.** Render "Not yet rated", not `NaN` or `0.0`.
14. **Don't let the feed render body or images.** Explicit rubric line, easiest point to lose.
15. **Check the README boxes.** `[ ]` → `[x]`.

---

## 12. Submission checklist

- [ ] Repo **private**, `codepathreview` added as collaborator
- [ ] README follows the Project 8 template exactly
- [ ] Every implemented feature checked `[x]`
- [ ] GIF walkthrough covering every required feature in one take: feed → sort → search → open a post → bravo → comment → create → edit → delete. Append shows, profiles, and the theme toggle after.
- [ ] Commits spread across both weeks
- [ ] `.env` gitignored
- [ ] Submitted through the course portal

---

## 13. What changed from v1

**Added:** `shows` and `profiles` tables; the `type` discriminator on posts; `show_ratings` view; `/shows`, `/show/:slug`, `/user/:id` routes; `ShowPicker` and `NameGate`; pseudo-auth via localStorage identity.

**Cut, to make room:** the poster grid on the home feed (it lives at `/shows` now, which is better — the rubric constraint doesn't apply there) and production flags with feed filtering (the `flag` column is gone; type tabs do a similar job).

**Unchanged:** the whole design system, every required feature, the Supabase stack, and the loading animation.
