# คลังเสียง absurd-cases (SFX library)

592 ไฟล์ · 154 เสียง · สร้างใหม่: `python tools/sfx_index.py build` · ค้น: `python tools/sfx_index.py search <คำ>` (ไทยก็ได้)

## วิธีใช้

1. อ่านสคริปต์ตอนใหม่ แล้วไล่ทีละจังหวะ: ฉากอยู่ที่ไหน (bed) → คนทำอะไร (spot) → ช่วงพีก (จับ/ตัดสิน/มุก). หาเสียงจากหมวดด้านล่างหรือ `search`
2. มีเสียงที่ตรง → ก๊อป take ไป `public/absurd-cases/epN/sfx_sao/<cue>_r1.wav` แล้วเรียกใน premix ด้วย `take('<cue>', synth_สำรอง, ความยาว)`
3. ไม่มี / ไม่ตรง → เจนเฉพาะ cue ที่ขาดด้วย `tools/ai-sfx/gen_sao_epN.py` (ตั้งชื่อ cue อังกฤษค้นง่าย) แล้วเพิ่มบรรทัดใน `tools/sfx_library/usage.json` ว่าใช้ตอนไหน แล้ว `build`
4. ลำดับความไว้ใจ: engine `sao` (Stable Audio Open 44.1 kHz) > `audioldm2` (16 kHz) > รุ่นเก่า `_v1/_v2` (EP1–2). คะแนน CLAP < 0.05 = take พลาด ใช้ synth แทน
5. ไม่มีเพลงเด็ดขาด. ระดับ: bed rms ≈ 0.0038 (−40 dBFS) · spot peak 0.15–0.62 · ค้อนตัดสิน/ป้ายข้อหาดังสุด · ทุกอย่างหลบใต้พากย์ ~3 dB · มิกซ์จบ −15 LUFS

## สารบัญหมวด

- **บรรยากาศพื้นหลัง (bed)** — วางยาวตลอดฉาก loop ได้ ด้วย M.bed(...) ระดับ rms ≈ BED (0.0038, ≈ −40 dBFS) ใต้เสียงพากย์ เปลี่ยน bed ตรงคัตเปลี่ยนสถานที่ ครอสเฟด 0.2–0.3 วิ
- **ท่าทางคน (เดิน หายใจ ไอ จาม)** — spot ตรงเฟรมที่ตัวละครทำ ใส่ก่อนเหตุการณ์ 0.02–0.1 วิ peak 0.15–0.35 ฝีเท้าใช้ rms ต่ำ (~0.02) เพราะยาว
- **ของใช้ในบ้าน / เรื่องธรรมดาตอนเปิดเรื่อง** — ใช้ในช่วง 'ชายคนนี้ กำลัง…' ให้ฉากธรรมดาฟังดูจริง ก่อนเรื่องจะเพี้ยน peak 0.2–0.4
- **โทรศัพท์ / แจ้งเหตุ / อุปกรณ์** — ช็อต MCU มือถือ: เสียงแตะจอตรงนิ้วแตะ, เสียงเตือนตอน UI เด้ง peak 0.15–0.3
- **ตำรวจ / หน่วยพิเศษบุก / จับกุม** — ไซเรนเข้าก่อนภาพตำรวจ 0.3–0.6 วิแล้ว loop ใต้ช็อตบุก (rms ต่ำ ~0.006), ฝีเท้า SWAT ตรงคัตเข้า, กุญแจมือตรงเฟรมใส่ (peak 0.4+) = จุดพีกของช่วงจับ
- **สถาบัน: ห้องสอบสวน ศาล เอกสาร** — bed ห้อง + spot เด่นหนึ่งเสียงต่อช็อต (คลิกโคมไฟตอนเปิดไฟสอบสวน, ค้อนตอนตัดสิน peak ~0.6 = ดังสุดของคลิป, ตราปั๊มตรงเฟรมปั๊ม)
- **คุก / บทลงโทษ** — ประตูเหล็ก/ล็อกปิดตรงคัตเข้าคุก (peak 0.5–0.6), bed ทางเดินคุกเบาๆ, สัญญาณเตือนเมื่อมีหนี
- **มุกการ์ตูน / ยาง / ของย้วย** — เสียงของคำตอบหรือสิ่งที่ผิดธรรมชาติ (เงา ยาง สบู่) ใส่ตรงเฟรมขยับ peak 0.18–0.38; ซ้ำ 2–3 ครั้งห่าง 0.3 วิได้; อย่าใช้เพลง
- **เหตุใหญ่ / ภัย / ไฟฟ้า / ยานพาหนะ** — ใช้ตอนเรื่องบานปลาย (ฮ.บิน, รถทหาร, ฟ้าผ่า, ไฟช็อต) วางเป็น bed สั้นหรือ spot ใหญ่ peak 0.4–0.6 ลดลงใต้คำพากย์
- **กระแทก / ทรานซิชัน / ล้ม** — ปิดท้ายแอ็กชันหรือคัตแรง (ล้ม, ประตูพัง, riser ก่อนคัตใหญ่) peak 0.3–0.55 ใส่ thud ต่ำซ้อนได้

## บรรยากาศพื้นหลัง (bed)

