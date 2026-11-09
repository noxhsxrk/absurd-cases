"""Thai soi street set (the man's house front, EP8): row of 2-storey shophouses with roller shutters, balconies, AC units,
signboards, potted plants; tiled pavement with a red/white kerb; asphalt with worn lines; power poles + cables kept out of the
action lane. Pavement runs along +x at y in [0, 2.4] (house fronts at y = 2.4), road at y < 0."""
import bpy, math, random
from look import painted, box

def build(seed=3, length=40.0):
    rnd = random.Random(seed)
    asphalt = painted('asphalt', (0.11, 0.11, 0.12), var=0.12, stroke_scale=1.5, rough=0.95)
    pave = painted('pave', (0.62, 0.58, 0.52), var=0.07, stroke_scale=3)
    kerb_r = painted('kerb_r', (0.62, 0.12, 0.10), var=0.06); kerb_w = painted('kerb_w', (0.86, 0.85, 0.80), var=0.05)
    line = painted('roadline', (0.9, 0.86, 0.6), var=0.1)
    box('road', (0, -3.5, -0.05), (length, 7, 0.1), asphalt, bevel=0)
    box('pavement', (0, 1.2, 0.06), (length, 2.4, 0.12), pave, bevel=0.004)
    # tile joints: thin dark strips every 0.4 m
    joint = painted('joint', (0.38, 0.35, 0.31), var=0.04)
    for i in range(int(length / 0.4)):
        box('j%d' % i, (-length / 2 + i * 0.4, 1.2, 0.121), (0.012, 2.4, 0.002), joint, bevel=0)
    for k, y in enumerate([0.4, 0.8, 1.2, 1.6, 2.0]):
        box('jy%d' % k, (0, y, 0.121), (length, 0.012, 0.002), joint, bevel=0)
    for i in range(int(length / 1.0)):
        box('kerb%d' % i, (-length / 2 + i + 0.5, -0.06, 0.07), (1.0, 0.14, 0.16), kerb_r if i % 2 else kerb_w, bevel=0.01)
    for i in range(int(length / 4)):
        box('dash%d' % i, (-length / 2 + i * 4 + 1, -3.5, 0.002), (2.0, 0.12, 0.004), line, bevel=0)
    # shophouses
    walls = [(0.80, 0.72, 0.60), (0.72, 0.78, 0.74), (0.86, 0.80, 0.66), (0.70, 0.68, 0.74), (0.84, 0.70, 0.62)]
    W = 4.2
    for i in range(int(length / W)):
        x0 = -length / 2 + i * W + W / 2; wall = painted('wall%d' % (i % 5), walls[i % 5], var=0.09, stroke_scale=4, stroke_dir=1.57)
        box('house%d' % i, (x0, 2.4 + 5, 3.6), (W - 0.04, 10, 7.2), wall, bevel=0.02)
        shutter = painted('shutter%d' % (i % 3), [(0.55, 0.58, 0.6), (0.45, 0.52, 0.56), (0.6, 0.6, 0.58)][i % 3], var=0.06, stroke_scale=40, stroke_dir=0.0)
        open_ = rnd.random() < 0.35
        if not open_:
            box('shut%d' % i, (x0, 2.395, 1.5), (W - 0.6, 0.04, 2.9), shutter, bevel=0.003)
            for r in range(14): box('rib%d_%d' % (i, r), (x0, 2.37, 0.15 + r * 0.2), (W - 0.6, 0.02, 0.02), shutter, bevel=0)
        else:
            dark = painted('interior', (0.12, 0.11, 0.1), var=0.1)
            box('door%d' % i, (x0, 2.43, 1.5), (W - 0.6, 0.02, 2.9), dark, bevel=0)
        trim = painted('trim', (0.92, 0.9, 0.86), var=0.04)
        box('lintel%d' % i, (x0, 2.32, 3.05), (W, 0.18, 0.2), trim, bevel=0.01)
        # balcony + windows
        box('balc%d' % i, (x0, 1.95, 3.25), (W - 0.2, 0.9, 0.1), trim, bevel=0.01)
        rail = painted('rail', (0.2, 0.22, 0.24), var=0.05, rough=0.5)
        for r in range(9): box('bar%d_%d' % (i, r), (x0 - W / 2 + 0.3 + r * (W - 0.6) / 8, 1.52, 3.75), (0.03, 0.03, 0.9), rail, bevel=0)
        box('handrail%d' % i, (x0, 1.52, 4.22), (W - 0.4, 0.05, 0.05), rail, bevel=0)
        glass = painted('glass', (0.18, 0.26, 0.32), var=0.1, rough=0.15)
        for s in (-1, 1): box('win%d_%d' % (i, s), (x0 + s * 0.9, 2.39, 4.4), (1.2, 0.04, 1.4), glass, bevel=0.005)
        # AC unit + sign
        if rnd.random() < 0.7: box('ac%d' % i, (x0 + rnd.choice([-1.2, 1.2]), 2.15, 5.9), (0.8, 0.45, 0.55), painted('ac', (0.86, 0.86, 0.84), var=0.05), bevel=0.02)
        if rnd.random() < 0.6:
            sc = [(0.75, 0.2, 0.15), (0.15, 0.35, 0.6), (0.9, 0.7, 0.2)][rnd.randrange(3)]
            box('sign%d' % i, (x0, 2.28, 3.6), (W * 0.7, 0.06, 0.45), painted('sign%d' % i, sc, var=0.08), bevel=0.01)
        # potted plant
        if rnd.random() < 0.5:
            pot = painted('pot', (0.55, 0.3, 0.2), var=0.08); leaf = painted('leaf', (0.2, 0.42, 0.22), var=0.15, stroke_scale=12)
            px = x0 + rnd.uniform(-1.5, 1.5)
            box('pot%d' % i, (px, 2.15, 0.32), (0.34, 0.34, 0.4), pot, bevel=0.03)
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.38, location=(px, 2.12, 0.8)); o = bpy.context.object; o.data.materials.append(leaf); o.scale = (1, 1, 1.15)
    # power poles (well behind the action lane, on the kerb line) + cables
    concrete = painted('pole', (0.62, 0.6, 0.56), var=0.06)
    for x in (-14, 6, 18):
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.13, depth=9, location=(x, 0.15, 4.5)); o = bpy.context.object; o.data.materials.append(concrete)
    cable = painted('cable', (0.05, 0.05, 0.05), var=0.0, rough=0.6)
    for k in range(3):
        bpy.ops.curve.primitive_bezier_curve_add(location=(0, 0, 0)); c = bpy.context.object; c.data.bevel_depth = 0.012
        sp = c.data.splines[0]; p0, p1 = sp.bezier_points
        p0.co = (-14, 0.15 + k * 0.25, 8.4 - k * 0.15); p1.co = (6, 0.15 + k * 0.25, 8.4 - k * 0.15)
        p0.handle_right = (-8, 0.15 + k * 0.25, 7.3); p1.handle_left = (0, 0.15 + k * 0.25, 7.3); p0.handle_left = p0.co; p1.handle_right = p1.co
        c.data.materials.append(cable)
