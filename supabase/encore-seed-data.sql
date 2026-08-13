-- ENCORE seed data — mirrors src/data/dummy.js
-- Run this AFTER the schema, in the Supabase SQL Editor.

insert into shows (slug, title, opening_year, poster_url) values
  ('hadestown', 'Hadestown', 2019, 'https://placehold.co/400x600/14110E/F2C230?text=Hadestown'),
  ('sunset-boulevard', 'Sunset Boulevard', 1993, 'https://placehold.co/400x600/14110E/F2C230?text=Sunset+Boulevard'),
  ('kimberly-akimbo', 'Kimberly Akimbo', 2022, 'https://placehold.co/400x600/14110E/F2C230?text=Kimberly+Akimbo'),
  ('maybe-happy-ending', 'Maybe Happy Ending', 2024, 'https://placehold.co/400x600/14110E/F2C230?text=Maybe+Happy+Ending'),
  ('six', 'Six', 2021, 'https://placehold.co/400x600/14110E/F2C230?text=Six'),
  ('merrily-we-roll-along', 'Merrily We Roll Along', 1981, 'https://placehold.co/400x600/14110E/F2C230?text=Merrily'),
  ('sweeney-todd', 'Sweeney Todd', 1979, 'https://placehold.co/400x600/14110E/F2C230?text=Sweeney+Todd'),
  ('into-the-woods', 'Into the Woods', 1987, 'https://placehold.co/400x600/14110E/F2C230?text=Into+the+Woods'),
  ('next-to-normal', 'Next to Normal', 2009, 'https://placehold.co/400x600/14110E/F2C230?text=Next+to+Normal'),
  ('the-bands-visit', 'The Band''s Visit', 2017, 'https://placehold.co/400x600/14110E/F2C230?text=The+Band%27s+Visit'),
  ('parade', 'Parade', 1998, 'https://placehold.co/400x600/14110E/F2C230?text=Parade'),
  ('company', 'Company', 1970, 'https://placehold.co/400x600/14110E/F2C230?text=Company'),
  ('floyd-collins', 'Floyd Collins', 1996, 'https://placehold.co/400x600/14110E/F2C230?text=Floyd+Collins'),
  ('bat-boy', 'Bat Boy: The Musical', 2001, 'https://placehold.co/400x600/14110E/F2C230?text=Bat+Boy'),
  ('suffs', 'Suffs', null, null);

insert into profiles (id, display_name) values
  ('a1111111-1111-4111-8111-111111111111', 'ellis_w'),
  ('a2222222-2222-4222-8222-222222222222', 'quietriot'),
  ('a3333333-3333-4333-8333-333333333333', 'mezzo_forte'),
  ('a4444444-4444-4444-8444-444444444444', 'balcony_rail'),
  ('a5555555-5555-4555-8555-555555555555', 'standing_o'),
  ('a6666666-6666-4666-8666-666666666666', 'matinee_kid');

insert into watch_logs (user_id, show_id, watched_on, venue, rating, note) values
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'hadestown'), '2026-03-03', 'Bernard B. Jacobs Theatre', 5, 'Third time and the first time I watched the Fates instead of Orpheus. Different show entirely.'),
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'sunset-boulevard'), '2026-02-27', null, 3, 'Handsome, cold, and about forty minutes too pleased with itself.'),
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'hadestown'), '2026-01-14', 'Proshot at home', 4, null),
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'kimberly-akimbo'), '2026-01-02', 'Booth Theatre', null, 'Didn''t score it. I need to sit with it a while longer before I put a number on it.'),
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'hadestown'), '2025-11-09', 'Walter Kerr Theatre', 3, 'Balcony, far right. Half the staging was a rumour from up there and I still went back twice.'),
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'merrily-we-roll-along'), '2026-02-01', 'Hudson Theatre', 5, 'Still the best "Not a Day Goes By" I''ve heard live.'),
  ('a2222222-2222-4222-8222-222222222222', (select id from shows where slug = 'next-to-normal'), '2026-02-18', 'Hudson Theatre', 5, 'Sat in the front row and regretted my mascara.'),
  ('a2222222-2222-4222-8222-222222222222', (select id from shows where slug = 'into-the-woods'), '2025-10-15', null, 4, null),
  ('a3333333-3333-4333-8333-333333333333', (select id from shows where slug = 'company'), '2026-01-20', 'Bernard B. Jacobs Theatre', 4, null),
  ('a3333333-3333-4333-8333-333333333333', (select id from shows where slug = 'sweeney-todd'), '2025-11-22', 'Lunt-Fontanne Theatre', 5, null),
  ('a4444444-4444-4444-8444-444444444444', (select id from shows where slug = 'company'), '2025-12-05', null, 5, 'Patti would be proud.'),
  ('a5555555-5555-4555-8555-555555555555', (select id from shows where slug = 'six'), '2026-02-10', 'Lena Horne Theatre', 4, null),
  ('a5555555-5555-4555-8555-555555555555', (select id from shows where slug = 'parade'), '2026-01-18', 'Bernard B. Jacobs Theatre', 5, null),
  ('a6666666-6666-4666-8666-666666666666', (select id from shows where slug = 'six'), '2026-01-05', null, 5, null),
  ('a6666666-6666-4666-8666-666666666666', (select id from shows where slug = 'kimberly-akimbo'), '2026-01-25', 'Booth Theatre', 4, null);

