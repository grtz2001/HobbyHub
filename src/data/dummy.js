// src/data/dummy.js
//
// Temporary stand-in for the Supabase database. Mirrors the five tables in
// docs/encore-spec.md §3 exactly: same column names, same nullability.
//
// Rows are FLAT here, like real database tables. src/api/ does the joining
// and hands components the nested shape Supabase returns. When Supabase is
// wired up, this file is deleted and nothing else changes.
//
// Timestamps are computed at load time from a minutes-ago offset, so
// "2 hours ago" stays accurate no matter when you run the app. watch_logs
// use fixed calendar dates instead, since a diary is dated, not relative.

const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

// --------------------------------------------------------------- shows
export const shows = [
  { id: 1, slug: 'hadestown', title: 'Hadestown', opening_year: 2019, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Hadestown' },
  { id: 2, slug: 'sunset-boulevard', title: 'Sunset Boulevard', opening_year: 1993, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Sunset+Boulevard' },
  { id: 3, slug: 'kimberly-akimbo', title: 'Kimberly Akimbo', opening_year: 2022, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Kimberly+Akimbo' },
  { id: 4, slug: 'maybe-happy-ending', title: 'Maybe Happy Ending', opening_year: 2024, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Maybe+Happy+Ending' },
  { id: 5, slug: 'six', title: 'Six', opening_year: 2021, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Six' },
  { id: 6, slug: 'merrily-we-roll-along', title: 'Merrily We Roll Along', opening_year: 1981, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Merrily' },
  { id: 7, slug: 'sweeney-todd', title: 'Sweeney Todd', opening_year: 1979, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Sweeney+Todd' },
  { id: 8, slug: 'into-the-woods', title: 'Into the Woods', opening_year: 1987, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Into+the+Woods' },
  { id: 9, slug: 'next-to-normal', title: 'Next to Normal', opening_year: 2009, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Next+to+Normal' },
  { id: 10, slug: 'the-bands-visit', title: "The Band's Visit", opening_year: 2017, poster_url: "https://placehold.co/400x600/14110E/F2C230?text=The+Band%27s+Visit" },
  { id: 11, slug: 'parade', title: 'Parade', opening_year: 1998, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Parade' },
  { id: 12, slug: 'company', title: 'Company', opening_year: 1970, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Company' },
  { id: 13, slug: 'floyd-collins', title: 'Floyd Collins', opening_year: 1996, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Floyd+Collins' },
  { id: 14, slug: 'bat-boy', title: 'Bat Boy: The Musical', opening_year: 2001, poster_url: 'https://placehold.co/400x600/14110E/F2C230?text=Bat+Boy' },
  // Added through the ShowPicker by a user — no poster, no opening year.
  // Exists specifically to exercise the no-poster fallback tile on /shows.
  { id: 15, slug: 'suffs', title: 'Suffs', opening_year: null, poster_url: null },
];

// ------------------------------------------------------------ profiles
export const profiles = [
  { id: 'a1111111-1111-4111-8111-111111111111', display_name: 'ellis_w', created_at: ago(60 * 24 * 150) },
  { id: 'a2222222-2222-4222-8222-222222222222', display_name: 'quietriot', created_at: ago(60 * 24 * 120) },
  { id: 'a3333333-3333-4333-8333-333333333333', display_name: 'mezzo_forte', created_at: ago(60 * 24 * 95) },
  { id: 'a4444444-4444-4444-8444-444444444444', display_name: 'balcony_rail', created_at: ago(60 * 24 * 80) },
  { id: 'a5555555-5555-4555-8555-555555555555', display_name: 'standing_o', created_at: ago(60 * 24 * 60) },
  { id: 'a6666666-6666-4666-8666-666666666666', display_name: 'matinee_kid', created_at: ago(60 * 24 * 40) },
];

const ELLIS = 'a1111111-1111-4111-8111-111111111111';
const QUIETRIOT = 'a2222222-2222-4222-8222-222222222222';
const MEZZO = 'a3333333-3333-4333-8333-333333333333';
const BALCONY = 'a4444444-4444-4444-8444-444444444444';
const STANDING_O = 'a5555555-5555-4555-8555-555555555555';
const MATINEE = 'a6666666-6666-4666-8666-666666666666';

// --------------------------------------------------------- watch_logs
// The Letterboxd diary. Profile-only — never joined into posts or shows.
// Deliberately no unique constraint on (user_id, show_id): ellis_w logs
// Hadestown three times on purpose, so the rewatch badge has something to
// number. One entry has no venue, one has no rating — both null cases the
// diary has to render cleanly.
export const watch_logs = [
  { id: 1, created_at: ago(60 * 24 * 5), user_id: ELLIS, show_id: 1, watched_on: '2026-03-03', venue: 'Bernard B. Jacobs Theatre', rating: 5, note: 'Third time and the first time I watched the Fates instead of Orpheus. Different show entirely.' },
  { id: 2, created_at: ago(60 * 24 * 10), user_id: ELLIS, show_id: 2, watched_on: '2026-02-27', venue: null, rating: 3, note: 'Handsome, cold, and about forty minutes too pleased with itself.' },
  { id: 3, created_at: ago(60 * 24 * 30), user_id: ELLIS, show_id: 1, watched_on: '2026-01-14', venue: 'Proshot at home', rating: 4, note: null },
  { id: 4, created_at: ago(60 * 24 * 42), user_id: ELLIS, show_id: 3, watched_on: '2026-01-02', venue: 'Booth Theatre', rating: null, note: "Didn't score it. I need to sit with it a while longer before I put a number on it." },
  { id: 5, created_at: ago(60 * 24 * 95), user_id: ELLIS, show_id: 1, watched_on: '2025-11-09', venue: 'Walter Kerr Theatre', rating: 3, note: 'Balcony, far right. Half the staging was a rumour from up there and I still went back twice.' },
  { id: 6, created_at: ago(60 * 24 * 15), user_id: ELLIS, show_id: 6, watched_on: '2026-02-01', venue: 'Hudson Theatre', rating: 5, note: "Still the best “Not a Day Goes By” I've heard live." },
  { id: 7, created_at: ago(60 * 24 * 12), user_id: QUIETRIOT, show_id: 9, watched_on: '2026-02-18', venue: 'Hudson Theatre', rating: 5, note: 'Sat in the front row and regretted my mascara.' },
  { id: 8, created_at: ago(60 * 24 * 60), user_id: QUIETRIOT, show_id: 8, watched_on: '2025-10-15', venue: null, rating: 4, note: null },
  { id: 9, created_at: ago(60 * 24 * 20), user_id: MEZZO, show_id: 12, watched_on: '2026-01-20', venue: 'Bernard B. Jacobs Theatre', rating: 4, note: null },
  { id: 10, created_at: ago(60 * 24 * 70), user_id: MEZZO, show_id: 7, watched_on: '2025-11-22', venue: 'Lunt-Fontanne Theatre', rating: 5, note: null },
  { id: 11, created_at: ago(60 * 24 * 55), user_id: BALCONY, show_id: 12, watched_on: '2025-12-05', venue: null, rating: 5, note: 'Patti would be proud.' },
  { id: 12, created_at: ago(60 * 24 * 25), user_id: STANDING_O, show_id: 5, watched_on: '2026-02-10', venue: 'Lena Horne Theatre', rating: 4, note: null },
  { id: 13, created_at: ago(60 * 24 * 18), user_id: STANDING_O, show_id: 11, watched_on: '2026-01-18', venue: 'Bernard B. Jacobs Theatre', rating: 5, note: null },
  { id: 14, created_at: ago(60 * 24 * 32), user_id: MATINEE, show_id: 5, watched_on: '2026-01-05', venue: null, rating: 5, note: null },
  { id: 15, created_at: ago(60 * 24 * 28), user_id: MATINEE, show_id: 3, watched_on: '2026-01-25', venue: 'Booth Theatre', rating: 4, note: null },
];

// -------------------------------------------------------------- posts
// The public forum. No type, no rating — see the three rules in CLAUDE.md.
export const posts = [
  { id: 1, created_at: ago(120), author_id: MEZZO, show_id: null, title: 'In the Heights needs a revival', content: null, image_url: null, upvotes: 91 },
  {
    id: 2,
    created_at: ago(300),
    author_id: ELLIS,
    show_id: 6,
    title: 'The transfer is better than the original and I will take questions',
    content:
      'The 1981 cast album is scripture, and I am not arguing with scripture. I am arguing with the idea that a first attempt is automatically the truest one. This company plays the reverse chronology as a slow loss of nerve rather than a stunt, and the second act lands like a door closing.\n\nWhat changed for me was the staging of "Not a Day Goes By." Held still, no ornament, three people who cannot look at each other. If you have only ever heard the show, you have heard the score. You have not seen the argument it is making.',
    image_url: 'https://placehold.co/800x400/14110E/F2C230?text=Merrily+We+Roll+Along',
    upvotes: 64,
  },
  { id: 3, created_at: ago(60 * 26), author_id: QUIETRIOT, show_id: 1, title: 'Nobody talks about the sound design in Hadestown', content: null, image_url: null, upvotes: 38 },
  { id: 4, created_at: ago(60 * 48), author_id: BALCONY, show_id: 2, title: 'Sunset Boulevard is all concept and no heart', content: null, image_url: null, upvotes: 27 },
  { id: 5, created_at: ago(60 * 72), author_id: ELLIS, show_id: 4, title: 'Maybe Happy Ending made me cry on a Tuesday', content: null, image_url: null, upvotes: 19 },
  { id: 6, created_at: ago(60 * 96), author_id: QUIETRIOT, show_id: null, title: "Cast a countertenor as the Phantom. That's the post.", content: null, image_url: null, upvotes: 9 },
  { id: 7, created_at: ago(60 * 144), author_id: STANDING_O, show_id: 1, title: 'The turntable does half the storytelling', content: null, image_url: null, upvotes: 22 },
  { id: 8, created_at: ago(60 * 24 * 14), author_id: MATINEE, show_id: 1, title: 'Which Orpheus did you see', content: null, image_url: null, upvotes: 14 },
  { id: 9, created_at: ago(60 * 24 * 14 + 60), author_id: QUIETRIOT, show_id: 11, title: 'Parade deserved a longer run and everyone knows it', content: null, image_url: null, upvotes: 46 },
];

// ----------------------------------------------------------- comments
export const comments = [
  { id: 1, created_at: ago(180), post_id: 2, author_id: QUIETRIOT, content: 'Correct, and the orchestrations are thinner on purpose. You can hear the room.' },
  { id: 2, created_at: ago(120), post_id: 2, author_id: MEZZO, content: 'I will take the questions instead. Question one: have you listened to the 1981 album this year, or are you remembering it?' },
  { id: 3, created_at: ago(41), post_id: 2, author_id: BALCONY, content: 'Saw it twice. The second time I watched only the friends in the background and cried harder.' },
  { id: 4, created_at: ago(60), post_id: 1, author_id: ELLIS, content: 'Bring back the block party energy.' },
  { id: 5, created_at: ago(60 * 20), post_id: 3, author_id: MATINEE, content: 'The bridge cue during the wedding always gets me.' },
];
