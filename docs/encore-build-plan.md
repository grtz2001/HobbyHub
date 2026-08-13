# ENCORE — Two-Week Build Plan (v3)

Ordered so nothing is blocked by something built later, and so **every graded feature is done by Day 9**. The Letterboxd layer — the diary, shows, averages, profiles — lands in Days 10–11, which means if those days go badly you still have a complete, submittable project.

Each day is roughly 2–3 hours. Commit at every milestone.

> **v3 changes:** the whole plan is restructured around **dummy data first, Supabase last** — v2 had you building against Supabase from Day 2, which contradicts the locked sequencing. Day 2 is now the `src/api/` boundary; Day 12 is the swap. The type toggle and type tabs are gone, the feed is three fields, and Day 10 is the new log-a-watch + diary work.

---

## The shape of the two weeks

| Days | What | Data source |
|---|---|---|
| 1–2 | Scaffold, design tokens, dummy data, the `api/` boundary | dummy |
| 3–9 | Every graded feature | dummy |
| 10–11 | The diary, show pages, the shows directory | dummy |
| 12 | **The Supabase swap** — rewrite `src/api/`, touch no components | Supabase |
| 13–14 | Loader, polish, night theme, README, GIF, submit | Supabase |

The swap is one folder. That's the entire reason for the boundary, and it only stays true if no component ever imports Supabase or `dummy.js`.

---

## Week 1 — The boundary, then full CRUD

### Day 1 · Scaffold and design system

- `npm create vite@latest encore -- --template react`, install `@supabase/supabase-js` and `react-router-dom`
- Wire `BrowserRouter` with all nine routes pointing at placeholder components
- Playbill tokens into `index.css`, link Google Fonts, build the `Marquee` header bar
- Folders: `src/components/`, `src/pages/`, `src/api/`, `src/data/`, `src/identity.js`
- Declare `currentUser`, `search`, and `theme` as `useState` in `App` right now, even unused

That last one takes two minutes and saves an awkward refactor on Days 3 and 9. `Marquee` is a sibling of `<Routes>`, so header state has to live in `App`.

`git commit -m "chore: scaffold app, routing, and Playbill design tokens"`

### Day 2 · Dummy data and the API boundary

This is the most important architectural day of the project and it's easy to underrate.

- Drop the generated `dummy.js` into `src/data/`
- Write `src/api/` — `posts.js`, `watchLogs.js`, `shows.js`, `profiles.js`, `comments.js`
- Every function: `async`, a ~300ms artificial delay, **throws on error**, returns Supabase's nested shape
- `console.log` a call from each module before writing any UI

**Then spend thirty minutes on Supabase and stop:** create the project, paste the entire schema from spec §3 in one go (all five tables, the `show_ratings` view, the RLS disables, the `increment_upvotes` function), run `encore-seed-data.sql`, put `VITE_` vars in `.env`, add `.env` to `.gitignore`, and confirm one `select()` returns rows from the Supabase dashboard.

Then close it and don't touch it again until Day 12. The point isn't to use it yet — it's to discover credential, RLS, and schema problems on Day 2 when they cost twenty minutes, rather than on Day 12 when they cost the project. **Do not import the client into a component.**

`git commit -m "feat: dummy data and src/api boundary"`
`git commit -m "chore: supabase project and schema (not yet wired)"`

### Day 3 · Identity

- `identity.js` with `readLocalUser` and `createLocalUser` (spec §6), calling `api/profiles.js` — not Supabase
- `NameGate`: a **full-page gate** rendered instead of `<Routes>` when `currentUser` is null. Not a modal — no portal, no focus trap.
- Load the user once in `App` on mount

Build this before anything that writes rows. Every post, comment, and watch log carries a user id, and retrofitting that later means touching every insert you've written.

Test the reset path early: clear `localStorage`, refresh, confirm the gate reappears. You'll do this constantly while testing ownership.

`git commit -m "feat: pseudo-auth identity and profile creation"`

### Day 4 · Home feed

- `HomeFeed` calls `getPosts()` and renders `PostCard`s
- **`PostCard` renders exactly three fields: creation time, title, bravo count.** No body, no image, no author byline, no show name, no rating squares.
- Relative timestamps via the `timeAgo` helper in spec §7 — no date library

