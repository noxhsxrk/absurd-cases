"""Box-people on a Mixamo skeleton (our own design, see BOX.nai in the three.js kit): box parts parented to bones,
painted cloth, an ink-drawn face on the head box (swappable images: open / half / blink / wide / talk / O), hatched hair cap.
`build(rig_fbx, look, name)` imports the rig, removes the Mixamo mesh, returns the armature."""
import bpy, os
from mathutils import Matrix, Vector
from look import painted

TEX = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tex')
NAI = dict(skin=(0.80, 0.56, 0.38), shirt=(0.45, 0.62, 0.80), pants=(0.12, 0.17, 0.28), shoes=(0.07, 0.07, 0.08), hair='nai_hair.png', face='nai')
# the rest of the cast (all original box-people; accessories are extra boxes on the same bones)
COP = dict(skin=(0.62, 0.40, 0.26), shirt=(0.36, 0.27, 0.16), pants=(0.25, 0.19, 0.11), shoes=(0.05, 0.05, 0.05), hair='cop_hair.png', face='cop', cap=(0.28, 0.21, 0.12))
SWAT = dict(skin=(0.62, 0.40, 0.26), shirt=(0.05, 0.05, 0.06), pants=(0.06, 0.06, 0.07), shoes=(0.03, 0.03, 0.03), hair='cop_hair.png', face='cop',
            helmet=(0.04, 0.045, 0.05), vest=(0.09, 0.10, 0.09), goggles=True)
JUDGE = dict(skin=(0.80, 0.62, 0.47), shirt=(0.05, 0.05, 0.06), pants=(0.05, 0.05, 0.06), shoes=(0.04, 0.04, 0.04), hair='judge_hair.png', face='judge', robe=True)
P1 = dict(skin=(0.86, 0.68, 0.52), shirt=(0.85, 0.55, 0.55), pants=(0.30, 0.30, 0.34), shoes=(0.9, 0.9, 0.88), hair='p1_hair.png', face='p1')
P2 = dict(skin=(0.55, 0.36, 0.24), shirt=(0.88, 0.78, 0.45), pants=(0.15, 0.20, 0.30), shoes=(0.2, 0.15, 0.1), hair='p2_hair.png', face='p2')

def _img(name):
    p = os.path.join(TEX, name); im = bpy.data.images.get(name) or bpy.data.images.load(p); return im

def face_material(prefix, modes=('open', 'half', 'blink', 'wide', 'talk', 'O')):
    """one material, an image node per expression; the active one is chosen by the node mixer value 'mode' (0..n-1) keyed per frame"""
    m = bpy.data.materials.new(prefix + '_face'); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    bsdf = N['Principled BSDF']; bsdf.inputs['Roughness'].default_value = 0.85; bsdf.inputs['Specular IOR Level'].default_value = 0.15
    uv = N.new('ShaderNodeTexCoord'); val = N.new('ShaderNodeValue'); val.name = 'mode'; val.outputs[0].default_value = 0
    prev = None
    for i, md in enumerate(modes):
        t = N.new('ShaderNodeTexImage'); t.image = _img(f'{prefix}_{md}.png'); t.interpolation = 'Cubic'; L.new(uv.outputs['UV'], t.inputs[0])
        if prev is None: prev = t.outputs[0]; continue
        cmp = N.new('ShaderNodeMath'); cmp.operation = 'COMPARE'; cmp.inputs[1].default_value = i; cmp.inputs[2].default_value = 0.5; L.new(val.outputs[0], cmp.inputs[0])
        mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L.new(cmp.outputs[0], mx.inputs['Factor']); L.new(prev, mx.inputs[6]); L.new(t.outputs[0], mx.inputs[7]); prev = mx.outputs[2]
    L.new(prev, bsdf.inputs['Base Color'])
    return m

def image_material(name, img, rough=0.9):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes
    t = N.new('ShaderNodeTexImage'); t.image = _img(img); nt.links.new(t.outputs[0], N['Principled BSDF'].inputs['Base Color']); N['Principled BSDF'].inputs['Roughness'].default_value = rough
    return m

def _cube(name, mats):
    me = bpy.data.meshes.new(name); import bmesh; bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    uv = bm.loops.layers.uv.new()
    for f in bm.faces:
        n = f.normal; f.material_index = 1 if (len(mats) > 1 and n.z > 0.9) else 0      # +Z local face = the face plane
        # planar UV per face (0..1)
        ax = max(range(3), key=lambda k: abs(n[k])); u_ax, v_ax = [(1, 2), (0, 2), (0, 1)][ax]
        for lp in f.loops:
            co = lp.vert.co; u = co[u_ax] + 0.5; v = co[v_ax] + 0.5
            if ax == 2: u, v = (co.x + 0.5), (co.y + 0.5)
            lp[uv].uv = (u if n[ax] > 0 else 1 - u, v)
    bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    bev = o.modifiers.new('bev', 'BEVEL'); bev.width = 0.006; bev.segments = 2; bev.limit_method = 'ANGLE'
    return o

