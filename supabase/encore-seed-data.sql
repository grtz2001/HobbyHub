-- ENCORE — seed data (v2, four-table schema)
-- Run in the Supabase SQL Editor AFTER creating shows / profiles / posts /
-- comments and the show_ratings view.
--
--   14 shows        (2 deliberately unreviewed, to test the "Not yet rated" case)
--    8 profiles
--   22 posts        (17 reviews + 5 discussions)
--   24 comments
--
-- Deliberately varied so every feature is visible:
--   * created_at spread across ~6 weeks   -> date sorting actually moves rows
--   * upvotes from 9 to 91                -> bravo sorting reorders the feed
--   * ratings 1 through 5                 -> averages differ per show
--   * NULL content / image_url / show_id  -> proves the UI survives missing data
--   * one show with a single review        -> average equals that one rating
--   * two shows with zero reviews          -> avg_rating comes back NULL
--
-- Posters use placehold.co in the Playbill palette. Real poster art is
-- copyrighted; these render fine for the demo and the /shows grid.

-- ---------------------------------------------------------------------------
-- Optional: wipe and restart. Uncomment when re-seeding.
-- ---------------------------------------------------------------------------
-- truncate table comments, posts, shows, profiles restart identity cascade;


-- ---------------------------------------------------------------------------
-- SHOWS
-- ---------------------------------------------------------------------------
insert into shows (slug, title, opening_year, poster_url) values
  ('hadestown',             'Hadestown',              2019, 'https://placehold.co/400x600/14110E/F2C230?text=Hadestown'),
  ('sunset-boulevard',      'Sunset Boulevard',       1993, 'https://placehold.co/400x600/14110E/F2C230?text=Sunset+Boulevard'),
  ('kimberly-akimbo',       'Kimberly Akimbo',        2022, 'https://placehold.co/400x600/14110E/F2C230?text=Kimberly+Akimbo'),
  ('maybe-happy-ending',    'Maybe Happy Ending',     2024, 'https://placehold.co/400x600/14110E/F2C230?text=Maybe+Happy+Ending'),
  ('six',                   'Six',                    2021, 'https://placehold.co/400x600/14110E/F2C230?text=Six'),
  ('merrily-we-roll-along', 'Merrily We Roll Along',  1981, 'https://placehold.co/400x600/14110E/F2C230?text=Merrily'),
  ('sweeney-todd',          'Sweeney Todd',           1979, 'https://placehold.co/400x600/14110E/F2C230?text=Sweeney+Todd'),
  ('into-the-woods',        'Into the Woods',         1987, 'https://placehold.co/400x600/14110E/F2C230?text=Into+the+Woods'),
  ('next-to-normal',        'Next to Normal',         2009, 'https://placehold.co/400x600/14110E/F2C230?text=Next+to+Normal'),
  ('the-bands-visit',       'The Band''s Visit',      2017, 'https://placehold.co/400x600/14110E/F2C230?text=The+Band%27s+Visit'),
  ('parade',                'Parade',                 1998, 'https://placehold.co/400x600/14110E/F2C230?text=Parade'),
  ('company',               'Company',                1970, 'https://placehold.co/400x600/14110E/F2C230?text=Company'),
  -- no reviews yet: these should render "Not yet rated" in the directory
  ('floyd-collins',         'Floyd Collins',          1996, 'https://placehold.co/400x600/14110E/F2C230?text=Floyd+Collins'),
  ('bat-boy',               'Bat Boy: The Musical',   2001, 'https://placehold.co/400x600/14110E/F2C230?text=Bat+Boy');


-- ---------------------------------------------------------------------------
-- PROFILES
-- Fixed UUIDs so the inserts below can reference them deterministically.
-- ---------------------------------------------------------------------------
insert into profiles (id, display_name, created_at) values
  ('a1111111-1111-4111-8111-111111111111', 'ellis_w',       now() - interval '80 days'),
  ('a2222222-2222-4222-8222-222222222222', 'quietriot',     now() - interval '74 days'),
  ('a3333333-3333-4333-8333-333333333333', 'marguerite',    now() - interval '66 days'),
  ('a4444444-4444-4444-8444-444444444444', 'j_okonkwo',     now() - interval '61 days'),
  ('a5555555-5555-4555-8555-555555555555', 'thea_r',        now() - interval '52 days'),
  ('a6666666-6666-4666-8666-666666666666', 'sondheimer',    now() - interval '45 days'),
  ('a7777777-7777-4777-8777-777777777777', 'dev_patel_nyc', now() - interval '30 days'),
  ('a8888888-8888-4888-8888-888888888888', 'harriet_l',     now() - interval '18 days');


