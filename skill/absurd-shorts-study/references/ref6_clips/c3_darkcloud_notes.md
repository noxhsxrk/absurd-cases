# c3_darkcloud — frame-by-frame notes

Source: `31bb0f3e-v15025gf0000dbpk9pnog65ncc5hjv60.mp4`, 576×1024, 30 fps, 856 frames.
Creator content = frames 0–735 (24.53 s). **TikTok end card starts at f736** (f736–855, 4.0 s) — ignored below.
All 15 sheets read in order; full-res frames 0–740 extracted to `c3_darkcloud\full\f0000.jpg…` (file number = frame index) plus
`strip_*.jpg` / `pick_*.jpg` / `crop_*.jpg` montages used for the calls below.

Method notes
- Shot rule used: same geography sliding through a blur = ONE shot with a whip/tilt; a new set-up after the blur = a new shot that
  starts on a whip. `diff[]` agreed (hidden cut = one-frame spike, camera move = smooth hump).
- Timing: caption card swaps are frame-exact (measured by pixel detector). Whisper word times drift up to ~10 frames on this clip
  ("holy" is smeared over 1.36 s), so cut-on-word calls use caption frames + per-frame audio RMS, with Whisper as a cross-check.
- Machine list has 11 internal cuts; 2 are false (f556, f625 = blur spikes), and it misses 4 (f281, f340, f561, f671). Real cuts: 13.

### 1. Story spine

| t0–t1 s (frames) | narration / quoted line | what we SEE | why it is funny (mechanism) |
|---|---|---|---|
| 0.0–2.3 (0–69) | This man saw a dark cloud. | Suit man walks out of his gate under a blue sky with about 8 white clouds; one small cloud greys, swells; sky grades to slate; 4 pigeons leave the roof; camera cranes up until the cloud fills the top third and he is tiny | Ordinary sight framed as an ominous event; the world itself "reacts" (birds flee, sky dims) |
| 2.3–3.6 (70–109) | It hadn't done anything. | Tilt down from the cloud to his low-angle face; eyes go from open (f78) to slits (f86) | Narrator states innocence up front; the face says guilty anyway |
| 3.7–4.9 (110–147) | That was suspicious. | Snap zoom, plate **SUSPICIOUS** drops, he raises a pointing finger at the sky | Non-sequitur logic: innocence = evidence. The "charge" is an adjective, not a crime |
| 4.9–6.1 (148–182) | So he called the police. | Eyes pop open, phone whipped to ear; cut to a patrol car racing in, a dark car on the road behind it | Formula line; instant over-response |
| 6.1–6.7 (183–201) | (no caption for 0.63 s; voice gap 0.98 s per Whisper) | Car stops under the cloud, officer steps out | Silent "arrival" beat |
| 6.7–7.9 (202–238) | "Well, well (well...)" | Officer swaggers from the car; yellow lightning bolt under the cloud f233–240 | Cop cliché addressed to a cloud; the caption's parenthesis adds a trailing third "well" |
| 8.0–9.3 (239–280) | Then it thundered. | Two officers stand hands-on-hips, backs to camera, staring up; push-in | Weather doing weather, narrated as an act |
| 9.4–10.4 (282–313) | "Shots fired!" | Whip to a low angle behind the officer; he draws and aims straight up | Thunder re-labelled as gunfire = licence to shoot |
| 10.5–13.4 (315–401) | They fired 600 rounds into the sky. | 3 flash shots of officers firing up, second car skids in, crane to 4 officers + 2 cars, whip to the cloud collecting round holes | Literal over-reaction; holes in a cloud played straight |
| 13.4–15.1 (402–453) | It cried for an hour. | Heap of brass at an officer's shoes; a puddle spreads under him; rain; tilt up his body, still firing | Rain re-labelled as crying; "an hour" shown in 1.3 s |
| 15.1–17.2 (454–515) | Then it was white. (+0.8 s silence) | Cloud, full of holes, pales from grey to white, sky goes slate → blue, last drips fall; held with no caption | Reveal + dead-air pause for the penny to drop |
| 17.2–18.6 (516–557) | "Holy sh*t." | Officer lowers the gun, takes his cap off, holds it to his chest, rain dripping off his chin | Funeral gesture for a cloud |
| 18.6–20.7 (559–622) | "We almost shot an innocent cloud." | Over-shoulder on a second officer, tilt up to the white cloud with ~15 holes | "Almost" over a visibly riddled cloud; dark = suspect / white = innocent is the satirical core (police profiling) |
| 20.8–22.3 (624–670) | One officer threw up. | Hatless officer walks off, folds 90° over a hedge, olive arc of vomit; colleague stands by, eyes shut | Remorse scaled to a war-crime for a weather event |
| 22.4–24.0 (672–719) | He's been in therapy ever since. | Therapist's office: officer on the couch in full uniform, cap on chest; **the holed white cloud drifts into the window** | Institution gag lands on the cop, not the offender; background callback |
| 24.0–24.5 (720–735) | (no narration) | Punch-in; officer's head jerks up, eyes wide | Wordless button: the trauma is still outside |

