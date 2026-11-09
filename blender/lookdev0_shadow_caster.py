import bpy, math, sys
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE_NEXT'
sc.render.resolution_x, sc.render.resolution_y = 540, 960
ee = sc.eevee; ee.use_shadows = True; ee.shadow_ray_count = 2; ee.shadow_step_count = 8
ee.use_gtao = True; ee.gtao_distance = 0.6
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
def mat(name, rgb, rough=0.8):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; return m
def box(name, loc, size, m):
    bpy.ops.mesh.primitive_cube_add(location=loc); o = bpy.context.object; o.name = name; o.scale = (size[0]/2, size[1]/2, size[2]/2); o.data.materials.append(m); return o
pave = mat('pave', (0.55, 0.53, 0.5)); road = mat('road', (0.12, 0.12, 0.13)); wall = mat('wall', (0.75, 0.68, 0.58)); shirt = mat('shirt', (0.35, 0.52, 0.72)); skin = mat('skin', (0.8, 0.58, 0.42)); pants = mat('pants', (0.12, 0.17, 0.3))
box('pavement', (0, 0, -0.06), (12, 2.4, 0.12), pave); box('road', (0, 3.2, -0.1), (12, 4, 0.1), road); box('house', (0, -2.2, 2), (12, 2, 4), wall)
def person(prefix, x, step):
    parts = []
    parts.append(box(prefix+'head', (x, 0, 1.6), (0.24, 0.26, 0.3), skin)); parts.append(box(prefix+'torso', (x, 0, 1.18), (0.4, 0.22, 0.55), shirt))
    for s in (-1, 1):
        parts.append(box(prefix+'leg%d' % s, (x + s * step * 0.12, s * 0.1, 0.45), (0.14, 0.14, 0.88), pants))
        parts.append(box(prefix+'arm%d' % s, (x - s * step * 0.1, s * 0.26, 1.15), (0.1, 0.1, 0.55), shirt))
    for p in parts:
        if p.name.startswith(prefix+'leg'): p.rotation_euler = (0, (1 if '1' in p.name[-2:] else -1) * step * 0.35, 0)
    return parts
person('man_', 0.0, 0.0)                     # the man, standing still
sh = person('shade_', 0.9, 1.0)              # an invisible body one step ahead, mid-stride: casts the shadow only
for p in sh:
    p.visible_camera = False; p.visible_diffuse = False; p.visible_glossy = False; p.visible_transmission = False; p.visible_volume_scatter = False
man = [o for o in bpy.data.objects if o.name.startswith('man_')]
for p in man: p.visible_shadow = False       # the man's own body casts no shadow (his shadow IS the shade)
bpy.ops.object.light_add(type='SUN', rotation=(math.radians(52), 0, math.radians(-115))); sun = bpy.context.object; sun.data.energy = 4.5; sun.data.angle = math.radians(2.5); sun.data.color = (1, 0.94, 0.85)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.62, 0.74, 0.88, 1); bg.inputs[1].default_value = 0.9
bpy.ops.object.camera_add(location=(2.6, 3.4, 2.6)); cam = bpy.context.object; sc.camera = cam; cam.data.lens = 28
c = cam.constraints.new('TRACK_TO'); bpy.ops.object.empty_add(location=(0.2, -0.3, 0.4)); c.target = bpy.context.object
sc.render.filepath = '/home/claude/blend/lookdev0.png'; bpy.ops.render.render(write_still=True); print('done')
