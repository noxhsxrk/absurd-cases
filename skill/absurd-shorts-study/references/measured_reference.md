# กฎที่วัดจากคลิปต้นฉบับ (สรุป §0 + Appendix A1–A8) และที่อยู่ของงาน

ย้ายมาจาก SKILL.md แบบคำต่อคำเมื่อ 2026-11-16 (ไม่ได้แก้เนื้อหา) — ถ้าไฟล์นี้ขัดกับ `SKILL.md` ให้ยึด `SKILL.md`; ไฟล์นี้คือรายละเอียด เหตุผล และประวัติของกฎ

**ไฟล์ประวัติ ไม่ต้องอ่านระหว่างทำตอน ถูกทับแล้วในไฟล์นี้**: "ตอนแรกคือแม่แบบ ก๊อปโครงจากมัน" → แม่แบบคือตอนล่าสุด · "สูตรตำรวจเป็นทางเลือกหนึ่ง" → สูตรตำรวจเท่านั้น · ตัวเลขจังหวะ ความยาว และ "ไม่มีเพลง" ของต้นฉบับ → ค่าของเราใน `SKILL.md` · จอโทร 191 แบบ 2D และ phone MCU → เลิกใช้

ใช้เมื่ออยากรู้ว่าต้นฉบับทำอย่างไรหรือกฎมาจากไหน ตัวเลขจังหวะของต้นฉบับเร็วกว่าของเรา: ของเราดูใน `SKILL.md`

## ที่อยู่ของงาน (ย่อหน้าเปิดของ SKILL.md เดิม)

# absurd-shorts — workflow ตั้งแต่ศูนย์ถึงไฟล์ส่ง

เป้าหมาย: คลิป absurd ผู้บรรยายคนเดียวแนว "ชายคนนี้ … นั่นคือ[ข้อหา] เขาเลยโทรแจ้งตำรวจ" (สูตรตำรวจเท่านั้น ดู §0) ยาว ≤ 30 วิ (Nox 2026-11-12, EP12–14; ตอนพิเศษยาวได้เมื่อ Nox สั่ง), 1080×1920 @ 30 fps, ผู้บรรยายคนเดียว, ตัวละคร low-poly ออริจินัล
Repo: `absurd-cases` (Remotion 4 + @remotion/three, kit ใน `src/pov/`, ตอนละโฟลเดอร์ `src/episodes/AbsurdEpN/` + `episodes/absurd-cases/epN_*`). **ทุกอย่างของซีรีส์อยู่ที่เดียวบน PC ของ Nox: `C:\Claude\absurd-cases`** (git checkout ของ `github.com/noxhsxrk/absurd-cases` ซึ่งเป็น public, branch main, author noxhsxrk) — Remotion + `node_modules` (pnpm), `public/rb` mocap, `public/absurd-cases/epN/` (พากย์/มิกซ์/sfx_ai), `tools/ai-sfx/` (Stable Audio Open + Whisper, AudioLDM2 รุ่นเก่า พร้อม `.venv` torch cu124 และ take ทั้งหมด `out*/`), `tools/tts/`, `tools/sfx_library/` (index เสียง §5), `blender/queue/` (คิวสำรอง §6), `out/` คลิปที่เรนเดอร์แล้ว. โฟลเดอร์เก่า `C:\Claude\pov-story` / `C:\Claude\ai-sfx` / `C:\Claude\blender` เลิกใช้กับซีรีส์นี้ (ย้ายด้วย `tools/migrate_from_old_folders.bat` เมื่อ 2026-11-09). **Claude ทำงานผ่าน Claude Code บนเครื่องนี้โดยตรง** (cwd = `C:\Claude\absurd-cases`, RTX 4070 SUPER): รันคำสั่งเองได้เลย (pnpm, Python ใน `tools/ai-sfx/.venv`, ffmpeg) — ไม่ต้องใช้ computer use และไม่ต้องย้ายไฟล์ข้ามเครื่อง (§6). ตอนแรก (ยุงทำร้ายร่างกาย) คือแม่แบบ ก๊อปโครงจากมันได้เลย