- **Escalation ladder:** look → verdict → phone → 1 car → lightning → drawn gun → 600 rounds / 2 cars / 4 shooters → rain as tears → colour change → remorse → vomit → therapy → the cloud is still there.
- **Who speaks:** narrator for all narration. Four quoted (character) captions, all police: `"Well, well (well...)"`, `"Shots fired!"`,
  `"Holy sh*t."`, `"We almost shot` / `an innocent cloud."`. The caller never speaks. The cloud never speaks.
  Whisper pitch is higher/more varied on quoted words (fired 284 Hz, almost 193, well 192 vs narration ≈ 100–125 Hz) → the lines are
  performed, but whether by the same voice is **uncertain** (cannot hear).
- **Ending:** last line "ever since." (card f693–719; Whisper last word ends f712). Last image: officer on the couch, eyes wide,
  therapist writing, holed cloud in the window. After the caption there are 16 frames (0.53 s): punch-in at f720, head jerk f720–723,
  stare held f724–735 (12 frames). **Not a freeze:** the camera is still pushing in on the last frame (full-res mean abs
  difference f727→f735 = 10.1/255, f734→f735 = 2.4; the rounded thumbnail `diff[]` of 1 hides this). No outro.
- **Callback:** only inside the clip (the cloud in the therapy window). No reference to other episodes found.
- **Hook left open:** the cloud is free and nearby; the officer has not recovered.
- The caller drops out of the story after f166 but stays on screen as a bystander: at his fence f186–278, on his porch with hands to
  his head in the wide f362–365, behind the officers f566–583, by the house f634–668.

### 2. Shot list (14 shots, my eyes)