วางยาวตลอดฉาก loop ได้ ด้วย M.bed(...) ระดับ rms ≈ BED (0.0038, ≈ −40 dBFS) ใต้เสียงพากย์ เปลี่ยน bed ตรงคัตเปลี่ยนสถานที่ ครอสเฟด 0.2–0.3 วิ

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **court_amb** | ห้องพิจารณาคดี เสียงพึมพำ กระดาษ เก้าอี้ลั่น (ตัวหลักของศาล) | EP8b bed court→vest | `public/absurd-cases/ep8/sfx_sao/court_amb_r1.wav` | sao · 6.0 · 0.02 | 5 |
| **flood_hum** | สปอตไลต์ใหญ่กลางแจ้งหึ่ง วางหลังเปิดไฟส่องผู้ต้องหา | EP8b bed lights→interro | `public/absurd-cases/ep8/sfx_sao/flood_hum_r1.wav` | sao · 6.0 · 0.2 | 5 |
| **noon_amb** | เที่ยงร้อนป้ายรถเมล์ จักจั่นดัง รถผ่าน (ตัวหลักของกลางวันร้อน) | EP8b bed vest→report | `public/absurd-cases/ep8/sfx_sao/noon_amb_r1.wav` | sao · 10.0 · 0.18 | 5 |
| **room_tone** | ห้องสอบสวน ไฟนีออน+แอร์เบาๆ (ตัวหลักของห้องสอบสวน) | EP8b bed interro→court | `public/absurd-cases/ep8/sfx_sao/room_tone_r1.wav` | sao · 6.0 · 0.15 | 5 |
| **village_amb** | ถนนในหมู่บ้านไทยบ่ายแดดดี นกร้อง (ตัวหลักของฉากหมู่บ้าน) | EP8b bed …→interro | `public/absurd-cases/ep8/sfx_sao/village_amb_r1.wav` | sao · 10.0 · 0.22 | 5 |
| **air_drift** | ลมอ่อนข้างหน้าต่าง ฉากสูดอากาศ เช้าสงบ |  | `tools/ai-sfx/out3/air_drift_r1.wav` | audioldm2 · 3.0 ·  | 4 |
| **car_pass** | รถวิ่งผ่านเร็วหนึ่งคัน ฉากริมถนน/ข้ามถนน (วางทับ bed) | EP6 cars | `tools/ai-sfx/out6/car_pass_r1.wav` | audioldm2 · 2.5 · -0.0 | 4 |
| **cell_hum** | ทางเดินคุกคอนกรีต พัดลมระบายอากาศ น้ำหยด | EP7 bed cell18→prisonTop | `tools/ai-sfx/out7/cell_hum_r1.wav` | audioldm2 · 6.0 · 0.06 | 4 |
| **court_room** | ศาลรุ่นเก่า AudioLDM2 ใช้เมื่อ court_amb ไม่เข้า | EP6 bed courtIn→cellPush, EP7 bed court→cell18, EP8 bed court→vest | `tools/ai-sfx/out6/court_room_r1.wav` | audioldm2 · 6.0 · -0.03 | 8 |
| **crickets** | จิ้งหรีดกลางคืน นอกบ้าน/หน้าบ้านดึก |  | `tools/ai-sfx/out/crickets_v1.wav` | audioldm2 ·  ·  | 2 |
| **fan_hum** | พัดลมเปิดแรงสุด เสียงมอเตอร์+ใบพัด เป็น bed ในห้อง | EP5 bed fan19→report | `tools/ai-sfx/out5/fan_hum_r1.wav` | audioldm2 · 6.0 · 0.11 | 4 |
| **floodlight_hum** | สปอตไลต์หึ่ง รุ่น AudioLDM2 (ใช้ flood_hum ก่อน) | EP8 bed lights→interro | `tools/ai-sfx/out8/floodlight_hum_r1.wav` | audioldm2 · 6.0 · 0.22 | 4 |
| **fridge_hum** | ตู้เย็นหึ่งในครัวมืด ฉากดึก |  | `tools/ai-sfx/out3/fridge_hum_r1.wav` | audioldm2 · 6.0 · 0.18 | 4 |
| **high_wind_rain** | ลมแรงฝนหนักในพายุ ฉากบนฟ้า/ในพายุ | EP7 bed chase→interro | `tools/ai-sfx/out7/high_wind_rain_r1.wav` | audioldm2 · 8.0 · 0.24 | 4 |
| **morning_birds** | นกร้องตอนเช้า หน้าบ้าน/หมู่บ้าน |  | `tools/ai-sfx/out/morning_birds_v1.wav` | audioldm2 ·  ·  | 2 |
| **murmur** | เสียงพึมพำฝูงคน รุ่นเก่า (ศาล/ฝูงชน) |  | `tools/ai-sfx/out/murmur_v1.wav` | audioldm2 ·  ·  | 2 |
| **night_kitchen** | ครัวเงียบตอนดึก จิ้งหรีดไกลๆ |  | `tools/ai-sfx/out3/night_kitchen_r1.wav` | audioldm2 · 8.0 · 0.02 | 4 |
| **night_quiet** | กลางคืนเงียบ รุ่นเก่า |  | `tools/ai-sfx/out/night_quiet_v1.wav` | audioldm2 ·  ·  | 2 |
| **night_street_rain** | ฝนตกบนถนนกลางคืน ล้อรถเปียกไกลๆ | EP7 bed throttle→chase | `tools/ai-sfx/out7/night_street_rain_r1.wav` | audioldm2 · 8.0 · 0.25 | 4 |
| **noon_cicadas** | จักจั่นเที่ยงร้อน รุ่น AudioLDM2 | EP8 bed sun→report | `tools/ai-sfx/out8/noon_cicadas_r1.wav` | audioldm2 · 8.0 · 0.33 | 4 |
| **outdoor_prison** | ลานโล่งหน้าอาคาร ลมเบา นกไกลๆ (หน้าคุก/หน้าสถานที่ราชการ) | EP6 bed prisonFront→notice, EP8 bed vest→sun | `tools/ai-sfx/out6/outdoor_prison_r1.wav` | audioldm2 · 6.0 · 0.22 | 4 |
| **prison_hall** | ทางเดินคุก รุ่นเก่า |  | `tools/ai-sfx/out/prison_hall_v1.wav` | audioldm2 ·  ·  | 2 |
| **rain_window** | ฝนหนักกระทบหน้าต่างห้องนอน ฟ้าร้องไกล | EP7 bed …→throttle | `tools/ai-sfx/out7/rain_window_r1.wav` | audioldm2 · 8.0 · 0.32 | 4 |
| **room_hum** | ห้องสอบสวน ไฟนีออนหึ่ง รุ่น AudioLDM2 | EP7 bed interro→court, EP8 bed interro→court | `tools/ai-sfx/out7/room_hum_r1.wav` | audioldm2 · 6.0 · 0.07 | 4 |
| **shower_bed** | ฝักบัวเปิดในห้องน้ำเล็ก น้ำกระเซ็น | EP5 bed …→kick | `tools/ai-sfx/out5/shower_bed_r1.wav` | audioldm2 · 8.0 · 0.34 | 4 |
| **traffic_bed** | ถนนใหญ่ 8 เลนกลางวัน รถผ่าน แตรไกล | EP6 bed …→cranes, EP8 bed …→interro | `tools/ai-sfx/out6/traffic_bed_r1.wav` | audioldm2 · 8.0 · 0.14 | 4 |
| **wind_gap** | ลมหวีดผ่านช่องแคบในตึกปูน หลอนๆ | EP6 answer | `tools/ai-sfx/out6/wind_gap_r1.wav` | audioldm2 · 3.0 · -0.02 | 4 |
| **wind_gust** | ลมกระโชก รุ่นเก่า |  | `tools/ai-sfx/out/wind_gust_v1.wav` | audioldm2 ·  ·  | 2 |
| **wind_high** | ลมบนที่สูงเหนือเมือง โล่งๆ (ช็อตมุมสูง/บนฟ้า) | EP7 bed prisonTop→alert | `tools/ai-sfx/out7/wind_high_r1.wav` | audioldm2 · 8.0 · 0.16 | 4 |