References (ใน repo absurd-cases `skill/absurd-shorts-study/references/`): `ref6_story_visual_production.md` (6 คลิป อ่านทุกเฟรม 2026-11-12: เล่าเรื่อง / ภาพ / production — ชนะ ref8 และ ref16 เมื่อขัดกัน) + `ref6_clips/` (โน้ตรายคลิป: shot list เลขเฟรม จังหวะมุก ข้อความบนของประกอบ), `ref8_visual_animation_notes.md` (กล้อง/แอนิเมชัน/ป้าย/FX วัดทุกเฟรมจาก 8 คลิปใหม่ — ถ้าขัดกับ ref16 ให้ยึด ref8), `ref16_shot_notes.md` (ช็อตต่อช็อตพร้อมเลขเฟรม), `ref16_transcripts.md` + `ref16_words.json` (Whisper), contact sheets และเฟรมเต็ม (ป้าย/UI/annotation/mugshot)

---

## 0. กฎที่วัดมาจากต้นฉบับ (สรุป — รายละเอียดเต็มใน Appendix ท้ายไฟล์)
- **⚠⚠ ref6 (6 คลิป อ่านทุกเฟรม 2026-11-12) — ชนะกฎเก่าทุกข้อที่ขัดกัน** รายละเอียด: §1-R (เล่าเรื่อง), §4d (ภาพ + production), `references/ref6_story_visual_production.md`. หัวใจ 7 ข้อ:
  1. สูตร "ชายคนนี้ → ข้อหา → โทร" คือ 3–6 วิแรก ไม่ใช่ทั้งตอน ที่เหลือคือการเร่งหรือหักมุม (เลือกโครงจากเมนู §1-R)
  2. ช่วงตอบโต้เกินเหตุกิน ~1/3 ของคลิป และเวอร์เกินความจริงได้เต็มที่ (หรือเล็กจนขำ: "ส่งสองนายที่ดีที่สุด")
  3. ผู้ต้องหาที่เป็นธรรมชาติ/สิ่งของ **ไม่มีหน้า** แสดงผ่านของประกอบ ป้ายห้อย สี และช็อตมุมมองของมันเอง
  4. ความแน่นอยู่ในช็อต (3–4 เหตุการณ์/ช็อต ลงคำเน้น ±1 เฟรม) และใช้สะบัดกล้อง/ซูมเป็นขั้นแทนการตัด
  5. มีจังหวะภาพเงียบไม่มีซับ 5–7 จุดต่อคลิป ให้ผลของมุกค้าง
  6. มุกปิดมี 6 แบบ ห้ามซ้ำแบบเดียวกับ 2 ตอนก่อน; ตอนจบไม่จำเป็นต้องค้างเฟรมนิ่ง
  7. ป้ายข้อหา/ป้ายโทษเป็นของในฉาก (ขีดฆ่า ชนตก ซ้อน พลิก) ไม่ใช่กราฟิกลอย
