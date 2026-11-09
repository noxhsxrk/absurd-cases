"""The shared kit every shot is built from: scene bootstrap, clip library, cast spawning, camera operator, render.
A shot file (blender/eps/<ep>.py) only says WHAT happens; this module knows HOW.

    from kit import *
    def shot_walk(S):                       # S = Shot(ctx): frames, timeline, flags
        soi.build(seed=5, clear=(-6, 6)); daylight()
        nai = S.actor('nai', start=(-4.2, 0.95), heading=EAST, moves=[('walk', 1, 37), ('walk', 1, 37)])
        S.operator(follow=nai, offset=(1.3, -3.3, 1.35), look=(1.05, 1.8, 1.1))
"""
import bpy, os, math, json
from mathutils import Vector
from look import scene_setup, world_sky, sun
import boxman, motion

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # .../blender
MIX = os.path.join(HERE, 'mixamo')
EAST, WEST, NORTH, SOUTH = math.pi / 2, -math.pi / 2, math.pi, 0.0          # heading: rig faces -Y at 0
CLIPS = {                                                                     # clip name -> Mixamo fbx (30 fps, in place after load)
    'walk': 'ep8_walk_standard.fbx', 'stop': 'ep8_walk_stop.fbx', 'idle': 'ep8_idle_standing.fbx', 'look_back': 'ep8_look_behind.fbx',
    'surprised': 'ep8_react_surprised.fbx', 'careful': 'ep8_walk_careful.fbx', 'sneak': 'ep8_walk_sneak.fbx', 'phone': 'ep8_phone_talk.fbx',
}
RIG = 'ep8_walk_standard.fbx'                                                 # the one fbx that carries the skin/bind pose
LOOKS = {'nai': boxman.NAI, 'cop': boxman.COP, 'swat': boxman.SWAT, 'judge': boxman.JUDGE, 'p1': boxman.P1, 'p2': boxman.P2}

_clips = {}
def clip(name):
    if name not in _clips: _clips[name] = motion.load(os.path.join(MIX, CLIPS[name]), name)
    return _clips[name]

def daylight(elev=28, azim=356, energy=4.6, fill=110, fill_at=(3.0, -6.0, 2.5)):
    world_sky(strength=0.06); sun(elev_deg=elev, azim_deg=azim, energy=energy, angle_deg=0.4)
    fd = bpy.data.lights.new('fill', 'AREA'); fd.energy = fill; fd.size = 6; fd.color = (0.75, 0.85, 1.0)
    fl = bpy.data.objects.new('fill', fd); bpy.context.collection.objects.link(fl); fl.location = fill_at; fl.rotation_euler = (math.radians(70), 0, 0)

class Actor:
    def __init__(self, arm, parts, path, start, heading):
        self.arm, self.parts, self.path, self.start, self.heading = arm, parts, path, Vector(start), heading
        self.ends = list(arm['seg_ends'])
    def pos(self, f):
        """world position (feet) at frame f"""
        p = self.path.get(f, self.path[max(self.path)] if f > max(self.path) else 0.0) * 0.01
        return self.start + Vector((math.sin(self.heading), -math.cos(self.heading), 0)) * p
    def face(self, keys):
        """keys: [(frame, mode)] with mode in open/half/blink/wide/talk/O"""
        modes = ('open', 'half', 'blink', 'wide', 'talk', 'O'); m = [p for p in self.parts if p.name.endswith('_head')][0].material_slots[1].material
        v = m.node_tree.nodes['mode'].outputs[0]
        for f, md in keys: v.default_value = modes.index(md); v.keyframe_insert('default_value', frame=f)
        for fc in m.node_tree.animation_data.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = 'CONSTANT'
    def blink(self, at, base='half'):
        self.face([(1, base)] + [k for f in at for k in ((f, 'blink'), (f + 2, base))])