## ท่าทางคน (เดิน หายใจ ไอ จาม)

spot ตรงเฟรมที่ตัวละครทำ ใส่ก่อนเหตุการณ์ 0.02–0.1 วิ peak 0.15–0.35 ฝีเท้าใช้ rms ต่ำ (~0.02) เพราะยาว

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **cough** | คนแก่ไอสองทีกระแอม ช่วงเงียบในศาล/ห้องสอบสวนก่อนพูด | EP8b cough | `public/absurd-cases/ep8/sfx_sao/cough_r1.wav` | sao · 2.5 · 0.36 | 5 |
| **steps_road** | เดินช้าบนถนนยาง รองเท้าผ้าใบ ฉากเดินเล่นเปิดเรื่อง (loop ได้) | EP8b | `public/absurd-cases/ep8/sfx_sao/steps_road_r1.wav` | sao · 5.0 · 0.24 | 5 |
| **steps_stop** | เดิน 3 ก้าวแล้วหยุด ตรงจังหวะชะงัก/สังเกตเห็นความผิดปกติ | EP8b stop | `public/absurd-cases/ep8/sfx_sao/steps_stop_r1.wav` | sao · 2.0 · 0.13 | 5 |
| **breath_in** | สูดหายใจลึกทางจมูกแล้วผ่อน ฉากสูดอากาศ/ดมกลิ่น |  | `tools/ai-sfx/out3/breath_in_r1.wav` | audioldm2 · 3.0 ·  | 4 |
| **knee_crack** | ข้อเข่าลั่นกึก ตอนนั่งยองๆ/ลุก (มุกคนแก่) | EP6 knee | `tools/ai-sfx/out6/knee_crack_r1.wav` | audioldm2 · 1.0 · 0.19 | 4 |
| **mosquito** | ยุงบินหึ่งใกล้หู ตัวเดียว |  | `tools/ai-sfx/out/mosquito_v1.wav` | audioldm2 ·  ·  | 2 |
| **panting** | หอบเหนื่อยหลังวิ่ง ตอนหนีหรือไล่จับ | EP6 knee | `tools/ai-sfx/out6/panting_r1.wav` | audioldm2 · 3.0 · 0.08 | 4 |
| **sneeze** | จามดังหนึ่งที ฮัดชิ่ว |  | `tools/ai-sfx/out/sneeze_v1.wav` | audioldm2 ·  ·  | 6 |
| **sniff** | สูดดมทางจมูก 2 ที ตอนได้กลิ่น |  | `tools/ai-sfx/out3/sniff_r1.wav` | audioldm2 · 1.5 ·  | 4 |
| **street_steps** | เดินบนฟุตบาทแล้วหยุด รุ่น AudioLDM2 | EP8 | `tools/ai-sfx/out8/street_steps_r1.wav` | audioldm2 · 3.0 · 0.2 | 4 |
| **throat_clear** | คนแก่กระแอม ก่อนผู้พิพากษา/เจ้าหน้าที่พูด | EP6 ahem | `tools/ai-sfx/out6/throat_clear_r1.wav` | audioldm2 · 1.5 · 0.11 | 4 |
| **tired_steps** | ขึ้นบันไดปูนช้าๆ หอบ ตอนเดินขึ้นตึก/ไปรับโทษ | EP6 stairsUp | `tools/ai-sfx/out6/tired_steps_r1.wav` | audioldm2 · 4.0 · 0.21 | 4 |

## ของใช้ในบ้าน / เรื่องธรรมดาตอนเปิดเรื่อง

ใช้ในช่วง 'ชายคนนี้ กำลัง…' ให้ฉากธรรมดาฟังดูจริง ก่อนเรื่องจะเพี้ยน peak 0.2–0.4

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **breaker_clunk** | สับคัตเอาต์ ไฟดับ/ติดทั้งบ้าน |  | `tools/ai-sfx/out/breaker_clunk_v1.wav` | audioldm2 ·  ·  | 2 |
| **door_open** | เปิดประตูบ้านธรรมดา |  | `tools/ai-sfx/out/door_open_v1.wav` | audioldm2 ·  ·  | 2 |
| **fan_gear** | เฟืองพัดลมตั้งโต๊ะส่ายดังกึกๆ ฉากพัดลม |  | `tools/ai-sfx/out3/fan_gear_r1.wav` | audioldm2 · 2.5 ·  | 4 |
| **fan_motor** | มอเตอร์พัดลม รุ่นเก่า |  | `tools/ai-sfx/out/fan_motor_v1.wav` | audioldm2 ·  ·  | 2 |
| **fan_winddown** | พัดลมค่อยๆ หยุดหมุน หลังถูกปิด/ยึด |  | `tools/ai-sfx/out/fan_winddown_v1.wav` | audioldm2 ·  ·  | 2 |
| **flicker** | หลอดไฟกะพริบ ช่วงเพี้ยน/ไฟจะดับ |  | `tools/ai-sfx/out/flicker_v1.wav` | audioldm2 ·  ·  | 2 |
| **fridge_open** | เปิดตู้เย็น ขอบยางดูดป๊อก ไฟตู้เย็นติด |  | `tools/ai-sfx/out3/fridge_open_r1.wav` | audioldm2 · 2.0 · 0.16 | 4 |
| **gear_creak** | เฟืองลั่นเอี๊ยด ของเก่าขยับ |  | `tools/ai-sfx/out/gear_creak_v1.wav` | audioldm2 ·  ·  | 2 |
| **jar_lid** | ปิดฝาโหลแก้วหมุนแน่น ตอนเก็บ 'หลักฐาน' ใส่โหล |  | `tools/ai-sfx/out3/jar_lid_r1.wav` | audioldm2 · 2.0 ·  | 4 |
| **knock** | เคาะประตู ตำรวจมาเคาะ/มีคนมา |  | `tools/ai-sfx/out/knock_v1.wav` | audioldm2 ·  ·  | 2 |
| **light_switch** | กดสวิตช์ไฟบ้าน | EP8 lamp | `tools/ai-sfx/out/light_switch_v1.wav` | audioldm2 ·  ·  | 2 |
| **mouse_clicks** | คลิกเมาส์+พิมพ์คีย์บอร์ดรัว ฉากเล่นคอม | EP7 | `tools/ai-sfx/out7/mouse_clicks_r1.wav` | audioldm2 · 3.0 · 0.37 | 4 |
| **vacuum_roar** | เครื่องดูดฝุ่นคำราม |  | `tools/ai-sfx/out/vacuum_roar_v1.wav` | audioldm2 ·  ·  | 2 |
| **window_creak** | หน้าต่างลั่นเอี๊ยด รุ่นเก่า |  | `tools/ai-sfx/out/window_creak_v1.wav` | audioldm2 ·  ·  | 2 |
| **window_open** | ปลดกลอนหน้าต่างไม้เลื่อนเปิด |  | `tools/ai-sfx/out3/window_open_r1.wav` | audioldm2 · 2.5 ·  | 4 |

