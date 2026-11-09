"""Mixamo clips → in-place actions + a baked root path, sequenced on the NLA with blends.
Mixamo armature space: forward = local +Z of the Hips location (cm), armature object rotated X 90° and scaled 0.01,
so world forward = -Y (the rig faces -Y). We strip Hips Z/X from each action and move the armature object instead."""
import bpy, math
from mathutils import Vector

HIP = 'pose.bones["mixamorig:Hips"].location'

def load(fbx, name):
    before = set(bpy.data.objects); acts0 = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=fbx, automatic_bone_orientation=False)
    new = [o for o in bpy.data.objects if o not in before]; act = [a for a in bpy.data.actions if a not in acts0][0]
    for o in new: bpy.data.objects.remove(o)
    act.name = name; act.use_fake_user = True
    f0, f1 = (int(round(x)) for x in act.frame_range)
    fz = act.fcurves.find(HIP, index=2); fx = act.fcurves.find(HIP, index=0)
    fwd = [fz.evaluate(f) for f in range(f0, f1 + 1)]; side = [fx.evaluate(f) for f in range(f0, f1 + 1)]
    for fc, v in ((fz, fwd[0]), (fx, side[0])):
        for k in fc.keyframe_points: k.co.y = v; k.handle_left.y = v; k.handle_right.y = v
    act['fwd'] = fwd; act['f0'] = f0; act['f1'] = f1
    return act

def pose_dist(arm, a, fa, b, fb, bones=('LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftArm', 'RightArm')):
    """how different two clip frames look (sum of leg/arm rotation angles)"""
    def q(act, f, bn):
        p = f'pose.bones["mixamorig:{bn}"].rotation_quaternion'; return [act.fcurves.find(p, index=i).evaluate(f) for i in range(4)]
    d = 0
    for bn in bones:
        qa, qb = q(a, fa, bn), q(b, fb, bn); dot = abs(sum(x * y for x, y in zip(qa, qb))); d += 2 * math.acos(min(1, dot))
    return d

def best_entry(arm, cyc, nxt, cyc_frame, search=(1, 40)):
    """the frame of `nxt` whose pose best matches `cyc` at cyc_frame (so the cut into it doesn't pop)"""
    return min(range(*search), key=lambda f: pose_dist(arm, cyc, cyc_frame, nxt, f))

def sequence(arm, steps, start_frame=1, blend=6, start_pos=(0, 0, 0), heading=0.0):
    """steps: list of (action, action_start, action_end). Lays them on the NLA back to back (each overlapping the previous
    by `blend` frames with a linear blend-in) and bakes the armature's world position from the clips' own forward travel."""
    ad = arm.animation_data or arm.animation_data_create(); ad.action = None
    for t in list(ad.nla_tracks): ad.nla_tracks.remove(t)
    tracks = [ad.nla_tracks.new() for _ in range(3)]
    f = start_frame; segs = []
    for i, (act, a0, a1) in enumerate(steps):
        st = f if i == 0 else f - blend
        s = tracks[i % 3].strips.new(act.name + str(i), int(st), act); s.action_frame_start = a0; s.action_frame_end = a1
        s.frame_start = st; s.frame_end = st + (a1 - a0)
        if i: s.blend_in = blend; s.blend_type = 'REPLACE'
        s.extrapolation = 'HOLD' if i == 0 else ('HOLD_FORWARD' if i == len(steps) - 1 else 'NOTHING')   # first strip also holds backwards (no T-pose before start)
        segs.append((st, st + (a1 - a0), act, a0)); f = st + (a1 - a0)
    end = int(f)
    # root path: per-frame forward speed = weighted mix of the active strips' own hip travel
    def vel(act, af):
        fwd = act['fwd']; i = int(af - act['f0']); i = max(0, min(len(fwd) - 2, i)); return fwd[i + 1] - fwd[i]
    pos = 0.0; out = {}
    for fr in range(start_frame, end + 40):
        ws = []
        for j, (s0, s1, act, a0) in enumerate(segs):
            if s0 <= fr <= s1 or (j == len(segs) - 1 and fr > s1):
                w = 1.0 if j == 0 else min(1.0, (fr - s0) / blend); af = min(a0 + (fr - s0), act['f1'] - 1)
                ws.append((w, vel(act, af) if fr <= s1 else 0.0, j))
        if not ws: v = 0.0
        else:
            ws.sort(key=lambda x: x[2]); v = 0.0
            for w, vv, _ in ws: v = v * (1 - w) + vv * w
        out[fr] = pos; pos += v
    d = Vector((math.sin(heading), -math.cos(heading), 0))     # rig forward is -Y at heading 0
    arm.rotation_euler = (math.pi / 2, 0, heading)
    for fr, p in out.items():
        arm.location = Vector(start_pos) + d * (p * 0.01); arm.keyframe_insert('location', frame=fr)
    for fc in arm.animation_data.action.fcurves:
        for k in fc.keyframe_points: k.interpolation = 'LINEAR'
    arm['seg_ends'] = [int(x[1]) for x in segs]
    return end, out
