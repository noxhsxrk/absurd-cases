"""Thai housing-estate street (หมู่บ้านจัดสรร): a 6 m road along x (y in [-3, 3]) with low concrete kerbs, grass verges and
footpaths, detached 2-storey houses on both sides behind low walls with sliding metal gates, small front yards with trees,
street lamps and power poles. Original design, painted boxes for the Freestyle ink.
Light: `sun_along_road()` — afternoon sun from +x (azim 90) so shadows lie ALONG the road, never across it from the houses."""
import bpy, math, random
from look import painted, box, world_sky, sun

ROAD_W = 6.0
PASTEL = [(0.86, 0.82, 0.66), (0.78, 0.84, 0.74), (0.88, 0.78, 0.68), (0.80, 0.80, 0.78), (0.86, 0.84, 0.72), (0.74, 0.80, 0.84)]
ROOFS = [(0.55, 0.24, 0.16), (0.30, 0.36, 0.44), (0.42, 0.20, 0.14), (0.36, 0.38, 0.36)]

def sun_along_road(elev=38, energy=4.6):
    world_sky(strength=0.07); sun(elev_deg=elev, azim_deg=90, energy=energy, angle_deg=0.5)
    d = bpy.data.lights.new('skyfill', 'AREA'); d.energy = 260; d.size = 30; d.color = (0.72, 0.82, 1.0)
    o = bpy.data.objects.new('skyfill', d); bpy.context.collection.objects.link(o); o.location = (0, 0, 14)

def _roof(name, loc, w, d, h, mat, along_x=True):
    """a pitched roof: a triangular prism (ridge along x), overhanging the walls"""
    import bmesh
    me = bpy.data.meshes.new(name); bm = bmesh.new(); hw, hd = w / 2, d / 2
    v = [bm.verts.new(p) for p in ((-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0), (-hw, 0, h), (hw, 0, h))]
    for f in ((0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)): bm.faces.new([v[i] for i in f])
    bm.normal_update(); bm.to_mesh(me); bm.free(); me.materials.append(mat)
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o); o.location = loc
    if not along_x: o.rotation_euler = (0, 0, math.pi / 2)
    return o

