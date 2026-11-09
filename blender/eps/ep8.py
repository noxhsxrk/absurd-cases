"""EP8 คดีสะกดรอยตาม — Blender shots. Render one: blender -b -P eps/ep8.py -- --shot walk --mp4
Timing comes from public/absurd-cases/ep8/ep8_timeline.json (shot length + 20 frames of handle)."""
import bpy, sys, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, os.path.join(HERE, 'lib'))
from kit import *
import math
from look import world_sky
import soi, sheet, sets, props
from look import sun

TIMELINE = os.path.join(os.path.dirname(HERE), 'public', 'absurd-cases', 'ep8', 'ep8_timeline.json')
HOME_X = -4.2; LANE_Y = 1.85   # walk close to the wall: the shadow stands on the wall, only the feet touch the floor

def soi_day(seed=5, clear=(-8.0, 8.0)):
    soi.build(seed=seed, clear=clear); daylight()

def with_shadow(S, start, heading, moves, shadow_moves=None, **kw):
    """the man (casts no shadow of his own) + an invisible double that casts the shadow; by default the double copies him"""
    man = S.actor('nai', start, heading, moves, cast_shadow=False, **kw)
    shade = S.actor('shade', start, heading, shadow_moves or moves, shadow_only=True, **kw)
    return man, shade

# ---------------------------------------------------------------------------------------------------------------------
def shot_walk(S):
    """l001 'ชายคนนี้ กำลังเดินอยู่หน้าบ้าน' — wide: him and his ordinary shadow walking along the house front"""
    soi_day()
    man, shade = with_shadow(S, (HOME_X - 1.2, LANE_Y), EAST, [('walk', 1, 37)] * 3)
    man.blink([24])
    S.operator(follow=man, offset=(1.6, -4.4, 1.7), look=(1.2, 1.6, 1.0), lens=24)

def shot_look(S):
    """beat after l001: he stops, feels something, glances back over his shoulder. Shadow is still just a shadow."""
    soi_day()
    man, shade = with_shadow(S, (HOME_X, LANE_Y), EAST, [('stop', 22, 91), ('look_back', 'auto', 110)])
    man.face([(1, 'half'), (20, 'open'), (36, 'wide'), (52, 'half')])
    S.operator(follow=man, offset=(1.1, -2.4, 1.45), look=(0.25, 1.4, 1.2), lens=30, lag=(4, 14))

def shot_shadowStep(S):
    """l002 'แล้วเงา ก็แอบเดินตามเขาติดๆ' — locked-off frame: he walks on and out; his shadow stays on the wall a beat,
    then tiptoes after him. The camera barely drifts so the shadow is the only thing that moves on its own."""
    soi_day()
    x0 = HOME_X + 0.6
    man, shade = with_shadow(S, (x0, LANE_Y), EAST, [('walk', 1, 37)] * 3,
                             shadow_moves=[('idle', 1, 20), ('sneak', 'auto', 28), ('careful', 'auto', 53), ('careful', 1, 53)])
    man.blink([30])
    n = S.frames[1]
    S.operator(path=[(1, (x0 + 1.5, -3.6, 1.4), (x0 + 1.2, 1.8, 1.05)), (n, (x0 + 2.1, -3.6, 1.4), (x0 + 1.8, 1.8, 1.05))], lens=24)

# --- soi: the charge and the call ----------------------------------------------------------------------------------
def shot_charge(S):
    """l003 'นั่นคือการคุกคามสะกดรอยตาม!' — low along the wall: he stands; his shadow creeps right up behind him mid-tiptoe.
    The hanging plate drops on the charge word (Remotion)."""
    soi_day()
    x = HOME_X + 1.5
    man = S.actor('nai', (x, LANE_Y), EAST, [('idle', 30, 180)], cast_shadow=False)
    shade = S.actor('shade', (x - 0.8, LANE_Y), EAST, [('careful', 12, 13)], shadow_only=True)
    man.face([(1, 'half'), (S.ev('plate', -0.1), 'open'), (S.ev('plate', 0.25), 'half')]); man.blink([S.ev('plate', 0.9)])
    n = S.frames[1]
    S.operator(path=[(1, (x - 1.0, -1.9, 1.05), (x - 0.35, 2.4, 1.2)), (n, (x - 0.9, -1.55, 1.05), (x - 0.35, 2.4, 1.22))], lens=24)