| # | frames | dur s | size + angle | camera | action | text & graphics | starts with |
|---|---|---|---|---|---|---|---|
| 1 | 0–61 | 2.07 | WS low → EWS high | continuous crane up + tilt up + pull back; man shrinks from ≈ 30 % to ≈ 9 % of frame height | Man walks out of the gate (f0–24), stops, looks up; cloud darkens/grows; sky dims f20–45; pigeons leave f22–30 | "This man saw" f3–24; "a dark cloud." f25–; mailbox plate `@outofthisworld_9` | first frame |
| 2 | 62–147 | 2.87 | ECU cloud, low → CU face, low, dutch | tilt down f62–84 (23 f); creep f85–113; **snap push-in f114–118 ≈ +36 %**; static after | Eyes open f78 → slits f86; pointing hand rises f119–122, held | "a dark cloud." (carries over the cut) to f69; "It hadn't" f70–78; "done anything." f79–109; "That was suspicious." f110–147; plate SUSPICIOUS f119–146 | hard cut |
| 3 | 148–166 | 0.63 | CU low | pull-out + drift f148–157 (head shrinks ≈ 25 %), then still | Eyes now round and open; hand whips a phone from below frame to the ear f152–156 (2 smeared frames) | blank f148; "So he called" f149–160; "the police." f161– | hard cut (same subject, new axis) |
| 4 | 167–280 | 3.80 | WS low → rear 3/4 → MS → MCU from behind | car approach; **whip-pan ≈ 150° following the car f176–184**; settle f185–198; **whip-reframe (drop + roll) f199–206**; then push-in on the walking officer to MCU by f278 | Patrol car races in (a dark car is on the road behind it); it stops under the cloud; officer 1 out of the driver door f192–198, officer 2 from the passenger side; lightning f233–240; both end hands-on-hips, backs to camera, heads tipped up | "the police." to f182; none f183–201; `"Well, well (well...)"` f202–238; "Then it thundered." f239–280; POLICE on doors; `@outofthisworld_9` on boot lid + number plate | hard cut |
| 5 | 281–313 | 1.10 | MCU low, from behind/side | arrives blurred f281–283, then slow tilt up | Officer draws f282–286, arm locked up at the sky by f290, holds | blank f281; `"Shots fired!"` f282–313 (whole card coral) | whip-masked cut (f279–280 blur out, f281 new set-up) |
| 6 | 314–321 | 0.27 | MS low, front | near-static, slight roll | Officer fires two-handed straight up; casings; a second officer firing behind; 1 tracer | blank f314; "They fired 600 rounds" f315– | hard cut |
| 7 | 322–329 | 0.27 | MS low, dutch ≈ 10–12° | 2 blurred arrival frames, settles f324 | Another officer fires, body arched back; muzzle sparkles; casings | same card; boot lid `@outofthisw…` | hard cut, moving arrival |
| 8 | 330–339 | 0.33 | WS low past a car bumper and a foreground gun | 1 blurred arrival frame | Foreground muzzle top-left throws a long tracer; far officer fires; first hole in the cloud | same card | hard cut, moving arrival |
| 9 | 340–401 | 2.07 | MS car → high WS → CU cloud from below | tracks the skidding car f340–351; **crane up/back f360–363**; **whip-tilt up f366–368**; slow push-in on the cloud f369–401 ≈ +35–40 %/s | Second patrol car slides in; officer hops out f352–359; wide: 2 cars, 4 officers firing, caller on porch; holes pop into the cloud (7 at f369 → 11 at f385 → 12+ at f400) | card to f365; "into the sky." f366–401; POLICE ×2 | hard cut |
| 10 | 402–515 | 3.80 | ground-level low on legs → low MS → ECU sky/cloud | static f402–417; tilt up the body f418–453; continues into empty sky, cloud swings in with roll f456–461; push-in ≈ +12 %/s | Heap of brass at his shoe; puddle spreads f407–420; rain f414–453; he is still aiming up; cloud grey → white, sky slate → blue f461–495; 3 drips f470–492 | "It cried" f402–416; "for an hour." f417–453; "Then it was white." f454–491; **no caption f492–515** | hard cut |
| 11 | 516–560 | 1.50 | MS low → MCU low | push-in ≈ +40 %/s with drift; exits by tilting up into sky f556–560 | Lowers gun f519–527; cap off f528–537; cap to chest f538–555; mouth open, drop on chin | `"Holy sh*t."` f516–557; blank f558; next card from f559 | hard cut |
| 12 | 561–670 | 3.67 | OTS → CU cloud → MS two-shot → MS profile | arrives by whip-down from sky f561–565; **tilt up f584–588**; hold f589–622; **whip-tilt down f623–625**; **whip-pan f633–636**; whip-pan right out f668–670 | Officer B looks up, hands on hips, cap coming off at f585; cloud with ≈ 15 holes; foreground head leaves f600 and re-enters tipped back f605–622; hatless officer walks off, folds over the hedge f634–637 and vomits f639–667; colleague beside him, a third walking behind | `"We almost shot` f559–578; `an innocent cloud."` f579–622; blank f623; "One officer" f624–638; "threw up." f639–670 (whole card coral) | whip-masked cut through blank sky (boundary ±2 f) |
| 13 | 671–719 | 1.63 | high WS interior | arrives blurred f671–672, settled f673; push-in ≈ +19 %/s | Officer flat on the couch, hands clenched at his chest, cap on his chest; therapist writes; holed cloud drifts into the window f686–719; eyes shut f700, open f719 | blank f671; "He's been in therapy" f672–692; "ever since." f693–719 | whip-masked cut (f668–670 pan out, f671 new room) |
| 14 | 720–735 | 0.53 | same axis, tighter | **punch-in ≈ +20 % on the cut**, then the push-in continues to the last frame | Head jerks up off the couch f720–723 (1 smeared frame), eyes wide and blank; therapist unchanged | none | jump cut (punch-in) |

Uncertain: shot 10 may hide a stitch in the empty grey sky at f455–456 (gun exits bottom-right as the cloud enters top-left; no
geography to compare). Counted as one shot. Shot 12's whip-tilt at f623–625 was checked at full scale: cloud, red-roof house and
purple house all slide up together while the camera drops and pulls back, so it is one move — but the officer goes from a
foreground head to a full figure in 3 frames, so a stitch cannot be excluded. If both are cuts the count is 16, not 14.