The row will look sparse. That is correct and it is worth points. This is the single easiest requirement on the rubric to fail, and the way you fail it is by making the card nicer.

`git commit -m "feat: home feed with post cards"`

### Day 5 · Post detail page

- `Link` from each card to `/post/:id`
- `PostPage` fetches one post with its show, author, and comments
- Render show tag, author, title, timestamp, image, body — **no rating squares anywhere on this page**
- Handle three empty cases: no show tag, no image, no body. A title-only post is normal.
- Handle the missing-post case — a bad URL shouldn't white-screen

Optional-chain `post.shows?.title` from the first line you write, and make sure the byline reads correctly with no leading separator dot when a post is untagged.

`git commit -m "feat: individual post page"`

### Day 6 · Create form

- Build `PostForm` as a reusable component from the start (`initialValues`, `onSubmit`, `submitLabel`). Do not write a create-only form you'll refactor tomorrow.
- Fields: show (optional), title (required), body, image URL. **No type toggle. No rating field.**
- `ShowPicker` with `findOrCreateShow` (spec §7) — load the catalog once, filter locally
- Read `?show=` with `useSearchParams()` and prefill the picker
- `/new` inserts, then navigates to the new post

Coerce empty strings to `null` on submit. This is the day that habit either forms or doesn't.

`git commit -m "feat: create posts"`

### Day 7 · Edit, delete, ownership

Cheap now that `PostForm` exists — that's the payoff from yesterday.

- `/post/:id/edit` prefills and updates
- Delete with a confirm, then `navigate('/')`
- `OwnerActions`: only render Edit and Delete when `post.author_id === currentUser.id`

Test ownership by clearing `localStorage` and making a second identity. Confirm you cannot see Edit on the first user's posts.

`git commit -m "feat: edit and delete posts"`
`git commit -m "feat: author-only edit and delete"`

> **End of Week 1:** identity, create, read, update, delete all work. Three required features left — comments, sorting, search — and they're the three easiest.

---

## Week 2 — Finish the rubric, build the diary, then swap

### Day 8 · Bravos and comments

- `BravoButton` using **relative** state updates (spec §7)
- Click it eight times fast, then refresh. If the count doesn't match, you used absolute math.
- `CommentForm` inserts with `post_id` and `author_id`, requesting the nested profile back so the new comment renders with its author immediately
- `CommentList` ordered oldest-first
- Delete a post that has comments and confirm the cascade works

`git commit -m "feat: bravos with relative state updates"`
`git commit -m "feat: comments on posts"`

### Day 9 · Sorting and search

- `orderBy` state passed to `getPosts()`, in the effect's dependency array
- Sort control only — **no type tabs**, there's one kind of post
- Search input in `Marquee` reading `search` from `App`; filter on **post title** only
- Hide the search input off `/` via `useLocation()`
- Empty search state: "NO POSTS MATCH THAT TITLE."

`git commit -m "feat: sort feed by date or bravos"`
`git commit -m "feat: search posts by title"`

> **Every graded feature is now complete on dummy data.** Everything below is the reason you're building this rather than the reason you'll pass.

### Day 10 · The diary

The Letterboxd half of the product, and the most interesting day of the build.

- `/log` — `WatchLogForm`: show (required, prefilled from `?show=`), date (defaults to today, `toLocaleDateString('en-CA')`), venue, rating squares, note
- On save, navigate to `/user/:id` with the Diary tab active
- `/user/:id` — `ProfileHeader` with four stats (logs, shows, posts, avg given), then `ProfileTabs`
- `DiaryList` and `DiaryEntry`, newest first, with rewatch badges from `withWatchNumbers` (spec §7)
- Delete a diary entry, own-profile only
- Make author names throughout the app into `Link`s to profiles

Fetch logs and posts together with `Promise.all` on mount, then let the tab switch between two arrays already in state.

Your seed data has a user who logged the same show three times — that's what makes the rewatch badges visible. Also check the entry with no venue and the one with no rating render cleanly.

Use `formatWatchDate` from spec §7, not `new Date(isoString)`. A diary that shows every entry one day early is an hour you don't have.

`git commit -m "feat: log a watch"`
`git commit -m "feat: profile pages with diary and posts tabs"`

### Day 11 · Shows

