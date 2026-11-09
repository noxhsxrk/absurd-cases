import bpy, sys, math, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))
from look import scene_setup, world_sky, sun, painted, box, look_at
import soi
bpy.ops.wm.read_factory_settings(use_empty=True)
pct = int(sys.argv[sys.argv.index('--pct') + 1]) if '--pct' in sys.argv else 50
sc = scene_setup(samples=48, scale=pct)
world_sky(strength=0.06); sun(elev_deg=20, azim_deg=330, energy=4.5)
soi.build()
# placeholder mannequin (no shadow) + an invisible caster one step ahead
skin = painted('skin', (0.8, 0.6, 0.45)); shirt = painted('shirt', (0.45, 0.62, 0.8), stroke_scale=10); pants = painted('pants', (0.16, 0.22, 0.36))
def mann(prefix, x, y, stride):
    parts = [box(prefix + 'head', (x, y, 1.62), (0.26, 0.24, 0.3), skin), box(prefix + 'torso', (x, y, 1.2), (0.42, 0.24, 0.56), shirt)]
    for s in (-1, 1):
        lg = box(prefix + 'leg%d' % s, (x, y + s * 0.1, 0.48), (0.15, 0.15, 0.9), pants); lg.rotation_euler = (0, s * stride * 0.4, 0); parts.append(lg)
        parts.append(box(prefix + 'arm%d' % s, (x, y + s * 0.27, 1.17), (0.1, 0.1, 0.56), shirt))
    return parts
for p in mann('man_', 0.0, 1.0, 0.0): p.visible_shadow = False
ghost = bpy.data.collections['ghosts']
for p in mann('shade_', 0.55, 1.0, 1.0):
    bpy.context.collection.objects.unlink(p); ghost.objects.link(p)
    p.visible_camera = False; p.visible_diffuse = False; p.visible_glossy = False; p.visible_transmission = False; p.visible_volume_scatter = False
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 26; cam_d.dof.use_dof = True; cam_d.dof.focus_distance = 3.2; cam_d.dof.aperture_fstop = 2.8
cam = bpy.data.objects.new('cam', cam_d); bpy.context.collection.objects.link(cam); sc.camera = cam
cam.location = (1.6, -2.4, 1.35); look_at(cam, (-0.2, 1.3, 0.75))
sc.render.filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lookdev1.png'); bpy.ops.render.render(write_still=True); print('done')