### 3. Rhythm

- **By cuts:** 14 shots in 24.53 s. Median 1.57 s, mean 1.75 s, min 0.27 s, max 3.80 s. Shots < 0.5 s: 3 (#6, #7, #8). Shots > 2.5 s: 4 (#2, #4, #10, #12).
- **By visual beats** (cut OR fast in-shot reframe of ≥ 3 blurred frames): 24 beats. Median 0.77 s, mean 1.02 s, min 0.20 s, max 2.47 s; 6 beats < 0.5 s, none > 2.5 s.
  Beat frames: 62, 23, 63, 19, 16, 16, 8, 74, 33, 8, 8, 10, 20, 6, 36, 52, 62, 45, 23, 39, 10, 38, 49, 16.
  → the clip keeps a ~1 s rhythm with half as many cuts, because 7 whip/tilt reframes do the work of cuts.
- **Fast run:** f314–339 = three shots of 8, 8, 10 frames (0.87 s total) for the gunfire, then the car skid. Only fast run in the clip.
- **Long holds:** #4 (3.8 s) arrival-to-stare oner; #10 (3.8 s) casings → puddle → rain → white cloud, one move bottom-to-top; #12 (3.67 s)
  confession → cloud → walk → vomit. Long takes carry cause-and-effect chains; cuts are saved for violence and for scene changes.
- **Silences:** f175–205 (0.98 s, car stops, officer out); f486–520 (≈ 1.1 s without voice, RMS ≤ −21 dB, 24 frames with no caption) before
  "Holy sh*t."; tail f720–735.
- **Per sentence** (boundaries from caption cards):

| sentence | cards | shots | where the cuts / moves land |
|---|---|---|---|
| This man saw a dark cloud. | 2 | 1 (+ head of #2) | cut f62 falls in the pause after "cloud" (word ends ≈ f56); the card rides over the cut |
| It hadn't done anything. | 2 | 0 new | tilt-down reaches the face at f84 on "done anything" |
| That was suspicious. | 1 | 0 new | snap zoom f114–118 on "was"; plate f119 = onset of "suspicious" (Whisper 3.96 s = f119) |
| So he called the police. | 2 | 2 | cut f148 one frame before "So"; phone up f152–156 on "he called"; cut f167 on "police" (card f161) |
| "Well, well (well...)" | 1 | 0 new | whip-reframe f199–206 ends as the line starts (card f202) |
| Then it thundered. | 1 | 0 new | lightning f233–240 comes BEFORE the sentence (card f239; "thundered" ≈ f255) |
| "Shots fired!" | 1 | 1 | whip-cut f281, card f282, audio rises f282 |
| They fired 600 rounds into the sky. | 2 | 4 | cuts f314 ("They"), f322 ("fired"), f330 ("600"), f340 ("600/rounds"); whip-tilt to the cloud f366–368 = card "into the sky." f366 |
| It cried for an hour. | 2 | 1 | cut f402 on "It" (Whisper 13.36 s = f401); puddle f407–420 under "cried"; rain from f414, card "for an hour." f417 |
| Then it was white. | 1 | 0 new | tilt/whip f454–461 on "Then it was"; cloud finishes whitening ≈ f490, after "white" |
| "Holy sh*t." | 1 | 1 | cut f516 on the card; voice starts ≈ f521 |
| "We almost shot an innocent cloud." | 2 | 1 | whip-cut ≈ f561 on "We" (card f559); tilt to the cloud f584–588 as card 2 (f579) reaches "innocent" |
| One officer threw up. | 2 | 0 new | whip-tilt down f623–625 on "One"; whip-pan f633–636 before "threw"; vomit visible from f639 = card "threw up." |
| He's been in therapy ever since. | 2 | 1 (+#14) | whip-cut f671, card f672; punch-in f720, 8 frames after the last word ends |

### 4. Text & graphics

**Captions** (22 cards, 60 words, 2.7 words/card; card length median 1.07 s, min 0.30 s "It hadn't", max 1.70 s)
- Position: one line, centred, text rows y = 813–834 of 1024 → centre at **80.4 % of frame height**; cap height ≈ 2.1 % of frame height.
  Never 2 lines. 2–4 words per card (4 on "They fired 600 rounds", "Then it was white.", "He's been in therapy").
- Style: bold grotesque sans, white (#FFFFFF) with a dark outline/soft shadow, sentence case, real punctuation. Hard swap, no animation.
- Keyword colour: coral, sampled ≈ #CB8171 through anti-aliasing (looks like ≈ #E8907C). Keywords: cloud, anything, suspicious, police,
  thundered, 600, cried, hour, white, sh*t, almost, innocent, therapy. Two cards are coral in full: `"Shots fired!"` and "threw up.".
  Seven cards have no keyword: "This man saw", "It hadn't", "So he called", `"Well, well (well...)"`, "into the sky.", "One officer", "ever since.".
- Quotes: straight double quotes on character lines. A line split over two cards opens the quote on card 1 and closes it on card 2.
- Profanity: `sh*t` with one asterisk. No sine bleep found in `a16.wav` (17.6–18.0 s is broadband 2–3.4 kHz hiss) → an elongated "sh…" or a
  noise censor; **uncertain**.
- Parenthesis as a caption-only aside: `(well...)`; Whisper heard only two "well"s.
- Captions blink off for exactly 1 frame six times: at four cuts (f148, f281, f314, f671), 2–3 frames before the whip-cut at ≈ f561
  (f558) and on the in-shot whip-tilt (f623). They are absent for the two silent
  stretches (f183–201, f492–515) and the tail (f720–735). They ride over the cuts at f62, f167, f322, f330, f340.

**Charge plate** (one only)
- Text `SUSPICIOUS`, white geometric caps on a flat navy rectangle (#213745), no strings or hanger visible.
- Size/position: rows 238–358, cols 24–544 → 90 % of frame width × 11.7 % of height, centre at **29 % of frame height** (upper third, not the top edge).
- Motion: enters f119 as a vertical smear (drops from above), f120 rotated ≈ −4°, f121 ≈ +2°, level by f123–124 → **settles in 4–5 frames**; slight breathing afterwards.
- Lives f119–146 (28 frames = 0.93 s) and is removed at f147, one frame BEFORE the cut. No strike-through, no replacement, no re-drop.

**Signs / props with text**
- Mailbox name plate: `@outofthisworld_9` (f0–60, f160).
- Patrol car: `POLICE` on front doors; `@outofthisworld_9` on the boot lid and again on the number plate (f186–262, f326, f334).
- Phone back: patterned panel starting `@out…` (f152) — the handle again; rest unreadable.
- Therapist: white pad on a dark clipboard, pen on a cord; the pad is blank (cropped 4× at f735). Bookshelf spines blank.
- No UI inserts, no documents, no annotations (arrows, circles, ✕), no speed-up badge. The TikTok watermark roams (left-middle until f149, bottom-right after).

### 5. Gag mechanics, frame by frame

1. **Sky turns on him (f0–61).** f0–19 normal blue; f20–45 sky grades #9CCEDE → #6C7680 while one small top-centre cloud greys and
   scales up ≈ 4×; pigeons take off f22–30 and are specks by f45; camera rises the whole time. No cut: the mood change is one grade + one scale.
2. **Verdict (f62–147).** Anticipation: tilt down 23 f, eyes open f78, slits f86, 28-frame deadpan hold. Action: snap zoom f114–118.
   Impact: plate f119. Reaction: pointing finger up f119–122 (3 frames, smeared). Hold: 24 frames (f123–146) with everything still.
3. **Phone (f148–166).** Eyes snap from slits to round on the cut. Phone: off-screen f151, smeared f152–154, at the ear f156. Hold 10 frames.
4. **Arrival (f167–206).** Car covers the road in 10 frames, passes the lens f176–182 (wheel ≈ 25 % of frame width at f178), camera whips
   with it, car is stopped and sharp by f186. 6 quiet frames, door f192, officer upright f197.
5. **Thunder → "Shots fired!" (f233–313).** Bolt: 2D yellow zig-zag, white core, 8 frames (f233–240), crawling right under the cloud, no
   frame flash. Officers hold the hands-on-hips stare for 33 frames (f245–278) while the camera pushes in. Whip f279–283; draw f282–286;
   arm locked f290; held 23 frames.
6. **600 rounds (f314–401).** Three flashes: 8 f, 8 f, 10 f. Each has 2 white 8-point sparkles at the muzzle (1–2 frames each, ≈ 2 % of
   frame width), 3–6 gold casings in the air and 1 thin white tracer line. Bodies arch back; no recoil shake of the camera. Then the
   skid (12 f), hop-out (8 f), crane (4 f), wide held only 4 sharp frames (f362–365), whip (3 f), and 33 frames on the cloud while holes
   pop in one at a time (dark ring + lighter bore; tracers still crossing at f372–392).
7. **It cried (f402–453).** f402–406: ≈ 40–50 casings heaped by the shoe, more dropping. Puddle: first seen f407, covers ≈ 60 % of frame
   width by f420 (13 frames), pale blue with two white glints. Rain: first streaks f414, dense by f428, gone on f454 (40 frames). The
   officer never stops aiming up.
8. **White (f454–515).** Tilt through blank sky 7 frames; cloud swings in rotating ≈ 90° and settles f461; grey → white and slate → blue
   over ≈ 30 frames; 3 drips fall f470–492; then 24 frames of nothing but the white cloud, no caption, near-silence.
9. **Hat off (f516–557).** Gun down f519–527 (smeared f525), hand to cap f528, cap off f534–537, cap on chest f540, held 15 frames. Drops
   fall from his chin at f519, f543, f553.
10. **Innocent cloud (f559–622).** 18 frames on officer B, tilt 5 frames, cloud held 34 frames.
11. **Vomit (f623–670).** Walk 8 frames, lunge f633–636 (camera whips with him), bent 90° by f637. Olive arc (#646529) pulses from the
    head into the hedge f639–667; gun still in his hand; colleague's hand goes to his back ≈ f650. Held 31 frames.
12. **Therapy + button (f671–735).** Room readable by f673. Cloud edge enters the window ≈ f686, fully in by ≈ f705. Punch-in f720; head
    jerk f720–723; stare held 12 frames (f724–735) with the camera still creeping in.

### 6. Acting & staging

- **Design:** tall box heads with ink-drawn faces (brow lines, eye outlines, dash mouth, stubble dots), block bodies, no fingers
  except a pointing index. Caller: navy suit, teal lapels, white shirt, red tie. Officers: grey-blue shirt front with gold badge and
  buttons, navy sleeves/back/trousers, peaked cap with gold badge, holster, radio. Therapist: grey hair, round glasses, tan jacket.
- **Faces are swapped, not animated:** caller slits (f86–147) → round eyes (f148+); officer mouth closed (f516) → open (f525–555);
  couch officer eyes shut (f700) → open (f719) → wide (f720+). No per-syllable lip-sync seen.
- **No officer face in close-up before f516.** Until then the foreground officer is shown from behind or with his arms over his
  face; faces are only visible on small background officers (f316, f334). The first close police face arrives with the remorse.
- **Poses:** hands-on-hips stare ×2 (33 frames); two-handed overhead firing with the spine arched back; cap-to-chest; 90° fold over the
  hedge; rigid on the couch with fists at the chest.
- **Eye-lines:** everyone looks up for the whole street section; the cloud is usually out of frame, so heads tipped back sell it.
- **Bystanders/idle life:** caller watches from his fence, then covers his head on the porch during the shooting; a dark car
  is behind the patrol car and is parked nearby in later shots; a third officer walks through the vomit shot; pigeons; leaves on the pavement.
- **Props are held by characters:** phone in the caller's hand, pistols in hands (still gripped while vomiting), cap in hand, pad in
  the therapist's hand. Nothing floats or slides in as an overlay.
- **The offender:** a low-poly cloud mesh with NO face, hands or props. It "acts" only through state changes: scale + colour (grey,
  then white), a lightning sprite, rain, drips, persistent bullet holes, and position (over the car, over the street, in the window).

### 7. FX, light, colour

- **Particles/FX:** lightning sprite (8 f); muzzle sparkles (white 8-point stars, 1–2 f); gold casings (#B58B3A) in the air and heaped;
  white tracer lines (1–3 frames, up to ≈ 40 % of frame height); bullet holes; rain = white vertical streaks of mixed length, motion-smeared;
  spreading flat puddle (#A5D2DF); 3 drips; chin drops; vomit arc. No smoke, fire, dust cloud, debris or explosion.
- **Light changes inside a shot:** sky blue → slate f20–45 (shot 1); slate → blue f461–495 (shot 10). Ground and props darken/lighten with
  it (pavement #E6DEBC sunny vs sidewalk #767062 under the cloud).
- **Police lights:** light bars alternate red (#EE2431) / cyan (#55FFF9) blocks every few frames. **No red/blue wash on the frame.**
- **Palette (sampled):** sunny street — sky #9CCEDE, roof #CA5C49, wall #C1C1B7, door #1B6167, shutters #E1AE39, grass #90B55E.
  Storm — sky #6C7680, cloud #3B4346 → #6A6B6B, road #484F58, tree #40672A. Clear — sky #94C9DB, hedge #53883D, pavement #FEFDDA.
  Therapy — wall #D8C6A2, wainscot #779571, rug #D97758, couch #643428, curtain #BB8D45, floor #805334.
  Suit/uniform navy ≈ #1F2F3F and car cream ≈ #E6E0C8 are by eye.
- **Render look:** flat-shaded low-poly, faint paper/brush grain on every surface, soft contact shadows, no outlines on geometry (ink
  lines only on faces/hair), real motion blur on camera and limb moves, shallow depth of field on whips and on the OTS (f566–583).

### 8. Camera

- **Framings:** low angles dominate (roughly 10 of 14 shots start below eye level, by eye); two high angles (end of #1, wide in #9, therapy room).
  Wide-lens feel: big foreground wheels, legs and heads against small backgrounds.
- **Push-ins (7 of 14):** #2 (creep + snap +36 % in 5 f), #4 (to MCU), #9 (cloud ≈ +35–40 %/s), #10 (≈ +12 %/s), #11 (≈ +40 %/s), #13 (≈ +19 %/s), #14 (slow, after the punch-in).
  Pull-outs/cranes back: #1, #3, wide in #9. Rates are from two-frame comparisons at full-res, ± 5 points.
- **Arrivals:** 6 of 14 shots start in blur and settle in 2–5 frames (#5, #7, #8, #9, #12, #13).
- **Roll:** ≈ 8° on the road horizon at f207–215, ≈ 10–12° in #7, ≈ 5° in #8; cloud rotates ≈ 90° as it swings in at f456–461.
- **Transitions:** 13 in total = 10 hard cuts (3 with moving arrivals, 1 punch-in) + **3 whip-masked cuts** (f281, ≈ f561 through blank
  sky, f671). On top of that, **7 in-shot whip/tilt reframes** (f176–184, f199–206, f360–368, f454–461, f584–588, f623–625, f633–636).
- No shake on gunfire, no handheld jitter, no zoom-blur other than the snap at f114–118.
- Vertical logic: the camera travels ground ↔ sky five times (#1 up, #2 down, #9 up, #10 up, #12 up then down). The 9:16 frame is used as
  a tilt axis between people and the cloud.

### 9. Scale of the escalation

- **Response:** 1 patrol car on the call (f167–176; the dark car behind it is unmarked and may be traffic — uncertain); 2 officers out; a second patrol car skids in (f340–351).
  Wide at f362–365: 2 patrol cars, 4 officers firing upward, caller on the porch. Held 4 sharp frames.
- **"600 rounds":** shown as 3 flash shots (0.87 s), ≈ 6 tracers, casings in every firing frame, a heap of ≈ 40–50 casings at one
  officer's shoe (f402–416), and 12–15 holes in the cloud. The number itself is only spoken and captioned.
- **"For an hour":** one puddle growing in 13 frames + 40 frames of rain, with the officer still firing through it.
- **Aftermath:** cap off, one vomiting officer, therapy "ever since".
- **Impossible, played straight:** bullets leave neat permanent round holes in a cloud (still there through the therapist's window);
  the sky's colour follows the story beat; the cloud cries; nobody questions arresting weather; no falling bullets, no property damage.
- **Missing on purpose:** no arrest, no court, no sentence. The escalation turns inward (guilt) instead of upward (punishment).

### 10. Deviations from the known rules

- **Formula — partly CONFIRMS, ending BREAKS.** Confirmed: "This man saw…", the offender does nothing, "That was <CHARGE>", "So he called
  the police", literal over-reaction, one institution gag, 2-word coda ("ever since."). Broken: the charge is an adjective, not an
  offence; there is no sentence; the offender is cleared ("innocent cloud") and the institution gag (therapy) lands on a police officer.
  New: a three-step relabelling chain where each natural behaviour is narrated as a human act (thundered → "Shots fired!", rain → "cried",
  clearing → "was white"), and a reversal built on colour (dark = suspicious, white = innocent).
- **Lead never speaks / narrator voices all / offender is weather — CONFIRMS.** New: the lead leaves the story after 5.5 s and survives
  only as a background bystander; the police carry acts 2 and 3.
- **Shot rhythm — BREAKS by cuts, CONFIRMS by beats.** Median shot 1.57 s (rule 1.0–1.2); beats median 0.77 s, mean 1.02 s. Action run
  is 0.27–0.33 s per shot (rule 0.4–0.6), and there is only one run.
- **Last frame — BREAKS.** Not frozen: a punch-in plus a head jerk, then a 12-frame held stare with the camera still moving; 16
  frames after the caption (inside the 10–24 frame window, but live). No outro — CONFIRMS.
- **Push-ins — BREAKS the share, exceeds the rate.** 7 of 14 shots push in (50 % vs 79 %), 3 pull back; rates +12 to +40 %/s (rule
  median +11 %/s). Fast arrivals 43 % (rule 27 %). Roll 5–12° — upper end of the rule. Motion blur on fast moves — CONFIRMS.
- **Charge plate — partly BREAKS.** Navy, drops on the charge word, swings — CONFIRMS. But: centre at 29 % height (not top edge), 90 %
  wide, no hanger, settles in 4–5 frames (rule 6–8), removed 1 frame before the cut, never repeated.
- **Captions — CONFIRMS** (white, outlined, 2–4 words, 80.4 % height, coral keyword, hard swap, quotes for speech). Differences: always
  1 line; 7 of 22 cards have no keyword; 2 cards are coral in full; censoring is `sh*t`; no em-dash interruption; new parenthetical
  aside; 1-frame caption blink at six shot changes.
- **Phone — BREAKS.** It is a hand-held prop whipped to the ear in 4 frames; no slide-up, no full-frame UI, no pause-bait prop, no red
  annotations. Branding sits on the mailbox, the car boot, the number plate and the phone back instead.
- **Police FX — BREAKS.** No strobe wash; light bars only. Muzzle = tiny white sparkles + casings (CONFIRMS) + tracer lines (new). No dust-brawl cloud.
- **Not on the list:** whip-masked cuts and in-shot whip reframes as the main editing device; sky colour as a story state; silence +
  caption-less hold before the reveal line; a background callback in the final set; punch-in as the closing button.

### 11. Steal list

1. **Reframe instead of cutting.** For a cause-and-effect chain (arrive → step out → stare), keep one shot and whip-reframe for 4–8
   blurred frames between beats; aim for a new picture every ≈ 0.8–1.0 s without a cut.
2. **Whip-masked scene change.** Pan/tilt out for 2–3 blurred frames, cut, and start the next shot already blurred for 2 frames; settle by
   frame 3–5. Blank sky works as the wipe when the offender lives overhead.
3. **Snap zoom into the plate.** Creep for ≈ 1 s, punch in ≈ +35 % over 5 frames, drop the plate on the very next frame, hold everything
   still for 24 frames, and remove the plate 1 frame before the cut.
4. **Let the object act through state, not a face.** Give a weather/object offender 4–5 visible states (scale, colour, a sprite, a
   particle system, damage) and narrate each as a human verb.
5. **Grade the sky inside the shot.** Lerp sky, ambient and ground colour over ≈ 25–30 frames on the mood turn; send a few birds off the
   roof in the same window.
6. **Gunfire in three flashes.** Three shots of 8–10 frames, a different officer and angle each time, each with 1–2 frame white
   sparkles, 3–6 casings and one tracer line; follow with a 4-frame wide that proves the head-count.
7. **Show the number as residue.** After the burst, open the next shot on the ground: a heap of 40–50 casings by a shoe, then the next
   consequence (puddle) growing over 13 frames in the same framing.
8. **Silence before the turn.** Hold the revealed image for ≈ 24 frames with no caption and no voice, then cut to the reaction line.
9. **Withhold close-up faces during the aggression.** Stage the foreground aggressor from behind or behind raised arms; give the first
   close face to the moment of regret.
10. **Run the vertical axis.** In 9:16, link people and a sky offender with tilts (ground → body → sky in one move) rather than cutting
    between them.
11. **Background callback + punch-in button.** Put the surviving offender small in the last set (enter ≈ 0.5 s after the shot starts),
    never mention it, then end on a +20 % punch-in and a 3-frame head jerk held ≈ 12 frames.
12. **Brand inside the world.** Put the handle on 3–4 diegetic surfaces (mailbox plate, number plate, boot lid, phone back) at a size
    that only reads on pause.