- **⚠ จังหวะของซีรีส์เรา (Nox 2026-11-12: คลิป ≤ 30 วิ — ทับค่า EP9 ของ 2026-11-09 และชนะตัวเลขจังหวะจากต้นฉบับทุกข้อด้านล่าง)**: ตอนพิเศษยาวได้เมื่อ Nox สั่ง; ความชัดยังสำคัญกว่าความเร็ว คนดูต้องอ่านซับทันและเข้าใจทุกฉาก
  - พากย์: กระชับ ~25 วิ; สั่ง Fenrir อ่านไม่เร่ง หยุดที่ลูกน้ำ ~0.5 วิ ระหว่างประโยค ~1 วิ (ช่วงแอ็กชันก็ไม่เร่ง ให้พลังอยู่ที่น้ำเสียง) — ช่องหยุดยาวช่วยหาจุดตัด (§2) แล้ว `tighten_take.py` บีบเหลือค่าด้านล่าง
  - ตัดเสียง: ช่องในประโยค 0.15–0.25 วิ (`tighten_take.py … 0.2`), gap ระหว่างบรรทัด 0.2–0.4 วิ และ **เปิดช่องให้ภาพเล่า** 0.4–1.3 วิ (3–7 จุด §1-R) หลังบรรทัดที่มีแอ็กชันต้องดู หรือก่อนประโยคเฉลย — ใส่ใน `epN_gaps.txt`; split แบบ `[a, b, gap]` บังคับช่องเงียบระหว่างการ์ดได้. ค่า EP9 (0.32 / gap 0.4 / ช่อง 0.6–1.8 วิ / คลิป 44 วิ) เลิกใช้
  - ภาพ: 1 ช็อต = 1 แอ็กชันที่อธิบายตัวเองได้ (ใครทำอะไรกับใคร) ค้างจนอ่านออก, ASL ~1.1–1.5 วิ, ช็อต ≤ 3.5 วิ; ความแน่นอยู่ในช็อต (§4d) ไม่ใช่มอนทาจรัว 0.4 วิ; มุกที่อาศัยของ/กระจกต้องจัดกล้องให้เห็นทั้งสองฝั่งของมุก (คนทำ + ผลลัพธ์) ไม่ให้ตัวละครบังเลนส์
  - เพิ่มฉากที่อยากให้เห็น = เพิ่มบทพากย์ให้ฉากนั้นด้วย (ฉากเงียบนานคนดูหลุด)
  - มุกปิดที่ได้ผล: วนกลับไปต้นเรื่อง + ประโยคถูกตัดกลางคำ ("เขาเลยโทรแจ้งตำ—") เงียบ ~0.35 วิ แล้วตัดจบ
  - **ช็อตแรก = ตัวเอกเต็มตา** (Nox EP10): "ชายคนนี้ …" ต้องเป็น MCU เห็นหน้า + สิ่งที่เขาทำ (ถือมือถือ แปรงฟัน) อย่าพยายามยัดผู้ต้องหาเข้าเฟรมเดียวกันจนคนเหลือขอบเฟรม — ผู้ต้องหาเปิดตัวช็อตถัดไป