## โทรศัพท์ / แจ้งเหตุ / อุปกรณ์

ช็อต MCU มือถือ: เสียงแตะจอตรงนิ้วแตะ, เสียงเตือนตอน UI เด้ง peak 0.15–0.3

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **phone_taps** | นิ้วแตะจอ 3 ทีแล้วเสียงรอสาย ตรงช็อตกดโทรแจ้งตำรวจ | EP8b press | `public/absurd-cases/ep8/sfx_sao/phone_taps_r1.wav` | sao · 2.0 · 0.21 | 5 |
| **dial_beeps** | ตัวเลขดิจิทัลวิ่ง/นับเร็วขึ้นเรื่อยๆ ตอนมิเตอร์พุ่ง | EP7 dial | `tools/ai-sfx/out7/dial_beeps_r1.wav` | audioldm2 · 2.0 · 0.23 | 4 |
| **phone_alert** | เสียงเตือนฉุกเฉินมือถือ ติ๊ดๆ ตอนแจ้งเตือนทั้งประเทศ/แอปแจ้ง | EP7 alert | `tools/ai-sfx/out7/phone_alert_r1.wav` | audioldm2 · 2.0 · 0.28 | 4 |

## ตำรวจ / หน่วยพิเศษบุก / จับกุม

ไซเรนเข้าก่อนภาพตำรวจ 0.3–0.6 วิแล้ว loop ใต้ช็อตบุก (rms ต่ำ ~0.006), ฝีเท้า SWAT ตรงคัตเข้า, กุญแจมือตรงเฟรมใส่ (peak 0.4+) = จุดพีกของช่วงจับ

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **cuffs** | กุญแจมือรูดล็อกกริ๊กๆ ตรงเฟรมใส่กุญแจมือ (พีกช่วงจับกุม) | EP8b cuff | `public/absurd-cases/ep8/sfx_sao/cuffs_r1.wav` | sao · 2.0 · 0.43 | 5 |
| **flood_on** | สปอตไลต์เปิดทีละดวงดังปึก ตรงจังหวะไฟส่องผู้ต้องหา (ใส่ 2 ชั้นห่าง 0.2 วิ) | EP8b | `public/absurd-cases/ep8/sfx_sao/flood_on_r1.wav` | sao · 2.5 · 0.32 | 5 |
| **siren** | ไซเรนตำรวจคันเดียวใกล้ๆ ถนนเงียบ เข้าก่อนภาพตำรวจ แล้ว loop ใต้ช็อตบุก | EP8b scrape | `public/absurd-cases/ep8/sfx_sao/siren_r1.wav` | sao · 7.0 · 0.34 | 5 |
| **swat_run** | หน่วยบุกวิ่งบนถนนยาง (กลางแจ้ง) ตรงคัตเข้าช็อต SWAT | EP8b swat | `public/absurd-cases/ep8/sfx_sao/swat_run_r1.wav` | sao · 4.0 · 0.19 | 5 |
| **car_door** | ประตูรถตำรวจเปิด-ปิดตอนมาถึง |  | `tools/ai-sfx/out/car_door_v1.wav` | audioldm2 ·  ·  | 2 |
| **car_door_open** | เปิดประตูรถแรงๆ ลมพัดเข้า ตอนตำรวจลงรถกลางพายุ | EP7 jump | `tools/ai-sfx/out7/car_door_open_r1.wav` | audioldm2 · 1.5 · 0.05 | 4 |
| **cuff_click** | กุญแจมือล็อก รุ่นเก่า (ใช้ cuffs ก่อน) |  | `tools/ai-sfx/out/cuff_click_v1.wav` | audioldm2 ·  ·  | 2 |
| **door_crash** | พังประตูไม้ล้มลงพื้น ตอนหน่วยบุกเข้าห้อง | EP5 kick | `tools/ai-sfx/out5/door_crash_r1.wav` | audioldm2 · 2.5 · 0.08 | 8 |
| **engine_rev** | รถตำรวจหลายคันเร่งเครื่องพร้อมกัน ก่อนออกไล่ล่า | EP7 tyres | `tools/ai-sfx/out7/engine_rev_r1.wav` | audioldm2 · 3.0 · -0.03 | 4 |
| **handcuffs** | กุญแจมือล็อก รุ่น AudioLDM2 (ใช้ cuffs ก่อน) | EP5, EP7 cuff, EP8 cuff | `tools/ai-sfx/out7/handcuffs_r1.wav` | audioldm2 · 1.5 · 0.01 | 8 |
| **heavy_boots** | รองเท้าบู๊ตหนักวิ่ง รุ่นเก่า |  | `tools/ai-sfx/out/heavy_boots_v1.wav` | audioldm2 ·  ·  | 2 |
| **mask_breath** | หายใจผ่านหน้ากากกันแก๊ส ฟู่ๆ หน่วยพิเศษชุดป้องกัน |  | `tools/ai-sfx/out3/mask_breath_r1.wav` | audioldm2 · 3.0 · 0.1 | 4 |
| **mask_cough** | ไอผ่านหน้ากากกันแก๊ส อู้อี้ (มุกกลิ่นแรง) | EP8 cough | `tools/ai-sfx/out8/mask_cough_r1.wav` | audioldm2 · 2.0 · 0.13 | 4 |
| **police_arrive** | รถตำรวจมาจอด รุ่นเก่า |  | `tools/ai-sfx/out/police_arrive_v1.wav` | audioldm2 ·  ·  | 2 |
| **police_sirens** | ไซเรนตำรวจหลายคันบนถนนเมือง (กำลังมาก) | EP6 courtExt, EP7 interro, EP8 scrape | `tools/ai-sfx/out7/police_sirens_r1.wav` | audioldm2 · 6.0 · 0.43 | 8 |
| **radio_squelch** | วิทยุสื่อสารตำรวจซ่า-แกร๊ก ก่อน/หลังสั่งการ |  | `tools/ai-sfx/out/radio_squelch_v1.wav` | audioldm2 ·  ·  | 2 |
| **spotlight_on** | สปอตไลต์สนามเปิดปึก+หึ่งไต่ รุ่น AudioLDM2 (ใช้ flood_on ก่อน) | EP8 | `tools/ai-sfx/out8/spotlight_on_r1.wav` | audioldm2 · 2.0 · 0.17 | 4 |
| **suit_breath** | หายใจในชุดป้องกัน รุ่นเก่า |  | `tools/ai-sfx/out/suit_breath_v1.wav` | audioldm2 ·  ·  | 2 |
| **swat_boots** | หน่วยบุกวิ่งเข้าห้อง บู๊ตหนัก อุปกรณ์กระทบ (ในอาคาร) | EP5 kick, EP8 swat | `tools/ai-sfx/out3/swat_boots_r1.wav` | audioldm2 · 3.0 · 0.09 | 8 |
| **tape_unroll** | ดึงเทปกั้นพื้นที่ (เทปเหลือง) ตอนกั้นที่เกิดเหตุ |  | `tools/ai-sfx/out3/tape_unroll_r1.wav` | audioldm2 · 2.0 · 0.09 | 4 |
| **taser** | ปืนช็อตไฟฟ้าแปร๊บๆ ตอนจับกุมด้วยไฟฟ้า | EP5 tongs | `tools/ai-sfx/out5/taser_r1.wav` | audioldm2 · 3.0 · 0.29 | 4 |
| **traffic_cones** | วางกรวยจราจรพลาสติกเร็วๆ ตอนปิดถนน | EP6 cones | `tools/ai-sfx/out6/traffic_cones_r1.wav` | audioldm2 · 2.0 · 0.08 | 4 |
| **tyre_squeal** | ล้อหมุนฟรีเอี๊ยดบนถนนเปียก รถตำรวจออกตัว | EP7 tyres | `tools/ai-sfx/out7/tyre_squeal_r1.wav` | audioldm2 · 2.0 · -0.04 | 4 |
| **zap_taser** | ปืนช็อต รุ่นเก่า |  | `tools/ai-sfx/out/zap_taser_v1.wav` | audioldm2 ·  ·  | 2 |

