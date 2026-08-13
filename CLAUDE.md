# Encore — Project Conventions

A musical theatre community site. Keep a diary of shows you've seen, and argue about them in public. Built for CodePath WEB102 Unit 8.

Full spec: `docs/encore-spec.md`. Build order: `docs/encore-build-plan.md`.

---

## Stack — this is fixed

- **React 18 + JavaScript.** No TypeScript. Do not add it, do not suggest it, do not write JSDoc type annotations that mimic it.
- **Vite** as the build tool.
- **react-router-dom v6** for routing.
- **Plain CSS.** One `.css` file per component, imported at the top of that component.
- **Supabase** for the database — but not yet. See "Data layer" below.

## Keep it grounded

This is a student project with a two-week deadline. The goal is code the author can read, explain, and debug at 1am. Prefer the obvious solution.

**Do not add:**

- TypeScript
- Tailwind, styled-components, CSS Modules, Emotion, or any CSS framework
- Redux, Zustand, Jotai, Recoil, MobX, or any state library
- React Query, SWR, or any data-fetching library
- A component library (MUI, Chakra, shadcn, Radix, Headless UI)
- Testing infrastructure — no Jest, Vitest, or Testing Library
- `date-fns`, `moment`, `dayjs` — the two helpers needed are in `docs/encore-spec.md` §7
- Barrel files (`index.js` that only re-exports)
- Path aliases (`@/components`) — relative imports are fine
- Storybook, ESLint plugins beyond the Vite default, Prettier configs

If a dependency isn't already in `package.json`, don't reach for it. The only installs are `@supabase/supabase-js` and `react-router-dom`.

## React conventions

- **Function components only.** No class components.
- **`useState` and `useEffect` are the whole toolkit.** `useContext` is allowed for `currentUser` only, since it's needed nearly everywhere. Reach for `useMemo`, `useCallback`, or `useReducer` only when there's a measured problem — not preemptively.
- **No custom hooks until the same logic appears three times.** Two copies is fine. Extracting early makes the code harder to follow, not easier.
- **Prop drilling is fine at this size.** Two or three levels is normal and readable. Don't introduce context to avoid it.
- **One component per file**, named the same as the file. `PostCard.jsx` exports `PostCard`.
- **Default export** for components.
- Keep components under ~150 lines. If one grows past that, split it by what it *renders*, not by clever abstraction.

## File structure

```
src/
├── api/            data access — the ONLY place that knows where data comes from
│   ├── posts.js
│   ├── watchLogs.js
│   ├── shows.js
│   ├── comments.js
│   └── profiles.js
├── data/
│   └── dummy.js    seed data as JS objects (temporary)
├── components/     reusable pieces: PostCard, DiaryEntry, RatingSquares, Loader, Marquee…
├── pages/          one per route: HomeFeed, PostPage, ShowPage, ProfilePage, LogWatch…
├── identity.js     localStorage user
├── client.js       supabase client (added at the end)
├── App.jsx
└── index.css       design tokens + global styles
```

## Data layer — the one rule that matters

**Components must never import Supabase or `data/dummy.js` directly.** Every read and write goes through `src/api/`.

```js
// GOOD — component doesn't know or care where data lives
import { getPosts } from '../api/posts';
const rows = await getPosts({ orderBy: 'upvotes' });

// BAD — couples the component to the data source
import { supabase } from '../client';
const { data } = await supabase.from('posts').select();
```

Right now `src/api/` reads from `data/dummy.js`. At the end of the project those function bodies get rewritten to call Supabase, and **no component changes**. That swap only stays cheap if the boundary is respected everywhere.

Three things the API functions must keep doing:

1. **Stay `async` and keep the artificial ~300ms delay.** Removing it makes loading states invisible during development, and you'll ship a loader that was never actually wired up.
2. **Throw on error, don't return it.** API functions return data or throw. Components `try/catch`. Don't leak `{ data, error }` tuples into component code.
3. **Return Supabase's nested shape**, not a flattened one, and project fields explicitly rather than spreading:
   ```js
   // a single post, for the post page
   { id, created_at, title, content, image_url, upvotes, author_id,
     shows:    { id, slug, title, poster_url },   // null when untagged
     profiles: { id, display_name } }
   ```
   Components read `post.shows?.title` from day one. Flatten it now and every component needs editing at swap time.

## Data model

**Five tables. Three separate entities. Full DDL in `docs/encore-spec.md` §3.**