def attach(arm, bone, name, size, along=(0.0, 1.0), offset=(0, 0, 0), mats=None, coll=None):
    """a box on `bone`: size (x, length-scale or metres, z) in metres; `along` = start/end fraction along the bone (or ('m', a, b) metres)"""
    b = arm.data.bones[bone]; MW = arm.matrix_world
    head = MW @ b.head_local; tail = MW @ b.tail_local; L = (tail - head).length
    rot = (MW.to_3x3() @ b.matrix_local.to_3x3()).normalized().to_4x4()
    a0, a1 = (along[1], along[2]) if along[0] == 'm' else (along[0] * L, along[1] * L)
    y = (a0 + a1) / 2; ln = abs(a1 - a0) if size[1] is None else size[1]
    ctr = head + (rot.to_3x3() @ Vector((offset[0], y + offset[1], offset[2])))
    o = _cube(name, mats); o.matrix_world = Matrix.Translation(ctr) @ rot @ Matrix.Diagonal((size[0], ln, size[2], 1))
    pm = MW @ b.matrix_local @ Matrix.Translation((0, b.length, 0))
    o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bone; o.matrix_parent_inverse = pm.inverted()
    o.matrix_world = Matrix.Translation(ctr) @ rot @ Matrix.Diagonal((size[0], ln, size[2], 1))
    if coll: [c.objects.unlink(o) for c in o.users_collection]; coll.objects.link(o)
    return o

def import_rig(fbx, name):
    before = set(bpy.data.objects); bpy.ops.import_scene.fbx(filepath=fbx, automatic_bone_orientation=False)
    new = [o for o in bpy.data.objects if o not in before]; arm = [o for o in new if o.type == 'ARMATURE'][0]
    for o in new:
        if o.type == 'MESH': bpy.data.objects.remove(o)
    arm.name = name; arm.data.pose_position = 'REST'; bpy.context.view_layer.update()
    return arm

