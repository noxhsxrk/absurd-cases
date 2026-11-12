---
name: "absurd-shorts-study"
description: "End-to-end workflow + design rules for Thai absurd narrator shorts (e.g. 'ชายคนนี้…โทรแจ้งตำรวจ' and other absurd formats; low-poly 3D, 9:16; three.js/Remotion in the absurd-cases repo, Stable Audio Open foley with a reusable SFX index, run via Claude Code on Nox's PC): script → Fenrir voice → plan → shots → SFX → mix → render → QA → cleanup. Use for any new or fixed episode."
---

# absurd-shorts — workflow ตั้งแต่ศูนย์ถึงไฟล์ส่ง

เป้าหมาย: คลิป absurd ผู้บรรยายคนเดียว (แนวที่ทำมาแล้วคือ "ชายคนนี้ … นั่นคือ[ข้อหา] เขาเลยโทรแจ้งตำรวจ" แต่ไม่จำกัดแค่แนวนี้ ดู §0) ยาวเท่าที่เรื่องต้องการ (EP9 = 44 วิ, Nox อนุมัติ) ไม่บีบให้ ≤ 30 วิ, 1080×1920 @ 30 fps, ผู้บรรยายคนเดียว, ตัวละคร low-poly ออริจินัล
Repo: `absurd-cases` (Remotion 4 + @remotion/three, kit ใน `src/pov/`, ตอนละโฟลเดอร์ `src/episodes/AbsurdEpN/` + `episodes/absurd-cases/epN_*`). **ทุกอย่างของซีรีส์อยู่ที่เดียวบน PC ของ Nox: `C:\Claude\absurd-cases`** (git checkout ของ `github.com/noxhsxrk/absurd-cases` ซึ่งเป็น public, branch main, author noxhsxrk) — Remotion + `node_modules` (pnpm), `public/rb` mocap, `public/absurd-cases/epN/` (พากย์/มิกซ์/sfx_ai), `tools/ai-sfx/` (AudioLDM2 + Whisper พร้อม `.venv` torch cu124 และ take ทั้งหมด `out*/`), `tools/tts/`, `tools/sfx_library/` (index เสียง §5), `blender/queue/` (คิวสำรอง §6), `out/` คลิปที่เรนเดอร์แล้ว. โฟลเดอร์เก่า `C:\Claude\pov-story` / `C:\Claude\ai-sfx` / `C:\Claude\blender` เลิกใช้กับซีรีส์นี้ (ย้ายด้วย `tools/migrate_from_old_folders.bat` เมื่อ 2026-11-09). **Claude ทำงานผ่าน Claude Code บนเครื่องนี้โดยตรง** (cwd = `C:\Claude\absurd-cases`, RTX 4070 SUPER): รันคำสั่งเองได้เลย (pnpm, Python ใน `tools/ai-sfx/.venv`, ffmpeg) — ไม่ต้องใช้ computer use และไม่ต้องย้ายไฟล์ข้ามเครื่อง (§6). ตอนแรก (ยุงทำร้ายร่างกาย) คือแม่แบบ ก๊อปโครงจากมันได้เลย

## 0. กฎที่วัดมาจากต้นฉบับ (สรุป — รายละเอียดเต็มใน Appendix ท้ายไฟล์)
- **⚠ จังหวะของซีรีส์เรา (Nox 2026-11-09, EP9 "pace นี้กำลังดี") — ชนะตัวเลขจังหวะจากต้นฉบับทุกข้อด้านล่าง**: ความชัดสำคัญกว่าความเร็ว คนดูต้องอ่านซับทันและเข้าใจทุกฉาก
  - พากย์: สั่ง Fenrir อ่านไม่เร่ง หยุดที่ลูกน้ำ ~0.5 วิ ระหว่างประโยค ~1 วิ (ช่วงแอ็กชันก็ไม่เร่ง ให้พลังอยู่ที่น้ำเสียง) — ประโยคใน voice_prompt.md ของ EP9
  - ตัดเสียง: `tighten_take.py … 0.32` (ช่องในประโยค 0.32 วิ) + gap ระหว่างบรรทัด 0.4 วิ เป็นค่าตั้งต้น และ **เปิดช่องให้ภาพเล่า** หลังบรรทัดที่มีแอ็กชันต้องดู (0.6–1.8 วิ: เลียนแบบ, รุมตี, ตบโต๊ะ+เอกสาร pause-bait, ศาลโกรธ, setup มุกปิด) — ใส่ใน `epN_gaps.txt`; split แบบ `[a, b, gap]` บังคับช่องเงียบระหว่างการ์ดได้
  - ภาพ: 1 ช็อต = 1 แอ็กชันที่อธิบายตัวเองได้ (ใครทำอะไรกับใคร) ค้างจนอ่านออก ~1.5–3 วิ, ASL ~1.6–1.8 วิ (EP9: 26 ช็อต/44 วิ), ช็อต ≤ 3.5 วิ; ไม่ตัดมอนทาจรัว 0.4 วิ; มุกที่อาศัยของ/กระจกต้องจัดกล้องให้เห็นทั้งสองฝั่งของมุก (คนทำ + ผลลัพธ์) ไม่ให้ตัวละครบังเลนส์
  - เพิ่มฉากที่อยากให้เห็น = เพิ่มบทพากย์ให้ฉากนั้นด้วย (ฉากเงียบนานคนดูหลุด)
  - มุกปิดที่ได้ผล: วนกลับไปต้นเรื่อง + ประโยคถูกตัดกลางคำ ("เขาเลยโทรแจ้งตำ—") เงียบ ~0.35 วิ แล้วตัดจบ
  - **ช็อตแรก = ตัวเอกเต็มตา** (Nox EP10): "ชายคนนี้ …" ต้องเป็น MCU เห็นหน้า + สิ่งที่เขาทำ (ถือมือถือ แปรงฟัน) อย่าพยายามยัดผู้ต้องหาเข้าเฟรมเดียวกันจนคนเหลือขอบเฟรม — ผู้ต้องหาเปิดตัวช็อตถัดไป
