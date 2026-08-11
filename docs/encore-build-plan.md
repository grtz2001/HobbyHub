# ENCORE — Two-Week Build Plan (v2)

Ordered so nothing is blocked by something built later, and so **every graded feature is done by Day 9**. The Letterboxd layer — shows, averages, profiles — lands in Days 10–12, which means if those days go badly you still have a complete, submittable project.

Each day is roughly 2–3 hours. Commit at every milestone.

> **v2 changes:** identity moved to Day 3 (it touches every row you create after it). Shows, show pages, and profiles take Days 10–12. Poster grid and flag filtering are cut.

---

## Week 1 — Identity and full CRUD

### Day 1 · Scaffold and design system

- `npm create vite@latest encore -- --template react`, install `@supabase/supabase-js` and `react-router-dom`
- Wire `BrowserRouter` with all eight routes pointing at placeholder components
- Playbill tokens into `index.css`, link Google Fonts, build the `Marquee` header bar
- Folders: `src/components/`, `src/pages/`, `src/client.js`, `src/identity.js`
- Declare `currentUser`, `search`, and `theme` as `useState` in `App` right now, even unused

That last one takes two minutes and saves an awkward refactor on Days 3 and 9. `Marquee` is a sibling of `<Routes>`, so header state has to live in `App`.

`git commit -m "chore: scaffold app, routing, and Playbill design tokens"`

### Day 2 · Full schema and seed

- Create the Supabase project, run the entire schema from spec §3 in one paste — all four tables, the `show_ratings` view, the RLS disables, and the `increment_upvotes` function
- `.env` with `VITE_` vars, `.env` into `.gitignore`, fill in `client.js`
- Run `encore-seed-data.sql`
- Run the sanity checks at the bottom of the seed file

**Build the whole schema today even though you won't touch shows or profiles until Day 3 and Day 10.** Schema changes are cheap now and expensive once components depend on shapes. The seed data is already verified — 14 shows, 8 profiles, 22 posts, 24 comments, no orphans.

Verify with one `console.log` of a `select()` before writing any UI.

`git commit -m "feat: supabase schema, seed data, and client"`

### Day 3 · Identity

- `identity.js` with `readLocalUser` and `createLocalUser` (spec §6)
- `NameGate` modal: shows when `currentUser` is null, takes a display name, inserts a profile, stores it in `localStorage`
- Load the user once in `App` on mount

Build this before anything that writes rows. Every post and comment carries an `author_id`, and retrofitting that later means touching every insert you've written.

Test the reset path early: clear `localStorage`, refresh, confirm the gate reappears. You'll do this constantly while testing ownership.

`git commit -m "feat: pseudo-auth identity and profile creation"`

### Day 4 · Home feed

- `HomeFeed` fetches posts with the nested select from spec §7 — show and author come back attached, no manual joins
- `PostCard`: creation time, title, show name, author, rating squares, bravo count — **and no body or image**
- Relative timestamps via a small helper; skip a date library

Optional-chain `post.shows?.title` from the first line you write. Two of your seed posts are general discussions with no show, and they will crash the card otherwise.

`git commit -m "feat: home feed with post cards"`

### Day 5 · Post detail page

- `Link` from each card to `/post/:id`
- `PostPage` fetches one row with its show, author, and comments
- Render title, show, author, timestamp, rating squares, image, body
- Handle the missing-post case — a bad URL shouldn't white-screen

`git commit -m "feat: individual post page"`

### Day 6 · Create form

- Build `PostForm` as a reusable component from the start (`initialValues`, `onSubmit`, `type` props). Do not write a create-only form you'll refactor tomorrow.
- Type toggle: Review | Discussion, swapping which fields show
- `ShowPicker` with `findOrCreateShow` (spec §7) — load the catalog once, filter locally
- `/new` inserts, then navigates to the new post

The `review_shape` constraint will reject a review with no rating. That's the database doing your form validation for you — catch the error and surface it rather than fighting it.

`git commit -m "feat: create reviews and discussions"`

### Day 7 · Edit, delete, ownership

Cheap now that `PostForm` exists — that's the payoff from yesterday.

- `/post/:id/edit` prefills and updates. Disable the type toggle on edit.
- Delete with a confirm, then `navigate('/')`
- `OwnerActions`: only render Edit and Delete when `post.author_id === currentUser.id`