## สถาบัน: ห้องสอบสวน ศาล เอกสาร

bed ห้อง + spot เด่นหนึ่งเสียงต่อช็อต (คลิกโคมไฟตอนเปิดไฟสอบสวน, ค้อนตอนตัดสิน peak ~0.6 = ดังสุดของคลิป, ตราปั๊มตรงเฟรมปั๊ม)

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **gavel** | ค้อนผู้พิพากษาเคาะแท่น 2 ที ตรงคำตัดสิน (เสียงดังสุดของคลิป peak ~0.62) | EP8b gavel | `public/absurd-cases/ep8/sfx_sao/gavel_r1.wav` | sao · 2.0 · 0.25 | 5 |
| **lamp_click** | สวิตช์โคมไฟโต๊ะคลิกเดียว ตอนเปิดไฟส่องหน้าในห้องสอบสวน | EP8b lamp | `public/absurd-cases/ep8/sfx_sao/lamp_click_r1.wav` | sao · 1.5 · 0.47 | 5 |
| **noon_bell** | ระฆังตีเที่ยงหนึ่งครั้ง หางยาว บอกเวลา/เปลี่ยนช่วง | EP8 bell, EP8b bell | `public/absurd-cases/ep8/sfx_sao/noon_bell_r1.wav` | sao · 5.0 · 0.26 | 9 |
| **stamp** | ตรายางปั๊มกระดาษบนโต๊ะไม้ตุ้บ ตรงเฟรมปั๊ม (อนุมัติ/ตัดสิน/ปิดคดี) | EP8b stamp | `public/absurd-cases/ep8/sfx_sao/stamp_r1.wav` | sao · 1.5 · 0.15 | 5 |
| **gavel_metal** | ค้อนเคาะราวเหล็ก ดังกริ๊ง ศาลกลางแจ้ง/ศาลแปลกที่ | EP6 gavel, EP8 gavel | `tools/ai-sfx/out6/gavel_metal_r1.wav` | audioldm2 · 1.5 · 0.12 | 4 |
| **hammer** | ตอกตะปู 2 ที ติดประกาศ/ปิดตาย |  | `tools/ai-sfx/out3/hammer_r1.wav` | audioldm2 · 2.0 ·  | 4 |
| **hammer_nail** | ตอกตะปู รุ่นเก่า |  | `tools/ai-sfx/out/hammer_nail_v1.wav` | audioldm2 ·  ·  | 2 |
| **mic_feedback** | ไมค์หอนสั้นๆ ก่อนแถลงข่าว/ประกาศ | EP7 blast | `tools/ai-sfx/out7/mic_feedback_r1.wav` | audioldm2 · 1.5 · 0.27 | 4 |
| **pen_writing** | ปากกาเขียนบนกระดาษ จดบันทึกปากคำ |  | `tools/ai-sfx/out/pen_writing_v1.wav` | audioldm2 ·  ·  | 2 |
| **rubber_stamp** | ตรายางปั๊มกระดาษตุ้บเดียว รุ่น AudioLDM2 (ใช้ stamp ก่อน) | EP6 stamp, EP8 stamp | `tools/ai-sfx/out6/rubber_stamp_r1.wav` | audioldm2 · 1.0 · -0.02 | 4 |
| **tongs_creak** | คีมเหล็กยาวบีบดังเอี๊ยด ตอนคีบ 'หลักฐาน' | EP5 grab | `tools/ai-sfx/out5/tongs_creak_r1.wav` | audioldm2 · 2.0 · 0.21 | 4 |

## คุก / บทลงโทษ

