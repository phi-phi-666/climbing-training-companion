// Exercise descriptions with Polish translations
// Each exercise includes: name, Polish name, description, and category

export interface ExerciseInfo {
  name: string
  namePl: string
  description: string
  category: 'warmup' | 'strength' | 'mobility' | 'climbing' | 'cardio' | 'core' | 'fingers'
}

export const exerciseDatabase: ExerciseInfo[] = [
  // === WARMUP / CARDIO ===
  { name: 'Jumping jacks', namePl: 'Pajacyki', description: 'Stand, then jump with legs apart and arms overhead, return to standing.', category: 'warmup' },
  { name: 'High knees', namePl: 'Bieg z wysokim unoszeniem kolan', description: 'Jog in place lifting knees to hip height alternately.', category: 'warmup' },
  { name: 'Butt kicks', namePl: 'Bieg z kopaniem piętami', description: 'Jog in place kicking heels toward glutes.', category: 'warmup' },
  { name: 'Star jumps', namePl: 'Gwiazdy', description: 'Jump explosively spreading arms and legs into an X shape.', category: 'warmup' },
  { name: 'Mountain climbers', namePl: 'Wspinacz górski', description: 'Plank position, drive knees toward chest alternately at pace.', category: 'warmup' },
  { name: 'Burpees', namePl: 'Burpees', description: 'Squat down, jump feet back to plank, push-up, jump feet forward, jump up.', category: 'warmup' },
  { name: 'Jump rope', namePl: 'Skakanka', description: 'Skip rope with light jumps, keeping core engaged.', category: 'cardio' },
  { name: 'Jogging in place', namePl: 'Bieg w miejscu', description: 'Light jog without moving forward, lift feet slightly.', category: 'warmup' },
  { name: 'Lateral shuffles', namePl: 'Przesunięcia boczne', description: 'Shuffle sideways in athletic stance, feet never crossing.', category: 'warmup' },
  { name: 'Skipping', namePl: 'Podskoki', description: 'Exaggerated skipping motion driving knee up with each step.', category: 'warmup' },
  { name: 'Fast feet drills', namePl: 'Szybkie nogi', description: 'Rapid small steps in place, staying on balls of feet.', category: 'warmup' },
  { name: 'Box step-ups', namePl: 'Wejścia na skrzynię', description: 'Step up onto box or bench alternating legs.', category: 'warmup' },
  { name: 'Jump squats', namePl: 'Przysiady z wyskoku', description: 'Squat down then explode upward, land softly.', category: 'warmup' },

  // === UPPER BODY / SHOULDERS ===
  { name: 'Arm circles', namePl: 'Kółka ramionami', description: 'Extend arms and rotate in small to large circles.', category: 'warmup' },
  { name: 'Shoulder rotations', namePl: 'Rotacje barków', description: 'Roll shoulders forward then backward in circles.', category: 'warmup' },
  { name: 'Wrist circles', namePl: 'Kółka nadgarstkami', description: 'Rotate wrists in circles both directions.', category: 'warmup' },
  { name: 'Band pull-aparts', namePl: 'Rozciąganie gumy przed sobą', description: 'Hold band at chest width, pull apart squeezing shoulder blades.', category: 'strength' },
  { name: 'Scapular push-ups', namePl: 'Pompki łopatkowe', description: 'In plank, push shoulder blades apart then squeeze together without bending elbows.', category: 'strength' },
  { name: 'Wall slides', namePl: 'Ślizgi po ścianie', description: 'Back against wall, slide arms up and down keeping contact.', category: 'mobility' },
  { name: 'Thread the needle', namePl: 'Przewlekanie nici', description: 'From all fours, reach one arm under body rotating spine.', category: 'mobility' },
  { name: 'Cat-cow', namePl: 'Kot-krowa', description: 'On all fours, alternate arching and rounding spine with breath.', category: 'mobility' },
  { name: 'Thoracic rotations', namePl: 'Rotacje kręgosłupa piersiowego', description: 'Rotate upper spine while keeping hips stable.', category: 'mobility' },
  { name: 'PVC pass-throughs', namePl: 'Przełożenia drążka', description: 'Hold stick wide, pass it over head and behind back.', category: 'mobility' },
  { name: 'Prone Y raises', namePl: 'Unoszenia Y na brzuchu', description: 'Lie face down, lift arms into Y position squeezing upper back.', category: 'strength' },
  { name: 'Cuban rotations', namePl: 'Rotacje kubańskie', description: 'Elbows at 90°, rotate forearms up keeping elbows in place.', category: 'strength' },
  { name: 'Face pulls', namePl: 'Ściąganie liny do twarzy', description: 'Pull cable or band toward face, elbows high, squeeze back.', category: 'strength' },
  { name: 'Chest openers', namePl: 'Otwieranie klatki', description: 'Hands behind head, open elbows wide stretching chest.', category: 'mobility' },
  { name: 'External rotation', namePl: 'Rotacja zewnętrzna', description: 'Elbow at side, rotate forearm outward against resistance.', category: 'strength' },
  { name: 'YTWs', namePl: 'Litery Y-T-W', description: 'Lying or bent over, form Y, T, and W shapes with arms.', category: 'strength' },
  { name: 'Shoulder dislocates', namePl: 'Przeprosty ramion', description: 'With stick, rotate arms over head and behind back.', category: 'mobility' },
  { name: 'Lateral raises', namePl: 'Unoszenia boczne', description: 'Lift dumbbells to sides until arms parallel to floor.', category: 'strength' },
  { name: 'Front raises', namePl: 'Unoszenia przednie', description: 'Lift weights forward to shoulder height.', category: 'strength' },
  { name: 'Cuban press', namePl: 'Wyciskanie kubańskie', description: 'External rotation into overhead press in one motion.', category: 'strength' },

  // === FINGER / FOREARM ===
  { name: 'Finger spreads and squeezes', namePl: 'Rozciąganie i ściskanie palców', description: 'Spread fingers wide, then make tight fist. Repeat.', category: 'fingers' },
  { name: 'Wrist flexor stretches', namePl: 'Rozciąganie zginaczy nadgarstka', description: 'Extend arm, pull fingers back with palm up.', category: 'fingers' },
  { name: 'Wrist extensor stretches', namePl: 'Rozciąganie prostowników nadgarstka', description: 'Extend arm, pull fingers down with palm facing down.', category: 'fingers' },
  { name: 'Finger tendon glides', namePl: 'Ślizgi ścięgien palców', description: 'Move fingers through hook, fist, table, straight positions.', category: 'fingers' },
  { name: 'Rubber band finger extensions', namePl: 'Rozciąganie palców z gumką', description: 'Open fingers against resistance of rubber band.', category: 'fingers' },
  { name: 'Piano fingers', namePl: 'Palce pianisty', description: 'Tap fingers on table as if playing piano scales.', category: 'fingers' },
  { name: 'Prayer stretches', namePl: 'Rozciąganie w pozycji modlitwy', description: 'Press palms together, lower hands keeping contact.', category: 'fingers' },
  { name: 'Reverse prayer stretches', namePl: 'Odwrócona modlitwa', description: 'Press backs of hands together, raise wrists.', category: 'fingers' },
  { name: 'Finger rolls on table', namePl: 'Toczenie palców po stole', description: 'Roll fingers from fingertip to palm on flat surface.', category: 'fingers' },
  { name: 'Light grip squeezes', namePl: 'Lekkie ściskanie', description: 'Gently squeeze stress ball or grip trainer.', category: 'fingers' },
  { name: 'Wrist curls', namePl: 'Uginanie nadgarstków', description: 'Forearm on thigh, curl weight by flexing wrist.', category: 'strength' },
  { name: 'Reverse wrist curls', namePl: 'Odwrócone uginanie nadgarstków', description: 'Palm down, extend wrist lifting weight.', category: 'strength' },
  { name: 'Finger curls', namePl: 'Uginanie palców', description: 'Let barbell roll to fingertips, curl back to palm.', category: 'fingers' },
  { name: 'Rice bucket', namePl: 'Wiadro z ryżem', description: 'Plunge hand into rice bucket, open and close fist.', category: 'fingers' },
  { name: 'Farmers carry', namePl: 'Spacer farmera', description: 'Walk while holding heavy weights at sides.', category: 'strength' },
  { name: 'Wrist roller', namePl: 'Rolka na nadgarstki', description: 'Roll weight up and down by rotating wrist.', category: 'fingers' },

  // === CORE ===
  { name: 'Dead bugs', namePl: 'Martwy żuk', description: 'Lie on back, extend opposite arm/leg keeping lower back pressed down.', category: 'core' },
  { name: 'Bird dogs', namePl: 'Pies myśliwski', description: 'On all fours, extend opposite arm and leg, hold briefly.', category: 'core' },
  { name: 'Plank holds', namePl: 'Deska', description: 'Hold straight body on forearms and toes.', category: 'core' },
  { name: 'Planks', namePl: 'Deska', description: 'Hold straight body on forearms and toes.', category: 'core' },
  { name: 'Side plank dips', namePl: 'Opady w desce bocznej', description: 'From side plank, lower and raise hips.', category: 'core' },
  { name: 'Hollow body rocks', namePl: 'Kołyska wydrążona', description: 'Lie in hollow body position, rock gently.', category: 'core' },
  { name: 'Hollow body holds', namePl: 'Pozycja wydrążona', description: 'Lie on back, lift shoulders and legs, hold position.', category: 'core' },
  { name: 'Leg raises', namePl: 'Unoszenie nóg', description: 'Lie on back, lift straight legs to vertical.', category: 'core' },
  { name: 'Bicycle crunches', namePl: 'Skłony z rowerkiem', description: 'Touch elbow to opposite knee alternating sides.', category: 'core' },
  { name: 'Bear crawl holds', namePl: 'Pozycja niedźwiedzia', description: 'On hands and feet, knees hovering just off ground.', category: 'core' },
  { name: 'Pallof press', namePl: 'Wyciskanie Pallofa', description: 'Press cable or band straight out resisting rotation.', category: 'core' },
  { name: 'Ab wheel', namePl: 'Kółko do brzucha', description: 'Roll wheel out from kneeling, extend and return.', category: 'core' },
  { name: 'Hanging leg raises', namePl: 'Unoszenie nóg w zwisie', description: 'Hang from bar, lift legs straight or knees to chest.', category: 'core' },
  { name: 'Russian twists', namePl: 'Rosyjskie skręty', description: 'Seated lean back, rotate torso touching floor each side.', category: 'core' },
  { name: 'Supermans', namePl: 'Superman', description: 'Lie face down, lift arms and legs simultaneously.', category: 'core' },
  { name: 'L-sits', namePl: 'L-siedząc', description: 'Support body on hands, lift legs straight in front.', category: 'core' },
  { name: 'Dragon flags', namePl: 'Smocze flagi', description: 'Lie on bench, lift body straight using only upper back.', category: 'core' },
  { name: 'Windshield wipers', namePl: 'Wycieraczki', description: 'Hang or lie down, rotate legs side to side.', category: 'core' },

  // === LOWER BODY / HIPS ===
  { name: 'Hip circles', namePl: 'Kółka biodrami', description: 'Stand on one leg, rotate other leg in circles.', category: 'mobility' },
  { name: 'Leg swings (front-back)', namePl: 'Wymahi nóg przód-tył', description: 'Swing leg forward and backward like pendulum.', category: 'mobility' },
  { name: 'Leg swings (side-side)', namePl: 'Wymahi nóg bok-bok', description: 'Swing leg across body and out to side.', category: 'mobility' },
  { name: 'Deep squats', namePl: 'Głębokie przysiady', description: 'Squat as low as possible, pause at bottom.', category: 'mobility' },
  { name: 'Walking lunges', namePl: 'Wypady w marszu', description: 'Step forward into lunge, alternate legs moving forward.', category: 'strength' },
  { name: 'Cossack squats', namePl: 'Przysiady kozackie', description: 'Wide stance, shift to one side keeping other leg straight.', category: 'mobility' },
  { name: 'Hip 90/90', namePl: 'Biodra 90/90', description: 'Sit with both legs at 90°, rotate to switch sides.', category: 'mobility' },
  { name: 'Hip 90/90 transitions', namePl: 'Przejścia 90/90', description: 'Flow between hip 90/90 positions without using hands.', category: 'mobility' },
  { name: 'Frog stretch', namePl: 'Żabka', description: 'Knees wide, rock back stretching inner thighs.', category: 'mobility' },
  { name: 'Frog stretches', namePl: 'Żabka', description: 'Knees wide, rock back stretching inner thighs.', category: 'mobility' },
  { name: 'Pigeon pose', namePl: 'Pozycja gołębia', description: 'One leg bent in front, other extended back, lean forward.', category: 'mobility' },
  { name: 'Ankle circles', namePl: 'Kółka kostkami', description: 'Rotate ankle in circles both directions.', category: 'mobility' },
  { name: 'Calf raises', namePl: 'Wspięcia na palce', description: 'Rise onto balls of feet, lower slowly.', category: 'strength' },
  { name: 'Glute bridges', namePl: 'Mostek biodrowy', description: 'Lie on back, lift hips squeezing glutes.', category: 'strength' },
  { name: 'Fire hydrants', namePl: 'Hydranty', description: 'On all fours, lift bent knee out to side.', category: 'strength' },
  { name: 'Donkey kicks', namePl: 'Kopnięcia osła', description: 'On all fours, kick bent leg up toward ceiling.', category: 'strength' },
  { name: "World's greatest stretch", namePl: 'Najlepsze rozciąganie świata', description: 'Lunge with rotation, elbow to instep, reach to sky.', category: 'mobility' },
  { name: 'Inchworms', namePl: 'Gąsienice', description: 'Walk hands out to plank, walk feet to hands.', category: 'mobility' },
  { name: 'Squats', namePl: 'Przysiady', description: 'Stand, bend knees and hips to lower, stand back up.', category: 'strength' },
  { name: 'Lunges', namePl: 'Wypady', description: 'Step forward, lower back knee toward floor, push back.', category: 'strength' },
  { name: 'Pistol squats', namePl: 'Przysiady pistoletowe', description: 'Single leg squat with other leg extended forward.', category: 'strength' },
  { name: 'Romanian deadlifts', namePl: 'Martwy ciąg rumuński', description: 'Hinge at hips lowering weight, keep legs nearly straight.', category: 'strength' },
  { name: 'Bulgarian split squats', namePl: 'Przysiady bułgarskie', description: 'Rear foot elevated, squat on front leg.', category: 'strength' },
  { name: 'Box jumps', namePl: 'Skoki na skrzynię', description: 'Jump onto elevated platform, step down.', category: 'strength' },
  { name: 'Step-ups', namePl: 'Wejścia na podest', description: 'Step up onto elevated surface alternating legs.', category: 'strength' },
  { name: 'Couch stretch', namePl: 'Rozciąganie przy kanapie', description: 'Rear foot against wall, lunge forward stretching hip flexor.', category: 'mobility' },
  { name: 'Banded hip flexor stretch', namePl: 'Rozciąganie biodrowego z gumą', description: 'Band around hip, lunge forward with resistance.', category: 'mobility' },
  { name: 'Ankle mobility', namePl: 'Mobilność kostki', description: 'Drive knee forward over toes in half-kneeling.', category: 'mobility' },
  { name: 'Deep squat hold', namePl: 'Zatrzymanie w głębokim przysiadzie', description: 'Hold bottom squat position for time.', category: 'mobility' },

  // === BACK / PULLING ===
  { name: 'Pull-ups', namePl: 'Podciągnięcia', description: 'Hang from bar, pull chin over bar.', category: 'strength' },
  { name: 'Rows', namePl: 'Wiosłowanie', description: 'Pull weight toward torso squeezing shoulder blades.', category: 'strength' },
  { name: 'Lat pulldowns', namePl: 'Ściąganie drążka', description: 'Pull cable bar down to chest from overhead.', category: 'strength' },
  { name: 'Scapular pull-ups', namePl: 'Podciąganie łopatkowe', description: 'Hang from bar, lift body by squeezing shoulder blades only.', category: 'strength' },
  { name: 'Inverted rows', namePl: 'Wiosłowanie w zwisie', description: 'Hang under bar, pull chest to bar keeping body straight.', category: 'strength' },
  { name: 'One-arm rows', namePl: 'Wiosłowanie jednorącz', description: 'Row dumbbell to hip one arm at a time.', category: 'strength' },
  { name: 'Deadlifts', namePl: 'Martwy ciąg', description: 'Lift barbell from floor by hinging at hips.', category: 'strength' },
  { name: 'Bent-over rows', namePl: 'Wiosłowanie w opadzie', description: 'Hinged forward, row barbell to lower chest.', category: 'strength' },

  // === CHEST / PUSHING ===
  { name: 'Push-ups', namePl: 'Pompki', description: 'Lower chest to floor and press back up.', category: 'strength' },
  { name: 'Dips', namePl: 'Dipy', description: 'Lower body between parallel bars, press back up.', category: 'strength' },
  { name: 'Bench press', namePl: 'Wyciskanie na ławce', description: 'Press barbell from chest while lying on bench.', category: 'strength' },
  { name: 'Chest flies', namePl: 'Rozpiętki', description: 'Arms wide, bring dumbbells together over chest.', category: 'strength' },
  { name: 'Diamond push-ups', namePl: 'Pompki diamentowe', description: 'Push-up with hands together forming diamond shape.', category: 'strength' },
  { name: 'Incline push-ups', namePl: 'Pompki na skosie', description: 'Push-up with hands elevated on bench.', category: 'strength' },
  { name: 'Archer push-ups', namePl: 'Pompki łucznika', description: 'Wide push-up shifting weight to one arm.', category: 'strength' },

  // === TRICEPS ===
  { name: 'Tricep dips', namePl: 'Dipy na triceps', description: 'Dips with elbows close to body, targeting triceps.', category: 'strength' },
  { name: 'Tricep pushdowns', namePl: 'Prostowanie ramion na wyciągu', description: 'Push cable down keeping elbows at sides.', category: 'strength' },
  { name: 'Overhead extension', namePl: 'Wyprost nad głową', description: 'Extend weight overhead, lower behind head, press up.', category: 'strength' },
  { name: 'Close-grip bench press', namePl: 'Wyciskanie wąskim chwytem', description: 'Bench press with hands closer together.', category: 'strength' },
  { name: 'Skull crushers', namePl: 'Łamacze czaszki', description: 'Lower weight to forehead, extend arms overhead.', category: 'strength' },

  // === CLIMBING SPECIFIC ===
  { name: 'Easy traverse', namePl: 'Łatwe trawersowanie', description: 'Move sideways on easy holds focusing on footwork.', category: 'climbing' },
  { name: 'Slab footwork drills', namePl: 'Ćwiczenia na płycie', description: 'Practice precise foot placements on slab.', category: 'climbing' },
  { name: 'Quiet feet practice', namePl: 'Ciche stopy', description: 'Move on wall placing feet silently and precisely.', category: 'climbing' },
  { name: 'Open hand dead hangs', namePl: 'Zwieszanie otwartym chwytem', description: 'Hang from edge with open hand grip.', category: 'climbing' },
  { name: 'Light campus touches', namePl: 'Dotknięcia na kampusie', description: 'Touch campus rungs without pulling, activating fingers.', category: 'climbing' },
  { name: 'Flag practice', namePl: 'Ćwiczenie flag', description: 'Practice flagging technique on easy routes.', category: 'climbing' },
  { name: 'Smearing drills', namePl: 'Ćwiczenia smerowania', description: 'Practice using rubber friction without footholds.', category: 'climbing' },
  { name: 'Balance practice', namePl: 'Ćwiczenia równowagi', description: 'Move slowly on wall focusing on balance points.', category: 'climbing' },
  { name: 'Easy dynos', namePl: 'Łatwe dyno', description: 'Practice dynamic moves on large holds.', category: 'climbing' },
  { name: 'Mantling practice', namePl: 'Ćwiczenia mantli', description: 'Practice mantle moves on low ledges.', category: 'climbing' },
  { name: 'Drop knee practice', namePl: 'Ćwiczenia drop knee', description: 'Practice drop knee positions for rotation.', category: 'climbing' },

  // === HANGBOARD ===
  { name: 'Max hangs - 20mm edge', namePl: 'Maksymalne zwisy - 20mm', description: 'Hang from 20mm edge with added weight for 7-10 sec.', category: 'fingers' },
  { name: 'Max hangs - 15mm edge', namePl: 'Maksymalne zwisy - 15mm', description: 'Hang from 15mm edge with added weight for 7-10 sec.', category: 'fingers' },
  { name: 'Max hangs - 10mm edge', namePl: 'Maksymalne zwisy - 10mm', description: 'Hang from 10mm edge with added weight for 7-10 sec.', category: 'fingers' },
  { name: 'Repeaters - 20mm edge', namePl: 'Powtórzenia - 20mm', description: 'Hang 7 sec on / 3 sec off for multiple sets on 20mm.', category: 'fingers' },
  { name: 'Repeaters - 15mm edge', namePl: 'Powtórzenia - 15mm', description: 'Hang 7 sec on / 3 sec off for multiple sets on 15mm.', category: 'fingers' },
  { name: 'Repeaters - 10mm edge', namePl: 'Powtórzenia - 10mm', description: 'Hang 7 sec on / 3 sec off for multiple sets on 10mm.', category: 'fingers' },
  { name: 'Half crimp hangs', namePl: 'Zwieszanie półzamkniętym chwytem', description: 'Hang with fingers at 90°, thumb not wrapped.', category: 'fingers' },
  { name: 'Open hand hangs', namePl: 'Zwieszanie otwartym chwytem', description: 'Hang with fingers extended, open grip.', category: 'fingers' },
  { name: 'Three finger drag', namePl: 'Trzy palce - drag', description: 'Hang using only index, middle, ring fingers.', category: 'fingers' },
  { name: 'Front two fingers', namePl: 'Dwa przednie palce', description: 'Hang using only index and middle fingers.', category: 'fingers' },
  { name: 'Back two fingers', namePl: 'Dwa tylne palce', description: 'Hang using only ring and pinky fingers.', category: 'fingers' },
  { name: 'Mono hangs', namePl: 'Zwisy na jednym palcu', description: 'Advanced: hang from single finger pocket.', category: 'fingers' },
  { name: 'Pinch hangs', namePl: 'Zwisy szczypcem', description: 'Hang from pinch grips engaging thumb.', category: 'fingers' },
  { name: 'Sloper hangs', namePl: 'Zwisy na sloperach', description: 'Hang from rounded sloper holds.', category: 'fingers' },
  { name: 'One arm hangs', namePl: 'Zwisy jedną ręką', description: 'Advanced: hang from one arm.', category: 'fingers' },
  { name: 'Offset hangs', namePl: 'Zwisy asymetryczne', description: 'Hang with one hand lower than the other.', category: 'fingers' },
  { name: 'Lock-off hangs', namePl: 'Zwisy w blokadzie', description: 'Pull up and hold at various lock-off positions.', category: 'fingers' },
  { name: 'Pull-up repeaters', namePl: 'Powtórzenia podciągnięć', description: 'Continuous pull-ups on hangboard.', category: 'fingers' },

  // === CROSSFIT SPECIFIC ===
  { name: 'Thrusters', namePl: 'Thrustery', description: 'Front squat into overhead press in one motion.', category: 'strength' },
  { name: 'Push press', namePl: 'Wyciskanie z pędem', description: 'Use leg drive to help press weight overhead.', category: 'strength' },
  { name: 'Push jerk', namePl: 'Jerk z pędem', description: 'Drive weight overhead with slight dip under.', category: 'strength' },
  { name: 'Split jerk', namePl: 'Jerk rozkroczny', description: 'Drive weight overhead landing in split stance.', category: 'strength' },
  { name: 'Handstand push-ups', namePl: 'Pompki w staniu na rękach', description: 'Push-up while inverted against wall.', category: 'strength' },
  { name: 'Overhead squat', namePl: 'Przysiad nad głową', description: 'Squat with weight locked out overhead.', category: 'strength' },
  { name: 'Snatch', namePl: 'Rwanie', description: 'Lift barbell from floor to overhead in one motion.', category: 'strength' },
  { name: 'Chest-to-bar pull-ups', namePl: 'Podciągnięcia do klatki', description: 'Pull chest to touch the bar.', category: 'strength' },
  { name: 'Muscle-ups', namePl: 'Muscle-up', description: 'Pull-up transitioning into dip on top of bar/rings.', category: 'strength' },
  { name: 'Ring rows', namePl: 'Wiosłowanie na kółkach', description: 'Row body toward rings from inclined position.', category: 'strength' },
  { name: 'Power cleans', namePl: 'Power clean', description: 'Explosive pull from floor catching in quarter squat.', category: 'strength' },
  { name: 'Hang cleans', namePl: 'Clean z zawieszenia', description: 'Clean starting from hang position.', category: 'strength' },
  { name: 'Toes-to-bar', namePl: 'Palce do drążka', description: 'Hang, swing toes up to touch bar.', category: 'core' },
  { name: 'Knees-to-elbows', namePl: 'Kolana do łokci', description: 'Hang, bring knees up toward elbows.', category: 'core' },
  { name: 'GHD sit-ups', namePl: 'Brzuszki na GHD', description: 'Sit-up on glute ham developer.', category: 'core' },
  { name: 'V-ups', namePl: 'V-ki', description: 'Lie flat, lift arms and legs to touch in middle.', category: 'core' },
  { name: 'Ab mat sit-ups', namePl: 'Brzuszki na macie', description: 'Sit-up with ab mat support under lower back.', category: 'core' },
  { name: 'Ring dips', namePl: 'Dipy na kółkach', description: 'Dips on gymnastics rings.', category: 'strength' },
  { name: 'Ring push-ups', namePl: 'Pompki na kółkach', description: 'Push-up with hands on rings for instability.', category: 'strength' },
  { name: 'Hand-release push-ups', namePl: 'Pompki z odrywaniem rąk', description: 'Push-up with hands lifting off floor at bottom.', category: 'strength' },
  { name: 'Back squats', namePl: 'Przysiady ze sztangą z tyłu', description: 'Squat with barbell on upper back.', category: 'strength' },
  { name: 'Front squats', namePl: 'Przysiady przednie', description: 'Squat with barbell in front rack position.', category: 'strength' },
  { name: 'Wall balls', namePl: 'Piłka do ściany', description: 'Squat and throw medicine ball to target.', category: 'strength' },
  { name: 'Clean and jerk', namePl: 'Clean & Jerk', description: 'Clean barbell to shoulders, then jerk overhead.', category: 'strength' },
  { name: 'Double-unders', namePl: 'Podwójne przeskoki', description: 'Jump rope passing twice under feet per jump.', category: 'cardio' },
  { name: 'Assault bike', namePl: 'Rower Assault', description: 'Air bike with arm and leg power.', category: 'cardio' },
  { name: 'Rope climbs', namePl: 'Wspinanie na linę', description: 'Climb thick rope using arms and leg wrap.', category: 'climbing' },

  // === MOBILITY STRETCHES ===
  { name: 'Shoulder stretches', namePl: 'Rozciąganie barków', description: 'Various stretches for shoulder flexibility.', category: 'mobility' },
  { name: 'Wrist stretches', namePl: 'Rozciąganie nadgarstków', description: 'Stretch wrists in flexion and extension.', category: 'mobility' },
]