Test ownership by clearing `localStorage` and making a second identity. Confirm you cannot see Edit on the first user's posts.

`git commit -m "feat: edit and delete posts"`
`git commit -m "feat: author-only edit and delete"`

> **End of Week 1:** identity, create, read, update, delete all work. Three required features left — comments, sorting, search — and they're the three easiest.

---

## Week 2 — Finish the rubric, then build the Letterboxd layer

### Day 8 · Bravos and comments

- `BravoButton` using **relative** state updates and the `increment_upvotes` RPC (spec §7)
- Click it eight times fast, then refresh. If the count doesn't match, you used absolute math.
- `CommentForm` inserts with `post_id` and `author_id`, requesting the nested profile back so the new comment renders with its author immediately
- `CommentList` ordered oldest-first
- Delete a post that has comments and confirm the cascade works

`git commit -m "feat: bravos with atomic increment"`
`git commit -m "feat: comments on posts"`

### Day 9 · Sorting and search

- `orderBy` state → `.order(orderBy, { ascending: false })`, in the effect's dependency array
- Type tabs: All / Reviews / Discussions → `.eq('type', typeTab)`
- Search input in `Marquee` reading `search` from `App`; filter on post title and show title
- Hide the search input off `/` via `useLocation()`

`git commit -m "feat: sort feed by date or bravos"`
`git commit -m "feat: search and type tabs"`

> **Every graded feature is now complete.** Everything below is the reason you're building this rather than the reason you'll pass.

### Day 10 · Show pages

- `/show/:slug` fetches from the `show_ratings` view — the average is already computed, you never do math in JavaScript
- `ShowHeader`: poster, title, year, average, review count
- Fetch its posts in one query, split into reviews and discussions in JS
- Make show names on `PostCard` and `PostPage` into `Link`s

Your two unreviewed shows (*Floyd Collins*, *Bat Boy*) exist specifically to catch this: `avg_rating` comes back `null`, and rendering it raw gives you `NaN`. Show "Not yet rated".

`git commit -m "feat: show pages with aggregate ratings"`

### Day 11 · Shows directory

- `/shows` — poster grid from `show_ratings`, 3 columns
- `ShowTile`: poster with a 2px border, title, average, review count
- Link it from the header

This is your Letterboxd wall. It's on its own route, so the feed's no-images rule doesn't apply and you can go as visual as you want.

`git commit -m "feat: shows directory"`

### Day 12 · Profile pages

- `/user/:id` — display name, joined date, their posts newest-first
- Three stats: reviews written, discussions started, average rating given
- Make author names throughout the app into `Link`s to their profile

`git commit -m "feat: user profile pages"`

### Day 13 · Loading animation and polish

- `Loader` with the marquee-bulb CSS, rendered wherever `loading` is true — feed, post page, show page, directory, profile, and `PostForm`'s `submitting`
- Throttle your network in DevTools to confirm it appears
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
  Then append shows, a show page, a profile, and the theme toggle
- Confirm the repo is **private** and `codepathreview` is a collaborator
- Submit through the course portal

`git commit -m "docs: README with walkthrough GIF"`

---

## If you fall behind

Cut from the back — the days are ordered by expendability:

1. **Profile pages** (Day 12) — the least visible of the three new features
2. **Shows directory** (Day 11) — show pages already prove the concept
3. **Show pages** (Day 10) — losing this costs you the whole Letterboxd layer
4. **Loading animation** (Day 13) — an hour of work, visible in every demo

Never cut: any required feature, polish, the README, or the GIF.

If Days 1–9 slip, cut Days 10–12 without guilt and submit a clean forum. You can build the shows layer during the 48-hour extension, or after the class ends. A polished project that does less always demos better than an ambitious one held together with tape.

---

## Habits worth keeping

- **Commit when a feature works**, not when a day ends. Grading looks at commit history as evidence of steady work.
- **Keep two identities in two browsers.** One normal window, one incognito. It's the only way to test ownership gating without clearing `localStorage` every thirty seconds.
- **Test delete early and often.** It's the feature most likely to break silently and the one most likely to blow up during a live demo.
- **Record a backup GIF on Day 13.** If Day 14 runs late you'll have something submittable.