- **shows** — the catalog. `slug` is the URL key.
- **profiles** — `id` is a UUID made in the browser and kept in `localStorage`. No passwords.
- **watch_logs** — the Letterboxd diary. One row per viewing: `watched_on`, `venue`, `rating` (1–5, nullable), `note`. **Repeatable** — many rows per user per show.
- **posts** — the public forum. `title` required, `content` and `image_url` optional, `upvotes`. **No rating column.** `show_id` is an optional tag.
- **comments** — belong to a post, authored by a profile.

### The three rules that define this model

1. **Watch logs and posts are independent.** A user can log without posting or post without logging. Never write a feature that assumes one implies the other, and never add a "share this to the feed" control to the log form.
2. **Posts never carry a rating.** Ratings live on watch logs, full stop. If rating squares appear on a `PostCard` or `PostPage`, something has gone wrong.
3. **Watch logs render in exactly one place:** the Diary tab of `/user/:id`. Never in the feed. Never on a show page — show pages get aggregate numbers from the `show_ratings` view and nothing else.

An earlier version of this project merged reviews and discussions into one `posts` table with a `type` column and a `review_shape` constraint. **That was a mistake and it has been undone.** If you see `type`, `review_shape`, or `posts.rating` anywhere, it's stale — delete it.

**Do not add a unique constraint on `watch_logs (user_id, show_id)`.** Repeat rows aren't duplicates, they're rewatches, and rewatches are the point of the feature.

### Three numbers that are easy to confuse

| | Meaning | Where it renders |
|---|---|---|
| `rating` | 1–5, how good the *show* was, set by whoever logged the watch | diary entries only |
| `upvotes` ("bravos") | how much the community likes a *post*; anyone, unlimited clicks | posts |
| `avg_rating` | mean of a show's watch-log ratings; a view, never stored | show page and show tiles |

Individual logs are profile-scoped; the **aggregate is public**. This was an open question and it is settled — don't reopen it.

## Styling

Design system lives in `index.css` as custom properties. Full details in `docs/encore-spec.md` §8.

- **Never write a literal color.** No `#000`, `#fff`, `black`, `white`. Every border and rule is `var(--ink)`, every surface is `var(--paper)`. This is what makes the night theme work — at night `--ink` *is* cream.
- **No `border-radius`.** Anywhere. The aesthetic is a printed theatre program.
- **No `box-shadow`.** Ever. Depth comes from rules and type weight.
- Buttons need `border: 2px solid transparent` in the base state, or they jump 4px when the hover border appears.
- Ratings render as filled/empty **squares**, not stars — on diary entries and beside show averages, nowhere else.

## Things that will bite

- **The home feed renders exactly three fields: creation time, title, and upvote count.** No body, no image, no author byline, no show name, no rating squares. This is an explicit grading requirement and the easiest point on the rubric to lose. `getPosts` doesn't even fetch the other columns — keep it that way.
- Upvotes must use relative state updates — `setUpvotes(n => n + 1)`, never `setUpvotes(post.upvotes + 1)`. The rubric requires unlimited rapid clicking, so several updates can be in flight at once.
- The upvote RPC argument key must be exactly `post_id`: `rpc('increment_upvotes', { post_id: id })`. A mismatch fails silently and looks identical to an RLS problem.
- RLS must be disabled on **all five** tables. `watch_logs` is the one people forget. Silent write failures are almost always this.
- `post.shows` is `null` for untagged posts. Always `post.shows?.title`.
- `avg_rating` is `null` for shows nobody has logged. Render "Not yet rated", never `NaN`. It also arrives as a **string** — `Number()` it before arithmetic.
- `poster_url` is `null` for shows added through the `ShowPicker`. `/shows` needs a fallback tile.
- `new Date('2026-03-03')` parses as UTC midnight and renders as the previous day in the Americas. Use the `formatWatchDate` helper in spec §7. Same reason `toISOString().slice(0,10)` is wrong for "today" — use `toLocaleDateString('en-CA')`.
- `useParams()` returns strings. `id` is `"12"`, not `12`.
- `currentUser`, `search`, and `theme` live in `App`. The header is a sibling of `<Routes>`, so state it touches can't live inside a page.
- Empty form fields send `''`, not `null` — type errors on `smallint`/`bigint` and CHECK violations on `rating`. Coerce with `|| null`.
- Missing `.select()` after an insert — `data` comes back `null`.
- Dummy-data writes reset on refresh. In-memory arrays, by design.

## Definition of done for a feature

It works, it handles the empty and missing-data cases, it has a loading state, and it's committed with a descriptive message. Not: it's abstracted, tested, or memoized.