- `/show/:slug` from the `show_ratings` view — the average is already computed, you never do math in JavaScript
- `ShowHeader`: poster, title, year, "seen by / logs / ratings", average with squares, and the two buttons
- Its tagged posts in one section below. **No list of individual watch logs on this page.**
- `/shows` — poster grid, 3 columns, linked from the header
- Make show names on `PostPage` into `Link`s

Two null cases to hit deliberately: `avg_rating` is `null` for unlogged shows ("Not yet rated", never `NaN`), and `poster_url` is `null` for any show added through the picker (the reversed-out ink block).

`git commit -m "feat: show pages with aggregate ratings"`
`git commit -m "feat: shows directory"`

### Day 12 · The Supabase swap

**Rewrite the function bodies in `src/api/`. Touch no components.**

- Fill in `client.js` from the `.env` vars you set on Day 2
- Rewrite each module against Supabase, keeping every signature and return shape identical
- Delete the artificial delays as you go — real network latency replaces them
- Work one module at a time and test that module's screens before moving on. `comments.js` is the smallest; start there to prove the pattern.

**If a component needs editing, the boundary leaked** — fix the API function to return the old shape rather than editing the component. That's the whole bet of the last eleven days.

Then walk every screen: feed, sort, search, post page, bravo, comment, create, edit, delete, log a watch, diary, show page, directory.

**This day is not cuttable.** Supabase is a course requirement. If you're running behind, cut Day 10 or Day 11 and swap on schedule.

Expect the failure to be RLS. Silent write failures are almost always RLS, and `watch_logs` is the table people forget to disable it on. Second most likely: the `increment_upvotes` RPC key must be exactly `post_id`.

`git commit -m "feat: swap api layer from dummy data to supabase"`

### Day 13 · Loading animation and polish

- `Loader` with the marquee-bulb CSS, rendered wherever `loading` is true — feed, post page, show page, directory, profile, and both forms' `submitting`
- Throttle your network in DevTools to confirm it appears. This is easier now that the delays are real.
- Then polish: mobile breakpoints, empty states, hover states, focus rings, error messages
- Before the theme toggle, grep your CSS for `#000`, `#fff`, `black`, `white` — every hit becomes `var(--ink)` or `var(--paper)` or the night theme ships broken
- Night theme via `data-theme` on `<html>`

Give polish at least half of today. Visual design is graded; a sixth feature isn't.

`git commit -m "feat: loading animation"`
`git commit -m "feat: night theme"`
`git commit -m "style: responsive layout and polish"`

### Day 14 · README, GIF, submit

- Project 8 README template, every `[x]` checked
- Record the GIF — one continuous take of every **required** feature first:
  **feed → sort → search → open a post → bravo → comment → create → edit → delete**
  Then append the diary, a show page, a profile, and the theme toggle
- Confirm the repo is **private** and `codepathreview` is a collaborator
- Submit through the course portal

`git commit -m "docs: README with walkthrough GIF"`

---

## If you fall behind

Cut from the back, but **never cut Day 12**. The order of expendability:

1. **Shows directory** (Day 11, second half) — show pages already prove the concept
2. **Show pages** (Day 11, first half) — losing this costs the aggregate ratings
3. **The diary** (Day 10) — the biggest cut, and the one that hurts, because it's why you're building this
4. **Loading animation** (Day 13) — an hour of work, visible in every demo

Never cut: any required feature, the Supabase swap, polish, the README, or the GIF.

If Days 1–9 slip, cut Days 10–11 without guilt, swap on Day 12, and submit a clean forum. You can build the diary during the 48-hour extension or after the class ends. A polished project that does less always demos better than an ambitious one held together with tape.

**One nuance on cutting Day 10:** the diary is the entire reason `watch_logs` exists. If you cut it, the shows catalog has no ratings to aggregate and Day 11 becomes a poster grid with "Not yet rated" under every tile. Cut both together or neither.

---

## Habits worth keeping

- **Commit when a feature works**, not when a day ends. Grading looks at commit history as evidence of steady work.
- **Keep two identities in two browsers.** One normal window, one incognito. It's the only way to test ownership gating without clearing `localStorage` every thirty seconds.
- **Test delete early and often.** It's the feature most likely to break silently and the one most likely to blow up during a live demo.
- **Never import Supabase or `dummy.js` into a component.** Every day you hold this line makes Day 12 shorter.
- **Record a backup GIF on Day 13.** If Day 14 runs late you'll have something submittable.
