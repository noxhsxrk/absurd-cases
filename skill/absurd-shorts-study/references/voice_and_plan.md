# เสียงพากย์เข้า และแผนเวลา

ย้ายมาจาก SKILL.md แบบคำต่อคำเมื่อ 2026-11-16 (ไม่ได้แก้เนื้อหา) — ถ้าไฟล์นี้ขัดกับ `SKILL.md` ให้ยึด `SKILL.md`; ไฟล์นี้คือรายละเอียด เหตุผล และประวัติของกฎ

**ถูกทับแล้วในไฟล์นี้**: "ก๊อป `ep1_plan.py`", `at('l003c1')`, `END_HOLD` → แผนมาจาก `tools/new_episode.py` (ก๊อปตอนล่าสุด) ใช้ `P()` / `E()` / `HOLD` · "ป้ายข้อหา 3D" → `HangingPlate` (2D ใน `Episode.tsx`) · `transcribe_epN.py`, `post_tts.py`, การตัดเป็นไฟล์รายบรรทัด → `segments.py` + `make_cuts.py` · ค่า `tighten_take.py … 0.2` → 0.12 (ขอบถูกดันเข้าช่องเงียบแล้ว) · ที่ยังใช้: วิธีหาจุดแบ่งของการ์ดที่ไม่มีจังหวะหยุด, การเร่งเทค (atempo), การทำภาพก่อนมีเสียง

**งานปกติใช้เครื่องมือใน `SKILL.md` ขั้น B–C** (`tools/voice_in.py`, `tools/ai-sfx/segments.py`, `tools/make_cuts.py`, `tools/new_episode.py`) สคริปต์รายตอนที่ข้อความข้างล่างเอ่ยถึง (`transcribe_epN.py`, `segments_epN.py`, การตัดด้วยมือ) คือวิธีเดิม ใช้ไฟล์นี้เมื่อเครื่องมือแก้ไม่ได้: การ์ดที่ไม่มีจังหวะหยุด เทคยาวเกิน 30 วิ หรือทำภาพก่อนมีเสียง

## 2. เสียงพากย์เข้า
- ไฟล์ที่ได้มักเป็น take เดียวทั้งตอน (`public/absurd-cases/epN/raw/narration_*.wav`) **header WAV ของ Gemini พัง** (nAvgBytesPerSec) → `ffmpeg -i in.wav -ar 16000 narration16.wav` ก่อนให้ scipy อ่าน
- **หาจุดตัดด้วย Whisper บน PC** (`C:\Claude\absurd-cases\tools\ai-sfx\transcribe_epN.py` + `run_epN_words.bat` — ก๊อปจาก `transcribe_ep8.py`, วาง `narration_epN_16.wav` ไว้ข้างๆ, venv มี torch cu124 + transformers, โมเดล large-v3-turbo, `return_timestamps='word'`) อย่าเดาจากความยาวประโยค — รอบแรกเดาแล้วเพี้ยนตั้งแต่บรรทัด 5
- **Whisper ภาษาไทยให้ word timestamp เป็นก้อนรวมหลายคำ** (EP10) — วิธีที่ได้ผล: (1) หาช่วงเงียบ ≥ 0.3 วิ (RMS 10 ms, เกณฑ์ max−38 dB) แล้วจับคู่ช่วงพูดกับบรรทัดตามลำดับ ช่วงเงียบในบรรทัด = จุดลูกน้ำ (split แบบ `[a, b]`); (2) การ์ดที่ไม่มีจังหวะหยุด (เช่น "นั่นคือขัดขวาง|กระบวนการ…") หาจุดต่ำของพลังงานในบรรทัด แล้วให้ Whisper ถอดเสียงซับคลิป `[ต้นบรรทัด, จุดที่สงสัย]` ทีละจุด เลือกจุดที่ข้อความจบตรงคำ → ใส่เป็น split แบบตัวเลข
- **Windows console เป็น cp874**: สคริปต์ Python ที่พิมพ์/อ่านไทยต้องรันด้วย `PYTHONUTF8=1` (premix อ่าน JSON ภาษาไทย) — `sfx_index.py` ตั้ง UTF-8 ให้เองแล้ว
- เขียน `epN_cuts_fenrir.json` {id: [start, end]} → ตัดด้วย ffmpeg เป็น `public/absurd-cases/epN/src/<id>.wav` (mono 24 kHz) → `python3 tools/post_tts.py N public/absurd-cases episodes/absurd-cases/epN_script.json public/absurd-cases/epN/epN_lines_meta.json` (trim + segs) → รวม seg ที่ห่าง < 0.25 วิ ให้จำนวน seg = จำนวนการ์ด → บีบช่วงเงียบด้วย `python tools/tighten_take.py <raw24k.wav> epN_cuts_fenrir.json public/absurd-cases/epN/epN_narration_tight.wav epN_line_timing.json 0.2 $(cat epN_gaps.txt)` (ช่องในประโยค 0.2 วิ, gap บรรทัด 0.2–0.4 วิ + ช่องให้ภาพเล่า 0.4–1.3 วิ — §0 ⚠; ถ้าค่าตั้งต้น gap ในสคริปต์ยังเป็น 0.4 ของ EP9 ให้ลดตามคลิป)
- ถ้า Nox ส่งมาเป็นไฟล์แยกบรรทัด: `bash episodes/absurd-cases/ingest_voices.sh <โฟลเดอร์>` ทำให้ทั้งหมด