- **แนวเรื่อง (Nox 2026-11-09): สูตรตำรวจเท่านั้น** — เคยเปิดให้ลอง absurd แนวอื่นที่ไม่มีตำรวจ (หน่วยงานประหลาด ราชการ บริษัท นิติบุคคล ฯลฯ) Nox ลองแล้วไม่ตลก → กลับมาสูตร "เขาเลยโทรแจ้งตำรวจ" อย่าเสนอแนวไม่มีตำรวจเอง ความหลากหลายให้มาจากเมนูโครงเรื่อง §1-R (เปลี่ยนผู้รับสาย, ผู้ต้องสงสัยผิดตัว, กลับบทบาท, ภาคต่อ …) ซึ่งยังมีการโทรแจ้งอยู่; สิ่งที่คงไว้: ผู้บรรยายคนเดียวเล่าแบบ deadpan, โลกตอบสนองแบบจริงจังเกินเหตุ, มุกปิดสั้น
- **สูตรตำรวจ**: `ชายคนนี้ <กำลังทำเรื่องธรรมดา>` → ธรรมชาติ/สิ่งของทำสิ่งที่มันทำอยู่แล้ว → `นั่นคือ[ข้อหาทางกฎหมายจริง]` → `เขาเลยโทรแจ้งตำรวจ` → ตำรวจ/หน่วยพิเศษทำตามตัวอักษรแบบเกินจริง → มุกสถาบัน 1 อย่าง (สอบสวน/ชี้ตัว/ศาล/คุก/โรงพยาบาล/บำบัด) → โทษ + มุกปิด 2–5 คำ (pun / callback / ผลลัพธ์แห้งๆ) เขียนย้อนจากมุกปิด ผู้ต้องหาเป็นสิ่งไม่มีชีวิตหรือสัตว์เสมอ ได้รับโทษแบบมนุษย์และ "ชีวิตหลังคดี" แบบมนุษย์ ตัวเอกไม่พูด ผู้บรรยายพูดแทนทุกคน ทุกตอนปลูก hook ให้ตอนอื่นมาเก็บ (จักรวาลเดียวกัน)
- **จังหวะ (ค่าของต้นฉบับ — ใช้อ้างอิงเท่านั้น ของเราช้ากว่า ดูข้อ ⚠ ด้านบน)**: 48–73 คำ/4–14 ประโยค พากย์คลุม ≥ 85–95 % ของคลิป ช็อตมัธยฐาน 1.0–1.2 วิ (ช่วงบุก/ตี 0.4–0.6 วิ) ช็อตแรก 0.7–2.8 วิ ไม่ต้องยาวสุด แต่เหตุการณ์ hook ต้องเกิดใน 0.8 วิแรก ช็อตท้ายค้าง 1.5–3 วิ (เฟรมสุดท้ายนิ่ง 10–24 เฟรม) แล้วจบ ไม่มี outro ตัดแข็งเป็นหลัก แต่ ~11 % ของคัตเชื่อมด้วย whip เบลอ / วัตถุพุ่งผ่านเลนส์ / ทะลุเมฆ **ทุกเฟรมต้องขยับ** ไม่มีเฟรมนิ่งเลยนอกจากท้ายคลิป (รายละเอียดใน §4b, ตัวละคร §4c)
- **กล้อง**: กล้องไม่เคยนิ่ง: 79 % ของช็อต push-in มัธยฐาน +11 %/วิ (4–24 %/วิ) เห็นชัด ไม่ใช่ช้า; 27 % ของช็อตเปิดด้วยกล้อง "ร่อนลงจอด" (เคลื่อนเร็วแล้ว ease-out หยุดใน 4–6 เฟรม); roll เอียง 2–10° ระหว่างช็อตได้; เลนส์กว้างจ่อหน้าเกือบชนเลนส์, low angle ตำรวจ; motion blur ทุกการเคลื่อนเร็ว; MCU ระดับสายตา, ช็อตโทร **ไม่บังคับแล้ว** (Nox EP16: "phone MCU + UI เต็มจอ ไม่ต้องแล้วนะ" — การโทรแจ้งยังต้องมีในเรื่อง แต่จะเล่าในช็อตอื่นหรือด้วยเสียงพากย์อย่างเดียวก็ได้); ถ้าทำ ให้เป็นโทรศัพท์ 3D เลื่อนขึ้นจากขอบล่าง (~5 เฟรม) ไม่มีจอ 2D เต็มจอ, ช็อต scale (ผู้ต้องหาใหญ่ คนจิ๋ว), สถาบันถ่ายหน้าตรงสมมาตร, top-down สำหรับ reveal, ECU ของประกอบ 0.5–1 วิ
- **ภาพ**: พาเลตต์ผูกกับสถานที่ ไม่ใช่ชุดเดียวทั้งซีรีส์ (กลางคืนในบ้าน value ≈ 0.33 กรมท่า/ถ่าน + ไฟอุ่น, ห้องน้ำชมพู, ทะเลเขียวอมฟ้า + เหลืองดวงอาทิตย์, ชานเมืองฟ้า/เขียว) saturation เฉลี่ยต่อคลิป 0.19–0.39, grain กระดาษ, เงานุ่ม; **แสงคือแอนิเมชัน**: ไฟไซเรนแดง/น้ำเงินอาบทั้งเฟรมสลับทุก 3–5 เฟรม, ไฟกะพริบ, ลำแสงจากหน้าต่าง, ไฟฉาย; **หน้า = ลายเส้นหมึกวาดมือ** บนหัวกล่อง (เส้นขอบหัวสีดำ, ผมขีดเส้น, ตอหนวดจุด, แก้มแรเงา) สลับสีหน้า (กะพริบตา 2–3 เฟรม, อ้าปากตอนมีบทพูด); เอฟเฟกต์มี particle ได้และใช้บ่อย (ปลอกกระสุนทอง, เศษชิ้นส่วน, ดาว 4 แฉก, ควันพัฟ, โน้ต ♪, หยดน้ำ, ไอน้ำ) + glow ตอนฟ้าผ่า/ไฟฟ้า — ดูสูตรใน §4b
- **ตัวหนังสือ**: ซับขาวขอบดำ ≤ 2 บรรทัด 2–5 คำ/การ์ด ตัดแข็ง คีย์เวิร์ดสีปะการัง `#F08A6E` 1 คำ/การ์ด; ป้ายข้อหา = ป้ายกรมท่าห้อยแขวน กลางบนของเฟรม (ขอบบน 8–20 % ของความสูง กว้าง 65–75 %) หล่นจากนอกเฟรม เบลอ 1 เฟรม แกว่ง overshoot นิ่งใน 6–8 เฟรม แล้วแกว่งเบาๆ ต่อ **ลงตรงคำข้อหา (±3 เฟรม)** ~0.3–0.5 วิหลังขึ้นช็อต; หล่นซ้ำเมื่อตัวละครพูดซ้ำ/ปฏิเสธข้อหา ข้อหาใหม่ = ป้ายใหม่; ของประกอบแบบหยุดดู (pause-bait) = ใบประกาศ/เว็บไซต์ที่มีมุกในทุกช่องข้อมูล; ประโยคถูกตัดจบด้วย em dash ("เขาเลยโทรแจ้งตำ—") + เงียบสนิท ~0.3 วิ; คำหยาบเขียน `f***` + เสียงบี๊บ; ป้ายโทษ ("20 YEARS") เป็นป้ายจริงในฉากคุก; annotation สีแดง (กรอบประ + ✕ + ป้าย); UI ปลอมเต็มจอ (ต้นฉบับมีจอโทร 191 ด้วย — ของเราเลิกใช้จอโทร 2D ตั้งแต่ EP16; เครื่องเป่า, หน้า YouTube); ชื่อแอคเคานต์ฝังในฉาก (ป้าย/แฟ้ม/ถนน) ไม่ใช่โลโก้มุมจอ
- **เสียง**: −15 ถึง −16 LUFS, LRA 2–3 (ref16 วัดได้ 4–5), peak ≈ −2 dB พากย์แห้ง ใกล้ ≈ −24 dBFS ไม่มีเพลงที่ได้ยินชัด (ของต้นฉบับ — ของเรามี BGM เบาๆ ทุกตอน §5) (ref8 พบโทน A–C♯–E นิ่งๆ ในช่วงเงียบ 7/8 คลิป น่าจะเป็น pad เบามาก ~−30 dB ใต้เสียงพากย์ ยังไม่ได้ฟังยืนยัน) พื้นช่วงเงียบ −32 ถึง −40 dBFS SFX ลงตรงคัต 75–90 % ของคัต sting โทนเสียงเป็นของหายาก (1–2 ครั้งทั้งคลิป)