-- ---------------------------------------------------------------------------
-- POSTS
-- Authors and shows are resolved by name/slug so this runs regardless of
-- generated ids. NULL show_slug means a general discussion.
-- ---------------------------------------------------------------------------
insert into posts (type, author_id, show_id, title, content, image_url, rating, upvotes, created_at)
select
  v.type,
  (select id from profiles where display_name = v.author),
  (select id from shows    where slug         = v.show_slug),
  v.title,
  v.content,
  v.image_url,
  v.rating::smallint,
  v.upvotes::integer,
  now() - v.age::interval
from (values

('review', 'ellis_w', 'hadestown',
 'A Hadestown that finally earns its ending',
 'I have seen this show four times and this is the first cast that made the walk out of the underworld feel genuinely uncertain. You know how it goes. Everyone in the theatre knows how it goes. And somehow the staging still had me leaning forward. The turntable work in the second act does so much quiet storytelling that I did not notice on my first two visits.',
 'https://placehold.co/800x500/14110E/F2C230?text=Hadestown',
 5, 91, '2 hours'),

('review', 'j_okonkwo', 'sunset-boulevard',
 'Sunset Blvd is all spectacle and no spine',
 'The camera work is genuinely inventive and I understand why people are losing their minds over the staging. But stripping the show down this far exposes how little is underneath. Every design choice is doing something interesting and none of them are doing it in the same direction. I left impressed and completely unmoved.',
 null,
 3, 47, '5 hours'),

('review', 'thea_r', 'kimberly-akimbo',
 'Kimberly Akimbo is the only show that has made me cry at a bowling alley set',
 'Nothing prepared me for how funny this is, and being that funny is exactly what makes the last fifteen minutes land the way they do. It refuses to be sentimental right up until the moment it earns the right to be. The teenage ensemble numbers are doing more structural work than they get credit for.',
 'https://placehold.co/800x500/14110E/F2C230?text=Kimberly+Akimbo',
 5, 68, '11 hours'),

('review', 'dev_patel_nyc', 'maybe-happy-ending',
 'Maybe Happy Ending has no business being this good',
 'A two-hander about obsolete helper robots should not work. It works. The design is doing something I have never seen on a Broadway stage and the score is doing something I have not heard in decades. Go in knowing nothing.',
 'https://placehold.co/800x500/14110E/F2C230?text=Maybe+Happy+Ending',
 5, 73, '1 day 3 hours'),

('review', 'harriet_l', 'six',
 'Unpopular opinion: Six is better as an album',
 'Live it is eighty minutes of very high energy and almost no variation in dynamics. Every number lands at the same intensity, so by queen four I had stopped registering the differences between them. On the cast recording you can skip around and it plays great. In the room it flattens out.',
 null,
 3, 29, '1 day 9 hours'),

('review', 'sondheimer', 'merrily-we-roll-along',
 'Merrily finally has a production that solves the structure',
 'The reverse chronology has always been the thing productions have to survive rather than use. This one uses it. By the time you reach the rooftop you have watched three people become strangers in real time and the sweetness is unbearable rather than saccharine. Casting actors who can actually play the age range is apparently the entire trick.',
 'https://placehold.co/800x500/14110E/F2C230?text=Merrily',
 5, 84, '2 days'),

('discussion', 'quietriot', 'sweeney-todd',
 'Is the Sweeney proshot worth it if you saw it live?',
 'Genuine question rather than a review. I caught this in previews and I am trying to work out whether the filmed version captures the orchestra properly. My memory of the room is that the sound was overwhelming in a way I suspect does not survive compression. Anyone seen both?',
 null,
 null, 21, '2 days 7 hours'),

('review', 'marguerite', 'into-the-woods',
 'Into the Woods worked better stripped down than I expected',
 'I went in skeptical about a semi-staged transfer and came out convinced this is how the show should always be done. Without the machinery you actually listen to the lyrics, and the second act stops feeling like a lecture. The narrator staging is a small change that reframes the whole thing.',
 'https://placehold.co/800x500/14110E/F2C230?text=Into+the+Woods',
 4, 52, '3 days 4 hours'),

('review', 'thea_r', 'next-to-normal',
 'Next to Normal in a 200-seat house is a completely different show',
 'Saw this at a regional theatre last weekend and being eight feet from the actors changes what the show is about. On a big stage it is a rock musical about mental illness. In a small room it is a family sitting at a kitchen table having the worst conversation of their lives while you watch from across the room.',
 'https://placehold.co/800x500/14110E/F2C230?text=Next+to+Normal',
 5, 44, '4 days'),

('review', 'ellis_w', 'the-bands-visit',
 'The Band''s Visit is a masterclass in restraint',
 'Almost nothing happens and it is one of the most affecting evenings I have had in a theatre. The score understands that silence is a musical choice. Everyone talks about the big number but the quiet ones between strangers are where the show actually lives.',
 null,
 5, 61, '5 days 2 hours'),

('discussion', 'harriet_l', null,
 'What is the best cast recording to give someone who thinks they hate musicals?',
 'Collecting recommendations. My rule is nothing over two hours and nothing that requires knowing the plot. So far the answers I have gotten are wildly inconsistent, which I think means the question is good.',
 null,
 null, 37, '5 days 18 hours'),

('review', 'j_okonkwo', 'parade',
 'Parade is devastating and I am not sure I can recommend it',
 'This is an extraordinary production of a show I found genuinely difficult to sit through, and I mean that as praise. It refuses to give you catharsis because there is not any available. Go if you are ready for it. Do not go on a whim.',
 'https://placehold.co/800x500/14110E/F2C230?text=Parade',
 5, 57, '7 days 5 hours'),

('review', 'marguerite', 'company',
 'The Company reconception opened it up more than I expected',
 'I was ready to find the gender swap gimmicky and instead the show got sharper. The anxieties land differently when they are attached to a different set of social expectations, and the birthday framing suddenly has teeth.',
 null,
 4, 40, '8 days'),

('discussion', 'sondheimer', 'company',
 'Company gender-swap: does it actually change anything?',
 'Asking sincerely and I know there is a review on here arguing yes. I enjoyed it a great deal but came out unsure whether the reconception opened the show up or just relocated the same anxieties. Interested in people who have seen both versions staged well.',
 null,
 null, 33, '8 days 6 hours'),

('review', 'dev_patel_nyc', 'hadestown',
 'Second Hadestown visit did not hold up',
 'Going back a year later I found the pacing slack in a way I did not notice the first time. Still a remarkable score and the design is beautiful, but the middle of act one sags badly once you know where it is going.',
 null,
 3, 26, '9 days 6 hours'),

('review', 'quietriot', 'sweeney-todd',
 'The orchestra is the reason to see this Sweeney',
 'Twenty-six players. You feel it in the floor. Whatever you think of the staging choices, hearing this score played at full strength is worth the ticket on its own.',
 'https://placehold.co/800x500/14110E/F2C230?text=Sweeney+Todd',
 5, 55, '11 days'),

('review', 'ellis_w', 'kimberly-akimbo',
 'Funny for ninety minutes and then it takes everything from you',
 'Second review of this on here and I am not sorry. What nobody warns you about is how carefully the jokes are load-bearing. Every laugh in act one is setting up something in act two.',
 null,
 5, 31, '13 days 2 hours'),

('discussion', 'thea_r', null,
 'How many times is too many times to see the same production?',
 'Asking for a friend. The friend is me. The number is six.',
 null,
 null, 44, '15 days'),

('review', 'harriet_l', 'into-the-woods',
 'Solid revival, oversold by everyone I know',
 'Perfectly good production that I enjoyed and would recommend at a matinee price. The problem is I was told it was transcendent and it was merely very competent, which is a hard note to land on.',
 null,
 3, 19, '17 days 8 hours'),

('review', 'marguerite', 'six',
 'Six on tour is tighter than the sit-down production',
 'Smaller house, same energy, and the sound mix was noticeably cleaner. If your only option is the tour, that is not a downgrade.',
 null,
 4, 22, '20 days'),

('discussion', 'j_okonkwo', 'parade',
 'Content warnings for Parade — what would you tell a first-timer?',
 'Taking someone next month who does not know the history. Trying to work out how much to prepare them without flattening the experience. Advice welcome.',
 null,
 null, 15, '24 days'),

('review', 'sondheimer', 'next-to-normal',
 'The Broadway production still sets the bar',
 'Every version I have seen since is measured against this one. The lighting design alone taught me things about how a stage can represent an interior state.',
 null,
 4, 28, '38 days')

) as v(type, author, show_slug, title, content, image_url, rating, upvotes, age);


