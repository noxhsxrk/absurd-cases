"""Small reusable props (police kit, signs of work, the sun). Each returns its root object/empty for animation."""
import bpy, math
from look import painted, box
from sets import spot

def empty(name, loc=(0, 0, 0), rot=(0, 0, 0)):
    e = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(e); e.location = loc; e.rotation_euler = rot; return e

def _emit(name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Emission Color'].default_value = (*color, 1); b.inputs['Emission Strength'].default_value = strength
    return m

def floodlight(name, loc, aim, real=False, energy=900):
    """a tripod work light; the head looks at `aim`. Returns (root, head_material) — key the material's emission to switch on.
    Only `real` ones carry an actual spot light (keep 4-6 per shot for speed)."""
    from mathutils import Vector
    metal = painted('fl_metal', (0.12, 0.12, 0.13), var=0.04, rough=0.4); yel = painted('fl_yel', (0.85, 0.65, 0.1), var=0.06, rough=0.5)
    r = empty(name, loc)
    for k in range(3):
        a = k * 2.094; leg = box(f'{name}_leg{k}', (0.28 * math.cos(a), 0.28 * math.sin(a), 0.6), (0.03, 0.03, 1.25), metal, bevel=0, rot=(0.3 * math.sin(a), -0.3 * math.cos(a), 0)); leg.parent = r
    pole = box(f'{name}_pole', (0, 0, 1.4), (0.04, 0.04, 1.0), metal, bevel=0); pole.parent = r
    head = empty(f'{name}_head', (0, 0, 1.9)); head.parent = r
    d = Vector(aim) - (Vector(loc) + Vector((0, 0, 1.9))); head.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    hb = box(f'{name}_hbox', (0, 0, 0.0), (0.42, 0.32, 0.16), yel, bevel=0.02); hb.parent = head
    em = _emit(f'{name}_lens', (1.0, 0.97, 0.9), 0.0); ln = box(f'{name}_lensf', (0, 0, -0.085), (0.36, 0.26, 0.01), em, bevel=0); ln.parent = head
    L = None
    if real:
        L = spot(f'{name}_L', (0, 0, -0.1), (0, 0, 0), 0.0, 48, blend=0.25, color=(1.0, 0.97, 0.9), radius=0.12); L.parent = head; L.data['on'] = energy
    return r, em, L

def switch_on(em, L, frame, on=True, ramp=3):
    s = em.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    s.default_value = 0.0; s.keyframe_insert('default_value', frame=frame - 1); s.default_value = 18.0 if on else 0.0; s.keyframe_insert('default_value', frame=frame + ramp)
    if L:
        L.data.energy = 0.0; L.data.keyframe_insert('energy', frame=frame - 1); L.data.energy = L.data['on'] if on else 0.0; L.data.keyframe_insert('energy', frame=frame + ramp)

def trowel(name, loc, rot=(0, 0, 0)):
    """the plasterer's trowel (เกรียง) — wide steel blade + wooden handle"""
    steel = painted('tr_steel', (0.65, 0.67, 0.70), var=0.05, rough=0.18); wood = painted('tr_wood', (0.45, 0.28, 0.13), var=0.1, stroke_scale=20)
    r = empty(name, loc, rot)
    b = box(f'{name}_blade', (0, 0.0, 0), (0.30, 0.20, 0.006), steel, bevel=0.002); b.parent = r
    s = box(f'{name}_shank', (0, -0.08, 0.05), (0.02, 0.02, 0.1), steel, bevel=0); s.parent = r
    h = box(f'{name}_handle', (0, -0.18, 0.1), (0.04, 0.2, 0.04), wood, bevel=0.01); h.parent = r
    return r

def cuffs(name, loc, rot=(0, 0, 0), s=1.0):
    steel = painted('cf_steel', (0.72, 0.74, 0.77), var=0.03, rough=0.15)
    r = empty(name, loc, rot); r.scale = (s, s, s); rings = []
    for k, x in enumerate((-0.07, 0.07)):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.045, minor_radius=0.008, location=(x, 0, 0), rotation=(math.pi / 2, 0, 0))
        o = bpy.context.active_object; o.name = f'{name}_ring{k}'; o.data.materials.append(steel); o.parent = r; rings.append(o)
    c = box(f'{name}_chain', (0, 0, 0), (0.06, 0.01, 0.01), steel, bevel=0); c.parent = r
    return r, rings

def vest_on(rig, name='vest'):
    """an orange hi-vis vest stuck to the shadow sheet's chest (parented to sheet bone b8), a reflective band + Thai label"""
    org = painted('vest_org', (0.95, 0.38, 0.05), var=0.06, stroke_scale=16, rough=0.7); refl = painted('vest_refl', (0.85, 0.86, 0.82), var=0.02, rough=0.25)
    r = empty(name, (0, 0, 0)); r.parent = rig; r.parent_type = 'BONE'; r.parent_bone = 'b8'; r.location = (0, -0.33, 0.012)
    v = box(f'{name}_body', (0, 0, 0), (0.44, 0.52, 0.015), org, bevel=0.01); v.parent = r
    for y in (-0.08, 0.12):
        b = box(f'{name}_band{y}', (0, y, 0.009), (0.445, 0.045, 0.004), refl, bevel=0); b.parent = r
    return r

def anklet(rig, name='anklet'):
    blk = painted('ank_blk', (0.05, 0.05, 0.06), var=0.02, rough=0.3)
    r = empty(name, (0, 0, 0)); r.parent = rig; r.parent_type = 'BONE'; r.parent_bone = 'b0'; r.location = (0.07, -0.02, 0.0)
    b = box(f'{name}_box', (0, 0, 0.02), (0.08, 0.05, 0.04), blk, bevel=0.008); b.parent = r
    st = box(f'{name}_strap', (0, 0, 0.0), (0.11, 0.025, 0.012), blk, bevel=0.003); st.parent = r
    led = _emit(f'{name}_led', (1.0, 0.1, 0.05), 0.0); l = box(f'{name}_led', (0.02, 0.0, 0.042), (0.012, 0.012, 0.006), led, bevel=0); l.parent = r
    s = led.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
    for f in range(1, 200, 15):
        s.default_value = 25.0; s.keyframe_insert('default_value', frame=f); s.default_value = 0.0; s.keyframe_insert('default_value', frame=f + 4)
    for fc in led.node_tree.animation_data.action.fcurves:
        for k in fc.keyframe_points: k.interpolation = 'CONSTANT'
    return r

def sun_ball(name, loc, r=1.0):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16); o = bpy.context.active_object; o.name = name
    o.data.materials.append(_emit('sunball', (1.0, 0.88, 0.55), 30.0)); return o