ประตูเหล็ก/ล็อกปิดตรงคัตเข้าคุก (peak 0.5–0.6), bed ทางเดินคุกเบาๆ, สัญญาณเตือนเมื่อมีหนี

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **beep** | กำไล EM ที่ข้อเท้าร้องสองที ตอนรับโทษคุมประพฤติ | EP8b em | `public/absurd-cases/ep8/sfx_sao/beep_r1.wav` | sao · 2.0 · 0.33 | 5 |
| **vest** | สวมเสื้อกั๊กสะท้อนแสง ผ้า+ตีนตุ๊กแก ตอนเริ่มบริการสังคม | EP8b vest | `public/absurd-cases/ep8/sfx_sao/vest_r1.wav` | sao · 2.0 · 0.13 | 5 |
| **broom_sweep** | กวาดพื้นถนน ฉากทำงานบริการสังคม | EP8 vest | `tools/ai-sfx/out8/broom_sweep_r1.wav` | audioldm2 · 3.0 · 0.21 | 4 |
| **cell_door** | ประตูห้องขังเลื่อนปิดดังกึง ตรงคัตเข้าคุก | EP5 clang, EP7 cellDoor | `tools/ai-sfx/out5/cell_door_r1.wav` | audioldm2 · 2.5 · 0.17 | 12 |
| **chain_rattle** | โซ่เหล็กลากตึง ตอนพันธนาการเกินเหตุ | EP6 chain | `tools/ai-sfx/out6/chain_rattle_r1.wav` | audioldm2 · 2.5 · 0.22 | 4 |
| **concrete_bars** | ก้อนปูนกระแทกลูกกรง ตอนขังของแปลกๆ (เสา/ก้อนปูน) | EP6 | `tools/ai-sfx/out6/concrete_bars_r1.wav` | audioldm2 · 2.0 · 0.24 | 4 |
| **giant_lock** | แม่กุญแจยักษ์ล็อกดังกึงก้อง ปิดท้ายการขัง | EP6 cuff | `tools/ai-sfx/out6/giant_lock_r1.wav` | audioldm2 · 2.5 · 0.08 | 4 |
| **keys** | พวงกุญแจกรุ๊งกริ๊ง ผู้คุมเปิดห้องขัง |  | `tools/ai-sfx/out/keys_v1.wav` | audioldm2 ·  ·  | 2 |
| **prison_alarm** | สัญญาณเตือนนักโทษหนีในทางเดินคุก | EP5 report | `tools/ai-sfx/out5/prison_alarm_r1.wav` | audioldm2 · 6.0 · 0.16 | 4 |
| **prison_siren** | ไซเรนคุก รุ่นเก่า |  | `tools/ai-sfx/out/prison_siren_v1.wav` | audioldm2 ·  ·  | 2 |

## มุกการ์ตูน / ยาง / ของย้วย

เสียงของคำตอบหรือสิ่งที่ผิดธรรมชาติ (เงา ยาง สบู่) ใส่ตรงเฟรมขยับ peak 0.18–0.38; ซ้ำ 2–3 ครั้งห่าง 0.3 วิได้; อย่าใช้เพลง

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **fold** | พับแผ่นยางหนาครึ่ง ตบแปะ ตอนพับผู้ต้องหาที่แบน (เงา ผ้า) | EP8b fold | `public/absurd-cases/ep8/sfx_sao/fold_r1.wav` | sao · 2.0 · 0.23 | 5 |
| **peel** | ลอกแผ่นยางเหนียวขึ้นจากถนน ดังแคว๊ก ตอนลอกเงา/สติกเกอร์/ของติดพื้น | EP8b peel | `public/absurd-cases/ep8/sfx_sao/peel_r1.wav` | sao · 3.0 · 0.26 | 5 |
| **shrink** | เสียงยางบีบเอี๊ยดสั้นๆ ใช้เป็น 'คำตอบ' ของผู้ต้องหาที่พูดไม่ได้ (ดังกว่าพากย์ +4 dB) | EP8b | `public/absurd-cases/ep8/sfx_sao/shrink_r1.wav` | sao · 1.5 · 0.27 | 5 |
| **squash** | ยางเปียกบี้ไถลบนพื้น ตอนของแบนถูกเหยียบ/หนี | EP8b squash | `public/absurd-cases/ep8/sfx_sao/squash_r1.wav` | sao · 2.0 · 0.24 | 5 |
| **trowel_scrape** | เกรียงเหล็กขูดถนนแรงๆ ตอนขูดเงา/ของติดพื้น | EP8b scrape | `public/absurd-cases/ep8/sfx_sao/trowel_scrape_r1.wav` | sao · 3.0 · 0.38 | 5 |
| **bubble_pop** | ฟองสบู่แตกเบาๆ ฉากห้องน้ำ/สบู่ | EP5 pop | `tools/ai-sfx/out5/bubble_pop_r1.wav` | audioldm2 · 1.5 · 0.15 | 4 |
| **foam_fizz** | ฟองโฟมฟู่ซ่า ตอนฟองสบู่เยอะผิดปกติ | EP5 report | `tools/ai-sfx/out5/foam_fizz_r1.wav` | audioldm2 · 6.0 · 0.2 | 4 |
| **gavel_rubber** | ค้อนยางทุบโต๊ะดังตุ้บ ตอนค้อนกลายเป็นของนิ่ม (มุก) | EP7 gavel | `tools/ai-sfx/out7/gavel_rubber_r1.wav` | audioldm2 · 1.0 · 0.08 | 4 |
| **guard_slip** | ผู้คุมลื่นล้มหงาย (มุกพื้นเปียก/สบู่) | EP5 guardSlip | `tools/ai-sfx/out5/guard_slip_r1.wav` | audioldm2 · 2.0 · 0.07 | 4 |
| **rubber_flap** | แผ่นยางเปียกตบพื้นแปะๆ ตอนของแบนขยับ | EP8 | `tools/ai-sfx/out8/rubber_flap_r1.wav` | audioldm2 · 2.0 · 0.07 | 4 |
| **rubber_shrink** | ลูกโป่งหดเร็วฟึ่บ ตอนของหด/คำตอบเป็นเสียงยาง | EP8 answer | `tools/ai-sfx/out8/rubber_shrink_r1.wav` | audioldm2 · 1.0 · 0.16 | 4 |
| **sheet_fold** | พับแผ่นยาง รุ่นแรก (ใช้ fold ก่อน) | EP8 fold | `tools/ai-sfx/out8/sheet_fold_r1.wav` | audioldm2 · 1.5 · 0.04 | 4 |
| **sizzle** | ฉ่าสั้นๆ ของโดนกระทะร้อน (มุกหน้าไหม้/แดดเผา) | EP8 burn | `tools/ai-sfx/out8/sizzle_r1.wav` | audioldm2 · 1.5 · 0.07 | 4 |
| **slip_falls** | หลายคนลื่นล้มต่อกันเป็นทอดๆ | EP5 slip0 | `tools/ai-sfx/out5/slip_falls_r1.wav` | audioldm2 · 3.0 · 0.08 | 4 |
| **smell_puff** | ปล่อยแก๊สฟู่ทุ้มๆ ตอนกลิ่นปล่อยออกมา | EP8 court | `tools/ai-sfx/out3/smell_puff_r1.wav` | audioldm2 · 2.0 · 0.05 | 4 |
| **soap_scrub** | ถูสบู่บนผิวเอี๊ยดๆ ฉากอาบน้ำ | EP5 slip | `tools/ai-sfx/out5/soap_scrub_r1.wav` | audioldm2 · 3.0 · 0.13 | 4 |
| **soap_slip** | สบู่ลื่นหลุดมือไถลบนกระเบื้อง | EP5 slip | `tools/ai-sfx/out5/soap_slip_r1.wav` | audioldm2 · 1.5 · 0.04 | 4 |
| **tape_peel** | ลอกเทปเหนียวยาวขึ้นจากพื้นปูน แคว๊กยาว | EP8 swat, EP8 scrape, EP8 peel | `tools/ai-sfx/out8/tape_peel_r1.wav` | audioldm2 · 2.5 · 0.1 | 4 |
| **trombone_down** | ทรอมโบนไหลลงวาวาว ปิดมุกแป้ก (ใช้น้อย — ไม่ใช่เพลง แต่ระวังให้ดูถูก) | EP8 squash | `tools/ai-sfx/out8/trombone_down_r1.wav` | audioldm2 · 2.0 · 0.16 | 4 |

