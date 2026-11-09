"""EP8 test shot: he walks along the soi pavement and stops; his shadow on the shophouse wall takes one more stride and stops
on its own. Renders a PNG sequence. usage: blender -b -P shot_shadowstep.py -- [--pct 100] [--frames a-b] [--still f] [--samples n] [--out dir]"""
import bpy, sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, 'lib'))
from look import scene_setup, world_sky, sun, look_at
import soi, boxman, motion
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
arg = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = scene_setup(samples=int(arg('--samples', 64)), scale=int(arg('--pct', 100)))
world_sky(strength=0.06); sun(elev_deg=21, azim_deg=356, energy=4.6, angle_deg=0.4)  # light almost square to the wall: the wall shadow is his side profile, stride readable
soi.build(seed=5, clear=(-6.0, 6.0))
# soft fill from the camera side so faces aren't silhouettes against the low sun
fd = bpy.data.lights.new('fill', 'AREA'); fd.energy = 180; fd.size = 6; fd.color = (0.75, 0.85, 1.0)
fl = bpy.data.objects.new('fill', fd); bpy.context.collection.objects.link(fl); fl.location = (3.0, -6.0, 2.5); fl.rotation_euler = (math.radians(70), 0, 0)
M = os.path.join(HERE, 'mixamo') + os.sep
ghost = bpy.data.collections['ghosts']
man, mparts = boxman.build(M + 'ep8_walk_standard.fbx', 'nai')
shade, sparts = boxman.build(M + 'ep8_walk_standard.fbx', 'shade', face=False, coll=ghost)
for p in mparts: p.visible_shadow = False
for p in sparts:
    p.visible_camera = False; p.visible_diffuse = False; p.visible_glossy = False; p.visible_transmission = False; p.visible_volume_scatter = False
walk = motion.load(M + 'ep8_walk_standard.fbx', 'walk'); stop = motion.load(M + 'ep8_walk_stop.fbx', 'stop'); idle = motion.load(M + 'ep8_idle_standing.fbx', 'idle')
e = motion.best_entry(man, walk, stop, 37)
START = (-4.2, 0.95, 0.12)
man_end, mp = motion.sequence(man, [(walk, 1, 37), (stop, e, 91), (idle, 1, 180)], start_pos=START, heading=math.pi / 2)
sh_end, sp = motion.sequence(shade, [(walk, 1, 37), (walk, 1, 37), (walk, 1, 37), (stop, e, 91), (idle, 1, 180)], start_pos=START, heading=math.pi / 2)
# face: deadpan half-lids, one blink
fm = bpy.data.materials['nai_face'].node_tree.nodes['mode'].outputs[0]
for f, v in ((1, 1), (70, 1), (71, 2), (73, 1), (150, 1), (151, 2), (153, 0)): fm.default_value = v; fm.keyframe_insert('default_value', frame=f)
for fc in bpy.data.materials['nai_face'].node_tree.animation_data.action.fcurves:
    for k in fc.keyframe_points: k.interpolation = 'CONSTANT'
# camera: three-quarter front from down the pavement, so his face reads and the wall shadow sits behind him in profile.
# Tracks him with a lag; when he stops it settles, then drifts to keep both him and the departing shadow in frame.
cd = bpy.data.cameras.new('cam'); cd.lens = 24; cd.dof.use_dof = True; cd.dof.aperture_fstop = 5.6
cam = bpy.data.objects.new('cam', cd); bpy.context.collection.objects.link(cam); sc.camera = cam
tgt = bpy.data.objects.new('tgt', None); bpy.context.collection.objects.link(tgt)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'; cd.dof.focus_object = tgt
man_stop = man['seg_ends'][-2]; sh_stop = shade['seg_ends'][-2]
def mx(f): return START[0] + mp.get(f, mp[max(mp)]) * 0.01
def sx(f): return START[0] + sp.get(f, sp[max(sp)]) * 0.01
T_END = sh_stop + 45
# operator follows him with a soft lag, then holds the frame still once he stops, so the shadow is the only thing moving
for f in range(1, T_END + 1):
    fx = sum(mx(max(1, f - k)) for k in range(6, 18)) / 12
    cam.location = (fx + 1.7, -2.5, 1.3); cam.keyframe_insert('location', frame=f)
    tgt.location = (fx + 1.3, 1.8, 1.1); tgt.keyframe_insert('location', frame=f)
print('man x at stop %.2f  shadow x at stop %.2f' % (mx(man_stop), sx(sh_stop)))
sc.frame_start, sc.frame_end = 1, T_END
fr = arg('--frames'); 
if fr: a, b = fr.split('-'); sc.frame_start, sc.frame_end = int(a), int(b)
out = arg('--out', os.path.join(HERE, 'renders', 'shadowstep'))
print('man stops at', man_stop, 'shadow stops at', sh_stop, 'shot', T_END)
if arg('--still'):
    for s in arg('--still').split(','):
        sc.frame_set(int(s)); sc.render.filepath = os.path.join(out, f'still_{int(s):04d}.png'); bpy.ops.render.render(write_still=True)
else:
    if '--mp4' in argv:
        r = sc.render; r.image_settings.file_format = 'FFMPEG'; r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'; r.ffmpeg.constant_rate_factor = 'HIGH'; r.ffmpeg.ffmpeg_preset = 'GOOD'
        r.filepath = os.path.join(out, 'shadowstep.mp4')
    else:
        sc.render.filepath = os.path.join(out, 'f_'); sc.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(animation=True)
print('SHOT DONE')