# Appendix — the measured reference rules in full (16 clips, 241 shots)

Measured on 576×1024 @ 30 fps clips, 16–29 s story (one 65 s special), then a 3.6 s TikTok end card that is **not** the creator's (download watermark outro — never copy it).

## A1. Story formula of the reference channel (the police format — one option, not a rule for every episode)

```
0.0 s  "This man was <ordinary activity>."            ← frame 0 is already mid-action, no logo, no title
       <nature / object does what it naturally does>   ← the "crime"
       "That was <CHARGE>."  or
       "He informed the <offender> that this was <CHARGE> and called the police."
       police / Coast Guard / SWAT / FBI obey LITERALLY and over-react (12 officers, helicopter, warships)
       one institution gag: arrest → interrogation / line-up / court / prison / hospital / AA / community service
       sentence + a 2–5 word coda that is a pun, a callback, or a dry consequence ("Still there." / "Next door." / "The glass cost extra.")
```

- 4–14 sentences, 48–73 words (≈ 180–220 wpm English). Narration covers ~95 % of the runtime; the only silences are comedic beats before a punchline (r14: 10 frames of no caption before "Still there.").
- Short, past-tense, deadpan. Swearing allowed once ("beat the shit out of it"). The lead NEVER speaks; the narrator voices other people's lines ("Pull over." / "You have the right to remain silent." / "Hello.").
- The offender is always inanimate or animal (tsunami, sun, cloud, moon, car, canyon, coconut, black hole, volcano, tornado, lion, pigeon, ant). Charges are real legal terms used literally: assault, attempted murder, trespassing, stalking, negligence, false imprisonment, arson, copyright infringement, DUI, attempted kidnapping.
- Objects receive HUMAN punishments and human life afterwards (prison tally, AA on Tuesdays, YouTube channel, visiting hours, community service, homeless with a sign).
- **Shared universe**: the tornado "20 years, out in five with good behaviour" (r03) → released "to make room" (r12) → full prequel + "Next door." (r15). The black hole's YouTube page lists "Local Man Calls Police on Literally Everything" and "Prison Escape Tutorial: Magnifying Glass Only" (sun, r07). Every episode should plant one hook another episode can pay off.
- Build the episode BACKWARDS from the pun ("number three cracked and spilled everything", "going through a phase", "justice for black cars").