## เหตุใหญ่ / ภัย / ไฟฟ้า / ยานพาหนะ

ใช้ตอนเรื่องบานปลาย (ฮ.บิน, รถทหาร, ฟ้าผ่า, ไฟช็อต) วางเป็น bed สั้นหรือ spot ใหญ่ peak 0.4–0.6 ลดลงใต้คำพากย์

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **army_trucks** | รถทหารหลายคันติดเครื่องรอ ตอนรัฐส่งกำลังใหญ่เกินเหตุ | EP6 bed cranes→courtExt, EP6 cranes | `tools/ai-sfx/out6/army_trucks_r1.wav` | audioldm2 · 6.0 · 0.24 | 4 |
| **crane_lift** | เครนยกของหนัก ตอนต้องยกผู้ต้องหาที่เป็นวัตถุใหญ่ | EP6 lift | `tools/ai-sfx/out6/crane_lift_r1.wav` | audioldm2 · 4.0 · 0.12 | 4 |
| **electric_buzz** | ไฟฟ้าซ่าต่อเนื่อง ของเสียบปลั๊กเพี้ยน |  | `tools/ai-sfx/out/electric_buzz_v1.wav` | audioldm2 ·  ·  | 2 |
| **electric_crackle** | ไฟแรงสูงแลบเป็นสาย ตอนของเริ่มมีพลังผิดปกติ | EP7 phone | `tools/ai-sfx/out7/electric_crackle_r1.wav` | audioldm2 · 4.0 · 0.24 | 4 |
| **electric_pop** | เครื่องใช้ไฟฟ้าลัดวงจรดังป๊อก ควันขึ้น | EP7 routerBoom | `tools/ai-sfx/out7/electric_pop_r1.wav` | audioldm2 · 2.0 · 0.1 | 4 |
| **electric_zip** | ไฟวิ่งปรี๊ดไปตามราวเหล็ก/ลูกกรง | EP7 barJump | `tools/ai-sfx/out7/electric_zip_r1.wav` | audioldm2 · 1.5 · 0.2 | 4 |
| **fan_spinup** | พัดลมหมุนเร็วขึ้นจนกรีดเหมือนเครื่องเจ็ต ตอนของธรรมดาบานปลาย | EP7 blow | `tools/ai-sfx/out7/fan_spinup_r1.wav` | audioldm2 · 4.0 · 0.15 | 4 |
| **glass_burst** | หน้าต่างปะทะพายุ กระจกสั่น ลมพุ่งเข้า | EP7 strike | `tools/ai-sfx/out7/glass_burst_r1.wav` | audioldm2 · 2.0 · 0.05 | 4 |
| **heli_hover** | เฮลิคอปเตอร์ลอยเหนือหัว ใบพัดตึกๆ ตอนกำลังใหญ่เกินเหตุ | EP6 lanes | `tools/ai-sfx/out6/heli_hover_r1.wav` | audioldm2 · 6.0 · 0.28 | 4 |
| **helicopter** | เฮลิคอปเตอร์ รุ่นเก่า |  | `tools/ai-sfx/out/helicopter_v1.wav` | audioldm2 ·  ·  | 2 |
| **jet_takeoff** | เครื่องเจ็ตขึ้นบิน เสียงพุ่ง ตอนของพุ่งขึ้นฟ้า | EP7 liftoff | `tools/ai-sfx/out7/jet_takeoff_r1.wav` | audioldm2 · 4.0 · 0.13 | 4 |
| **mic_blast** | ไมค์โดนไฟระเบิดดังปัง แล้วซ่า | EP7 zap | `tools/ai-sfx/out7/mic_blast_r1.wav` | audioldm2 · 2.5 · 0.05 | 4 |
| **mosquito_swarm** | ฝูงยุงมหาศาลหวีดหึ่ง ตอนยุงยกพวกมา | EP6 notice | `tools/ai-sfx/out6/mosquito_swarm_r1.wav` | audioldm2 · 6.0 · 0.39 | 4 |
| **national_alarm** | ไซเรนเตือนภัยทั้งเมืองหวอยาวไกลๆ ตอนเรื่องเล็กกลายเป็นวิกฤตชาติ | EP7 prisonTop | `tools/ai-sfx/out7/national_alarm_r1.wav` | audioldm2 · 8.0 · 0.38 | 4 |
| **power_spark** | ไฟช็อตสปาร์ก รุ่นเก่า |  | `tools/ai-sfx/out/power_spark_v1.wav` | audioldm2 ·  ·  | 2 |
| **saw_concrete** | เลื่อยวงเดือนตัดเสาปูนกรีดหวีด ตอนตัดผู้ต้องหาที่ติดอยู่กับที่ | EP6 cuffs | `tools/ai-sfx/out6/saw_concrete_r1.wav` | audioldm2 · 4.0 · 0.22 | 4 |
| **stampede** | ฝูงคน/สัตว์วิ่งกรู รุ่นเก่า |  | `tools/ai-sfx/out/stampede_v1.wav` | audioldm2 ·  ·  | 2 |
| **swarm** | ฝูงแมลงหึ่ง รุ่นเก่า |  | `tools/ai-sfx/out/swarm_v1.wav` | audioldm2 ·  ·  | 2 |
| **thunder_close** | ฟ้าผ่าใกล้มาก เปรี้ยงแล้วครืน | EP7 strike, EP7 carHit | `tools/ai-sfx/out7/thunder_close_r1.wav` | audioldm2 · 4.0 · 0.3 | 4 |
| **wind_blast** | ลมพายุพัดแรงแบบทอร์นาโด | EP7 blow, EP8 busStop | `tools/ai-sfx/out7/wind_blast_r1.wav` | audioldm2 · 3.0 · 0.18 | 4 |
| **zap_arc** | ไฟอาร์กแลบ รุ่นเก่า |  | `tools/ai-sfx/out/zap_arc_v1.wav` | audioldm2 ·  ·  | 2 |
| **zap_shock** | ไฟช็อตคน รุ่นเก่า |  | `tools/ai-sfx/out/zap_shock_v1.wav` | audioldm2 ·  ·  | 2 |