- **แนวเรื่อง (Nox 2026-11-09): absurd เป็นหลัก ไม่ล็อกสูตรเดียว** — สูตรตำรวจด้านล่างคือแนวที่ทำมาแล้ว (EP1–8) ใช้เป็นตัวอย่างได้ แต่ตอนใหม่อาจเป็น absurd แนวอื่น ไม่ต้องมีการแจ้งตำรวจหรือขึ้นศาล และการจัดการปัญหาอาจแปลกกว่านั้นมาก (หน่วยงานประหลาด, ระบบราชการ, พิธีกรรม, บริษัท, ชุมชน, วิทยาศาสตร์ …). เสนอแนวใหม่ได้ อย่ายัดทุกเรื่องเข้าสูตรตำรวจ; สิ่งที่คงไว้: ผู้บรรยายคนเดียวเล่าแบบ deadpan, โลกตอบสนองแบบจริงจังเกินเหตุ, มุกปิดสั้น
- **สูตรตำรวจ (แนวที่ใช้บ่อย)**: `ชายคนนี้ <กำลังทำเรื่องธรรมดา>` → ธรรมชาติ/สิ่งของทำสิ่งที่มันทำอยู่แล้ว → `นั่นคือ[ข้อหาทางกฎหมายจริง]` → `เขาเลยโทรแจ้งตำรวจ` → ตำรวจ/หน่วยพิเศษทำตามตัวอักษรแบบเกินจริง → มุกสถาบัน 1 อย่าง (สอบสวน/ชี้ตัว/ศาล/คุก/โรงพยาบาล/บำบัด) → โทษ + มุกปิด 2–5 คำ (pun / callback / ผลลัพธ์แห้งๆ) เขียนย้อนจากมุกปิด ผู้ต้องหาเป็นสิ่งไม่มีชีวิตหรือสัตว์เสมอ ได้รับโทษแบบมนุษย์และ "ชีวิตหลังคดี" แบบมนุษย์ ตัวเอกไม่พูด ผู้บรรยายพูดแทนทุกคน ทุกตอนปลูก hook ให้ตอนอื่นมาเก็บ (จักรวาลเดียวกัน)
- **จังหวะ (ค่าของต้นฉบับ — ใช้อ้างอิงเท่านั้น ของเราช้ากว่า ดูข้อ ⚠ ด้านบน)**: 48–73 คำ/4–14 ประโยค พากย์คลุม ≥ 85–95 % ของคลิป ช็อตมัธยฐาน 1.0–1.2 วิ (ช่วงบุก/ตี 0.4–0.6 วิ) ช็อตแรก 0.7–2.8 วิ ไม่ต้องยาวสุด แต่เหตุการณ์ hook ต้องเกิดใน 0.8 วิแรก ช็อตท้ายค้าง 1.5–3 วิ (เฟรมสุดท้ายนิ่ง 10–24 เฟรม) แล้วจบ ไม่มี outro ตัดแข็งเป็นหลัก แต่ ~11 % ของคัตเชื่อมด้วย whip เบลอ / วัตถุพุ่งผ่านเลนส์ / ทะลุเมฆ **ทุกเฟรมต้องขยับ** ไม่มีเฟรมนิ่งเลยนอกจากท้ายคลิป (รายละเอียดใน §4b, ตัวละคร §4c)
- **กล้อง**: กล้องไม่เคยนิ่ง: 79 % ของช็อต push-in มัธยฐาน +11 %/วิ (4–24 %/วิ) เห็นชัด ไม่ใช่ช้า; 27 % ของช็อตเปิดด้วยกล้อง "ร่อนลงจอด" (เคลื่อนเร็วแล้ว ease-out หยุดใน 4–6 เฟรม); roll เอียง 2–10° ระหว่างช็อตได้; เลนส์กว้างจ่อหน้าเกือบชนเลนส์, low angle ตำรวจ; motion blur ทุกการเคลื่อนเร็ว; MCU ระดับสายตา, ช็อตโทร = โทรศัพท์ 3D เลื่อนขึ้นจากขอบล่าง (~5 เฟรม) แล้วแนบหู push-in เสมอ, ช็อต scale (ผู้ต้องหาใหญ่ คนจิ๋ว), สถาบันถ่ายหน้าตรงสมมาตร, top-down สำหรับ reveal, ECU ของประกอบ 0.5–1 วิ
- **ภาพ**: พาเลตต์ผูกกับสถานที่ ไม่ใช่ชุดเดียวทั้งซีรีส์ (กลางคืนในบ้าน value ≈ 0.33 กรมท่า/ถ่าน + ไฟอุ่น, ห้องน้ำชมพู, ทะเลเขียวอมฟ้า + เหลืองดวงอาทิตย์, ชานเมืองฟ้า/เขียว) saturation เฉลี่ยต่อคลิป 0.19–0.39, grain กระดาษ, เงานุ่ม; **แสงคือแอนิเมชัน**: ไฟไซเรนแดง/น้ำเงินอาบทั้งเฟรมสลับทุก 3–5 เฟรม, ไฟกะพริบ, ลำแสงจากหน้าต่าง, ไฟฉาย; **หน้า = ลายเส้นหมึกวาดมือ** บนหัวกล่อง (เส้นขอบหัวสีดำ, ผมขีดเส้น, ตอหนวดจุด, แก้มแรเงา) สลับสีหน้า (กะพริบตา 2–3 เฟรม, อ้าปากตอนมีบทพูด); เอฟเฟกต์มี particle ได้และใช้บ่อย (ปลอกกระสุนทอง, เศษชิ้นส่วน, ดาว 4 แฉก, ควันพัฟ, โน้ต ♪, หยดน้ำ, ไอน้ำ) + glow ตอนฟ้าผ่า/ไฟฟ้า — ดูสูตรใน §4b
- **ตัวหนังสือ**: ซับขาวขอบดำ ≤ 2 บรรทัด 2–5 คำ/การ์ด ตัดแข็ง คีย์เวิร์ดสีปะการัง `#F08A6E` 1 คำ/การ์ด; ป้ายข้อหา = ป้ายกรมท่าห้อยแขวน กลางบนของเฟรม (ขอบบน 8–20 % ของความสูง กว้าง 65–75 %) หล่นจากนอกเฟรม เบลอ 1 เฟรม แกว่ง overshoot นิ่งใน 6–8 เฟรม แล้วแกว่งเบาๆ ต่อ **ลงตรงคำข้อหา (±3 เฟรม)** ~0.3–0.5 วิหลังขึ้นช็อต; หล่นซ้ำเมื่อตัวละครพูดซ้ำ/ปฏิเสธข้อหา ข้อหาใหม่ = ป้ายใหม่; ของประกอบแบบหยุดดู (pause-bait) = ใบประกาศ/เว็บไซต์ที่มีมุกในทุกช่องข้อมูล; ประโยคถูกตัดจบด้วย em dash ("เขาเลยโทรแจ้งตำ—") + เงียบสนิท ~0.3 วิ; คำหยาบเขียน `f***` + เสียงบี๊บ; ป้ายโทษ ("20 YEARS") เป็นป้ายจริงในฉากคุก; annotation สีแดง (กรอบประ + ✕ + ป้าย); UI ปลอมเต็มจอ (โทร 191, เครื่องเป่า, หน้า YouTube); ชื่อแอคเคานต์ฝังในฉาก (ป้าย/แฟ้ม/ถนน) ไม่ใช่โลโก้มุมจอ
- **เสียง**: −15 ถึง −16 LUFS, LRA 2–3 (ref16 วัดได้ 4–5), peak ≈ −2 dB พากย์แห้ง ใกล้ ≈ −24 dBFS ไม่มีเพลงที่ได้ยินชัด (ref8 พบโทน A–C♯–E นิ่งๆ ในช่วงเงียบ 7/8 คลิป น่าจะเป็น pad เบามาก ~−30 dB ใต้เสียงพากย์ ยังไม่ได้ฟังยืนยัน) พื้นช่วงเงียบ −32 ถึง −40 dBFS SFX ลงตรงคัต 75–90 % ของคัต sting โทนเสียงเป็นของหายาก (1–2 ครั้งทั้งคลิป)

## Q. มาตรฐานคุณภาพ + ด่านอนุมัติ (บทเรียน EP8 — ห้ามข้าม)
EP8 รอบแรกโดน Nox ตีกลับว่า "ลวก" เพราะ: ส่ง render หลังดูแค่ still กลางช็อตละ 1 ภาพ, ไม่ได้ดูการเคลื่อนไหวทีละเฟรม, ผู้ต้องหา (เงา) ไม่ได้ look-dev แยกก่อนจึงเป็นตุ๊กตาดำ/แผ่นแข็ง, มีเสาบังตัวละคร, เงาบ้านทับเงาตัวเอก, ท่าย่อ/พับเขียนด้วยโค้ดเลยแข็ง. เป้าคุณภาพวัดจาก 5 คลิปที่ Nox ส่ง → `episodes/absurd-cases/ref5_visual_notes.md` (อ่านก่อนทุกตอน)

สรุปสิ่งที่ทำให้ต้นฉบับดูธรรมชาติ: เรนเดอร์ระดับเอนจิน (เงานุ่ม, AO ทุกซอก, แสงสะท้อน, bloom, ลำแสง+ฝุ่น, DOF ช็อตใกล้, motion blur ทุกการเคลื่อนไหวเร็ว, ผิวทุกชิ้นมีลายพู่กัน/เส้นหมึก) · การเคลื่อนไหวมีน้ำหนักจริง (mocap/ฟิสิกส์ — ลื่นล้มเป็นโค้ง หมุน กระแทก ไถล; คนยืนเฉยก็หันหัว ตานำ ease 8–12 เฟรม) · กล้องเหมือนมีตากล้องถือ (แพนตาม รีเฟรม ลงจอดนุ่ม) · 1 ช็อต = 1 แอ็กชัน จัดให้เลนส์ ไม่มีอะไรบัง · ผู้ต้องหาที่เป็นนามธรรมเล่าผ่านฟิสิกส์ของโลก ("the dark" = ไฟดับ/ช่องมืด ไม่ใช่หุ่นดำ)