## A2. Cutting rhythm

- 241 shots measured: median **1.2 s**, mean 1.5 s, p10 0.4 s, p90 2.6 s. Older clips 1.5–2.2 s median; newest (r13–r16) 0.8–1.2 s. Beatings / arrivals accelerate to 0.4–0.6 s shots.
- One hard cut per new sentence-fragment is the rule; inside a shot the camera does ONE thing: slow push-in, slow orbit, or static.
- (ref16) Opening shot is the longest (2–5 s) so the hook sentence lands — ref8 contradicts: newer clips open with 0.7–2.8 s shots and put the hook event inside 0.8 s, see A7; last shot holds 1.5–2 s after the final word and the clip just ends (no outro of their own).
- Transitions are hard cuts, with three exceptions: (a) a street-lamp bloom that balloons to white over 5 frames before the cut (r14 turn), (b) top-down "whip" shots of the car drifting (22 frames), (c) a 0.5 s b/w live-action meme insert as a jump-scare laugh (r14).
- r01 is the counter-example: one 22 s take with continuous camera travel, cuts replaced by camera moves. Use it for "surreal gag" episodes without police.

## A3. Camera grammar

- Eye-level MCU for the lead (head fills ~1/4 of frame); the "informed X … and called the police" beat is ALWAYS phone-to-ear MCU with a slow push-in.
- The offender gets a scale shot: tiny man vs. huge wave / sun / cloud / volcano (extreme wide, man ≤ 1/8 frame height).
- Institutions are flat, frontal, symmetric: cell with number plate and "N YEARS" sign, courtroom with red carpet + cream pillars, line-up wall with height marks, interrogation table under one lamp. Same sets are reused across episodes (cell block 18/19/20, courtroom, suburbia, beach).
- Top-down shots for reveals (flat man on floor, island ring of boats, car turn).
- ECU inserts (≈ 0.5–1 s) carry jokes: wrinkle texture, coin in a wing, slot reels, cell door bolt, record folder, pain checklist.

## A4. Look