insert into posts (author_id, show_id, title, content, image_url, upvotes) values
  ('a3333333-3333-4333-8333-333333333333', null, 'In the Heights needs a revival', null, null, 91),
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'merrily-we-roll-along'), 'The transfer is better than the original and I will take questions',
    'The 1981 cast album is scripture, and I am not arguing with scripture. I am arguing with the idea that a first attempt is automatically the truest one. This company plays the reverse chronology as a slow loss of nerve rather than a stunt, and the second act lands like a door closing.' || chr(10) || chr(10) ||
    'What changed for me was the staging of "Not a Day Goes By." Held still, no ornament, three people who cannot look at each other. If you have only ever heard the show, you have heard the score. You have not seen the argument it is making.',
    'https://placehold.co/800x400/14110E/F2C230?text=Merrily+We+Roll+Along', 64),
  ('a2222222-2222-4222-8222-222222222222', (select id from shows where slug = 'hadestown'), 'Nobody talks about the sound design in Hadestown', null, null, 38),
  ('a4444444-4444-4444-8444-444444444444', (select id from shows where slug = 'sunset-boulevard'), 'Sunset Boulevard is all concept and no heart', null, null, 27),
  ('a1111111-1111-4111-8111-111111111111', (select id from shows where slug = 'maybe-happy-ending'), 'Maybe Happy Ending made me cry on a Tuesday', null, null, 19),
  ('a2222222-2222-4222-8222-222222222222', null, 'Cast a countertenor as the Phantom. That''s the post.', null, null, 9),
  ('a5555555-5555-4555-8555-555555555555', (select id from shows where slug = 'hadestown'), 'The turntable does half the storytelling', null, null, 22),
  ('a6666666-6666-4666-8666-666666666666', (select id from shows where slug = 'hadestown'), 'Which Orpheus did you see', null, null, 14),
  ('a2222222-2222-4222-8222-222222222222', (select id from shows where slug = 'parade'), 'Parade deserved a longer run and everyone knows it', null, null, 46);

insert into comments (post_id, author_id, content) values
  ((select id from posts where title = 'The transfer is better than the original and I will take questions'), 'a2222222-2222-4222-8222-222222222222', 'Correct, and the orchestrations are thinner on purpose. You can hear the room.'),
  ((select id from posts where title = 'The transfer is better than the original and I will take questions'), 'a3333333-3333-4333-8333-333333333333', 'I will take the questions instead. Question one: have you listened to the 1981 album this year, or are you remembering it?'),
  ((select id from posts where title = 'The transfer is better than the original and I will take questions'), 'a4444444-4444-4444-8444-444444444444', 'Saw it twice. The second time I watched only the friends in the background and cried harder.'),
  ((select id from posts where title = 'In the Heights needs a revival'), 'a1111111-1111-4111-8111-111111111111', 'Bring back the block party energy.'),
  ((select id from posts where title = 'Nobody talks about the sound design in Hadestown'), 'a6666666-6666-4666-8666-666666666666', 'The bridge cue during the wedding always gets me.');
