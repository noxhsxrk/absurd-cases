"""Reusable interior/exterior sets for absurd-cases (each builds geometry + its own light; origin conventions in each doc).
All original designs, painted materials, built from boxes so Freestyle ink reads them."""
import bpy, math, os
from look import painted, box, world_sky, sun

TEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tex')

def img_mat(name, file, rough=0.8, emit=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; b = N['Principled BSDF']
    t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.get(file) or bpy.data.images.load(os.path.join(TEX, file))
    nt.links.new(t.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = rough
    if emit: nt.links.new(t.outputs[0], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = emit
    return m

def plane_img(name, file, loc, size, rot=(math.pi / 2, 0, 0), rough=0.8, emit=0.0):
    """an image card (e.g. a sign) of size (w, h) metres; default faces -Y"""
    bpy.ops.mesh.primitive_plane_add(size=1); o = bpy.context.active_object; o.name = name
    o.scale = (size[0], size[1], 1); o.location = loc; o.rotation_euler = rot; o.data.materials.append(img_mat(name + '_m', file, rough, emit))
    return o

def area(name, loc, rot, energy, size, color=(1, 1, 1), shape='RECTANGLE', size_y=None):
    d = bpy.data.lights.new(name, 'AREA'); d.energy = energy; d.size = size; d.color = color
    if size_y: d.shape = shape; d.size_y = size_y
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = rot; return o

def point(name, loc, energy, color=(1, 1, 1), radius=0.1):
    d = bpy.data.lights.new(name, 'POINT'); d.energy = energy; d.color = color; d.shadow_soft_size = radius
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc; return o

def spot(name, loc, rot, energy, angle_deg, blend=0.3, color=(1, 1, 1), radius=0.05):
    d = bpy.data.lights.new(name, 'SPOT'); d.energy = energy; d.spot_size = math.radians(angle_deg); d.spot_blend = blend; d.color = color; d.shadow_soft_size = radius
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = rot; return o

# ---------------------------------------------------------------------------------------------------------------------
def interrogation():
    """4.4 x 4 m room, origin at floor centre; table at origin (long axis X), suspect side +Y (back wall y=2), cop side -Y.
    Open toward -Y (camera side) beyond y=-2.2. Returns dict with the lamp parts for animation."""
    world_sky(strength=0.0)
    wall = painted('iw_wall', (0.46, 0.52, 0.47), var=0.10, stroke_scale=5); band = painted('iw_band', (0.26, 0.31, 0.29), var=0.1, stroke_scale=5)
    floor = painted('iw_floor', (0.30, 0.30, 0.29), var=0.12, stroke_scale=2); ceil = painted('iw_ceil', (0.55, 0.56, 0.53), var=0.05)
    metal = painted('iw_metal', (0.42, 0.44, 0.45), var=0.06, rough=0.35); dark = painted('iw_dark', (0.04, 0.05, 0.06), var=0.02, rough=0.08)
    seat = painted('iw_seat', (0.18, 0.2, 0.22), var=0.05, rough=0.5)
    box('floor', (0, 0, -0.05), (6, 6, 0.1), floor, bevel=0)
    for i in range(-7, 8): box('ft%d' % i, (i * 0.4, 0, 0.001), (0.01, 6, 0.002), band, bevel=0)
    box('backwall', (0, 2.05, 1.5), (6, 0.1, 3.0), wall, bevel=0); box('backband', (0, 1.995, 0.5), (6, 0.02, 1.0), band, bevel=0)
    for sx in (-1, 1):
        box('side%d' % sx, (sx * 2.25, 0, 1.5), (0.1, 6, 3.0), wall, bevel=0); box('sideband%d' % sx, (sx * 2.195, 0, 0.5), (0.02, 6, 1.0), band, bevel=0)
    box('ceiling', (0, 0, 3.0), (6, 6, 0.1), ceil, bevel=0)
    # one-way mirror on the left wall, door on the right wall
    box('mirror', (-2.19, 0.2, 1.55), (0.02, 1.8, 0.9), dark, bevel=0); box('mirrorframe', (-2.185, 0.2, 1.55), (0.025, 1.9, 1.0), metal, bevel=0.005)
    box('door', (2.19, 1.0, 1.05), (0.03, 0.95, 2.1), metal, bevel=0.01); box('doorwin', (2.17, 1.0, 1.55), (0.02, 0.25, 0.35), dark, bevel=0)
    box('knob', (2.16, 0.62, 1.0), (0.04, 0.08, 0.04), dark, bevel=0.01)
    plane_img('sign_interro', 'sign_interro.png', (0, 1.99, 2.45), (0.7, 0.18))
    # table + chairs
    box('tabletop', (0, 0, 0.74), (1.5, 0.85, 0.04), metal, bevel=0.01)
    for sx in (-1, 1):
        for sy in (-1, 1): box('tleg%d%d' % (sx, sy), (sx * 0.68, sy * 0.36, 0.36), (0.04, 0.04, 0.72), metal, bevel=0.005)
    for sy, nm in ((1, 'suspect'), (-1, 'cop')):
        y = sy * 0.75
        box(nm + '_seat', (0, y, 0.45), (0.46, 0.44, 0.05), seat, bevel=0.01); box(nm + '_back', (0, y + sy * 0.21, 0.72), (0.46, 0.04, 0.5), seat, bevel=0.01)
        for sx in (-1, 1):
            for sz in (-1, 1): box(nm + '_l%d%d' % (sx, sz), (sx * 0.2, y + sz * 0.19, 0.22), (0.03, 0.03, 0.45), metal, bevel=0)
    box('folder', (0.35, -0.12, 0.765), (0.3, 0.22, 0.012), painted('iw_folder', (0.75, 0.62, 0.38), var=0.05), rot=(0, 0, 0.12), bevel=0.002)
    box('cup', (-0.5, -0.2, 0.81), (0.08, 0.08, 0.1), painted('iw_cup', (0.86, 0.85, 0.8), var=0.03), bevel=0.01)
    # desk lamp on the cop side, head aimed at the suspect chair; 'lamp_head' rotates, 'lamp_bulb' emission keyed by the shot
    base = box('lamp_base', (-0.35, -0.2, 0.78), (0.16, 0.16, 0.03), dark, bevel=0.01)
    box('lamp_arm', (-0.35, -0.2, 0.98), (0.025, 0.025, 0.4), dark, bevel=0)
    head = bpy.data.objects.new('lamp_head', None); bpy.context.collection.objects.link(head); head.location = (-0.35, -0.2, 1.18)
    shade = box('lamp_shade', (0, 0.1, -0.02), (0.18, 0.22, 0.12), dark, bevel=0.02); shade.parent = head
    bulbm = bpy.data.materials.new('lamp_bulb'); bulbm.use_nodes = True; bn = bulbm.node_tree.nodes['Principled BSDF']
    bn.inputs['Base Color'].default_value = (1, 0.95, 0.8, 1); bn.inputs['Emission Color'].default_value = (1, 0.93, 0.78, 1); bn.inputs['Emission Strength'].default_value = 0.0
    bulb = box('lamp_bulb', (0, 0.205, -0.03), (0.14, 0.01, 0.09), bulbm, bevel=0); bulb.parent = head
    lamp = spot('lamp_light', (0, 0.22, -0.03), (math.radians(-90), 0, 0), 0.0, 55, blend=0.4, color=(1, 0.92, 0.75), radius=0.04); lamp.parent = head
    # room light: one dim fluorescent tube, cold
    box('tube', (0, 0.3, 2.95), (1.2, 0.12, 0.05), painted('iw_tube', (0.9, 0.95, 1.0), var=0.0), bevel=0.01)
    area('tube_light', (0, 0.3, 2.9), (0, 0, 0), 120, 1.2, color=(0.82, 0.92, 1.0), size_y=0.2)
    area('bounce', (0, -3.0, 1.6), (math.radians(90), 0, 0), 35, 3.0, color=(0.7, 0.8, 0.9))
    return dict(head=head, bulb=bulbm, light=lamp.data)

def lamp_on(L, frame, on, energy=320):
    L['light'].energy = energy if on else 0.0; L['light'].keyframe_insert('energy', frame=frame)
    s = L['bulb'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']; s.default_value = 12.0 if on else 0.0; s.keyframe_insert('default_value', frame=frame)

# ---------------------------------------------------------------------------------------------------------------------
def courtroom():
    """origin floor centre; judge bench at +Y (back, raised), dock (accused box) at -X front-left, gallery benches toward -Y.
    Warm daylight through tall windows on +X."""
    world_sky(strength=0.0)
    wood = painted('ct_wood', (0.36, 0.20, 0.10), var=0.12, stroke_scale=18, stroke_dir=0.0, rough=0.5)
    woodd = painted('ct_woodd', (0.22, 0.12, 0.06), var=0.1, stroke_scale=18, rough=0.45)
    wall = painted('ct_wall', (0.80, 0.74, 0.62), var=0.06, stroke_scale=4); floor = painted('ct_floor', (0.42, 0.30, 0.20), var=0.12, stroke_scale=24, stroke_dir=1.57, rough=0.4)
    red = painted('ct_red', (0.45, 0.06, 0.06), var=0.08, rough=0.7); gold = painted('ct_gold', (0.75, 0.56, 0.22), var=0.06, rough=0.3)
    box('floor', (0, 0, -0.05), (12, 12, 0.1), floor, bevel=0)
    box('backwall', (0, 3.6, 2.5), (12, 0.1, 5), wall, bevel=0); box('wainscot', (0, 3.54, 0.7), (12, 0.04, 1.4), wood, bevel=0)
    for sx in (-1, 1): box('sidewall%d' % sx, (sx * 5.0, 0, 2.5), (0.1, 12, 5), wall, bevel=0)
    box('ceiling', (0, 0, 5.0), (12, 12, 0.1), painted('ct_ceil', (0.85, 0.80, 0.70), var=0.04), bevel=0)
    for i in range(3):
        y = -2.0 + i * 2.0
        box('win%d' % i, (4.94, y, 2.4), (0.04, 1.0, 2.4), painted('ct_glass', (0.95, 0.92, 0.8), var=0.0, rough=0.1), bevel=0)
        box('winframe%d' % i, (4.93, y, 2.4), (0.05, 1.1, 2.5), woodd, bevel=0.01)
    # dais + bench
    box('dais', (0, 2.6, 0.3), (5.0, 1.8, 0.6), woodd, bevel=0.01); box('bench', (0, 2.2, 1.1), (4.0, 0.5, 1.0), wood, bevel=0.015)
    box('benchtop', (0, 2.2, 1.62), (4.2, 0.65, 0.05), woodd, bevel=0.01)
    for k in range(5): box('benchpanel%d' % k, (-1.6 + k * 0.8, 1.94, 1.1), (0.6, 0.02, 0.7), woodd, bevel=0.01)
    box('chairback', (0, 2.95, 1.75), (0.8, 0.12, 1.5), red, bevel=0.03)
    # emblem: an original round plaque (not a real seal)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.55, depth=0.05, location=(0, 3.5, 3.4), rotation=(math.pi / 2, 0, 0)); e = bpy.context.active_object; e.name = 'emblem'; e.data.materials.append(gold)
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.42, depth=0.06, location=(0, 3.48, 3.4), rotation=(math.pi / 2, 0, 0)); e2 = bpy.context.active_object; e2.data.materials.append(red)
    plane_img('sign_court', 'sign_court.png', (0, 1.925, 1.3), (1.2, 0.32), rot=(math.pi / 2, 0, 0))
    box('curtainL', (-2.4, 3.45, 2.6), (0.6, 0.1, 3.4), red, bevel=0.02); box('curtainR', (2.4, 3.45, 2.6), (0.6, 0.1, 3.4), red, bevel=0.02)
    # gavel + block + a durian on the bench
    box('gavel_block', (0.55, 2.05, 1.66), (0.18, 0.12, 0.03), woodd, bevel=0.005)
    gav = bpy.data.objects.new('gavel', None); bpy.context.collection.objects.link(gav); gav.location = (0.75, 2.05, 1.7)
    g1 = box('gavel_handle', (-0.12, 0, 0.0), (0.26, 0.03, 0.03), wood, bevel=0.005); g1.parent = gav
    g2 = box('gavel_head', (-0.26, 0, 0.0), (0.06, 0.07, 0.15), woodd, bevel=0.01); g2.parent = gav; g2.rotation_euler = (math.pi / 2, 0, 0)
    dur = durian((-0.9, 2.1, 1.75), 0.14)
    # dock for the accused (front left) + rail; gallery benches
    box('dock', (-2.6, -0.4, 0.5), (1.2, 1.0, 1.0), wood, bevel=0.015); box('dockrail', (-2.6, -0.4, 1.05), (1.25, 1.05, 0.06), woodd, bevel=0.01)
    box('dockfloor', (-2.6, -0.4, 1.02), (1.1, 0.9, 0.02), woodd, bevel=0)
    for r in range(3):
        y = -2.2 - r * 1.0
        box('pew%d' % r, (1.0, y, 0.45), (5.0, 0.45, 0.06), wood, bevel=0.01); box('pewb%d' % r, (1.0, y - 0.22, 0.75), (5.0, 0.05, 0.6), wood, bevel=0.01)
    # light: warm sun through windows + soft fill
    area('winlight', (6.5, 0, 3.0), (0, math.radians(-70), 0), 900, 5.0, color=(1.0, 0.86, 0.66))
    area('fill', (0, -6, 3.0), (math.radians(65), 0, 0), 220, 6.0, color=(0.92, 0.9, 0.86))
    area('benchkey', (0.5, 0.0, 4.4), (math.radians(20), 0, 0), 160, 2.0, color=(1.0, 0.92, 0.8))
    return dict(gavel=gav, durian=dur)

def durian(loc, r):
    """a durian: a green-brown ball covered in short pyramid spikes"""
    m = painted('durian', (0.42, 0.42, 0.14), var=0.15, rough=0.7); bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=r, location=loc)
    o = bpy.context.active_object; o.name = 'durian'; o.data.materials.append(m); o.scale = (1, 0.92, 1.12)
    import bmesh
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.poke(bm, faces=bm.faces[:])
    for v in bm.verts:
        if len(v.link_edges) == 3: v.co *= 1.18
    bm.to_mesh(o.data); bm.free(); return o

# ---------------------------------------------------------------------------------------------------------------------
def prison_front(clock='sign_clock10.png'):
    """street in front of a prison: high wall along +Y (y=4) with razor wire and a watchtower, pavement y in [0, 4],
    road y < 0; bus-stop shelter at x in [-1.5, 1.5] (bench at y~2.9, roof 2.6 m); sun from the road side (set by the shot)."""
    world_sky(strength=0.06)
    wallm = painted('pr_wall', (0.62, 0.62, 0.58), var=0.12, stroke_scale=5); trim = painted('pr_trim', (0.48, 0.48, 0.46), var=0.08)
    asphalt = painted('asphalt', (0.11, 0.11, 0.12), var=0.04, stroke_scale=1.5, rough=0.95); pave = painted('pr_pave', (0.64, 0.6, 0.54), var=0.07, stroke_scale=3)
    kerb_r = painted('kerb_r', (0.62, 0.12, 0.10), var=0.06); kerb_w = painted('kerb_w', (0.86, 0.85, 0.80), var=0.05)
    metal = painted('pr_metal', (0.30, 0.32, 0.34), var=0.05, rough=0.4); blue = painted('pr_blue', (0.10, 0.26, 0.52), var=0.06, rough=0.5)
    roof = painted('pr_roof', (0.85, 0.86, 0.84), var=0.04, rough=0.4)
    box('road', (0, -3.5, -0.05), (60, 7, 0.1), asphalt, bevel=0); box('pave', (0, 2.0, 0.06), (60, 4.0, 0.12), pave, bevel=0.004)
    joint = painted('pr_joint', (0.32, 0.3, 0.27), var=0.02)
    for i in range(-75, 76): box('pj%d' % i, (i * 0.4, 2.0, 0.121), (0.012, 4.0, 0.002), joint, bevel=0)
    for k in range(10): box('pjy%d' % k, (0, k * 0.4, 0.121), (60, 0.012, 0.002), joint, bevel=0)
    for i in range(-30, 30): box('kerb%d' % i, (i * 1.0 + 0.5, 0.0, 0.09), (1.0, 0.18, 0.2), kerb_r if i % 2 else kerb_w, bevel=0.01)
    box('pwall', (0, 4.5, 3.0), (60, 1.0, 6.0), wallm, bevel=0.02); box('pwalltop', (0, 4.5, 6.05), (60, 1.1, 0.12), trim, bevel=0.01)
    for i in range(-14, 15): box('pil%d' % i, (i * 2.0, 3.98, 3.0), (0.3, 0.06, 6.0), trim, bevel=0.01)
    # razor wire: a row of ring coils along the top
    wire = painted('pr_wire', (0.6, 0.62, 0.64), var=0.02, rough=0.25)
    for i in range(-60, 61):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.008, location=(i * 0.25, 4.3, 6.35), rotation=(0, math.pi / 2, 0.3 * ((i % 3) - 1)))
        bpy.context.active_object.data.materials.append(wire)
    # watchtower (left) and gate (right)
    box('tower', (-9.0, 5.2, 4.5), (2.2, 2.2, 9.0), wallm, bevel=0.02); box('towercab', (-9.0, 5.2, 9.4), (2.8, 2.8, 1.4), trim, bevel=0.02)
    box('towerwin', (-9.0, 3.79, 9.4), (2.2, 0.02, 0.6), painted('pr_glass', (0.05, 0.07, 0.09), var=0, rough=0.1), bevel=0)
    box('towerroof', (-9.0, 5.2, 10.2), (3.2, 3.2, 0.2), trim, bevel=0.02)
    box('gate', (8.0, 3.96, 2.4), (4.0, 0.1, 4.8), metal, bevel=0.01)
    for k in range(9): box('gatebar%d' % k, (6.2 + k * 0.45, 3.9, 2.4), (0.06, 0.06, 4.6), trim, bevel=0)
    plane_img('sign_prison', 'sign_prison.png', (8.0, 3.89, 5.3), (3.2, 0.6))
    # bus-stop shelter
    for sx in (-1, 1):
        box('bs_post%d' % sx, (sx * 1.4, 3.3, 1.3), (0.08, 0.08, 2.6), metal, bevel=0.005)
        box('bs_postf%d' % sx, (sx * 1.4, 2.3, 1.3), (0.08, 0.08, 2.6), metal, bevel=0.005)
    box('bs_roof', (0, 2.8, 2.65), (3.2, 1.4, 0.06), roof, bevel=0.01, rot=(math.radians(-4), 0, 0))
    box('bs_back', (0, 3.32, 1.4), (2.8, 0.03, 1.6), painted('pr_glass2', (0.70, 0.78, 0.82), var=0.02, rough=0.08), bevel=0)
    box('bs_bench', (0, 3.0, 0.55), (2.4, 0.4, 0.05), blue, bevel=0.01)
    for sx in (-1, 0, 1): box('bs_benchleg%d' % sx, (sx * 1.0, 3.0, 0.33), (0.05, 0.3, 0.42), metal, bevel=0)
    box('bs_signpost', (1.9, 1.0, 1.5), (0.08, 0.08, 3.0), metal, bevel=0.005)
    plane_img('sign_busstop', 'sign_busstop.png', (1.9, 0.95, 2.75), (0.9, 0.3))
    plane_img('bs_clock', clock, (-1.0, 2.15, 2.4), (0.36, 0.18), emit=1.5)
    box('bs_clockbox', (-1.0, 2.18, 2.4), (0.42, 0.04, 0.24), metal, bevel=0.005)
    return {}
