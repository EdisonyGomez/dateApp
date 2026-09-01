-- ───────────────────────────────────────────────
--  Daily Surprise · fix: traducciones EN duplicadas
-- ───────────────────────────────────────────────
--  Root cause: 20260824_daily_surprise.sql (líneas 60-70) migró los
--  love_notes existentes a daily_content así:
--
--    jsonb_build_object('text', jsonb_build_object('es', ln.message, 'en', ln.message))
--
--  Copió el MISMO texto en español en las dos claves. No es un problema
--  de esquema (payload ya es jsonb con {es, en}) — no hace falta ALTER
--  TABLE. Es un problema de datos: hay que reemplazar `en` por una
--  traducción real, fila por fila.
--
--  Cada UPDATE toca SOLO payload->text->en vía jsonb_set (preserva `es`
--  y cualquier otra clave). Re-correr es seguro: vuelve a fijar el mismo
--  valor. Los ids salen de la tabla real (paste del usuario), no del seed.
--
--  Supabase → SQL Editor → pegar y Run.

update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"With you I learned that being vulnerable is not a weakness but a bridge."'::jsonb) where id = '016246a0-220c-4196-abc2-126453d2245f';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Every day with you is a gift I treasure 🎁"'::jsonb) where id = '04051982-4d34-40d0-8475-7cd3ba16b651';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Confession: you are my favorite thought before falling asleep, and often when I wake up too."'::jsonb) where id = '05ca2c9d-67ca-4e11-b9c7-9b4f4a8cd3f6';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If you''re reading this, promise me you''ll take care of yourself today the way I wish I could."'::jsonb) where id = '099d0764-7706-4358-9a89-5fe4ae53d2f0';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: tell me something you''ve never dared to ask me, and let''s see what we can do about it."'::jsonb) where id = '0fd2ea51-6ad8-49ff-920e-2d90b5181ce7';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Deep challenge: today let''s talk about a fear we''ve never told each other."'::jsonb) where id = '10dc2e80-ba2e-4782-81a8-dcae72493085';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"You are my favorite notification, my preferred coincidence, and the mistake I''d never correct."'::jsonb) where id = '1115e1a9-234a-4748-9493-012f2300b13d';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Your laugh is officially my favorite sound."'::jsonb) where id = '155818fe-f3ff-4131-81e7-425fa48b8f48';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"The way you see the world makes me want to be a better person too."'::jsonb) where id = '1a828ea4-7ea5-4a9f-803f-ead27bb4ee75';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If love had a scent, to me it would smell like you."'::jsonb) where id = '1bd01cd7-0f87-414c-a58a-74af96c05a03';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Flirty confession: there are things I only dare to imagine with you."'::jsonb) where id = '1f562407-7ad9-4181-954a-2aac7bf1174f';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Your love has taught me things no manual ever could."'::jsonb) where id = '205902ea-90f5-4e03-8f03-b87215d30689';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I love that we can talk about everything: from silly nonsense to our deepest fears."'::jsonb) where id = '25b7b11f-29f0-4137-9651-984cf21249bd';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Confession: I''ve cried out of love for you more than once, and I''m not ashamed to admit it."'::jsonb) where id = '2668256b-0d45-40a8-ab73-22af6321bb4e';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: pick a song that reminds you of me and send it to me, I want to put it on repeat."'::jsonb) where id = '26bc7225-4fda-4d02-8f9d-0edc15c437a8';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: today it''s forbidden to go to sleep without saying something sweet to each other."'::jsonb) where id = '297df6cf-2f21-4b99-9c9b-80dd97ec3347';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"When the world feels cold, I remember you exist and it warms up a little."'::jsonb) where id = '311220d9-f3f8-4710-bf34-18e6ac335b71';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I love you without rush, but with a whole lot of wanting."'::jsonb) where id = '3228b71c-4bf8-4a83-909f-39fde81dbea4';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Confession: I still get nervous when you stare at me."'::jsonb) where id = '3390f365-904e-4e18-ba37-974a59fdb150';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Thank you for being gentle with my wounds and firm with my excuses."'::jsonb) where id = '38ad19b4-d6e2-4b96-9f32-61a5bf224266';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If the day gets heavy, remember you can always find shelter in me."'::jsonb) where id = '3efdf9de-fcbd-4a65-97e1-422a08c46065';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Loving you became my favorite habit."'::jsonb) where id = '3f7d04cb-c62c-4b91-87bf-5c8fc1638c0f';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I don''t need a thousand reasons to love you. One is enough: you ✨"'::jsonb) where id = '4019a929-92fd-4fd6-b0fb-40bfe3b1164b';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"You''re my forever crush, even though you''re already my person."'::jsonb) where id = '4137b935-f291-4d1f-b0e9-cb9e3ac03985';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Romantic challenge: this week let''s write a mini love letter together in the chat."'::jsonb) where id = '4641a834-6b6a-498f-a50c-9bea8f1550dd';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: tell me a crazy goal you have and let''s plan together how to reach it."'::jsonb) where id = '490084c2-81d8-4945-af29-4fc292a60897';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I owe you a whole backlog of hugs, so get ready because I''m collecting on all of them."'::jsonb) where id = '497fc64b-cf6b-42d3-bfaa-285c3ba50d8b';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If I could choose again, I''d choose you every time, in every universe."'::jsonb) where id = '4bb1b9b7-02bb-4d43-a2a2-88cbf335a617';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If you knew how my heart races when you tell me you love me."'::jsonb) where id = '4c794bfc-c7df-49a2-81b2-1b913e79bb68';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I love you more than words can explain, thank you for being my safe place."'::jsonb) where id = '4de1d7d5-8fc1-4077-910e-8bfe276a0094';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: today I want you to tell me a memory of yours that you almost never share with anyone."'::jsonb) where id = '5085fa01-3ffa-4945-9871-c95397c68546';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Our love is my favorite story 📖"'::jsonb) where id = '51ba0f26-564b-496c-bab0-2bc9dc936ac0';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If love were a journey, with you I''d always choose a one-way ticket."'::jsonb) where id = '53bb8f11-8724-4117-99b0-04713b4bae72';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Your voice has that strange power to turn down the volume on my problems."'::jsonb) where id = '5494a1ac-7dff-4eb1-8751-6e03992582f4';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: our next hug has to last at least ten seconds, no counting out loud."'::jsonb) where id = '5566d31e-09f4-468f-8e6c-56f0ef5151a5';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Naughty confession: there are memories of you that make me smile at the least appropriate moments."'::jsonb) where id = '5627ea74-bb94-459a-a16d-ae6b5662f9cc';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Romantic challenge: today let''s imagine a plan for our future together."'::jsonb) where id = '57944de3-effd-4eba-b939-f0edb010f6b9';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Funny confession: I''ll use any silly excuse to keep the conversation going with you."'::jsonb) where id = '5ac82b1b-db47-4361-85ba-585b0cfcbabc';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: today you have to tell me something you really like about me without using the word ''really.''"'::jsonb) where id = '5b015be7-0ff3-4143-ba24-390370af5696';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Deep confession: sometimes I''m afraid of not being enough for you, but I promise to keep trying."'::jsonb) where id = '5bfdd37e-0fba-4a22-84ab-c236f0744d96';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I love you even on the days you can''t stand yourself."'::jsonb) where id = '5ceda0db-79f1-45c7-820c-0b4076b9008b';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I think of you more than you imagine, and I love you more than I say 💌"'::jsonb) where id = '5fce6023-1220-455c-a98b-5ceb45940c43';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Thank you for adding tenderness to my days and calm to my nights."'::jsonb) where id = '6232b04c-91a4-4b23-8342-84262f20f36f';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I want to be the reason you feel it was worth it not to give up."'::jsonb) where id = '62bfb7c2-8862-4fa0-905c-443c5d9fde94';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I wish you beautiful things, but most of all I wish myself many more years by your side."'::jsonb) where id = '64d65799-f1a2-46dc-9368-10f116dd2d4b';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Thank you for putting up with my craziness, my fears, and my drama, you are pure magic."'::jsonb) where id = '6580ce5d-c8fe-4158-b223-e346ce6b4945';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"You''re my favorite reason to smile every day 💫"'::jsonb) where id = '65fbf1ea-c599-4b88-8b94-9451dee1933d';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Thank you for not giving up on me, even when I was about to give up on myself."'::jsonb) where id = '6669b91c-fe53-4ba2-972f-1adddc63390c';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"You''re the only person I''d pause a show for right at the best part."'::jsonb) where id = '66c42465-5277-47d2-9063-301d17ac789b';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Your smile is my favorite notification."'::jsonb) where id = '6864eac3-2f7b-4736-861f-08d1dc1b5bfc';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"You make me feel lucky just for having you in my life 🥰"'::jsonb) where id = '689bf115-9411-43c7-a7c5-6b8b628e188a';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: tell me a romantic (or spicy) fantasy you have and let''s see how we can make it real."'::jsonb) where id = '68ac707d-60d5-4de8-ad09-eb90baa1a2dd';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Naughty confession: I can''t help but smile every time I see your profile picture."'::jsonb) where id = '69a168a3-07fa-4f10-a190-3b6ec19d538f';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Flirty challenge: today you get to choose where our first kiss happens when we see each other."'::jsonb) where id = '6b5afca8-22bb-434f-af81-06557acd61df';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"You are my most beautiful coincidence, turned into a daily choice."'::jsonb) where id = '6c31fa25-cea1-498b-b209-c5b8bdb1593e';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I want you to know that no matter what happens, I''m proud of you."'::jsonb) where id = '75657ace-49be-4370-b9b7-5ce1476e88de';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"With you, even gray days have color 🌈"'::jsonb) where id = '78d3af31-a3f7-4945-9eae-34b77e8c9f7a';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Deep challenge: let''s each write three things we love about the other, then share them."'::jsonb) where id = '7ff579c7-d0f6-4102-9d0c-a1599ce5dd6a';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"The way you love deserves patience, care, and respect, and I want to give you that and more."'::jsonb) where id = '80d9c239-01f9-485a-b549-1f295396978e';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"I think about you more times a day than I check my phone… and that''s saying a lot."'::jsonb) where id = '81b66920-f616-4651-a961-204f111d588a';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"You are that beautiful thought that interrupts all the ugly ones."'::jsonb) where id = '864b5048-de89-4a54-a392-ef402e2a1954';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Thank you for teaching me that love can also be peace, not just a storm."'::jsonb) where id = '88a182bf-3c55-4586-8c49-ca77c200a5bd';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If you ever doubt yourself, just ask me and I''ll remind you how amazing you are."'::jsonb) where id = '890eccaf-054b-4ffd-8e03-79fc524e7f80';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"If you knew how many times I''ve imagined our future together, you''d fall in love all over again."'::jsonb) where id = '89eec122-df13-4751-97c3-c17cddf5e7e7';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Every message from you improves my day more than any social media filter."'::jsonb) where id = '8f11b521-52e8-4e4b-a9d5-5e870576c860';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Confession: every time I write you a sweet message, I delete three even more intense ones."'::jsonb) where id = '94c726cd-efc0-4500-b9cf-ea343f7e77b8';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Challenge: today I want you to tell me the exact moment you started falling for me."'::jsonb) where id = '9653f4ee-6a00-4311-86dd-cdbb792bd714';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"With you I learned that home isn''t a place, it''s a person, and that person is you."'::jsonb) where id = '97c40f83-e982-47e7-9c65-11202e070ca0';
update public.daily_content set payload = jsonb_set(payload, '{text,en}', '"Sweet challenge: today I want a photo of you making a pouty face so I fall for you even more."'::jsonb) where id = '9fc20f65-c7b4-4b35-b313-74b327796b4b';

-- ── Verificación: cualquier "message" que TODAVÍA tenga en == es queda pendiente ──
-- (si tu export estaba cortado y hay más filas de las 69 de arriba, aparecen acá)
select id, payload -> 'text' ->> 'es' as pending_spanish_text
from public.daily_content
where kind = 'message'
  and payload -> 'text' ->> 'en' = payload -> 'text' ->> 'es';