def house(i, x, side, rnd):
    """one detached house centred at x on side +1 (y>0) or -1; front faces the road"""
    s = side; W = rnd.uniform(7.0, 8.5); D = 8.0; y0 = s * (ROAD_W / 2 + 1.6 + 1.0 + 4.0)      # verge+path, wall, yard
    wall = painted(f'h{i}_wall', rnd.choice(PASTEL), var=0.08, stroke_scale=5); trim = painted('h_trim', (0.93, 0.92, 0.88), var=0.03)
    roof = painted(f'h{i}_roof', rnd.choice(ROOFS), var=0.12, stroke_scale=14, rough=0.6)
    glass = painted('h_glass', (0.16, 0.22, 0.26), var=0.05, rough=0.08); frame = painted('h_frame', (0.32, 0.22, 0.14), var=0.06)
    yc = y0 + s * D / 2
    box(f'h{i}_body', (x, yc, 3.0), (W, D, 6.0), wall, bevel=0.03)
    box(f'h{i}_slab', (x, yc, 3.05), (W + 0.3, D + 0.3, 0.18), trim, bevel=0.01)
    _roof(f'h{i}_roof', (x, yc, 6.0), W + 1.0, D + 1.2, 2.2, roof)
    fy = y0 - s * 0.02          # front face
    for k, wx in enumerate((-W * 0.28, W * 0.28)):
        for fl, z in ((0, 1.6), (1, 4.4)):
            if fl == 0 and k == 0: continue
            box(f'h{i}_win{k}{fl}', (x + wx, fy, z), (1.6, 0.06, 1.3), glass, bevel=0.005)
            box(f'h{i}_winf{k}{fl}', (x + wx, fy - s * 0.01, z), (1.75, 0.05, 1.45), frame, bevel=0.005)
            box(f'h{i}_sill{k}{fl}', (x + wx, fy - s * 0.08, z - 0.72), (1.9, 0.16, 0.06), trim, bevel=0.005)
    box(f'h{i}_door', (x - W * 0.28, fy, 1.1), (1.0, 0.06, 2.2), frame, bevel=0.01)
    box(f'h{i}_porch', (x - W * 0.28, y0 - s * 0.8, 2.5), (2.2, 1.8, 0.12), roof, bevel=0.01)
    for px in (-1, 1): box(f'h{i}_pp{px}', (x - W * 0.28 + px * 1.0, y0 - s * 1.6, 1.25), (0.14, 0.14, 2.5), trim, bevel=0.01)
    box(f'h{i}_ac', (x + W * 0.28, fy - s * 0.25, 3.2), (0.8, 0.3, 0.55), trim, bevel=0.02)
    # yard: grass, a tree, front wall with a sliding gate
    grass = painted('grass', (0.30, 0.42, 0.18), var=0.15, stroke_scale=40)
    box(f'h{i}_yard', (x, s * (ROAD_W / 2 + 2.6 + 2.0), 0.05), (W + 1.0, 4.0, 0.1), grass, bevel=0)
    wy = s * (ROAD_W / 2 + 2.6); fence = painted('h_fence', (0.90, 0.88, 0.82), var=0.05, stroke_scale=5)
    gate = painted('h_gate', (0.20, 0.22, 0.24), var=0.04, rough=0.4)
    box(f'h{i}_fenceL', (x - W * 0.35, wy, 0.6), (W * 0.3 + 0.6, 0.18, 1.2), fence, bevel=0.01)
    box(f'h{i}_fenceR', (x + W * 0.3, wy, 0.6), (W * 0.4, 0.18, 1.2), fence, bevel=0.01)
    for b in range(10): box(f'h{i}_gb{b}', (x - 0.6 + b * 0.25 - 0.6, wy, 0.75), (0.04, 0.05, 1.4), gate, bevel=0)
    box(f'h{i}_gtop', (x - 1.2 + 0.6 - 0.6 + 1.1, wy, 1.42), (2.6, 0.06, 0.06), gate, bevel=0)
    if rnd.random() < 0.85: tree(f'h{i}_tree', (x + W * 0.32, s * (ROAD_W / 2 + 4.6), 0.1), rnd)

def tree(name, loc, rnd):
    trunk = painted('trunk', (0.30, 0.22, 0.15), var=0.1, stroke_scale=20, stroke_dir=1.57)
    leaf = painted('leaf%d' % rnd.randint(0, 2), rnd.choice([(0.22, 0.36, 0.14), (0.26, 0.40, 0.16), (0.20, 0.32, 0.15)]), var=0.18, stroke_scale=25, rough=0.8)
    h = rnd.uniform(2.6, 3.6); box(name + '_t', (loc[0], loc[1], loc[2] + h / 2), (0.22, 0.22, h), trunk, bevel=0.02)
    for k in range(5):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=rnd.uniform(0.8, 1.3), location=(loc[0] + rnd.uniform(-0.8, 0.8), loc[1] + rnd.uniform(-0.8, 0.8), loc[2] + h + rnd.uniform(-0.2, 0.9)))
        o = bpy.context.active_object; o.name = f'{name}_c{k}'; o.data.materials.append(leaf)

