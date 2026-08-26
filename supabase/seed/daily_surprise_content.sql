-- ───────────────────────────────────────────────
--  Daily Surprise — contenido curado (seed)
-- ───────────────────────────────────────────────
--  Correr DESPUÉS de 20260824_daily_surprise.sql.
--  Idempotente: la igualdad jsonb normaliza el orden de claves,
--  así que re-correrlo NO duplica.

with seed(kind, payload) as (
  values
  -- ── Mensajes motivacionales / de amor ──
  ('message', '{"text":{"es":"Cada día contigo es mi parte favorita del día.","en":"Every day with you is my favorite part of the day."}}'::jsonb),
  ('message', '{"text":{"es":"No importa la distancia: pensamos en el mismo cielo.","en":"No matter the distance: we look at the same sky."}}'::jsonb),
  ('message', '{"text":{"es":"Hoy es un buen día para ser un poquito más valiente.","en":"Today is a good day to be a little braver."}}'::jsonb),
  ('message', '{"text":{"es":"Lo pequeño hecho con amor se vuelve enorme.","en":"Small things done with love become huge."}}'::jsonb),
  ('message', '{"text":{"es":"Respira. Vas mejor de lo que crees.","en":"Breathe. You are doing better than you think."}}'::jsonb),
  ('message', '{"text":{"es":"Eres el plan, no el plan B.","en":"You are the plan, not the backup plan."}}'::jsonb),
  ('message', '{"text":{"es":"Un mensaje tuyo arregla cualquier día gris.","en":"One message from you fixes any gray day."}}'::jsonb),
  ('message', '{"text":{"es":"Gracias por elegirnos, otra vez, hoy.","en":"Thank you for choosing us, again, today."}}'::jsonb),
  ('message', '{"text":{"es":"El amor tambien es paciencia y buenos dias.","en":"Love is also patience and good mornings."}}'::jsonb),
  ('message', '{"text":{"es":"Que tu cafe de hoy sepa a abrazo.","en":"May your coffee today taste like a hug."}}'::jsonb),

  -- ── Chistes (setup → punchline) ──
  ('joke', '{"setup":{"es":"¿Que hace una abeja en el gimnasio?","en":"What does a bee do at the gym?"},"punchline":{"es":"¡Zum-ba!","en":"Zum-bee!"}}'::jsonb),
  ('joke', '{"setup":{"es":"¿Por que el libro de matematicas estaba triste?","en":"Why was the math book sad?"},"punchline":{"es":"Porque tenia muchos problemas.","en":"Because it had too many problems."}}'::jsonb),
  ('joke', '{"setup":{"es":"¿Que le dijo un semaforo a otro?","en":"What did one traffic light say to the other?"},"punchline":{"es":"No me mires, me estoy cambiando.","en":"Do not look, I am changing."}}'::jsonb),
  ('joke', '{"setup":{"es":"¿Como se despiden los quimicos?","en":"How do chemists say goodbye?"},"punchline":{"es":"Acido un placer.","en":"Have a nice periodic table."}}'::jsonb),
  ('joke', '{"setup":{"es":"¿Que hace un pez?","en":"What does a fish do?"},"punchline":{"es":"Nada.","en":"Nothing (nada also means swims)."}}'::jsonb),
  ('joke', '{"setup":{"es":"¿Por que los pajaros no usan Facebook?","en":"Why do birds not use Facebook?"},"punchline":{"es":"Porque ya tienen Twitter.","en":"Because they already have Twitter."}}'::jsonb),
  ('joke', '{"setup":{"es":"¿Que le dice un jardinero a otro?","en":"What does one gardener say to another?"},"punchline":{"es":"Disfrutemos mientras podamos.","en":"Let us enjoy while we can (podamos = we can / we prune)."}}'::jsonb),
  ('joke', '{"setup":{"es":"¿Cual es el colmo de un electricista?","en":"What is the worst thing for an electrician?"},"punchline":{"es":"No seguir la corriente.","en":"Not going with the current."}}'::jsonb),

  -- ── Adivinanzas (riddle) ──
  ('riddle', '{"question":{"es":"Oro parece, plata no es. ¿Que es?","en":"It looks like gold, it is not silver. What is it?"},"answer":{"es":"El platano","en":"The banana"},"hint":{"es":"Es una fruta amarilla","en":"It is a yellow fruit"}}'::jsonb),
  ('riddle', '{"question":{"es":"Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.","en":"White inside, green outside. If you want me to tell you, wait."},"answer":{"es":"La pera","en":"The pear"},"hint":{"es":"Rima con espera","en":"It rhymes with the Spanish word for wait"}}'::jsonb),
  ('riddle', '{"question":{"es":"Tengo agujas y no se coser, tengo numeros y no se leer. ¿Que soy?","en":"I have hands but cannot clap, I have numbers but cannot read. What am I?"},"answer":{"es":"El reloj","en":"The clock"},"hint":{"es":"Marca la hora","en":"It tells the time"}}'::jsonb),
  ('riddle', '{"question":{"es":"Cuanto mas grande, menos se ve. ¿Que es?","en":"The bigger it is, the less you see. What is it?"},"answer":{"es":"La oscuridad","en":"The darkness"},"hint":{"es":"Aparece de noche","en":"It comes at night"}}'::jsonb),
  ('riddle', '{"question":{"es":"Vuela sin alas, silba sin boca. ¿Que es?","en":"It flies without wings, whistles without a mouth. What is it?"},"answer":{"es":"El viento","en":"The wind"},"hint":{"es":"Lo sientes pero no lo ves","en":"You feel it but do not see it"}}'::jsonb),
  ('riddle', '{"question":{"es":"Tiene dientes y no come, tiene cabeza y no es hombre. ¿Que es?","en":"It has teeth but does not eat, it has a head but is not a person. What is it?"},"answer":{"es":"El ajo","en":"The garlic"},"hint":{"es":"Se usa para cocinar","en":"It is used for cooking"}}'::jsonb),
  ('riddle', '{"question":{"es":"Cae y no se rompe, se rompe y no cae. ¿Que son?","en":"One falls and does not break, one breaks and does not fall. What are they?"},"answer":{"es":"La noche y el dia","en":"The night and the day"},"hint":{"es":"Piensa en el cielo","en":"Think about the sky"}}'::jsonb),

  -- ── ¿Sabias que? (fact) ──
  ('fact', '{"text":{"es":"El corazon de un pulpo tiene tres corazones y sangre azul.","en":"An octopus has three hearts and blue blood."}}'::jsonb),
  ('fact', '{"text":{"es":"La miel nunca se echa a perder: se ha encontrado miel comestible de 3000 años.","en":"Honey never spoils: edible honey over 3000 years old has been found."}}'::jsonb),
  ('fact', '{"text":{"es":"Los flamencos nacen grises; se vuelven rosados por lo que comen.","en":"Flamingos are born gray; they turn pink because of what they eat."}}'::jsonb),
  ('fact', '{"text":{"es":"Un dia en Venus dura mas que un año en Venus.","en":"A day on Venus lasts longer than a year on Venus."}}'::jsonb),
  ('fact', '{"text":{"es":"Las nutrias se toman de la mano al dormir para no separarse.","en":"Otters hold hands while sleeping so they do not drift apart."}}'::jsonb),
  ('fact', '{"text":{"es":"El idioma espanol tiene casi 100000 palabras en el diccionario.","en":"The Spanish language has almost 100000 words in the dictionary."}}'::jsonb),
  ('fact', '{"text":{"es":"Los platanos son bayas, pero las fresas no lo son.","en":"Bananas are berries, but strawberries are not."}}'::jsonb),
  ('fact', '{"text":{"es":"Tu cerebro genera suficiente electricidad para encender una bombilla pequena.","en":"Your brain generates enough electricity to power a small light bulb."}}'::jsonb),
  ('fact', '{"text":{"es":"Colombia y Estados Unidos comparten el mismo huso horario en algunas epocas del año.","en":"Colombia and the United States share the same time zone during part of the year."}}'::jsonb),
  ('fact', '{"text":{"es":"El nombre completo de Bogota era Santa Fe de Bogota.","en":"The full name of Bogota used to be Santa Fe de Bogota."}}'::jsonb),

  -- ── Trivia (elige la respuesta) ──
  ('trivia', '{"question":{"es":"¿Cual es la capital de Colombia?","en":"What is the capital of Colombia?"},"options":{"es":["Medellin","Bogota","Cali","Cartagena"],"en":["Medellin","Bogota","Cali","Cartagena"]},"correctIndex":1}'::jsonb),
  ('trivia', '{"question":{"es":"¿Cuantos estados tiene Estados Unidos?","en":"How many states does the United States have?"},"options":{"es":["48","50","52","51"],"en":["48","50","52","51"]},"correctIndex":1}'::jsonb),
  ('trivia', '{"question":{"es":"¿Que planeta es el mas cercano al Sol?","en":"Which planet is closest to the Sun?"},"options":{"es":["Venus","Marte","Mercurio","Tierra"],"en":["Venus","Mars","Mercury","Earth"]},"correctIndex":2}'::jsonb),
  ('trivia', '{"question":{"es":"¿En que continente esta Egipto?","en":"On which continent is Egypt?"},"options":{"es":["Asia","Africa","Europa","Oceania"],"en":["Asia","Africa","Europe","Oceania"]},"correctIndex":1}'::jsonb),
  ('trivia', '{"question":{"es":"¿Cuantos lados tiene un hexagono?","en":"How many sides does a hexagon have?"},"options":{"es":["5","6","7","8"],"en":["5","6","7","8"]},"correctIndex":1}'::jsonb),
  ('trivia', '{"question":{"es":"¿Cual es el oceano mas grande?","en":"Which is the largest ocean?"},"options":{"es":["Atlantico","Indico","Artico","Pacifico"],"en":["Atlantic","Indian","Arctic","Pacific"]},"correctIndex":3}'::jsonb),
  ('trivia', '{"question":{"es":"¿Que animal es el mas rapido del mundo?","en":"Which is the fastest animal in the world?"},"options":{"es":["Guepardo","Halcon peregrino","Caballo","Liebre"],"en":["Cheetah","Peregrine falcon","Horse","Hare"]},"correctIndex":1}'::jsonb),

  -- ── Scramble (ordena la palabra) ──
  ('scramble', '{"word":{"es":"amor","en":"love"},"hint":{"es":"Lo que sentimos","en":"What we feel"}}'::jsonb),
  ('scramble', '{"word":{"es":"gato","en":"cat"},"hint":{"es":"Animal que maulla","en":"Animal that meows"}}'::jsonb),
  ('scramble', '{"word":{"es":"playa","en":"beach"},"hint":{"es":"Arena y mar","en":"Sand and sea"}}'::jsonb),
  ('scramble', '{"word":{"es":"cafe","en":"coffee"},"hint":{"es":"Bebida de la mañana","en":"Morning drink"}}'::jsonb),
  ('scramble', '{"word":{"es":"viaje","en":"trip"},"hint":{"es":"Ir de aventura","en":"Going on an adventure"}}'::jsonb),
  ('scramble', '{"word":{"es":"beso","en":"kiss"},"hint":{"es":"Con los labios","en":"With the lips"}}'::jsonb),

  -- ── Practica de idioma (el aprende ingles, ella espanol) ──
  ('language', '{"es":"Te extraño","en":"I miss you","example":{"es":"Te extraño cuando no estas.","en":"I miss you when you are away."}}'::jsonb),
  ('language', '{"es":"Buenos dias","en":"Good morning","example":{"es":"Buenos dias, mi amor.","en":"Good morning, my love."}}'::jsonb),
  ('language', '{"es":"¿Como amaneciste?","en":"How did you sleep?","example":{"es":"¿Como amaneciste hoy?","en":"How did you sleep today?"}}'::jsonb),
  ('language', '{"es":"Cuidate","en":"Take care","example":{"es":"Cuidate mucho, por favor.","en":"Please take good care of yourself."}}'::jsonb),
  ('language', '{"es":"Estoy orgulloso de ti","en":"I am proud of you","example":{"es":"Estoy orgulloso de ti por intentarlo.","en":"I am proud of you for trying."}}'::jsonb),
  ('language', '{"es":"Nos vemos pronto","en":"See you soon","example":{"es":"Nos vemos pronto, lo prometo.","en":"See you soon, I promise."}}'::jsonb),
  ('language', '{"es":"Que tengas un lindo dia","en":"Have a nice day","example":{"es":"Que tengas un lindo dia en el trabajo.","en":"Have a nice day at work."}}'::jsonb),
  ('language', '{"es":"Descansa","en":"Get some rest","example":{"es":"Ya es tarde, descansa.","en":"It is late, get some rest."}}'::jsonb)
)
insert into public.daily_content (kind, payload)
select s.kind, s.payload
from seed s
where not exists (
  select 1 from public.daily_content dc
  where dc.kind = s.kind and dc.payload = s.payload
);