def build(fbx, name, look=NAI, coll=None, face=True):
    arm = import_rig(fbx, name); P = name
    skin = painted(P + '_skin', look['skin'], var=0.05, stroke_scale=8); shirt = painted(P + '_shirt', look['shirt'], var=0.1, stroke_scale=14, stroke_dir=1.2)
    pants = painted(P + '_pants', look['pants'], var=0.1, stroke_scale=12, stroke_dir=1.5); shoes = painted(P + '_shoes', look['shoes'], var=0.06, rough=0.5)
    hairm = image_material(P + '_hair', look['hair']); facem = face_material(look['face']) if face else skin
    R, Lf = 'mixamorig:Right', 'mixamorig:Left'; parts = []
    A = lambda *a, **k: parts.append(attach(arm, *a, coll=coll, **k))
    A('mixamorig:Hips', P + '_pelvis', (0.36, None, 0.22), along=('m', -0.06, 0.12), mats=[pants])
    A('mixamorig:Spine', P + '_belly', (0.38, None, 0.23), along=('m', 0.0, 0.2), mats=[shirt])
    A('mixamorig:Spine2', P + '_chest', (0.44, None, 0.25), along=('m', -0.1, 0.17), mats=[shirt])
    A('mixamorig:Neck', P + '_neck', (0.11, None, 0.11), along=(0.0, 1.0), mats=[skin])
    # the head: a tall box, face on its front (+Z bone axis), hair cap on top and back
    A('mixamorig:Head', P + '_head', (0.30, 0.36, 0.28), along=('m', 0.0, 0.34), offset=(0, 0.0, 0.01), mats=[skin, facem])
    A('mixamorig:Head', P + '_hair', (0.315, 0.075, 0.295), along=('m', 0.33, 0.33), offset=(0, 0.0, -0.002), mats=[hairm])
    A('mixamorig:Head', P + '_hairback', (0.315, 0.2, 0.05), along=('m', 0.22, 0.22), offset=(0, 0.0, -0.13), mats=[hairm])
    for S in (R, Lf):
        A(S + 'Arm', P + S[-5:] + 'sleeve', (0.13, None, 0.13), along=(0.0, 0.42), mats=[shirt])
        A(S + 'Arm', P + S[-5:] + 'upper', (0.095, None, 0.095), along=(0.4, 1.0), mats=[skin])
        A(S + 'ForeArm', P + S[-5:] + 'fore', (0.085, None, 0.085), along=(0.0, 1.0), mats=[skin])
        A(S + 'Hand', P + S[-5:] + 'hand', (0.09, None, 0.045), along=(0.0, 1.1), mats=[skin])
        A(S + 'UpLeg', P + S[-5:] + 'thigh', (0.15, None, 0.15), along=(0.0, 1.0), mats=[pants])
        A(S + 'Leg', P + S[-5:] + 'shin', (0.13, None, 0.13), along=(0.0, 0.95), mats=[pants])
        A(S + 'Foot', P + S[-5:] + 'foot', (0.11, None, 0.07), along=(-0.1, 1.0), offset=(0, 0, 0.0), mats=[shoes])
        A(S + 'ToeBase', P + S[-5:] + 'toe', (0.11, None, 0.06), along=(0.0, 0.8), mats=[shoes])
    H = 'mixamorig:Head'
    if look.get('cap'):
        capm = painted(P + '_cap', look['cap'], var=0.06, rough=0.6); band = painted(P + '_capband', (0.05, 0.05, 0.05), var=0.02, rough=0.4)
        A(H, P + '_cap', (0.33, 0.09, 0.32), along=('m', 0.37, 0.37), mats=[capm]); A(H, P + '_capband', (0.322, 0.035, 0.312), along=('m', 0.33, 0.33), mats=[band])
        A(H, P + '_visor', (0.30, 0.02, 0.12), along=('m', 0.31, 0.31), offset=(0, 0, 0.19), mats=[band])
    if look.get('helmet'):
        hm = painted(P + '_helmet', look['helmet'], var=0.04, rough=0.45)
        A(H, P + '_helmet', (0.36, 0.14, 0.34), along=('m', 0.35, 0.35), offset=(0, 0, -0.01), mats=[hm])
        A(H, P + '_helmetback', (0.36, 0.22, 0.06), along=('m', 0.22, 0.22), offset=(0, 0, -0.16), mats=[hm])
        for sx in (-1, 1): A(H, P + '_helmetside%d' % sx, (0.03, 0.2, 0.3), along=('m', 0.24, 0.24), offset=(sx * 0.17, 0, -0.01), mats=[hm])
    if look.get('goggles'):
        gm = painted(P + '_goggles', (0.02, 0.025, 0.03), var=0.0, rough=0.1)
        A(H, P + '_goggles', (0.31, 0.07, 0.03), along=('m', 0.235, 0.235), offset=(0, 0, 0.145), mats=[gm])
    if look.get('vest'):
        vm = painted(P + '_vest', look['vest'], var=0.08, stroke_scale=20, rough=0.8); lab = painted(P + '_vestlabel', (0.82, 0.80, 0.70), var=0.02)
        A('mixamorig:Spine2', P + '_vest', (0.48, None, 0.31), along=('m', -0.14, 0.15), mats=[vm])
        A('mixamorig:Spine', P + '_vestlow', (0.42, None, 0.28), along=('m', 0.02, 0.2), mats=[vm])
        A('mixamorig:Spine2', P + '_vestlabel', (0.30, 0.06, 0.01), along=('m', 0.05, 0.05), offset=(0, 0, -0.158), mats=[lab])
        for k in range(3): A('mixamorig:Spine', P + '_pouch%d' % k, (0.09, 0.1, 0.05), along=('m', 0.1, 0.1), offset=(-0.13 + k * 0.13, 0, 0.16), mats=[vm])
    if look.get('robe'):
        rm = painted(P + '_robe', (0.04, 0.04, 0.05), var=0.06, stroke_scale=10, rough=0.7); wm = painted(P + '_collar', (0.92, 0.91, 0.88), var=0.02)
        A('mixamorig:Spine2', P + '_robechest', (0.52, None, 0.32), along=('m', -0.12, 0.2), mats=[rm])
        A('mixamorig:Hips', P + '_robeskirt', (0.50, None, 0.34), along=('m', -0.5, 0.12), mats=[rm])
        A('mixamorig:Neck', P + '_collar', (0.2, 0.05, 0.14), along=('m', 0.0, 0.0), offset=(0, 0, 0.06), mats=[wm])
        for S in (R, Lf): A(S + 'Arm', P + S[-5:] + 'robesleeve', (0.17, None, 0.17), along=(0.0, 1.0), mats=[rm])
    arm.data.pose_position = 'POSE'
    return arm, parts
