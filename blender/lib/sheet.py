"""The shadow as a thing: a thin black rubber sheet cut in his silhouette (tex/sil_stand.png), with two small angry
white eyes. A bone chain runs feet→head so it can peel off the road, curl, fold in half, stand up like a cut-out and squash.

    sh = sheet.build('shade')              # lies flat on the ground (local XY plane, head toward +Y), feet at origin
    sh.place((x, y, z), yaw)               # object transform
    sh.curl(frame, {9: 40, 10: 40})        # bone index -> degrees about the sheet's width axis (peel/fold)
    sh.blink([frames]); sh.look('angry')"""
import bpy, bmesh, math, os
from mathutils import Matrix, Vector

TEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tex')
H, W = 2.03, 0.636          # metres, from the silhouette render (2.2 m ortho over 1400 px; crop 405 x 1290 px)
NB = 12                     # bones along the length
EYE_SY = 0.024              # eye ellipse height (blink scales this)

def _mat(name):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; b = N['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.010, 0.010, 0.012, 1); b.inputs['Roughness'].default_value = 0.42
    b.inputs['Specular IOR Level'].default_value = 0.35
    t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.get('sil_stand.png') or bpy.data.images.load(os.path.join(TEX, 'sil_stand.png'))
    t.interpolation = 'Cubic'; t.extension = 'CLIP'
    op = N.new('ShaderNodeValue'); op.name = 'opacity'; op.outputs[0].default_value = 1.0      # <1 = reads as a cast shadow on the ground
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; nt.links.new(t.outputs['Color'], mul.inputs[0]); nt.links.new(op.outputs[0], mul.inputs[1])
    nt.links.new(mul.outputs[0], b.inputs['Alpha'])
    try: m.surface_render_method = 'DITHERED'
    except Exception: pass
    return m

def _white(name, c):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; N.remove(N['Principled BSDF'])
    e = N.new('ShaderNodeEmission'); e.inputs[0].default_value = (*c, 1); e.inputs[1].default_value = 1.0
    m.node_tree.links.new(e.outputs[0], N['Material Output'].inputs[0]); return m

class Sheet:
    def __init__(self, rig, obj, eyes):
        self.rig, self.obj, self.eyes = rig, obj, eyes
    def place(self, loc, yaw=0.0, pitch=0.0, frame=None):
        self.rig.location = loc; self.rig.rotation_euler = (pitch, 0, yaw)
        if frame is not None: self.rig.keyframe_insert('location', frame=frame); self.rig.keyframe_insert('rotation_euler', frame=frame)
    def scale(self, frame, sx, sy=None, sz=1.0):
        self.rig.scale = (sx, sy if sy is not None else sx, sz); self.rig.keyframe_insert('scale', frame=frame)
    def curl(self, frame, angles):
        """angles: {bone index: degrees}; unspecified bones go flat. Positive lifts the head end off the ground."""
        for i in range(NB):
            pb = self.rig.pose.bones['b%d' % i]; pb.rotation_mode = 'XYZ'
            pb.rotation_euler = (math.radians(angles.get(i, 0.0)), 0, 0); pb.keyframe_insert('rotation_euler', frame=frame)
    def blink(self, frames):
        for e in self.eyes:
            for f in frames:
                for df, s in ((-1, 1.0), (1, 0.1), (3, 1.0)): e.scale[1] = EYE_SY * s; e.keyframe_insert('scale', index=1, frame=f + df)
    def opacity(self, frame, v):
        o = self.obj.data.materials[0].node_tree.nodes['opacity'].outputs[0]; o.default_value = v; o.keyframe_insert('default_value', frame=frame)
    def eyes_visible(self, on, frame):
        for e in self.eyes: e.hide_render = not on; e.keyframe_insert('hide_render', frame=frame)

def build(name='shade', eyes=True, coll=None):
    coll = coll or bpy.data.collections.get('ghosts')        # no ink outline on the shadow (Freestyle skips 'ghosts')
    # mesh: a plane W x H in local XY, feet at y=0, normal +Z, finely divided along its length so it bends smoothly
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    nx, ny = 8, 96
    verts = [[bm.verts.new(((i / nx - 0.5) * W, j / ny * H, 0)) for i in range(nx + 1)] for j in range(ny + 1)]
    uv = bm.loops.layers.uv.new()
    for j in range(ny):
        for i in range(nx):
            f = bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
            for lp in f.loops: lp[uv].uv = (lp.vert.co.x / W + 0.5, lp.vert.co.y / H)
    bm.to_mesh(me); bm.free(); me.materials.append(_mat('shadow_sheet'))
    obj = bpy.data.objects.new(name + '_sheet', me)
    sol = obj.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = 0.004; sol.offset = 0
    # bone chain
    ad = bpy.data.armatures.new(name + '_rig'); rig = bpy.data.objects.new(name + '_rig', ad)
    (coll or bpy.context.collection).objects.link(rig); (coll or bpy.context.collection).objects.link(obj)
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
    seg = H / NB; prev = None
    for i in range(NB):
        b = ad.edit_bones.new('b%d' % i); b.head = (0, i * seg, 0); b.tail = (0, (i + 1) * seg, 0); b.roll = 0
        if prev: b.parent = prev; b.use_connect = True
        prev = b
    bpy.ops.object.mode_set(mode='OBJECT')
    # weights: each vertex follows the bone it lies on, blended with the next across the joint
    for i in range(NB): obj.vertex_groups.new(name='b%d' % i)
    for v in me.vertices:
        u = v.co.y / seg; i = min(NB - 1, int(u)); fr = u - i
        if fr > 0.5 and i < NB - 1: w = (fr - 0.5); obj.vertex_groups['b%d' % i].add([v.index], 1 - w, 'REPLACE'); obj.vertex_groups['b%d' % (i + 1)].add([v.index], w, 'REPLACE')
        elif fr < 0.5 and i > 0: w = (0.5 - fr); obj.vertex_groups['b%d' % i].add([v.index], 1 - w, 'REPLACE'); obj.vertex_groups['b%d' % (i - 1)].add([v.index], w, 'REPLACE')
        else: obj.vertex_groups['b%d' % i].add([v.index], 1.0, 'REPLACE')
    obj.parent = rig; am = obj.modifiers.new('rig', 'ARMATURE'); am.object = rig
    obj.modifiers.move(1, 0)                  # deform before solidify
    eye_objs = []
    if eyes:
        wm = _white('sheet_eye', (0.95, 0.94, 0.9)); km = _white('sheet_pupil', (0.0, 0.0, 0.0))
        top = 'b%d' % (NB - 1); hb = rig.data.bones[top]
        for side, sx in ((s_, x_) for s_ in (1, -1) for x_ in (-1, 1)):      # eyes on both faces: it looks at you either way up
            bpy.ops.mesh.primitive_circle_add(vertices=24, radius=1, fill_type='NGON'); e = bpy.context.active_object
            e.name = f'{name}_eye{sx}{side}'; e.data.materials.append(wm); e.scale = (0.034, EYE_SY, 1)
            bpy.ops.mesh.primitive_circle_add(vertices=16, radius=1, fill_type='NGON'); p = bpy.context.active_object
            p.name = f'{name}_pupil{sx}{side}'; p.data.materials.append(km); p.scale = (0.3, 0.42, 1); p.parent = e; p.location = (0.15 * sx * -1, -0.05, 0.002)
            # angry: inner corners down
            e.rotation_euler = (0 if side > 0 else math.pi, 0, math.radians(-16 * sx * side))
            # bone-parent at the head (eye height ~ 0.17 m below the top), a hair above the sheet's surface
            e.parent = rig; e.parent_type = 'BONE'; e.parent_bone = top
            e.location = (0.07 * sx, (H - 0.19) - NB * seg, 0.006 * side)
            for o in (e, p):
                o.visible_shadow = False
                if coll: [c.objects.unlink(o) for c in o.users_collection]; coll.objects.link(o)
            eye_objs.append(e)
    obj.visible_shadow = False        # a shadow casts no shadow of its own
    return Sheet(rig, obj, eye_objs)
