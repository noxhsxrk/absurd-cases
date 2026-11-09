"""EP7 คดีทำลายเร้าเตอร์ — single source of timing (narration take: ep7_narration_tight_1.00x.wav).

Run: python3 ep7_plan.py <lines_dir> <out_dir>
  lines_dir: l001.wav … l013.wav (tightened, 24 kHz mono)
  writes: ep7_lines_meta.json (line start/end + card segs), ep7_timeline.json (cards, events, shots)
Card boundaries: commas in the script = the largest pause inside the line; other boundaries =
syllable-proportional estimate snapped to the quietest 10 ms window within ±0.2 s.
"""
import json, sys
import numpy as np, scipy.io.wavfile as wav

FPS = 30
GAP = {"l004": 0.30, "l010": 0.50, "l013": 0.45}   # default 0.25 before every other line
END_HOLD = 1.6                                       # last word → end of clip

# id: [(card text, keyword, syllables, comma_after)]
SCRIPT = {
 "l001": [("ชายคนนี้", "", 3, True), ("กำลังเล่นคอม", "เล่นคอม", 4, False), ("ในห้องนอน", "ห้องนอน", 3, False)],
 "l002": [("แล้วฟ้าผ่า", "ฟ้าผ่า", 3, True), ("ก็ช็อตเร้าเตอร์เขาพัง", "เร้าเตอร์พัง", 6, False)],
 "l003": [("นั่นคือการ", "", 3, False), ("ทำให้เสียทรัพย์", "เสียทรัพย์", 4, False)],
 "l004": [("เขาเลยโทร", "โทร", 3, False), ("แจ้งตำรวจ", "ตำรวจ", 3, False)],
 "l005": [("ตำรวจสิบคัน", "สิบคัน", 4, True), ("เหยียบคันเร่ง", "คันเร่ง", 3, False), ("จนบินขึ้นฟ้า", "บินขึ้นฟ้า", 4, False)],
 "l006": [("ไล่ล่าสายฟ้า", "ไล่ล่า", 4, True), ("ทะลุเมฆฝน", "ทะลุเมฆ", 4, False)],
 "l007": [("แล้วกระโดด", "กระโดด", 3, False), ("ใส่กุญแจมือ", "กุญแจมือ", 4, True), ("กลางอากาศ", "กลางอากาศ", 3, False)],
 "l008": [("ในห้องสอบสวน", "ห้องสอบสวน", 4, True), ("ตำรวจถามว่าผ่าทำไม", "ผ่าทำไม", 7, False)],
 "l009": [("มันตอบด้วยการ", "", 4, True), ("ช็อตไมโครโฟนระเบิด", "ระเบิด", 6, False)],
 "l010": [("ศาลสั่งขัง", "สั่งขัง", 3, True), ("ห้องสิบแปด", "ห้องสิบแปด", 3, False)],
 "l011": [("แต่มันกระโดดไปช็อต", "ช็อต", 6, True), ("พัดลมห้องข้างๆ", "พัดลม", 5, False)],
 "l012": [("พัดลมหมุนแรงขึ้น", "หมุนแรงขึ้น", 5, True), ("พันเท่า", "พันเท่า", 2, False)],
 "l013": [("เป่ากลิ่นทุเรียน", "กลิ่นทุเรียน", 5, True), ("คลุมทั้งประเทศไทย", "ประเทศไทย", 5, False)],
}


def envelope(path):
    sr, x = wav.read(path)
    x = x.astype(np.float32) / 32768
    h = sr // 100
    n = len(x) // h
    return 20 * np.log10(np.sqrt((x[: n * h].reshape(n, h) ** 2).mean(1)) + 1e-9), len(x) / sr


def gaps(e, thr=-40, min_len=6):
    out, i = [], 0
    while i < len(e):
        if e[i] < thr:
            j = i
            while j < len(e) and e[j] < thr:
                j += 1
            if j - i >= min_len and i > 0 and j < len(e):
                out.append((i, j))
            i = j
        else:
            i += 1
    return out