// Get exercises by category
export function getExercisesByCategory(category: ExerciseInfo['category']): ExerciseInfo[] {
  return exerciseDatabase.filter(e => e.category === category)
}

// Search exercises by name (English or Polish)
export function searchExercises(query: string): ExerciseInfo[] {
  const lower = query.toLowerCase()
  return exerciseDatabase.filter(
    e => e.name.toLowerCase().includes(lower) ||
         e.namePl.toLowerCase().includes(lower) ||
         e.description.toLowerCase().includes(lower)
  )
}

// Find exercise by name
export function findExercise(name: string): ExerciseInfo | undefined {
  const lower = name.toLowerCase()
  return exerciseDatabase.find(
    e => e.name.toLowerCase() === lower || e.namePl.toLowerCase() === lower
  )
}

// Category labels
export const categoryLabels: Record<ExerciseInfo['category'], { en: string; pl: string }> = {
  warmup: { en: 'Warmup', pl: 'Rozgrzewka' },
  strength: { en: 'Strength', pl: 'Siła' },
  mobility: { en: 'Mobility', pl: 'Mobilność' },
  climbing: { en: 'Climbing', pl: 'Wspinaczka' },
  cardio: { en: 'Cardio', pl: 'Kardio' },
  core: { en: 'Core', pl: 'Rdzeń' },
  fingers: { en: 'Fingers', pl: 'Palce' }
}