def build(seed=3, x0=-30, x1=30, clear=None):
    rnd = random.Random(seed)
    asphalt = painted('v_asphalt', (0.20, 0.20, 0.21), var=0.05, stroke_scale=1.5, rough=0.9)
    kerb = painted('v_kerb', (0.76, 0.75, 0.72), var=0.06); path = painted('v_path', (0.66, 0.63, 0.58), var=0.07, stroke_scale=3)
    grass = painted('grass', (0.30, 0.42, 0.18), var=0.15, stroke_scale=40); line = painted('v_line', (0.92, 0.90, 0.80), var=0.04)
    L = x1 - x0; cx = (x0 + x1) / 2
    box('v_road', (cx, 0, -0.05), (L + 40, ROAD_W, 0.1), asphalt, bevel=0)
    box('v_ground', (cx, 0, -0.12), (L + 80, 120, 0.1), grass, bevel=0)
    for k in range(int(L / 3)): box(f'v_dash{k}', (x0 + k * 3.0, 0, 0.002), (1.4, 0.10, 0.004), line, bevel=0)
    for s in (-1, 1):
        box(f'v_kerb{s}', (cx, s * (ROAD_W / 2 + 0.08), 0.06), (L + 40, 0.16, 0.14), kerb, bevel=0.01)
        box(f'v_verge{s}', (cx, s * (ROAD_W / 2 + 0.6), 0.04), (L + 40, 0.9, 0.08), grass, bevel=0)
        box(f'v_path{s}', (cx, s * (ROAD_W / 2 + 1.6), 0.06), (L + 40, 1.1, 0.12), path, bevel=0.005)
        for k in range(int((L + 40) / 0.6)): box(f'v_pj{s}{k}', (x0 - 20 + k * 0.6, s * (ROAD_W / 2 + 1.6), 0.121), (0.012, 1.1, 0.002), kerb, bevel=0)
    # houses: alternate widths, both sides
    i = 0
    for s in (-1, 1):
        x = x0 + rnd.uniform(0, 4)
        while x < x1:
            house(i, x, s, rnd); i += 1; x += rnd.uniform(9.5, 11.0)
    # street lamps on the +y verge, power poles + cables on the -y verge
    metal = painted('v_metal', (0.42, 0.43, 0.44), var=0.05, rough=0.4); conc = painted('v_conc', (0.62, 0.61, 0.58), var=0.08)
    lampm = painted('v_lamp', (0.95, 0.93, 0.85), var=0.02)
    for k, x in enumerate(range(int(x0) + 6, int(x1), 18)):
        if clear and clear[0] - 1 < x < clear[1] + 1: continue
        box(f'v_lpole{k}', (x, ROAD_W / 2 + 0.5, 3.2), (0.12, 0.12, 6.4), metal, bevel=0.01)
        box(f'v_larm{k}', (x, ROAD_W / 2 - 0.3, 6.3), (0.08, 1.6, 0.08), metal, bevel=0)
        box(f'v_lhead{k}', (x, ROAD_W / 2 - 1.05, 6.2), (0.25, 0.5, 0.12), lampm, bevel=0.02)
    for k, x in enumerate(range(int(x0) + 2, int(x1), 24)):
        if clear and clear[0] - 1 < x < clear[1] + 1: continue
        box(f'v_ppole{k}', (x, -(ROAD_W / 2 + 0.5), 4.5), (0.26, 0.26, 9.0), conc, bevel=0.02)
        box(f'v_pbar{k}', (x, -(ROAD_W / 2 + 0.5), 8.4), (0.1, 1.6, 0.1), conc, bevel=0)
    # one parked pickup on the far side, a wheelie bin, a dog-shaped nothing (keep the street quiet)
    car = painted('v_car', (0.72, 0.74, 0.76), var=0.05, rough=0.35); tyre = painted('v_tyre', (0.05, 0.05, 0.05), var=0.02)
    cxp = (x1 - 6) if not clear else clear[1] + 7
    box('v_car_body', (cxp, ROAD_W / 2 - 1.1, 0.75), (4.6, 1.8, 0.8), car, bevel=0.08)
    box('v_car_cab', (cxp - 0.6, ROAD_W / 2 - 1.1, 1.4), (2.2, 1.7, 0.7), car, bevel=0.1)
    box('v_car_glass', (cxp - 0.6, ROAD_W / 2 - 1.1, 1.42), (2.25, 1.6, 0.5), painted('h_glass', (0.16, 0.22, 0.26), var=0.05, rough=0.08), bevel=0.05)
    for ax in (-1.5, 1.5):
        for sy in (-0.85, 0.85): box(f'v_wheel{ax}{sy}', (cxp + ax, ROAD_W / 2 - 1.1 + sy, 0.35), (0.7, 0.25, 0.7), tyre, bevel=0.1)
    box('v_bin', (-(5.0), -(ROAD_W / 2 + 1.0), 0.55), (0.6, 0.6, 1.0), painted('v_bin', (0.16, 0.42, 0.24), var=0.05), bevel=0.04)