def shot_phone(S):
    """l004 'เขาเลยโทรแจ้งตำรวจ' (+ callUI continues this take) — MCU: he lifts the phone to his ear, eyes on the wall"""
    S.frames = (1, S.frames[1] + 24)
    soi_day()
    x = HOME_X + 1.5
    man, shade = with_shadow(S, (x, LANE_Y), EAST, [('phone', 100, 260)])
    from look import painted
    import boxman
    boxman.attach(man.arm, 'mixamorig:RightHand', 'phone', (0.085, 0.17, 0.022), along=('m', 0.03, 0.17), offset=(0, 0, 0.05), mats=[painted('phone_body', (0.05, 0.05, 0.06), var=0.02, rough=0.2)])
    man.face([(1, 'half'), (S.ev('press', 0.1), 'talk'), (S.ev('press', 0.25), 'half'), (S.ev('press', 0.4), 'talk'), (S.ev('press', 0.5), 'half')])
    n = S.frames[1]
    S.operator(path=[(1, (x + 1.05, 0.55, 1.62), (x + 0.05, LANE_Y + 0.2, 1.55)), (n, (x + 0.9, 0.75, 1.62), (x + 0.05, LANE_Y + 0.2, 1.57))], lens=35, fstop=2.8)

# --- raid: the shadow lies on the road, SWAT, 20 lights, trowel, peel, fold, cuffs -----------------------------------
RAID = (-3.6, -1.8, 0.004)       # sheet feet; it lies along +x (head at x ~ 2)

def raid_set():
    soi_day(clear=(-8, 8))

def lying_sheet(S, eyes_mode=True):
    sh = sheet.build('shade'); sh.place(RAID, yaw=-math.pi / 2); sh.curl(1, {}); return sh

def shot_swat(S):
    """l005a 'หน่วยสวาท' — high wide: the shadow lies on the road; four SWAT tiptoe-sprint in and ring it"""
    raid_set(); sh = lying_sheet(S); sh.blink([12, 40])
    S.actor('nai', (-6.0, 1.0), 0.0, [('idle', 1, 180)])
    for k, (y, f0) in enumerate(((-3.1, 1), (-0.6, 5), (-3.3, 9), (-0.4, 13))):
        S.actor('swat%d' % k, (RAID[0] + 5.6 + k * 0.4, y), WEST, [('sneak', 1, 28), ('stop', 'auto', 91), ('idle', 1, 180)], start_frame=f0)
    n = S.frames[1]
    S.operator(path=[(1, (RAID[0] + 1.4, -8.2, 5.2), (RAID[0] + 1.0, -1.6, 0.2)), (n, (RAID[0] + 1.2, -7.2, 4.6), (RAID[0] + 1.0, -1.7, 0.2))], lens=22)