## 3. แผนเวลา (`episodes/absurd-cases/epN_plan.py` = แหล่งเวลาเดียวของทั้งตอน)
- ก๊อป `ep1_plan.py`: GAP ก่อนแต่ละบรรทัด 0.18–0.3 วิ (กว้างได้เฉพาะจังหวะมุก 0.45–0.55), `END_HOLD` 1.8, การ์ดตาม segs, `ev{}` = เหตุการณ์ทุกอย่างผูกกับบรรทัด/การ์ด (`at('l003c1', -0.05)`), `SHOTS[]` = คัตทุกจุด ช็อตแรกเริ่ม 0.0
- **ทำภาพก่อนเสียง (เมื่อ Nox สั่ง "เอาแค่งานภาพก่อน")**: เขียน `epN_line_timing.json` เองด้วยเวลาประมาณ ~0.22 วิ/พยางค์ (วัดจากเทคจริง: EP15 0.236, EP16 0.20 — ค่า 0.18 เดิมทำให้ประเมินสั้นไป ~2 วิ ให้ตัดบทที่ ≤ 88 พยางค์) ช่องลูกน้ำ 0.25 วิ ทุกแถวติด `'provisional': True`; plan/ช็อต/ซับทำตามปกติ ไม่มีไฟล์เสียง (Episode หา mix → voice → ไม่มีก็เงียบ) เมื่อเสียงจริงมา: ทำ §2 แทนที่ไฟล์ timing แล้วรัน plan + เรนเดอร์ใหม่ — เหตุการณ์ทุกตัวผูกกับบรรทัดอยู่แล้วจึงเลื่อนตามเอง
- ใส่ช็อตบังคับ: scale shot, ป้ายข้อหา 3D, สถาบันหน้าตรง, ECU ของประกอบ ≥ 1 (แฟ้มคดี, ค้อน, กุญแจมือ), ตอนจบตามแบบที่เลือก (§4d: ค้างนิ่ง / เดินต่อ / มุกภาพเงียบ)
- รัน `python3 episodes/absurd-cases/epN_plan.py` → `public/absurd-cases/epN/epN_timeline.json` (ภาพและมิกซ์อ่านไฟล์นี้) เป้า ASL ~1.1–1.5 วิ, คลิป ≤ 30 วิ (§0 ⚠), ช็อต ≤ 3.5 วิ, ทุกช็อต ≥ 12 เฟรม (assert อยู่แล้ว) — ก๊อป plan ของตอนล่าสุดที่ยาว ≤ 30 วิ (EP12 ขึ้นไป) เป็นแม่แบบ ไม่ใช่ `ep9_plan.py` (44 วิ)