class Shot:
    def __init__(self, name, frames, args):
        self.name, self.frames, self.args = name, frames, args
        self.cam = self.tgt = None; self.t0 = 0.0; self.EV = {}
    def ev(self, k, dt=0.0):
        """an episode event (seconds on the edit timeline) as a frame number inside this shot (frame 1 = shot start)"""
        return int(round((self.EV[k] + dt - self.t0) * 30)) + 1
    # --- cast -----------------------------------------------------------------------------------------------------
    def actor(self, who, start, heading, moves, look=None, shadow_only=False, cast_shadow=True, start_frame=1, blend=6):
        coll = bpy.data.collections['ghosts'] if shadow_only else None
        arm, parts = boxman.build(os.path.join(MIX, RIG), who, look=look or LOOKS.get(who.split('.')[0].rstrip('0123456789'), boxman.NAI), coll=coll, face=not shadow_only)
        for p in parts:
            if shadow_only:
                p.visible_camera = p.visible_diffuse = p.visible_glossy = p.visible_transmission = p.visible_volume_scatter = False
            elif not cast_shadow: p.visible_shadow = False
        steps = [(clip(c), a, b) for c, a, b in moves]
        steps = [(act, (motion.best_entry(arm, steps[i - 1][0], act, steps[i - 1][2], search=(1, max(2, b - 8))) if a == 'auto' else a), b) for i, (act, a, b) in enumerate(steps)]
        _, path = motion.sequence(arm, steps, start_frame=start_frame, blend=blend, start_pos=(start[0], start[1], start[2] if len(start) > 2 else 0.12), heading=heading)
        return Actor(arm, parts, path, (start[0], start[1], start[2] if len(start) > 2 else 0.12), heading)
    # --- camera operator ------------------------------------------------------------------------------------------
    def camera(self, lens=24, fstop=5.6):
        cd = bpy.data.cameras.new('cam'); cd.lens = lens; cd.dof.use_dof = True; cd.dof.aperture_fstop = fstop
        self.cam = bpy.data.objects.new('cam', cd); bpy.context.collection.objects.link(self.cam); bpy.context.scene.camera = self.cam
        self.tgt = bpy.data.objects.new('tgt', None); bpy.context.collection.objects.link(self.tgt)
        c = self.cam.constraints.new('TRACK_TO'); c.target = self.tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'; cd.dof.focus_object = self.tgt
        return self.cam
    def operator(self, follow=None, offset=(1.3, -3.3, 1.35), look=(1.05, 1.8, 1.1), lag=(6, 18), lens=24, fstop=5.6, path=None, breathe=0.004):
        """A camera operator: either follows an actor along x with a soft lag (holds still when they stop), or flies a
        keyed path [(frame, (pos), (look))] with eased in-betweens. `breathe` adds a tiny handheld drift (metres)."""
        if not self.cam: self.camera(lens, fstop)
        a, b = self.frames
        for f in range(a, b + 1):
            if follow:
                fx = sum(follow.pos(max(1, f - k)).x for k in range(*lag)) / (lag[1] - lag[0])
                p = (fx + offset[0], offset[1], offset[2]); t = (fx + look[0], look[1], look[2])
            else:
                p, t = _path_at(path, f)
            self.cam.location = p; self.cam.keyframe_insert('location', frame=f); self.tgt.location = t; self.tgt.keyframe_insert('location', frame=f)
        if breathe:
            for fc in self.cam.animation_data.action.fcurves:
                n = fc.modifiers.new('NOISE'); n.scale = 45; n.strength = breathe * 2; n.phase = fc.array_index * 7.3

def _ease(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
def _path_at(path, f):
    if f <= path[0][0]: return path[0][1], path[0][2]
    for (f0, p0, t0), (f1, p1, t1) in zip(path, path[1:]):
        if f0 <= f <= f1:
            k = _ease((f - f0) / max(1, f1 - f0)); L = lambda u, v: tuple(x + (y - x) * k for x, y in zip(u, v)); return L(p0, p1), L(t0, t1)
    return path[-1][1], path[-1][2]

def run(shots, argv, timeline=None):
    """entry point for an episode file: `blender -b -P eps/ep8.py -- --shot walk [--mp4] [--pct 25] [--samples n] [--still f,..] [--out dir]`"""
    arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
    name = arg('--shot'); fn = shots[name]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = scene_setup(samples=int(arg('--samples', 64)), scale=int(arg('--pct', 100)))
    dur = None; TL = None
    if timeline and os.path.exists(timeline):
        TL = json.load(open(timeline)); dur = next((s['dur'] for s in TL['shots'] if s['name'] == name), None)
    S = Shot(name, (1, int(arg('--len', 0)) or (dur + 20 if dur else 120)), argv)    # +20 frames of handle for the edit
    if TL:
        sh = next(s for s in TL['shots'] if s['name'] == name); S.t0 = sh['t0']; S.EV = TL['events']
    fn(S)
    sc.frame_start, sc.frame_end = S.frames
    out = arg('--out', os.path.join('renders', name))
    if not os.path.isabs(out): out = os.path.join(HERE, out)
    print('SHOT', name, 'frames', S.frames)
    if arg('--still'):
        for s in arg('--still').split(','):
            sc.frame_set(int(s)); sc.render.filepath = os.path.join(out, f'still_{int(s):04d}.png'); bpy.ops.render.render(write_still=True)
    else:
        r = sc.render
        if '--mp4' in argv:
            r.image_settings.file_format = 'FFMPEG'; r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'; r.ffmpeg.constant_rate_factor = 'HIGH'; r.ffmpeg.ffmpeg_preset = 'GOOD'
            r.filepath = os.path.join(out, os.path.basename(os.path.normpath(out)) + '.mp4')
        else:
            r.filepath = os.path.join(out, 'f_'); r.image_settings.file_format = 'PNG'
        bpy.ops.render.render(animation=True)
    print('SHOT DONE')