## กระแทก / ทรานซิชัน / ล้ม

ปิดท้ายแอ็กชันหรือคัตแรง (ล้ม, ประตูพัง, riser ก่อนคัตใหญ่) peak 0.3–0.55 ใส่ thud ต่ำซ้อนได้

| เสียง | ใช้ตอนไหน | เคยใช้ | take ที่ดีที่สุด | engine · วิ · score | takes |
|---|---|---|---|---|---|
| **body_fall** | คนล้มหงายลงพื้นแข็ง (ผู้ต้องหาหมดสติ ช็อก) |  | `tools/ai-sfx/out3/body_fall_r1.wav` | audioldm2 · 2.0 · 0.16 | 4 |
| **boom_hit** | ตูมหนักๆ ตรงคัตใหญ่ / เปิดเผยข้อหา (EP1 รุ่นเก่า) |  | `tools/ai-sfx/out/boom_hit_v1.wav` | audioldm2 ·  ·  | 2 |
| **glass_hit** | กระทบกระจก รุ่นเก่า |  | `tools/ai-sfx/out/glass_hit_v1.wav` | audioldm2 ·  ·  | 2 |
| **hit** | ตีกระแทกทั่วไป รุ่นเก่า |  | `tools/ai-sfx/out/hit_v1.wav` | audioldm2 ·  ·  | 2 |
| **riser** | เสียงไต่ขึ้นก่อนคัตใหญ่/เปิดเผยข้อหา (ใช้น้อยๆ) |  | `tools/ai-sfx/out/riser_v1.wav` | audioldm2 ·  ·  | 2 |
| **rubble_fall** | อิฐปูนถล่มลงพื้น หลังทุบ/รื้อ | EP6 rubble | `tools/ai-sfx/out6/rubble_fall_r1.wav` | audioldm2 · 3.0 · 0.21 | 4 |
| **thud1** | ตุ้บทุ้ม รุ่นเก่า |  | `tools/ai-sfx/out/thud1_v1.wav` | audioldm2 ·  ·  | 2 |
| **thud2** | ตุ้บทุ้ม รุ่นเก่า |  | `tools/ai-sfx/out/thud2_v1.wav` | audioldm2 ·  ·  | 2 |
| **whoosh_cloud** | วูบผ่านเมฆ ทรานซิชัน/กล้องพุ่ง | EP7 cloud | `tools/ai-sfx/out7/whoosh_cloud_r1.wav` | audioldm2 · 2.0 · 0.18 | 4 |

## เสียงสังเคราะห์ (ไม่ต้องเจน — ฟังก์ชันใน `tools/premix_absurd_ep8b.py`)

ใช้เป็นตัวสำรองตัวที่ 2 ของ `take()` หรือเมื่อ AI take ไม่เข้า

| ฟังก์ชัน | เสียง |
|---|---|
| `clunk` | ปึก/กึก โลหะทุ้ม (สวิตช์ใหญ่ ไฟเปิด ประตูเหล็กเล็ก) |
| `click` | คลิกสั้น (สวิตช์ ปุ่ม แตะจอ) |
| `whoosh` | วูบ (กล้องพุ่ง ทรานซิชัน ของปลิว) |
| `thud` | ตุ้บทุ้ม (ล้ม ปั๊ม วางของหนัก) |
| `tung` | ตึ๊ง! สปริงทุ้ม ป้ายข้อหาหล่นห้อย |
| `ratchet` | กุญแจมือรูดกริ๊กๆ |
| `metal` | กึ๊ง เหล็ก/ลูกกรงก้อง |
| `door_crash` | ประตูพังล้ม |
| `siren / alarm` | ไซเรนตำรวจ / เตือนภัยช้าๆ |
| `boots` | ฝีเท้าบู๊ตหลายคน |
| `beep / ankle_beep / alert_tone` | ติ๊ด / กำไล EM / เตือนมือถือ |
| `bell` | ระฆังหางยาว |
| `flap / fwip / peel / squash` | แปะ / ฟึ่บ / แคว๊ก / บี้ — ชุดเสียงยางย้วย |
| `slip_squeak / slide_long / scrub / fizz / pop_bubble / blub` | ชุดสบู่ลื่น ฟอง น้ำ |
| `electric / zip_ / spinup` | ไฟช็อตซ่า / ไฟวิ่ง / มอเตอร์ไต่รอบ |
| `traffic / engine / rotor / saw_whine` | ถนน / เครื่องยนต์ / ใบพัด ฮ. / เลื่อยหวีด |
| `rain / wind / wind_whistle / thunder` | ฝน / ลม / ลมหวีด / ฟ้าร้อง |
| `creak / knee_crack / swarm_buzz / trombone` | เอี๊ยด / เข่าลั่น / ฝูงแมลง / ทรอมโบนไหลลง |