def split_line(e, cards):
    """Return card boundaries (10 ms index) inside the line."""
    on = np.where(e > -42)[0]
    a, b = int(on[0]), int(on[-1]) + 1
    # comma = the pause nearest the syllable-proportional position (tightening makes all pauses equal length)
    tot_syl = sum(c[2] for c in cards)
    G, comma_cuts, acc = gaps(e, thr=-40, min_len=3), [], 0
    for c in cards[:-1]:
        acc += c[2]
        if c[3] and G:
            est = a + (b - a) * acc / tot_syl
            near = [g for g in G if abs((g[0] + g[1]) / 2 - est) <= 40]     # within ±0.4 s → longest pause wins
            comma_cuts.append(max(near, key=lambda g: g[1] - g[0]) if near
                              else min(G, key=lambda g: abs((g[0] + g[1]) / 2 - est)))
    comma_cuts = sorted(set(comma_cuts))
    # walk cards, hard-cut at commas, proportional+snap elsewhere
    bounds, ci, part_start = [], 0, a
    groups, cur = [], []
    for c in cards:
        cur.append(c)
        if c[3]:
            groups.append(cur); cur = []
    groups.append(cur)
    edges = [a] + [((s + t) // 2) for s, t in comma_cuts] + [b]
    for gi, grp in enumerate(groups):
        s, t = edges[gi], edges[gi + 1]
        tot = sum(c[2] for c in grp)
        acc = 0
        for c in grp[:-1]:
            acc += c[2]
            est = s + (t - s) * acc / tot
            lo, hi = max(int(est) - 20, s + 5), min(int(est) + 20, t - 5)
            bounds.append(lo + int(np.argmin(e[lo:hi])) if hi > lo else int(est))
        if gi < len(groups) - 1:
            bounds.append(edges[gi + 1])
    return a, b, bounds


def main(lines_dir, out_dir):
    t, meta, cards = 0.0, {}, []
    for k, cs in SCRIPT.items():
        if k != "l001":
            t += GAP.get(k, 0.25)
        e, dur = envelope(f"{lines_dir}/{k}.wav")
        a, b, bnd = split_line(e, cs)
        pts = [a] + bnd + [b]
        segs = [[round(t + pts[i] / 100, 3), round(t + pts[i + 1] / 100, 3)] for i in range(len(cs))]
        meta[k] = {"start": round(t, 3), "end": round(t + dur, 3), "segs": segs}
        for i, (txt, kw, _, _) in enumerate(cs):
            cards.append({"id": f"{k}c{i+1}", "line": k, "text": txt, "key": kw,
                          "from": segs[i][0], "to": segs[i + 1][0] if i + 1 < len(cs) else segs[i][1] + 0.12})
        t += dur
    voice_end = meta["l013"]["segs"][-1][1]
    END = round(voice_end + END_HOLD, 3)

    C = {c["id"]: c["from"] for c in cards}
    def at(cid, off=0.0):
        return round(C[cid] + off, 3)

    ev = {
        "router_strike":   at("l002c1", 0.25),          # "ฟ้าผ่า"
        "router_boom":     at("l002c2", 0.35),          # "ช็อตเร้าเตอร์"
        "charge_plate":    at("l003c2", 0.0),           # ป้าย "ทำให้เสียทรัพย์" ลงตรงคำข้อหา
        "phone_up":        at("l004c1", -0.17),          # โทรศัพท์เลื่อนขึ้น ~5 เฟรมก่อนคำ
        "tyres_spin":      at("l005c1", 0.0),
        "pedal_stomp":     at("l005c2", 0.05),
        "liftoff":         at("l005c3", 0.15),           # "บินขึ้นฟ้า"
        "cloud_punch":     at("l006c2", -0.13),          # ทะลุเมฆ: ทรานซิชัน 4 เฟรมก่อนคำ
        "car_hit":         at("l006c2", 0.45),
        "door_jump":       at("l007c1", 0.15),           # "กระโดด"
        "cuff_lock":       at("l007c2", 0.25),           # ±3 เฟรมรอบคำ "กุญแจมือ"
        "mic_bolt":        at("l009c2", 0.10),           # คำตอบของผู้ต้องหา (+4 dB เหนือพากย์)
        "gavel":           at("l010c1", 0.30),
        "cell_door":       at("l010c2", 0.40),
        "bar_jump":        at("l011c1", 0.40),           # "กระโดด"
        "fan_dial_3000":   at("l012c2", 0.10),           # "พันเท่า"
        "durian_blast":    at("l013c1", -0.40),
        "thai_full_cover": at("l013c2", 0.55),           # หมอกปิดปลายด้ามขวาน ตรง "ประเทศไทย"
        "alert_phone_up":  round(voice_end + 0.15, 3),
    }

    # shots: (name, start). Each ends where the next starts.
    S = [
        ("bedroom_mcu",          0.0),
        ("strike_wide",          at("l002c1", -0.05)),
        ("router_ecu",           at("l002c2", -0.05)),
        ("charge_lowangle",      at("l003c1", -0.05)),
        ("phone_call",           at("l004c1", -0.20)),
        ("throttle_line",        at("l005c1", -0.05)),
        ("liftoff_scale",        at("l005c3", -0.05)),
        ("chase_clouds",         at("l006c1", -0.05)),
        ("chase_hit",            at("l006c2", 0.10)),
        ("door_jump",            at("l007c1", -0.05)),
        ("cuff_ecu",             at("l007c2", -0.05)),
        ("midair_hero",          at("l007c3", -0.05)),
        ("interro_wide",         at("l008c1", -0.05)),
        ("interro_glare_cu",     at("l009c1", -0.05)),
        ("mic_bolt_cu",          at("l009c2", -0.05)),
        ("mic_aftermath",        at("l009c2", 1.25)),          # หน้าตำรวจ 3 นายดำ ตรง "ระเบิด"
        ("court",                at("l010c1", -0.05)),
        ("cell18",               at("l010c2", 0.25)),
        ("bar_jump_18_19",       at("l011c1", -0.05)),
        ("fan_plug_cu",          at("l011c2", -0.05)),
        ("fan_dial_ecu",         at("l012c1", -0.05)),
        ("fan_blast_20",         at("l012c2", 0.45)),
        ("prison_topdown_pull",  at("l013c1", -0.05)),
        ("thailand_map",         at("l013c2", -0.20)),
        ("alert_phone_hold",     round(voice_end + 0.10, 3)),
    ]
    shots = []
    for i, (name, s) in enumerate(S):
        e_ = S[i + 1][1] if i + 1 < len(S) else END
        f0, f1 = round(s * FPS), round(e_ * FPS)
        shots.append({"id": f"S{i+1:02d}", "name": name, "from": s, "to": e_, "frames": [f0, f1]})
        assert f1 - f0 >= 12, (name, f1 - f0)
        assert i == 0 or (e_ - s) <= 3.0, (name, round(e_ - s, 2))

    lens = [x["to"] - x["from"] for x in shots]
    stats = {"end": END, "frames": round(END * FPS), "voice_end": voice_end,
             "coverage": round(sum(m["end"] - m["start"] for m in meta.values()) / END, 3),
             "asl": round(float(np.mean(lens)), 2), "median": round(float(np.median(lens)), 2),
             "shots": len(shots)}
    json.dump(meta, open(f"{out_dir}/ep7_lines_meta.json", "w"), ensure_ascii=False, indent=1)
    json.dump({"fps": FPS, "stats": stats, "cards": cards, "events": ev, "shots": shots},
              open(f"{out_dir}/ep7_timeline.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps(stats, ensure_ascii=False))
    for c in cards:
        print(f"  {c['id']:7s} {c['from']:6.2f}-{c['to']:6.2f}  {c['text']}")
    for x in shots:
        print(f"  {x['id']} {x['from']:6.2f}-{x['to']:6.2f} ({x['to']-x['from']:.2f}s) {x['name']}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