def shot_lights(S):
    """l005b 'เอาไฟสปอตไลต์ยี่สิบดวงส่องล้อม' — near top-down: twenty work lights snap on in a ring around it"""
    raid_set(); sh = lying_sheet(S)
    c = (RAID[0] + 1.0, RAID[1]); on0 = S.ev('lights', -0.05)
    for k in range(20):
        a = k / 20 * 2 * math.pi; p = (c[0] + 3.0 * math.cos(a), c[1] + 2.4 * math.sin(a), 0.0)
        r, em, L = props.floodlight('fl%d' % k, p, (c[0], c[1], 0.0), real=(k % 5 == 0), energy=700)
        props.switch_on(em, L, on0 + (k * 7) % 20 // 2)
    for k, (x, y) in enumerate(((c[0] - 1.6, c[1] - 1.5), (c[0] + 1.7, c[1] + 1.2))):
        S.actor('swat%d' % k, (x, y), EAST if x < c[0] else WEST, [('idle', 1, 180)])
    sh.blink([on0 + 2, on0 + 14])
    n = S.frames[1]
    S.operator(path=[(1, (c[0] + 0.6, c[1] - 3.0, 7.5), (c[0], c[1], 0.0)), (n, (c[0] + 0.2, c[1] - 2.2, 6.6), (c[0], c[1], 0.0))], lens=20)

def shot_scrape(S):
    """l006a 'ใช้เกรียงแซะเงา' — ground-level close: a trowel slides under the shadow's head and its edge lifts"""
    raid_set(); sh = lying_sheet(S)
    hx = RAID[0] + 2.03; t = props.trowel('trowel', (hx + 0.55, RAID[1], 0.012), rot=(0, 0, math.pi / 2))
    hit = S.ev('scrape'); n = S.frames[1]
    for f, x, z in ((1, hx + 0.55, 0.012), (hit, hx - 0.05, 0.006), (hit + 6, hx - 0.18, 0.02), (n, hx - 0.26, 0.05)):
        t.location = (x, RAID[1], z); t.keyframe_insert('location', frame=f)
    sh.curl(hit - 1, {}); sh.curl(hit + 8, {10: 6, 11: 12}); sh.curl(n, {10: 10, 11: 22})
    sh.blink([hit + 2])
    S.operator(path=[(1, (hx + 0.9, RAID[1] - 1.1, 0.32), (hx - 0.1, RAID[1] + 0.05, 0.02)), (n, (hx + 0.75, RAID[1] - 0.95, 0.3), (hx - 0.12, RAID[1] + 0.05, 0.03))], lens=32, fstop=2.8)

def shot_peel(S):
    """l006b 'ออกจากพื้นถนน' — it peels off the road like a sticker, from the head down, until it stands up on its heels"""
    raid_set(); sh = lying_sheet(S)
    a = S.ev('peel', -0.25); b = S.frames[1] - 8
    for f in range(1, S.frames[1] + 1, 2):
        p = min(1, max(0, (f - a) / (b - a))); p = p * p * (3 - 2 * p)
        L = 12 * (1 - p) + 0.001; i0 = min(11, int(L)); fr = L - i0
        ang = {i0: 90 * (1 - fr)}
        if i0 + 1 < 12: ang[i0 + 1] = 90 * fr
        if p >= 0.999: ang = {0: 90}
        sh.curl(f, ang)
    sh.blink([b + 3])
    S.actor('swat0', (RAID[0] - 0.9, RAID[1] + 1.0), math.pi * 0.75, [('idle', 1, 180)])
    n = S.frames[1]
    S.operator(path=[(1, (RAID[0] - 2.3, RAID[1] - 0.9, 0.9), (RAID[0] + 0.8, RAID[1], 0.4)), (n, (RAID[0] - 2.0, RAID[1] - 0.7, 1.1), (RAID[0] + 0.2, RAID[1], 0.9))], lens=24)

STAND = (-3.0, -1.6, 0.004)
def standing_sheet(name='shade', at=STAND, yaw=0.0, s=1.0):
    sh = sheet.build(name); sh.place(at, yaw=yaw, pitch=math.pi / 2); sh.rig.scale = (s, s, s); sh.curl(1, {}); return sh

def shot_fold(S):
    """l007a 'แล้วพับครึ่ง' — it stands between two SWAT; its top half folds over in front like a towel"""
    raid_set(); sh = standing_sheet()
    f0 = S.ev('fold'); n = S.frames[1]
    sh.curl(f0 - 2, {}); sh.curl(f0 + 6, {6: 120}); sh.curl(f0 + 10, {6: 178}); sh.curl(f0 + 13, {6: 170}); sh.curl(n, {6: 172})
    sh.blink([f0 - 6])
    for k, x in enumerate((-0.35, 1.6)):
        S.actor('swat%d' % k, (STAND[0] + x - 0.6, STAND[1] + 0.5), 0.0, [('idle', 20 + k * 30, 180)])
    S.operator(path=[(1, (STAND[0] + 0.3, STAND[1] - 3.6, 1.3), (STAND[0], STAND[1], 1.0)), (n, (STAND[0] + 0.2, STAND[1] - 3.0, 1.2), (STAND[0], STAND[1], 0.9))], lens=26)

def shot_cuffs(S):
    """l007b 'ใส่กุญแจมือ' — close: cuffs snap shut around the folded shadow"""
    raid_set(); sh = standing_sheet(); sh.curl(1, {6: 172})
    c0 = S.ev('cuff'); n = S.frames[1]
    r, rings = props.cuffs('cuffs', (STAND[0], STAND[1] - 0.16, 0.62), s=1.4)
    for f, s_, z in ((1, 2.4, 0.95), (c0 - 6, 2.2, 0.7), (c0, 1.4, 0.62), (c0 + 3, 1.5, 0.62), (c0 + 6, 1.4, 0.62)):
        r.scale = (s_, s_, s_); r.location.z = z; r.keyframe_insert('scale', frame=f); r.keyframe_insert('location', frame=f)
    sh.blink([c0 + 1])
    S.operator(path=[(1, (STAND[0] + 0.35, STAND[1] - 1.6, 0.85), (STAND[0], STAND[1], 0.62)), (n, (STAND[0] + 0.3, STAND[1] - 1.35, 0.82), (STAND[0], STAND[1], 0.6))], lens=35, fstop=2.8)

# --- interrogation ---------------------------------------------------------------------------------------------------
SEAT = (0.0, 0.78, 0.48)
def room(S, lamp_on_at=None, aim=True):
    L = sets.interrogation()
    sh = standing_sheet(at=SEAT, yaw=math.radians(30), s=0.7); sh.curl(1, {})
    cop = S.actor('cop', (0.8, -1.05), NORTH, [('idle', 40, 180)])
    head = L['head']
    if aim:
        head.rotation_euler = (math.radians(-35), 0, math.radians(150)); head.keyframe_insert('rotation_euler', frame=1)
    if lamp_on_at is not None: sets.lamp_on(L, max(1, lamp_on_at - 1), False); sets.lamp_on(L, lamp_on_at, True)
    return L, sh, cop

def aim_lamp(L, frame, on_target=True):
    h = L['head']; h.rotation_euler = (math.radians(2), 0, math.radians(-19)) if on_target else (math.radians(-35), 0, math.radians(150)); h.keyframe_insert('rotation_euler', frame=frame)

def shot_interro(S):
    """l008a 'ในห้องสอบสวน' — wide from the corner: the cuffed shadow stands on the suspect chair, a cop across the table"""
    L, sh, cop = room(S); sh.blink([14])
    props.cuffs('cuffs', (SEAT[0] + 0.02, SEAT[1] - 0.06, SEAT[2] + 0.5), s=0.75)
    n = S.frames[1]
    S.operator(path=[(1, (2.0, -2.1, 2.3), (0.0, 0.4, 0.95)), (n, (1.8, -1.9, 2.2), (0.0, 0.45, 0.95))], lens=18)

def shot_lamp(S):
    """l008b 'พอเปิดโคมไฟส่อง' — over the cop's shoulder: the lamp swings onto the shadow and clicks on"""
    on = S.ev('lamp'); L, sh, cop = room(S, lamp_on_at=on)
    aim_lamp(L, on - 8, False); aim_lamp(L, on - 1, True)
    sh.blink([on + 1])
    n = S.frames[1]
    S.operator(path=[(1, (-1.5, -2.3, 1.8), (0.0, 0.7, 1.0)), (n, (-1.3, -2.0, 1.75), (0.0, 0.72, 1.0))], lens=24)

def shot_shrink(S):
    """l009 'มันหดตัวหนีแสง ไม่ยอมให้การ' — in the lamp's glare it shrinks in jerky steps, eyes squeezed"""
    L, sh, cop = room(S, lamp_on_at=1); aim_lamp(L, 1, True)
    s0 = S.ev('shrink'); n = S.frames[1]; sz = 0.7
    sh.scale(1, sz); sh.scale(s0, sz)
    for k, f in enumerate(range(s0 + 4, n - 10, 9)):
        sz2 = max(0.16, 0.7 * (0.78 ** (k + 1)))
        sh.rig.scale = (sz2 * 1.12, sz2 * 1.12, sz2 * 1.12); sh.rig.keyframe_insert('scale', frame=f)
        sh.rig.scale = (sz2, sz2, sz2); sh.rig.keyframe_insert('scale', frame=f + 3)
    sh.blink([s0 + 2, s0 + 30])
    S.operator(path=[(1, (1.5, -0.9, 1.25), (0.0, 0.78, 0.85)), (n, (1.15, -0.55, 1.0), (0.0, 0.78, 0.65))], lens=26)

def shot_answerCU(S):
    """the accused's answer: 'ฟึ่บ!' — close on the tiny shadow on the big chair, it blinks"""
    L, sh, cop = room(S, lamp_on_at=1); aim_lamp(L, 1, True); sh.rig.scale = (0.16, 0.16, 0.16)
    sh.blink([6])
    n = S.frames[1]
    S.operator(path=[(1, (0.45, 0.25, 0.68), (0.0, 0.8, 0.6)), (n, (0.38, 0.33, 0.66), (0.0, 0.8, 0.59))], lens=45, fstop=2.8)

# --- court --------------------------------------------------------------------------------------------------------------
def court(S, react_at=None):
    C = sets.courtroom()
    moves = [('idle', 1, max(2, react_at)), ('surprised', 'auto', 100)] if react_at else [('idle', 1, 180)]
    judge = S.actor('judge', (0.0, 2.6, 0.6), 0.0, moves)
    sh = standing_sheet(at=(-1.1, 0.0, 1.03), yaw=math.radians(-15), s=0.55)
    return C, judge, sh

def shot_court(S):
    """l010a 'ศาลเห็นว่าคุกเต็ม เพราะกลิ่นทุเรียน' — frontal, symmetrical: the judge recoils from the durian smell"""
    cough = S.ev('cough'); C, judge, sh = court(S, react_at=cough - 2)
    judge.face([(1, 'half'), (cough, 'blink'), (cough + 4, 'wide'), (cough + 16, 'half')])
    sh.blink([10])
    n = S.frames[1]
    S.operator(path=[(1, (0.0, -2.9, 2.35), (-0.2, 1.6, 1.55)), (n, (0.0, -2.4, 2.3), (-0.2, 1.6, 1.6))], lens=20)

def shot_gavel(S):
    """l010b — the gavel comes down"""
    C, judge, sh = court(S)
    g = C['gavel']; hit = S.ev('gavel')
    for f, a in ((1, 0), (hit - 10, 42), (hit - 3, 46), (hit, 0), (hit + 3, 7), (hit + 6, 0)):
        g.rotation_euler = (0, math.radians(a), 0); g.keyframe_insert('rotation_euler', frame=f)
    n = S.frames[1]
    S.operator(path=[(1, (1.05, 1.25, 1.95), (0.55, 2.05, 1.66)), (n, (0.95, 1.4, 1.9), (0.55, 2.05, 1.66))], lens=40, fstop=2.8)

# --- prison front: community service as shade -----------------------------------------------------------------------
POST = (0.0, 1.55, 0.125)
def prison(S, noon=False):
    P = sets.prison_front()
    if noon: sun(elev_deg=88, azim_deg=10, energy=5.2, angle_deg=0.4)
    else: sun(elev_deg=34, azim_deg=8, energy=4.8, angle_deg=0.4)
    sh = standing_sheet(at=POST, yaw=0.0, s=1.0)
    p1 = S.actor('p1', (-0.16, 2.75), 0.0, [('idle', 10, 180)]); p2 = S.actor('p2', (0.22, 3.05), 0.0, [('idle', 60, 180)])
    return P, sh, p1, p2

def shot_vest(S):
    """l011a 'เลยสั่งบำเพ็ญประโยชน์' — the shadow in an orange community-service vest, standing on the pavement"""
    P, sh, p1, p2 = prison(S); props.vest_on(sh.rig); sh.blink([S.ev('vest', 0.5)])
    n = S.frames[1]
    S.operator(path=[(1, (1.3, -1.7, 1.5), (0.0, 1.7, 1.15)), (n, (1.05, -1.3, 1.45), (0.0, 1.7, 1.2))], lens=28)

def shot_anklet(S):
    """l011b 'ห้าร้อยชั่วโมง' — close on its heel: an ankle monitor blinking red"""
    P, sh, p1, p2 = prison(S); props.vest_on(sh.rig); props.anklet(sh.rig)
    n = S.frames[1]
    S.operator(path=[(1, (0.45, 0.95, 0.32), (0.05, 1.55, 0.18)), (n, (0.38, 1.05, 0.3), (0.05, 1.55, 0.17))], lens=40, fstop=2.8)

def shot_busStop(S):
    """l012a 'ให้ยืนบังแดด' — commuters standing in the shadow's shade at the roofless bus stop"""
    P, sh, p1, p2 = prison(S); props.vest_on(sh.rig)
    p1.blink([12]); p2.blink([20])
    n = S.frames[1]
    S.operator(path=[(1, (1.6, 0.4, 1.45), (0.0, 2.9, 1.25)), (n, (1.4, 0.6, 1.45), (0.0, 2.9, 1.3))], lens=26)

def shot_busWide(S):
    """l012b 'ที่ป้ายรถเมล์หน้าคุก' — wide: prison wall, razor wire, the roofless stop, the shadow on duty"""
    P, sh, p1, p2 = prison(S); props.vest_on(sh.rig); sh.blink([30])
    n = S.frames[1]
    S.operator(path=[(1, (3.2, -6.5, 2.3), (0.0, 2.2, 2.2)), (n, (2.7, -5.8, 2.2), (0.0, 2.2, 2.1))], lens=20)

def shot_sun(S):
    """l013a 'พอเที่ยงตรง' — looking up past the clock: the sun climbs overhead, the clock flips to 12:00"""
    P, sh, p1, p2 = prison(S, noon=False)
    bell = S.ev('bell'); n = S.frames[1]
    b = props.sun_ball('sunball', (0, 30, 18), 4.0)
    for f, loc in ((1, (2, 34, 18)), (bell, (0.5, 8, 44)), (n, (0.4, 6, 46))):
        b.location = loc; b.keyframe_insert('location', frame=f)
    P['c10'].hide_render = False; P['c10'].keyframe_insert('hide_render', frame=bell - 1); P['c10'].hide_render = True; P['c10'].keyframe_insert('hide_render', frame=bell)
    P['c12'].hide_render = True; P['c12'].keyframe_insert('hide_render', frame=bell - 1); P['c12'].hide_render = False; P['c12'].keyframe_insert('hide_render', frame=bell)
    S.operator(path=[(1, (-1.9, -1.2, 1.4), (-1.6, 6.0, 5.0)), (n, (-1.9, -1.0, 1.35), (-1.2, 6.0, 9.5))], lens=18)

def shot_squash(S):
    """l013b 'มันหดหนีงาน' — sun straight overhead: the shadow shrinks into a puddle under itself; the vest drops"""
    P, sh, p1, p2 = prison(S, noon=True)
    sq = S.ev('squash'); n = S.frames[1]
    vest = props.vest_on(sh.rig)
    sh.rig.scale = (1, 1, 1); sh.rig.keyframe_insert('scale', frame=sq - 1)
    sh.rig.scale = (1.25, 0.6, 1); sh.rig.keyframe_insert('scale', frame=sq + 4)
    sh.rig.scale = (1.4, 0.3, 1); sh.rig.keyframe_insert('scale', frame=sq + 10)
    sh.rig.scale = (1.15, 0.24, 1); sh.rig.keyframe_insert('scale', frame=sq + 22)
    sh.place(POST, yaw=0.0, pitch=math.pi / 2, frame=sq + 6); sh.place((POST[0], POST[1] - 0.3, 0.127), yaw=math.pi, pitch=0.0, frame=sq + 14)
    sh.blink([sq + 1])
    p1.face([(1, 'half'), (sq + 6, 'blink'), (sq + 10, 'half')]); p2.face([(1, 'open'), (sq + 8, 'wide')])
    S.operator(path=[(1, (1.6, -1.2, 1.7), (0.0, 1.9, 0.9)), (n, (1.3, -0.9, 1.9), (0.0, 1.8, 0.5))], lens=26)

def shot_report(S):
    """the work report on a desk; the red 'หนีงาน' stamp comes down (pause-bait)"""
    world_sky(strength=0.05)
    from look import painted, box
    desk = painted('desk', (0.48, 0.30, 0.16), var=0.12, stroke_scale=20, rough=0.45); box('desk', (0, 0, -0.03), (2.0, 1.4, 0.06), desk, bevel=0.01)
    blank = sets.plane_img('rep0', 'report_blank.png', (0, 0, 0.002), (0.45, 0.6), rot=(0, 0, 0.05))
    stamped = sets.plane_img('rep1', 'report_stamped.png', (0, 0, 0.002), (0.45, 0.6), rot=(0, 0, 0.05)); stamped.hide_render = True
    st = S.ev('stamp'); n = S.frames[1]
    for o, a, b_ in ((blank, False, True), (stamped, True, False)):
        o.hide_render = a; o.keyframe_insert('hide_render', frame=st); o.hide_render = b_; o.keyframe_insert('hide_render', frame=st + 1)
        o.hide_render = b_
    red = painted('stamp_red', (0.6, 0.08, 0.08), var=0.05, rough=0.4); wood = painted('stamp_wood', (0.35, 0.2, 0.1), var=0.1)
    stamp = props.empty('stamp', (0.02, -0.13, 0.6))
    b1 = box('stamp_base', (0, 0, 0.02), (0.2, 0.09, 0.04), red, bevel=0.006); b1.parent = stamp
    b2 = box('stamp_handle', (0, 0, 0.12), (0.05, 0.05, 0.16), wood, bevel=0.01); b2.parent = stamp
    for f, z in ((1, 0.6), (st - 6, 0.35), (st, 0.002), (st + 4, 0.006), (st + 10, 0.4), (n, 0.7)):
        stamp.location.z = z; stamp.keyframe_insert('location', frame=f)
    sets.area('desklight', (0.6, -0.8, 1.6), (math.radians(40), 0, math.radians(35)), 160, 1.5, color=(1, 0.93, 0.82))
    sets.area('deskfill', (-1.0, 0.5, 1.5), (math.radians(-30), 0, math.radians(-120)), 40, 2.0, color=(0.8, 0.85, 0.95))
    S.operator(path=[(1, (0.05, -0.62, 0.95), (0.0, 0.0, 0.0)), (n, (0.04, -0.48, 0.8), (0.0, 0.0, 0.0))], lens=30, breathe=0.002)

SHOTS = {k[5:]: v for k, v in globals().items() if k.startswith('shot_')}
if __name__ == '__main__' or 'bpy' in sys.modules:
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if '--shot' in argv: run(SHOTS, argv, TIMELINE)