-- ---------------------------------------------------------------------------
-- COMMENTS
-- Matched to posts by title so this works regardless of generated ids.
-- ---------------------------------------------------------------------------
insert into comments (post_id, author_id, content)
select
  (select id from posts    where title        = v.post_title),
  (select id from profiles where display_name = v.author),
  v.body
from (values

('A Hadestown that finally earns its ending', 'quietriot',
 'Which cast did you see? I went in March and the turntable moment did not land the same way for me.'),
('A Hadestown that finally earns its ending', 'marguerite',
 'Completely agree about the second act staging. Four visits is dedication though.'),
('A Hadestown that finally earns its ending', 'thea_r',
 'Booking again because of this. I had written off a return trip.'),

('Sunset Blvd is all spectacle and no spine', 'ellis_w',
 'This is the most articulate version of my exact reaction. Impressed and unmoved, yes.'),
('Sunset Blvd is all spectacle and no spine', 'harriet_l',
 'Hard disagree, but this is a fair writeup rather than a hit piece, so thank you for that.'),

('Kimberly Akimbo is the only show that has made me cry at a bowling alley set', 'dev_patel_nyc',
 'The bowling alley set. I was not ready either.'),
('Kimberly Akimbo is the only show that has made me cry at a bowling alley set', 'sondheimer',
 'The point about it refusing sentimentality until it earns it is exactly right.'),

('Maybe Happy Ending has no business being this good', 'ellis_w',
 'Went in blind on this recommendation. Correct call. Do not read anything first.'),
('Maybe Happy Ending has no business being this good', 'marguerite',
 'The design work is the best I have seen in a decade and it is not close.'),

('Unpopular opinion: Six is better as an album', 'j_okonkwo',
 'You are in the minority, but the dynamics point is real. It is very loud for eighty straight minutes.'),
('Unpopular opinion: Six is better as an album', 'thea_r',
 'Saw the tour last month and felt this exactly. Great album, exhausting evening.'),

('Merrily finally has a production that solves the structure', 'ellis_w',
 'Casting actors who can play the age range being the whole trick is the best observation I have read about this show.'),
('Merrily finally has a production that solves the structure', 'quietriot',
 'The rooftop scene destroyed me. I have never seen the ending work like that.'),

('Is the Sweeney proshot worth it if you saw it live?', 'sondheimer',
 'Seen both. The proshot captures more than you would expect, but you are right that the low end does not survive.'),
('Is the Sweeney proshot worth it if you saw it live?', 'harriet_l',
 'Watch it with actual speakers rather than a laptop and it gets most of the way there.'),

('Into the Woods worked better stripped down than I expected', 'thea_r',
 'The narrator change is such a small thing and it reframes the entire second act. Good catch.'),

('Next to Normal in a 200-seat house is a completely different show', 'dev_patel_nyc',
 'Eight feet from the actors is a completely different artform. This is why I stopped buying rear mezzanine.'),
('Next to Normal in a 200-seat house is a completely different show', 'j_okonkwo',
 'Which regional house? Trying to work out if it is still running.'),

('The Band''s Visit is a masterclass in restraint', 'marguerite',
 'Silence as a musical choice. Yes. Nobody writes about this show properly and you just did.'),

('What is the best cast recording to give someone who thinks they hate musicals?', 'sondheimer',
 'Something under two hours with a plot you can follow from the songs alone. That narrows it more than people expect.'),
('What is the best cast recording to give someone who thinks they hate musicals?', 'ellis_w',
 'Honestly? Start with a proshot instead. The staging does half the work of explaining why anyone is singing.'),

('Parade is devastating and I am not sure I can recommend it', 'quietriot',
 'Appreciate the warning at the end. That is a responsible way to recommend this one.'),

('Company gender-swap: does it actually change anything?', 'marguerite',
 'I wrote the review above arguing yes, so I am biased, but the birthday framing genuinely lands differently.'),

('How many times is too many times to see the same production?', 'harriet_l',
 'Six is fine. Six is normal. Please do not look at my ticket folder.')

) as v(post_title, author, body);


-- ---------------------------------------------------------------------------
-- Sanity checks — run after seeding
-- ---------------------------------------------------------------------------
-- select count(*) from shows;      -- 14
-- select count(*) from profiles;   --  8
-- select count(*) from posts;      -- 22
-- select count(*) from comments;   -- 24
--
-- select type, count(*) from posts group by type;         -- 17 review, 5 discussion
-- select title, avg_rating, review_count from show_ratings order by avg_rating desc nulls last;
-- select * from show_ratings where avg_rating is null;    -- floyd-collins, bat-boy
-- select count(*) from posts where show_id is null;       -- 2 general discussions
-- select count(*) from posts where author_id is null;     -- 0
-- select count(*) from comments where post_id is null;    -- 0  (typo check)