- Palette per frame ≤ 4 colours: cream `#E6E7CF`, navy `#152028`, teal `#476F66`, tan `#C9BA9B`, brick/red accent, mean saturation 0.31. Flat Lambert, soft paper-grain texture on every surface, soft single-direction shadow, grey-blue sky. (ref8: palette is per location, sat 0.19–0.39; heads carry hand-drawn ink outlines; lighting is animated — see A7.)
- Lead: navy suit, red tie, white shirt, tall box head, tiny dot eyes, stubble texture; a rare tan suit when lit by fire. Police: teal shirt + navy cap, gold dot badge; SWAT: all navy + "SWAT" on back; FBI: navy jacket, yellow "FBI". Judge: white wig + glasses. No real insignia, no brands.
- Props do the acting: paper with big legible text (YOUR RIGHTS, PAIN? YES ☑ NO ☐, RECORD, FINE $500, COURT FILING, EVIDENCE bags, CASE 003: COCONUT), signs (WET FLOOR, INTERNATIONAL WATERS, SPARE CHANGE?, EXOTIC PET FAIR), giant handcuffs scaled to the offender (wave, sun, volcano crater, car wheels, funnel).
- FX vocabulary is geometric: flames = 2-colour flat polygons, smoke = grey low-poly blobs, lava = orange tubes, rain = thin white diagonal streaks + puddle disc, glass = teal flakes, muzzle flash = white dots, echo = one thin expanding ring (15 frames), light rays = straight white lines, melting = yellow drips, tyre smoke = puffs, sparkle = 4-point star. (ref8: low-poly/sprite particles and electric glow are common — shell casings, debris, stars, soot, steam; see A7.)
- Fake UI inserts, full-frame, flat-illustrated: phone "CALLING POLICE" shield, 911 EMERGENCY call button, speed camera "60 km/h / TRAFFIC CAMERA / 014", breathalyzer "NO BREATH DETECTED", YouTube channel page, heart monitor STABLE 72.
- Diagram annotations in RED: dashed outline + ✕ + label ("MISSING", "FORGOT!") drawn over the thing that is absent/wrong.
- Branding is diegetic: "@outofthisworld_9" painted on the road, on the exhibit board, on the mugshot card (with a date). Do this with your own handle instead of a corner logo.

## A5. Text

- Captions: bold rounded sans, white, dark outline, ≤ 2 lines, 2–5 words per card, centred at ~80 % frame height, hard swap (no pop), one keyword per card in coral `#F08A6E` (the noun or verb that carries the joke).
- Title plate for the charge: a small 3D navy sign IN the scene (tilted with perspective, cream caps, thin font), placed next to the accused (above the sun, beside the cloud, on the car roof). It appears on the shouting gesture ≈ 1–1.5 s BEFORE the charge is spoken and stays through the "called the police" beat. (ref8 newer convention, now the default: hanging plate top-centre, drops in ON the charge word — see A7.)
- Sentence signs ("10 YEARS", "20 YEARS", cell numbers) are physical plates in the cell set, not overlays.

## A6. Sound (all 16 clips: −15 LUFS integrated, LRA 4–5 LU, true-peak ≈ −1 dB)

- Narration is the mix: dry, close, compressed, ≈ −24 dBFS RMS, no reverb, 1 voice. Everything else sits ≥ 15–20 dB under it.
- **No music bed.** Scene ambience only (surf, wind, traffic, office hum) at ≈ −40 dBFS, starting on the cut and often fading under the next shot.
- Spot SFX land ON the cut (60–75 % of cuts have an onset within ±150 ms): whoosh/impact for arrivals, handcuff ratchet, gavel, door bolt, car door, siren swell under "called the police", helicopter / jet fly-by as a broadband rise, water splash, coconut thud.
- Only two tonal cues in 16 clips: a bass sting under the meme insert (r14) and a short buzz under the ankle monitor. Treat stings as rare punctuation, not a bed.
- Audio ends with the last spoken word + the ambience tail; the end card has TikTok's own sound.