**เป้าปริมาณ (Nox 2026-11-09): 3–4 คลิป/วัน** — ทำได้เพราะใช้ซ้ำได้มากแม้แนวเรื่องต่างกัน (เสียงจากคลัง §5, ฉาก/ตัวละคร/พร็อพซ้ำจาก kit three.js (`src/episodes/AbsurdEp1/sets`, `absurdkit`, props ของ EP3–7) งานใหม่ต่อตอนคือผู้ต้องหา + 1–3 ช็อตเด่น; ตอนละแชต ทำขนานกัน

ภาพทำด้วย three.js/Remotion เท่านั้น (§4)

ด่าน (ฉบับเร็ว — Nox อนุมัติให้ตัด QA ซ้ำซ้อน):
1. **Look-dev เฉพาะของใหม่** (ผู้ต้องหาใหม่/ฉากใหม่/ท่าใหม่) → ช็อตทดสอบสั้นให้ Nox อนุมัติ; ของในคลังที่อนุมัติแล้วไม่ต้องทำซ้ำ
2. **เช็กภาพย่อรายช็อต** (`pnpm exec remotion still`): ภาพ 25–40 % 2–3 เฟรมต่อช็อต (จุดเริ่ม/แอ็กชัน/จบ) — ห้ามข้ามข้อนี้ จับปัญหาได้เกือบทั้งหมด (ตัวบังเงา, เงาใต้เท้า, เฟรมหลุด) ใช้แค่ 1–2 นาที
3. **เรนเดอร์จริงรวดเดียวทั้งตอน** คุณภาพเต็ม (§6)
4. **QA รอบเดียวบนคลิปที่ประกอบเสร็จ** (contact sheet ทุก 8 เฟรม + ฟังมิกซ์) → แก้เฉพาะช็อตที่พัง → ส่ง Nox พร้อมรายการตรงๆ ว่าเหลืออะไร — ห้ามบอก "เสร็จ" ถ้ายังมีปัญหาที่รู้
- **ไม่ใช้ reviewer agent แยก** แล้ว (ตัดเพื่อความเร็ว)

## 1. ไอเดีย → สคริปต์ (`episodes/absurd-cases/epN_script.json`)
1. เริ่มจาก **มุกปิด** ก่อน (pun ไทยหรือ callback จากตอนก่อน) แล้วเดินถอยหลังหาข้อหาและผู้ต้องหา
2. เขียน 8–14 บรรทัด ภาษาพูดสั้น อดีตกาล deadpan แปลตามบริบทให้เป็นธรรมชาติ ไม่แปลตรงตัว (ข้อหา: ทำร้ายร่างกาย บุกรุก ลักทรัพย์ หมิ่นประมาท ขับขี่ประมาท พยายามฆ่า กักขังหน่วงเหนี่ยว ละเมิดลิขสิทธิ์ …)
3. ทุกบรรทัด: `id`, `text`, `cards` = [[ข้อความการ์ด, คีย์เวิร์ด], …] (2–5 คำ/การ์ด) และ `titleCard` ตรงบรรทัดข้อหา; เสียงของผู้ต้องหาใส่เป็น `after` (SFX + การ์ด) ไม่ใช่บรรทัดพากย์
4. เขียน `series_bible.md` เพิ่ม: hook ที่ปลูกไว้ให้ตอนหน้า, ของที่ใช้ซ้ำ (ชุดคุกเบอร์ 18/19/20, ศาล, โหลหลักฐาน)
5. ส่งให้ Nox เฉพาะ **ข้อความพากย์ล้วน** (`epN_script.txt`) + `voice_prompt.md` — เขาเจนเสียงเองใน Google AI Studio เสียง **Fenrir** (prompt ที่มีอารมณ์กว่า deadpan ล้วนอยู่ใน voice_prompt.md) ห้ามไปหา API key ในเครื่อง/ไฟล์

## 2. เสียงพากย์เข้า
- ไฟล์ที่ได้มักเป็น take เดียวทั้งตอน (`public/absurd-cases/epN/raw/narration_*.wav`) **header WAV ของ Gemini พัง** (nAvgBytesPerSec) → `ffmpeg -i in.wav -ar 16000 narration16.wav` ก่อนให้ scipy อ่าน
- **หาจุดตัดด้วย Whisper บน PC** (`C:\Claude\absurd-cases\tools\ai-sfx\transcribe_epN.py` + `run_epN_words.bat` — ก๊อปจาก `transcribe_ep8.py`, วาง `narration_epN_16.wav` ไว้ข้างๆ, venv มี torch cu124 + transformers, โมเดล large-v3-turbo, `return_timestamps='word'`) อย่าเดาจากความยาวประโยค — รอบแรกเดาแล้วเพี้ยนตั้งแต่บรรทัด 5
- **Whisper ภาษาไทยให้ word timestamp เป็นก้อนรวมหลายคำ** (EP10) — วิธีที่ได้ผล: (1) หาช่วงเงียบ ≥ 0.3 วิ (RMS 10 ms, เกณฑ์ max−38 dB) แล้วจับคู่ช่วงพูดกับบรรทัดตามลำดับ ช่วงเงียบในบรรทัด = จุดลูกน้ำ (split แบบ `[a, b]`); (2) การ์ดที่ไม่มีจังหวะหยุด (เช่น "นั่นคือขัดขวาง|กระบวนการ…") หาจุดต่ำของพลังงานในบรรทัด แล้วให้ Whisper ถอดเสียงซับคลิป `[ต้นบรรทัด, จุดที่สงสัย]` ทีละจุด เลือกจุดที่ข้อความจบตรงคำ → ใส่เป็น split แบบตัวเลข
- **Windows console เป็น cp874**: สคริปต์ Python ที่พิมพ์/อ่านไทยต้องรันด้วย `PYTHONUTF8=1` (premix อ่าน JSON ภาษาไทย) — `sfx_index.py` ตั้ง UTF-8 ให้เองแล้ว
- เขียน `epN_cuts_fenrir.json` {id: [start, end]} → ตัดด้วย ffmpeg เป็น `public/absurd-cases/epN/src/<id>.wav` (mono 24 kHz) → `python3 tools/post_tts.py N public/absurd-cases episodes/absurd-cases/epN_script.json public/absurd-cases/epN/epN_lines_meta.json` (trim + segs) → รวม seg ที่ห่าง < 0.25 วิ ให้จำนวน seg = จำนวนการ์ด → บีบช่วงเงียบด้วย `python tools/tighten_take.py <raw24k.wav> epN_cuts_fenrir.json public/absurd-cases/epN/epN_narration_tight.wav epN_line_timing.json 0.32 $(cat epN_gaps.txt)` (ช่องในประโยค 0.32 วิ, gap บรรทัด 0.4 วิ + ช่องให้ภาพเล่า — §0 ⚠; ไม่ใช่ 0.22 ของต้นฉบับ)
- ถ้า Nox ส่งมาเป็นไฟล์แยกบรรทัด: `bash episodes/absurd-cases/ingest_voices.sh <โฟลเดอร์>` ทำให้ทั้งหมด

## 3. แผนเวลา (`episodes/absurd-cases/epN_plan.py` = แหล่งเวลาเดียวของทั้งตอน)
- ก๊อป `ep1_plan.py`: GAP ก่อนแต่ละบรรทัด 0.18–0.3 วิ (กว้างได้เฉพาะจังหวะมุก 0.45–0.55), `END_HOLD` 1.8, การ์ดตาม segs, `ev{}` = เหตุการณ์ทุกอย่างผูกกับบรรทัด/การ์ด (`at('l003c1', -0.05)`), `SHOTS[]` = คัตทุกจุด ช็อตแรกเริ่ม 0.0
- ใส่ช็อตบังคับ: scale shot, phone MCU, ป้ายข้อหา 3D, สถาบันหน้าตรง, ECU ของประกอบ ≥ 1 (แฟ้มคดี, ค้อน, กุญแจมือ), ช็อตปิดค้าง
- รัน `python3 episodes/absurd-cases/epN_plan.py` → `public/absurd-cases/epN/epN_timeline.json` (ภาพและมิกซ์อ่านไฟล์นี้) เป้า ASL ~1.6–1.8 วิ (จังหวะซีรีส์เรา §0 ⚠), ช็อต ≤ 3.5 วิ, ทุกช็อต ≥ 12 เฟรม (assert อยู่แล้ว) — ก๊อป `ep9_plan.py` เป็นแม่แบบ

## 4-S. กฎการเล่าจากคอมเมนต์ Nox (EP8 — ใช้กับทุกตอน)
- **เห็นโลกจริงรอบตัว**: ฉากเปิดต้องเห็นบ้านเรือน/ตึก (เช่น เดินเล่นในหมู่บ้านจัดสรร บ้านเดี่ยว รั้ว ประตู ต้นไม้ เสาไฟ) ไม่ใช่กำแพงเปล่า
- **เริ่มจากความปกติ**: ผู้ต้องหาทำสิ่งที่มันทำตามธรรมชาติ (เงาทอดตามปกติ) ไม่ต้องแสดงให้มัน "ทำผิด" เกินธรรมชาติ (ตัดช็อตเงาแอบย่องทิ้ง) — ความตลกมาจากตำรวจที่ทำตามตัวอักษร
- **ตำรวจจัดการกับผู้ต้องหาตรงที่มันอยู่จริง**: เงา = เงาที่ติดเท้าเขาอยู่ → SWAT ล้อมตัวเขากับเงา, สปอตไลต์หันส่อง *เงา* (ไม่ใช่กลางถนน), เกรียงแซะตรงส้นเท้า หลังจับเขายืนไม่มีเงา
- **ฟิสิกส์ของผู้ต้องหาต้องสมเหตุสมผลในตัว**: เงาไม่มีเงาของตัวเอง (castShadow ปิดทุกฉาก), ถูกสั่งให้ "บังแดด" = นอนแผ่เป็นร่มเงาให้คนยืนบนตัวมัน (คนที่ยืนบนเงาไม่มีเงาตัวเอง) ไม่ใช่ยืนทอดเงาซ้อนเงา
- **คนทำ = คนถือของ**: ผู้พิพากษาต้องถือค้อนแล้วทุบเอง (มือเห็นในช็อต CU) อย่าให้ของขยับเอง
- **เสียงต้องสมจริง**: AudioLDM2 (16 kHz) ไม่ผ่านสายตา Nox → ใช้ Stable Audio Open (§5)


## 4. ภาพ — pipeline three.js (`src/episodes/AbsurdEpN/`, ทุกตอน)
- ฉากใช้ซ้ำได้: หมู่บ้านจัดสรร `src/episodes/AbsurdEp8/village.tsx` (`<Village clear={[x0, x1]} />` บ้านเดี่ยว รั้ว ประตูเหล็ก ต้นไม้ เสาไฟ รถกระบะ), ถนน/ห้องสอบสวน/ศาล `AbsurdEp1/sets`, หน้าเรือนจำ + ป้ายรถเมล์ EP3/EP6/EP8 props; แดดกลางวัน = `DAYLIGHT()` ใน EP8 shots
- ร่มเงาที่ต้องเห็นจริงบนตัวคน: ตัวบังแดดล่องหน (`colorWrite:false`, `DoubleSide`, castShadow) ระหว่างดวงอาทิตย์กับคน + `receiveShadow` ที่ตัวละคร + แดดแรงพอ (directional ~3.0) — ดู `ShadeBlocker` ใน EP8
- ของถือในมือ (ค้อน โทรศัพท์): ติดกับ `Bip01_R_Hand` ให้ด้ามออกจากกำปั้น (ค้อน EP8: offset `[8,0,0]` rot `[0, π/2, 0]`) แล้วเช็ก still ว่าจับถูกทาง; ของที่ต้องแตะจุดบนร่างกาย (แปรงฟันเข้าปาก) ให้แก้ IK ย้อนจากปลายของ: วน 3–4 รอบ `ik()` + `handTo()` แล้วขยับเป้าข้อมือด้วย (เป้า − ตำแหน่งปลายของจริง) ดู `brushInMouth` ใน EP9 — ปากของหัวกล่อง ≈ กระดูก Bip01_Head +0.08 ขึ้น +0.12 ไปหน้า (กระดูกหัวอยู่ที่คอ ไม่ใช่ปาก); ด้ามต้องออกด้านข้าง กำมือข้างแก้ม ไม่ใช่มือบังหน้า; ท่าทุบ = ยกขึ้นก่อน แล้วฟาดลงถึงโต๊ะตรงจังหวะเสียง (ไม่ใช่ยกค้างตอนจังหวะ)
- **เป้า IK / ทิศมองของตัวละครที่นอนหรือถูกยก** (นอนบนเตียง rx = −π/2, นั่งบัลลังก์ y = 0.5): ใช้ `rootLocal(I, world)` จาก `pov/acting/ik.ts` ไม่ใช่ `toLocal()` — `toLocal` คิดแค่ x/z/yaw เลยส่งมือและหัวไปผิดที่ (EP10 แขนชี้ไม่ขึ้น มือถือไม่ถึงหน้า) ตอนใหม่ใช้ `rootLocal` ทั้งหมด (ตอนเก่าคงไว้ไม่ให้ภาพเปลี่ยน)
- **`camMove` กับจุดมองไกล**: arrive/pull-out ขยับกล้องตามเวกเตอร์ (กล้อง−จุดมอง) — จุดมองไกลมาก (ยอดเสา 20 ม.) + มุมเงย = กล้องมุดใต้ดิน (เห็นฟ้าครึ่งล่าง) ตั้งจุดมองให้อยู่ใกล้ตัวแบบ (≤ 5 ม.) แล้วใช้ fov/มุมเงยให้ของสูงเข้าเฟรม
- **จอ UI เต็มจอ** (ClipScreen/WifiFail/NoNet แบบ EP10): ใส่ push-in `scale(1 + 0.05·(t−t0))` เป็นค่าเริ่มต้น จอพื้นเรียบสีเข้มไม่ผ่านเกณฑ์ "ทุกเฟรมขยับ" แม้มีวงหมุน; **ซูมเข้าหาจุดบน UI** (ไอคอนไวไฟ) อย่าใช้แค่ `transformOrigin` — คำนวณตำแหน่งจุดนั้น (รวมการซูมของจอเอง) แล้ว translate+scale ให้มันเลื่อนมากลางเฟรมขณะขยาย (ดู `OneBarZoom` ใน EP10 Episode.tsx)
- `cast.ts` + `boxcast.ts`: ตัวละครกล่อง **ออริจินัล** (หัวแปดเหลี่ยม หน้า canvas ตาเม็ดถั่ว แก้มชมพู) บน Rocketbox bones; ห้ามเลียนแบบตัวละครต้นฉบับ (หัวกล่องสูง สูทกรมท่า ไทแดง = ของเขา) ทุกตัวใส่ `frustumCulled=false` ไม่งั้นตัวหายเมื่อเปลี่ยนท่า/ย้ายที่
- `sets.tsx`: ฉากแบน ≤ 4 สี + fill ต่อสถานที่ใน `Episode.tsx` (`FILL`/`PLACE`), `GRADE` ต่อช็อต, `NoToneMapping`
- `props.tsx`: ผู้ต้องหา (scale 4–6× ของจริง), กุญแจมือยักษ์ (`Handcuffs size=`), `ChargePlate` (ป้าย 3D billboard — ใช้ `Matrix4.lookAt(camera, plate)` ให้ +z หันหากล้อง ไม่งั้นโดน backface cull เป็นแผ่นดำ), `CaseFolder` (ของประกอบตัวหนังสือใหญ่ ใช้ `MeshBasicMaterial` จะได้ไม่โดนไฟโคมเผาจนขาว), `Jar` (ป้ายต้องอยู่ที่รัศมีแก้ว ไม่ใช่ offset + รัศมี — เคยลอยออกมา 5 ซม.)
- `shots.tsx`: ฟังก์ชันต่อช็อต คืน `{node, cam}`; staging ซ้ำใช้ฟังก์ชันร่วม (เช่น `interro(mode)`, `courtShot(ecu)`); เสียง "ผู้ต้องหาตอบ" = การ์ดเอคโค่
- `ui.tsx`: ซับตัดแข็ง, `CallScreen` เต็มจอ, `NewsBar` มี `HANDLE`, `Stamp`, `Flash` สั้นๆ ตรง SFX; ป้ายโทษ 2D ใช้ได้เฉพาะในคุก/ศาล
- **ด่าน 2 แบบเร็ว**: เรนเดอร์ร่างทั้งตอน `pnpm exec remotion render src/index.ts AbsurdEpN qa/epN/draft.mp4 --gl=angle --scale=0.3` (~1 นาที) แล้ว ffmpeg `select` 3 เฟรม/ช็อต (15/50/90 %) `tile=15x6` เป็น contact sheet เดียว — เร็วกว่า `remotion still` ทีละเฟรมมาก แก้แล้วค่อย still เฉพาะช็อตที่แก้
- ตรวจด้วย stills ก่อนเสมอ: `pnpm exec remotion still src/index.ts AbsurdEpN out.png --frame=F --gl=swangle --scale=0.35` ทำ contact sheet กลางทุกช็อต + strip 30 fps ตรงเอฟเฟกต์ แล้วค่อยส่ง render

## 4b. กล้อง ทรานซิชัน FX — กฎจาก ref8 (8 คลิป ดูทุกเฟรม)
- **กล้องต่อช็อต** (`camMove(shot)` ใน shots.tsx): (1) ช่วง arrive: เริ่มห่างจากจุดพัก 8–15 % ของระยะ แล้ว ease-out cubic เข้าที่ใน 4–6 เฟรม (ใช้ ~1 ใน 4 ของช็อต), (2) ช่วงลอย: push-in 8–15 %/วิ (ช็อตเน้น 20–25 %/วิ) หรือ pull-out สำหรับช็อตเผย, (3) roll เอียงได้ ≤ 6° ต่อช็อต; ห้ามมีช็อตที่กล้องนิ่งสนิท; แผ่นดินไหว/ระเบิด = jitter สุ่มทุกเฟรม + roll
- **Motion blur**: ห่อเฉพาะช็อตที่มีการเคลื่อนเร็ว (arrive, whip, ของพุ่งผ่านเลนส์, ประตูหลุด, โทรศัพท์โผล่, แขนสะบัดเร็ว) ด้วย `@remotion/motion-blur` `<CameraMotionBlur samples={5} shutterAngle={180}>` ช็อตปกติไม่ต้อง (render ช้าลงเท่ากับจำนวน samples)
- **ทรานซิชันนอกจากตัดแข็ง**: whip = 2 เฟรมท้ายช็อต A + 2 เฟรมแรกช็อต B หมุน yaw เร็ว + blur; ทะลุเมฆ = กล้องพุ่งผ่านก้อนเมฆ low-poly ที่บังเต็มเฟรมแล้วเผยฉากใหม่; ฉากหน้าเคลื่อนผ่าน = ก้อนฝุ่น/ตัวละครวิ่งผ่านเลนส์บังเต็มเฟรม 3–5 เฟรม; แฟลชขาว 1 เฟรมเฉพาะฟ้าผ่า/ระเบิด
- **ป้ายข้อหา** (`ChargePlate`): ห้อยติดกล้อง ไม่ใช่วางข้างผู้ต้องหา; y เริ่มเหนือเฟรม → `spring({damping: 9, mass: 0.6})` ลงที่จุดพัก, rotation z overshoot ±6° แล้วแกว่ง `sin(2π·0.6·t)·1.5°` ลดลงเรื่อยๆ; เวลาเข้าเอาจาก word timestamp ของคำข้อหา (Whisper) ไม่ใช่ต้นประโยค
- **ไฟไซเรน**: `Math.floor(frame/4)%2` สลับ point light แดง/น้ำเงินแรงๆ + overlay สี multiply ~25 % ทั้งเฟรม ใช้แทนช็อตรถตำรวจได้ (เห็นรถผ่านหน้าต่าง)
- **สูตร FX**: ยิงปืน = ดาวขาว 4 แฉก 1–2 เฟรมตำแหน่งสุ่ม + ปืนสะบัด + ปลอกกระสุนทอง (instanced mesh) พุ่งแล้วตกค้างในช็อตต่อไป; ฟ้าผ่า = ซิกแซก 3 เฟรม → ขาว 1 เฟรม → 6–8 เฟรมพื้นอมน้ำเงิน + glow ขอบตัวขาว + ประกายไฟวาดใหม่ทุกเฟรม → เขม่าดำพัฟ + เศษ; ตะลุมบอน = ก้อนฝุ่นสีน้ำตาลอ่อนมีแขนขา/กระบองโผล่ + ดาวเหลือง + เส้นโค้ง swoosh + ตัวอักษรบนป้ายแตกหลุด
- **สื่อผสม**: ฟุตเทจขาวดำ public domain (หนังก่อน 1929) คอมโพสิตลงในฉาก 3D ได้ ใส่ flicker แบบฟิล์มเก่า

## 4c. ตัวละครขยับให้ธรรมชาติ (วัดจากต้นฉบับทุกเฟรม + จุดที่ kit เรายังขาด)
จังหวะจากต้นฉบับ (30 fps, ดู crop เต็มความละเอียดทีละเฟรม):
- ยกแขนชี้/โชว์ของ 5–6 เฟรม (ออกตัวเร็ว เข้าเป้าช้า เลยเป้านิดแล้วนิ่ง) → ค้างแบบยังลอยเบาๆ (moving hold) 8–12 เฟรม → ลดแขน 3–4 เฟรม เร็วกว่าตอนยก มีเบลอ
- ท่าเร็ว (ตบหน้าผาก ยกไฟฉาย โทรศัพท์โผล่เข้าเฟรม) 2–4 เฟรม + เบลอ 1–2 เฟรม
- สัมผัส: มือแตะหน้า/นิ้วกดปุ่ม ชนพอดี ไม่ลอยไม่จม สิ่งที่ถูกแตะ "รับแรง" 3–4 เฟรม (หัวเอนถอยตอนตบหน้าผาก) แล้วค่อยถู/กดค้าง; จอเปลี่ยน ~6 เฟรมหลังนิ้วแตะ
- ของตก/ประตูล้ม = เร่งตามแรงโน้มถ่วง (~7 เฟรม) → กระแทก + ฝุ่นพัฟ; นิ้วแต่ละนิ้วขยับเหลื่อมเฟส 1–2 เฟรม ไม่แข็งทื่อ
- หน้า: กะพริบ 2–3 เฟรมทุก 2–4 วิ; ปากเปลี่ยนรูปทุก 2–4 เฟรมแบบไม่สม่ำเสมอ เฉพาะตอนเป็นบทพูดของตัวนั้น; **ห้ามสลับ FaceMode ที่ตาต่างกันรัวๆ** (เช่น `wide`↔`talk` ทุก 3 เฟรม — ตา `wide` เป็นวงก้นหอย ตา `talk` เป็นจุด → ตากระพริบแปลก, Nox ทัก EP9) ใช้โหมดเดียวค้าง + เปลี่ยนเฉพาะจังหวะ; โกรธ = `angry` (คิ้ว V ตาจ้อง ปากคว่ำ) / ตะโกน = `shout` (ตาเดียวกัน + ปากอ้า) ใน boxcast ink face; สลับหน้าตามอารมณ์ตรงจังหวะ (ปิดตาเอือมตอนตบหน้าผาก, ยิ้มเยาะหลังพูดจบ, ตาปรือ deadpan)
- เดิน: เท้าติดพื้น แขนแกว่งสวนขา สายจูงห้อยโค้งและตึงเมื่อถูกดึง; ไม่มีใครยืนแข็ง (idle หายใจ/ถ่ายน้ำหนักตลอด)

สิ่งที่ต้องทำใน kit three.js (`src/pov/`, ใช้กับ EP1–7):
1. **มือกล่องต้องมีนิ้ว** — `boxcast.ts` ทำมือเป็นกล่องเดียว + นิ้วโป้ง ทำให้ `fingers()` ใน `ik.ts` (point/fist/claw/cup) มองไม่เห็นเลย: สร้างกล่องฝ่ามือบน Bip01_X_Hand แล้วกล่องนิ้ว 3 ท่อนบน `Bip01_X_Finger{0–4}{'',1,2}` (นิ้วโป้ง+นิ้วชี้แยก; กลาง-นาง-ก้อยรวมเป็นแผ่นเดียวตาม Finger2 ได้) ทุกท่ามือและการถือของต้องเรียก `fingers()` (ถือโทรศัพท์/ไฟฉาย/กระบอง = กำรอบของ, ชี้/กดปุ่ม = point, ตบหน้าผาก = flat, ผี/สัตว์ = claw)
2. **Crossfade ทุกครั้งที่เปลี่ยนคลิป** — `RbPerson.drive()` ตอนนี้สลับ weight 0↔1 ทันที ทำให้ท่ากระตุก: เก็บเวลาเปลี่ยนท่าต่อตัวละคร แล้ว weight = smoothstep((t−tSwitch)/0.25) ให้คลิปเก่าค่อยๆ หาย (6–10 เฟรม) คำนวณจาก t ล้วนๆ เพราะ Remotion render ทีละเฟรมไม่เรียงลำดับ
3. **คลิปท่าทางเริ่มตรงคำ** — ตอนนี้เวลาคลิป = t + seed·dur (เริ่มกลางคลิปสุ่ม) ใช้ได้กับ idle เท่านั้น; gestic_*/wave/point/ท่าตกใจ ให้ส่ง `clipStart` จาก `ev()` แล้วเล่นจาก 0 (เลื่อนก่อนคำ 2–4 เฟรม ท่าจะตรงคำพอดี)
4. **ซองเวลา gesture ไม่สมมาตร** — GEST ตอนนี้ใช้ smoothstep สมมาตร 0.35 วิ (ดูลอยแบบหุ่นยนต์): ทำ `env(t, {antic: 0.07, in: 0.18, over: 0.06, hold, out: 0.12})` = ถอยสวน 2–3 เฟรม → ease-out เข้าเป้าเลยไป ~6 % → settle → ค้างแบบลอย (sin เล็กๆ) → ลดเร็วกว่าตอนยก
5. **มือเดินทางเป็นโค้ง** — อย่า lerp เป้า IK เป็นเส้นตรง ใช้ quadratic bezier ผ่านจุดกลางที่ยกสูง/ออกห่างลำตัว 10–20 ซม.
6. **ลำดับการหัน** — ตานำ (เลื่อนตาใน face texture) → หัวตาม 2–3 เฟรม → ลำตัวตามอีก 2–3 เฟรม; ท่ามือใหญ่ให้ไหล่ยก/ลำตัวเอนตามนิดหน่อย; มือชนหัว → หัวถอยรับแรง
7. **Secondary** — เนคไท หมวก สายจูง ตามตัวช้ากว่า 2–4 เฟรม (spring ที่คำนวณย้อนจาก t ได้); นิ้วเหลื่อมเฟสกัน
8. **ไม่ทะลุ** — มือไม่ทะลุลำตัว/หัว (ใช้ `reachable()`), ของที่ถือติดกระดูกมือด้วย offset ที่นิ้วกำพอดี, จุดสัมผัส (ปุ่ม หน้าผาก โต๊ะ) เป็นเป้า IK ตรงๆ
9. **ปากตามเสียงจริง** — `autoFace` ตอนนี้ใช้ sin(t·13) ขยับปากตลอด: ผูกกับ segs ของบรรทัดใน lines_meta (เปิดเมื่อมีเสียง สลับรูปทุก 2–4 เฟรม) เฉพาะบรรทัดที่เป็นคำพูดของตัวนั้น ตัวเอกไม่อ้าปาก; เพิ่ม FaceMode `half` (ตาปรือ), `annoyed`, `smug`, `O`
10. **ฟิสิกส์จริง** — ของตก ประตูล้ม ป้ายแกว่ง ใช้ ½gt² / damped spring ไม่ใช่ smoothstep
11. **ไม่ต้อง render 60 fps** — ต้นฉบับ 30 fps; ความลื่นมาจาก spacing + motion blur ไม่ใช่เฟรมเรต

## 5. SFX + มิกซ์ (`tools/premix_absurd_epN.py`)
- **ประหยัด token: ห้าม Read `index.json` (~60k token) / `index.md` (~20k) / `usage.json` (~10k) ให้ใช้คำสั่งแทนเสมอ**: `python tools/sfx_index.py cues [หมวด]` = ชื่อเสียงทั้งคลังแยกหมวด (~500 token, ดูครั้งเดียวตอนวางแผนเสียงทั้งตอน), `search <คำ …>` = 1 บรรทัดต่อเสียง สูงสุด 8 บรรทัด (~400 token; `--takes` เมื่อต้องเลือก take เจาะจง, `-n` เพิ่มจำนวน), `note <cue> <หมวด> "<ใช้ตอนไหน>"` = เขียนคำอธิบายโดยไม่ต้องเปิด usage.json; รวบหลายคำค้นไว้ใน shell call เดียว (`search จับ; search ศาล; …`); อ่านเฉพาะบรรทัดสรุปท้ายของ `publish`/`upload` (`| tail -3`)
- **ค้นคลังก่อนเจนใหม่ทุกครั้ง**: `python tools/sfx_index.py search <คำ>` — index ของทุก take ทุกตอน (592+ ไฟล์: ชื่อ cue, prompt, แท็กหมวด, คะแนน CLAP, engine, ความยาว) ดูทั้งคลัง (จัดตามจังหวะเรื่อง + คอลัมน์ "ใช้ตอนไหน" + เคยใช้ในตอนไหน) ที่ `tools/sfx_library/index.md`; ค้นภาษาไทยได้ (`search จับ`). **เสียงเก็บบน GitHub repo ส่วนตัว `noxhsxrk/absurd-sfx` ไม่ใช่ในเครื่อง**: เจอเสียงที่ตรง → `python tools/sfx_index.py pull <cue …> --ep N` (ดึงเฉพาะไฟล์นั้นมาไว้ `public/absurd-cases/epN/sfx_sao/<cue>_r1.wav` ให้ `take('<cue>')` ใน premix หาเจอ; take เจาะจง `pull out_sao8/gavel_r2 --ep N --as gavel`). เลือก take `sao` ก่อนเสมอ (`audioldm2` คุณภาพต่ำกว่า). **ไม่มีเสียงที่ต้องการ → สร้างเองแล้ว push เลย ไม่ต้องถาม Nox (อนุญาต 2026-11-09)**: เจนเฉพาะ cue ที่ขาดด้วย `tools/ai-sfx/gen_sao_epN.py` (ก๊อปจาก ep8, รันด้วย `tools/ai-sfx/.venv/Scripts/python.exe`) → เพิ่มบรรทัด "ใช้ตอนไหน" (หมวด + คำอธิบายไทย) ใน `tools/sfx_library/usage.json` → `python tools/sfx_index.py publish` (= build + upload ขึ้นคลัง ตัดไฟล์ซ้ำด้วย hash + clean-local ลบ take ใน `tools/ai-sfx/out*` เฉพาะที่ยืนยันแล้วว่าอยู่บนคลัง + commit/push index เป็น noxhsxrk; generator SAO เรียก publish เองตอนจบ ถ้ามันฟ้องว่า cue ไหนยังไม่มี usage ให้เติมแล้ว publish ซ้ำ) → `pull <cue> --ep N` เอาไปใช้ → บอก Nox บรรทัดเดียวว่าเพิ่มเสียงอะไรเข้าคลัง — build ไม่ทำให้เสียงที่ลบไปหายจาก index (แสดงเป็น ☁). ถ้า clone คลังไม่ได้ = repo ยังไม่ถูกสร้าง ให้บอก Nox ห้ามลบเสียงในเครื่อง. ตั้งชื่อ cue เป็นคำนามอังกฤษค้นง่าย (`cuffs`, `gavel`, `village_amb`, `steps_road`)
- **แหล่งเสียงหลัก (ตั้งแต่ EP8 v2): Stable Audio Open 1.0** (44.1 kHz สเตอริโอ) บน PC: ก๊อป `tools/ai-sfx/gen_sao_ep8.py` → `gen_sao_epN.py` (แก้ `CUES` = (cue, วินาที, ข้อความ CLAP, prompt อังกฤษแบบ foley เจาะจง เช่น 'Metal handcuffs ratcheting and clicking shut, close foley, crisp.'), เจน 4 take/cue จัดอันดับด้วย CLAP `laion/larger_clap_general` → `out_sao<N>/<cue>_r1..r4.wav` + `scores.json`, ~70 วิ/cue. รัน: `tools\ai-sfx\run_sao_epN.bat` (หรือ `tools/ai-sfx/.venv/Scripts/python.exe tools/ai-sfx/gen_sao_epN.py <cue …>` เจนเฉพาะ cue). ตั้งค่าแล้ว: Nox ล็อกอิน HF + ยอมรับ license แล้ว (`hf_login.bat`, token อยู่ในเครื่องเขา ห้ามอ่าน/หา). ก๊อป `_r1` ไป `public/absurd-cases/epN/sfx_sao/` → มิกซ์ด้วย `tools/premix_absurd_ep8b.py` เป็นแม่แบบ (อ่าน sfx_sao, ตัด cue การ์ตูนออก เช่น trombone/sizzle) เสียงเบา/สั้นมากให้ดู rms/active ก่อนใช้
- **เสียง UI อิเล็กทรอนิกส์ (บี๊บ, error มือถือ, เครื่องดับ, แจ้งเตือน) = synth ใน premix ไม่ต้องเจน SAO** — EP10 SAO ให้ซ่าล้วน/จิ๊บเดียว/เสียงทุ้ม และคะแนน CLAP หลอก (router_beep 0.29 แต่ไม่มีบี๊บ) สูตรใน `premix_absurd_ep10.py` (`rb`, `err_buzz`, `pwr_down`)
- **เช็กเสียงเจนใหม่ก่อนมิกซ์ (แทนการฟัง)**: ต่อ take ดู ความยาว, % ช่วงมีเสียง, จำนวน burst, ความถี่พีก, spectral flatness — flatness > 0.6 = noise, burst ไม่ตรงที่สั่ง หรือพีก < 60 Hz สำหรับเสียงที่ควรใส = ทิ้ง
- **เสียงที่ใช้ไม่ได้ให้ลบทิ้ง**: `python tools/sfx_index.py remove <cue …>` ลบทุก take ออกจากคลัง GitHub + index + usage + ไฟล์ในเครื่อง แล้วเอา cue ออกจาก `CUES` ของ generator
- `pull` แปลง take ที่เป็น 32-bit float เป็น 16-bit ให้เองแล้ว (`mixlib` อ่าน float ไม่ได้)
- แหล่งสำรอง/เก่า: `sfx_ai/` (AudioLDM2 บน PC: `C:\Claude\absurd-cases\tools\ai-sfx\gen_sfx_epN.py` + `run_ai_sfx_epN.bat` — ก๊อปจาก `gen_sfx_ep8.py`, ผลออก `out<N>/<cue>_r1..r4.wav` + `scores.json` (CLAP) → ก๊อป take ที่ใช้ไป `public/absurd-cases/epN/sfx_ai/`; take เก่าทุกตอนอยู่ใน `out*/` ใช้ซ้ำได้ก่อนเจนใหม่, เลือก take ด้วย `tools/pick_ai_sfx.py` — เก่งเนื้อเสียงยาว: ไซเรน ฝูง จิ้งหรีด ฮ. เสียงคน; เสียงกระแทกสั้นให้ synth) → `sfx_own/` (`tools/sfx_absurd.py` numpy ล้วน) → ไลบรารี `sfx/`
- กฎมิกซ์: **ไม่มีเพลง** (`mus` ปิดไว้), บรรยากาศต่อฉาก rms ≈ 0.009 (−40 dBFS) เริ่มตรงคัต, SFX ลงตรงคัต/เหตุการณ์, duck เสียงอื่นใต้พากย์ 0.7, "คำตอบ" ของผู้ต้องหาต้องดังกว่าพากย์รอบข้าง ~4 dB, master −14.5 ถึง −15 LUFS LRA ≤ 5 TP −1.5
- เช็คทุกครั้ง: `ffmpeg -i mix.wav -af ebur128 -f null -` และ RMS ช่วงเหตุการณ์สำคัญเทียบพากย์

## 6. Render (Claude Code บนเครื่อง Nox)
- **เรนเดอร์ตรงจาก shell**: `pnpm exec remotion render src/index.ts AbsurdEpN out/absurd-epN.mp4 --gl=angle --props=render/props_full.json` — **ใช้ props_full ทุกครั้ง** (ค่าเริ่มต้น quality 'fast' = ครึ่งความละเอียด เงาแข็ง) ~1–2 นาที/1000 เฟรม; ภาพย่อ: `pnpm exec remotion still src/index.ts AbsurdEpN out/check.png --frame=N --scale=0.3`; งานยาว (เจนเสียง SAO, เรนเดอร์ทั้งตอน) รัน background แล้วอ่าน log. QA จากไฟล์จริง (contact sheet ทุก 16 เฟรม, ebur128 ≈ −15 LUFS) แล้วบอก Nox ว่าไฟล์อยู่ไหน; commit (author noxhsxrk ไม่มี Co-Authored-By) + push ทุกรอบ
- ทางสำรองเมื่อสั่งจากนอกเครื่องเท่านั้น (ใช้ Claude Code ไม่ต้องใช้): ข้อ 0–4 ด้านล่าง
0. **คิวอัตโนมัติบน PC**: บน PC มีหน้าต่าง "absurd-cases render watcher" (`blender\render_watch.bat`, เปิดด้วย `go_watch.bat` ที่ root ถ้าถูกปิด/รีสตาร์ท) ทุก 30 วิ `git pull` แล้วรันทุก `blender/queue/*.job` (เรียงตามชื่อ) ที่ยังไม่มี `renders/done/<job>.done` (ตัวรันในคิวคือ Blender headless ที่แค่เรียก Remotion/คำสั่งต่อให้ ไม่ได้ใช้ทำภาพ). ไฟล์ .job = 1 บรรทัด: **เรนเดอร์ Remotion** `remotion_job.py -- AbsurdEpN out/absurd-epN.mp4`; **คำสั่งใดก็ได้จาก root** `cmd_job.py -- <command>` (เช่น .bat เจนเสียง). หยุดงานที่ค้างคิว = `device_commit_files` ไฟล์ `.done` ให้งานนั้นก่อนมันถึงคิว (อย่าลบ .job ระหว่างที่ watcher วนลูป และอย่าแก้ render_watch.bat ตอนมันทำงาน). ชื่อ job ต้องไม่ซ้ำกับที่เคยมี .done (เคยชนกันแล้วงานไม่รัน) ตั้งชื่อ job ใหม่ทุกครั้งที่อยากเรนเดอร์ซ้ำ (`012_ep8_lamp_v2.job`). เช็กสถานะ: stage `blender/renders/watch_status.txt`, `watch_history.txt`, `renders/done/<job>.log` (ต้องมี `SHOT DONE`; .done มีคำว่า ok/failed). `--out` แบบ relative อิงโฟลเดอร์ `blender/`
1. ส่งไฟล์ที่เปลี่ยน (timeline.json, mix.wav, lines_meta.json, *.tsx) ด้วย `device_commit_files` ไปที่ `C:\Claude\absurd-cases\…` (หรือ push ขึ้น GitHub แล้วให้ .bat บน PC `git pull`) — **stagedPath ต้องชื่อใหม่ไม่ซ้ำทุกครั้ง** (`/mnt/user-data/outputs/<รอบ>/<ชื่อใหม่>`) ไม่งั้น cache ส่งไฟล์เก่าไป (เคยทำเสียงเพี้ยนทั้งคลิป) แล้ว **stage กลับมา cmp/md5 ยืนยัน** ก่อนกด render
2. Explorer ได้สิทธิ์แค่ click → เปิด `C:\Claude\absurd-cases` แล้วดับเบิลคลิก `render_absurd_epN.bat` (node remotion-cli render AbsurdEpN out/absurd-epN.mp4 --gl=angle --bundle-cache=false; log ที่ `out\render_log.txt`) ใช้เวลา ~45 วิ/1000 เฟรม
3. stage `out\absurd-epN.mp4` กลับ, อ่านท้าย log ต้องมี `RENDER DONE`, ดึงเฟรมตรงจุดที่แก้ + เทียบ envelope เสียงกับมิกซ์ (corr > 0.85) แล้วค่อย `SendUserFile` (Nox ดูจากมือถือ)
4. commit ใน `absurd-cases` ทุกรอบ (push ได้เมื่อ repo `noxhsxrk/absurd-cases` มีอยู่)

## 7. QA checklist ก่อนส่ง
1. hook ใน 2 วิแรก เฟรม 0 อยู่กลางแอ็กชัน ไม่มีไตเติล
2. ASL ~1.6–1.8 วิ, ไม่มีช็อต > 3.5 วิ, ทุกฉากดูเข้าใจโดยไม่ต้องฟัง (ใครทำอะไร เห็นผลของมุก), ซับอ่านทัน, ฉากที่เพิ่มมีบทพากย์รองรับ
3. มีครบ: scale shot / phone MCU + UI เต็มจอ / ป้ายข้อหาห้อยหล่นตรงคำข้อหา (±3 เฟรม) / สถาบันหน้าตรง / ECU ของประกอบ / กุญแจมือยักษ์ / มุกปิด ≤ 5 คำ + ค้าง 1.5–2 วิ / hook ตอนหน้า
4. ไม่มีเพลง, −15 LUFS, SFX ตรงคัต, คำตอบผู้ต้องหาได้ยินชัด
5. ตัวละครไม่หาย (frustum), ป้าย 3D ไม่ดำ ไม่ลอย ไม่หลุดเฟรม, ซับไม่ทับป้าย, ชื่อแอคเคานต์ (`HANDLE` ใน data.ts) อยู่ในฉาก
6. ดูจากเฟรมไฟล์ render จริง ไม่ใช่ still อย่างเดียว
7. ไม่มีเฟรมนิ่ง: frame diff เฉลี่ย > 0.6 ทุกเฟรมยกเว้น 10–24 เฟรมท้าย, ทุกช็อตมี push/pull ≥ 4 %/วิ หรือมีตัวละครขยับ, ช็อตเคลื่อนเร็วมี motion blur
9. ผู้ต้องหาอ่านออกชัดทุกเฟรมที่ควรเห็น: ไม่มีเสา/คน/เงาวัตถุอื่นทับ, คอนทราสต์กับพื้นพอ (เช่น เงาบนพื้นสว่าง), ไม่บางเป็นเส้นเพราะมุมกล้อง
10. เทียบกับ ref5 ทีละหัวข้อ (แสง/เท็กซ์เจอร์/น้ำหนักการเคลื่อนไหว/กล้อง/staging) ตอน QA รอบเดียวบนคลิปที่ประกอบเสร็จ (ไม่ใช้ reviewer แยกแล้ว)
11. เสียง: ค้นคลัง (`search`) + `pull` ก่อนเจนใหม่; เสียงใหม่ทุกตัวต้องมีบรรทัดใน usage.json และผ่าน `publish` แล้ว (อยู่บนคลัง + index บน GitHub อัปเดต)
8. แอนิเมชันตัวละคร: ทำ strip ทุกเฟรม (ครอปเต็มความละเอียดที่มือ/หน้า/เท้า) ทุกช่วงที่มีท่ามือ สัมผัส หรือเปลี่ยนคลิป เช็กว่า (ก) ไม่มีเฟรมที่ท่ากระโดด (ข) จุดสัมผัสชนพอดี (ค) นิ้วเปลี่ยนรูปตามงาน (ง) ยกเร็ว-ลงเร็วกว่า มีเลยเป้าแล้วนิ่ง (จ) ปากขยับเฉพาะบรรทัดของตัวเอง (ฉ) เท้าไม่ไถล

## 8. ปิดตอน + ล้างไฟล์ใช้แล้ว (Nox สั่ง 2026-11-09)
**ทริกเกอร์**: Nox บอกชัดว่าคลิปตอนนั้นโอเคแล้ว ไม่ต้องปรับ/แก้แล้ว (เช่น "โอเค ปิดตอน", "ผ่านแล้ว ไม่ต้องแก้") — คำชมเฉพาะจุด ("ดีเลย", "good") ระหว่างยังแก้อยู่ **ไม่นับ**; ถ้าไม่แน่ใจให้ถามสั้นๆ ว่าปิดตอนนี้เลยไหม. พอได้ทริกเกอร์แล้วลบได้เลยไม่ต้องขออนุญาตซ้ำ แต่ทำเฉพาะตอนที่ Nox ปิด
- **ลบ** (ของตอนนั้นเท่านั้น):
  - คลิปเวอร์ชันเก่าใน `out/` (`absurd-epN-v1..` ทุกตัวยกเว้นตัวสุดท้ายที่ส่ง), เรนเดอร์รายช็อต, still/ภาพเช็ก (`out/check*.png` ฯลฯ), log เรนเดอร์
  - `qa/` ของตอนนั้น (contact sheet, strip, frame dump)
  - `blender/renders/` ที่เป็นของตอนนั้น + `.job` ใน `blender/queue/` และ `.done/.log` ใน `blender/renders/done/` ของตอนนั้น (ห้ามแตะตอน watcher กำลังรันงานนั้น)
  - ไฟล์ชั่วคราวที่สร้างระหว่างทำ (premix ร่าง, wav ตัดทดลอง, `/tmp` ฯลฯ)
- **เก็บไว้เสมอ**: คลิปสุดท้าย 1 ไฟล์, source code ทั้งหมด (`src/`, `episodes/`, `tools/`), เสียงพากย์ต้นฉบับ, มิกซ์สุดท้าย (`public/absurd-cases/epN/mix/`), `tools/sfx_library/` (index + usage) — ส่วนไฟล์เสียงเก็บบนคลัง GitHub: ตอนปิดตอนรัน `upload` แล้ว `clean-local` + `prune` ได้เลย (ลบเฉพาะที่ยืนยันแล้วว่าอยู่บนคลัง), ไฟล์ที่ git track อยู่ (ถ้าจำเป็นต้องลบไฟล์ tracked ให้ถาม Nox ก่อน)
- วิธี: list ไฟล์ที่จะลบ + ขนาดรวมก่อน → ลบ (`rm`) → ถ้าลบไฟล์ tracked ไป commit ด้วย (author noxhsxrk ไม่มี Co-Authored-By) → บอก Nox บรรทัดเดียวว่าลบอะไรไป กี่ GB และคลิปสุดท้ายอยู่ที่ไหน

References (ใน repo absurd-cases `skill/absurd-shorts-study/references/`): `ref8_visual_animation_notes.md` (กล้อง/แอนิเมชัน/ป้าย/FX วัดทุกเฟรมจาก 8 คลิปใหม่ — ถ้าขัดกับ ref16 ให้ยึด ref8), `ref16_shot_notes.md` (ช็อตต่อช็อตพร้อมเลขเฟรม), `ref16_transcripts.md` + `ref16_words.json` (Whisper), contact sheets และเฟรมเต็ม (ป้าย/UI/annotation/mugshot)

---

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