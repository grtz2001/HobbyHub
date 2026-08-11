# Encore — Project Conventions

A musical theatre community site. Rate and review shows like Letterboxd, discuss them like a forum. Built for CodePath WEB102 Unit 8.

Full spec: `docs/spec.md`. Build order: `docs/build-plan.md`.

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
- `date-fns`, `moment`, `dayjs` — write a 15-line relative-time helper
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
│   ├── shows.js
│   ├── comments.js
│   └── profiles.js
├── data/
│   └── dummy.js    seed data as JS objects (temporary)
├── components/     reusable pieces: PostCard, RatingSquares, Loader, Marquee…
├── pages/          one per route: HomeFeed, PostPage, ShowPage, ProfilePage…
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

Two things the API functions must keep doing:

1. **Stay `async` and keep the artificial delay.** Removing it makes loading states invisible during development, and you'll ship a loader that was never actually wired up.
2. **Return Supabase's nested shape**, not a flattened one:
   ```js
   { id, title, upvotes, created_at, type, rating,
     shows:    { id, slug, title, poster_url },   // null for general discussions
     profiles: { id, display_name } }
   ```
   Components should read `post.shows?.title` and `post.profiles.display_name` from day one. Flatten it now and every component needs editing at swap time.

## Data model

Four tables. Full DDL in `docs/spec.md` §3.

- **shows** — the catalog. `slug` is the URL key.
- **profiles** — `id` is a UUID made in the browser and kept in `localStorage`. No passwords.
- **posts** — holds *both* reviews and discussions, split by a `type` column.
  - `type: 'review'` → must have `show_id` and `rating` (1–5)
  - `type: 'discussion'` → never has a `rating`; `show_id` optional
- **comments** — belong to a post, authored by a profile.

Three numbers that are easy to confuse, so keep them distinct in code and UI:

| | Meaning |
|---|---|
| `rating` | 1–5, how good the *show* is, set by the review's author |
| `upvotes` ("bravos") | how much the community likes the *write-up*; anyone, unlimited |
| `avg_rating` | mean of a show's review ratings; computed, never stored |

## Styling

Design system lives in `index.css` as custom properties. Full details in `docs/spec.md` §8.

- **Never write a literal color.** No `#000`, `#fff`, `black`, `white`. Every border and rule is `var(--ink)`, every surface is `var(--paper)`. This is what makes the night theme work — at night `--ink` *is* cream.
- **No `border-radius`.** Anywhere. The aesthetic is a printed theatre program.
- **No `box-shadow`.** Ever. Depth comes from rules and type weight.
- Buttons need `border: 2px solid transparent` in the base state, or they jump 4px when the hover border appears.
- Ratings render as filled/empty **squares**, not stars.

## Things that will bite

- `post.shows` is `null` for general discussions. Always `post.shows?.title`.
- `avg_rating` is `null` for shows with no reviews. Render "Not yet rated", never `NaN`.
- `useParams()` returns strings. `id` is `"12"`, not `12`.
- Upvotes must use relative state updates — `setUpvotes(n => n + 1)`, never `setUpvotes(post.upvotes + 1)`. The rubric requires unlimited rapid clicking, so several updates can be in flight at once.
- `currentUser`, `search`, and `theme` live in `App`. The header is a sibling of `<Routes>`, so state it touches can't live inside a page.
- **The home feed must not render body text or images.** Only timestamp, title, show name, author, rating squares, and bravo count. This is an explicit grading requirement. Posters belong on `/shows` and `/show/:slug`.

## Definition of done for a feature

It works, it handles the empty and missing-data cases, it has a loading state, and it's committed with a descriptive message. Not: it's abstracted, tested, or memoized.