## A7. ref8 updates (8 newer clips, every frame, 9,150 frames) — wins over A1–A6 where they conflict
- Rhythm: median shot 1.0 s (0.83–1.45 per clip); first shot 0.7–2.8 s; last story frame frozen 10–24 f; apart from that every frame moves (animated on 1s). 60–66 s specials exist (chaptered: crime → sentence → escape → manhunt → coda) and reuse whole shots from earlier episodes.
- Camera: 79 % of shots push in, median +11 %/s (IQR 4–24); 13 % pull out; 27 % open with a fast arrival that settles in 4–6 f (ease-out); zoom profiles ease-out 105 / linear 64 / ease-in 52; roll drift 2–10°; very wide close-ups; calm shots are perfectly smooth (no handheld jitter); earthquake = per-frame jitter.
- Motion blur on all fast motion; 25/229 cuts bridged by blurred whips; non-cut wipes: fly-through cloud, foreground dust cloud pass; 1 white frame on lightning.
- Charge plate: hanging navy sign, top-centre (top edge 8–20 %, width 65–75 %), drops from above with 1 blurred frame, swings and settles in 6–8 f, keeps a small sway; lands on the charge word ±0.1 s; re-drops when a character repeats or negates the charge; escalation = new plate.
- Look: per-location palette; night interiors value ≈ 0.33; police strobe red/blue every 3–5 f washes the whole frame; fridge-light flicker; window god-rays. Heads = box with hand-drawn ink face texture (black edge lines, hatched hair, stubble dots, hatched blush), blinks 2–3 f, mouth-open only on quoted lines; contrast character in a different render style as a gag. Constant mocap acting + prop secondary actions; object offenders grow body parts (water tendril through bars).
- Character motion: gesture raise 5–6 f with overshoot → moving hold 8–12 f → drop 3–4 f with blur; fast moves 2–4 f with 1–2 blurred frames; contacts land exactly and the touched thing reacts for 3–4 f; falling objects accelerate (gravity) then impact + dust; fingers move with per-finger phase offsets; hands are articulated (point, grip, claw).
- FX: muzzle stars 1–2 f + brass casings raining into the next shot; lightning build 3 f → white 1 f → blue glow/arcs 6–8 f → soot + state change; dust-brawl cloud with stars, swoosh arcs, sign letters smashed off; ♪ notes for innocent whistling; water drops, steam, debris; public-domain b/w film composited into a 3D doorway with flicker.
- Inserts: phone is a 3D prop sliding up from the bottom (~5 f), finger presses the red button → "CALL ENDED"; BREAKING NEWS + LIVE lower third; wanted web page with moving mouse cursor; jet HUD crosshair; pause-bait props where every field is a joke.
- Captions: small (cap height ≈ 2.5 % of frame), ~76–80 % height; quotes for character speech; interrupted line ends with an em dash over ~0.3 s digital silence; profanity as f*** + ~1.8 kHz bleep.
- Sound: −15.7 to −16.3 LUFS, LRA 2.0–2.9, sample peak ≈ −2 dBFS, pause floor −32 to −36 dBFS, 75–91 % of cuts have an onset within ±150 ms; stable 441/554/657 Hz peaks in quiet frames of 7/8 clips suggest a very faint A-major pad (unverified by ear).

## A8. ref6 updates (6 clips, every frame, 2026-11-12) — wins over A1–A7 where they conflict
Full text: `references/ref6_story_visual_production.md`; Thai working rules: §1-R and §4d. Corrections to the numbers above:
- A1/A7 formula: the fixed three sentences are the first 3–6 s; the rest follows one of eight story shapes; closers are of six kinds; quoted character lines exist.
- A2/A7 rhythm: median shot 0.77–1.57 s per clip; density is inside shots; whip reframes and step-zooms replace cuts; 5–7 silent picture beats per clip.
- A7 ending: 5 of 6 clips do not freeze the last frame.
- A3/A7 camera: push-ins 41–61 % of shots (not 79 %), +12–25 %/s where used; roll to 15–25° in action.
- A5/A7 plate: ≈ 90 % of frame width, top at 19–29 %, no rope, settles in 4–8 frames, can be a prop; the sentence is a flip-board in the set.
- A5/A7 captions: 1–7 words following the voice phrase; the coral keyword is optional.
- A4/A7 offenders: weather and objects have no face in any of the six clips.
