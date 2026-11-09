"""absurd-cases Blender look kit: painted/paper materials, ink outlines (Freestyle), EEVEE quality settings, sun + sky."""
import bpy, math, random

def scene_setup(res=(1080, 1920), samples=64, fps=30, outline=True, scale=100):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.fps = fps
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = scale
    ee = sc.eevee; ee.taa_render_samples = samples
    ee.use_shadows = True; ee.shadow_ray_count = 3; ee.shadow_step_count = 12; ee.shadow_resolution_scale = 1.0
    ee.use_gtao = True; ee.gtao_distance = 0.8; ee.gtao_quality = 0.5
    ee.use_raytracing = True; ee.ray_tracing_method = 'SCREEN'
    sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.5
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Base Contrast'; sc.view_settings.exposure = -0.6
    sc.render.film_transparent = False
    if outline:
        sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 1.6 * res[0] / 1080
        vl = sc.view_layers[0]; fs = vl.freestyle_settings; fs.crease_angle = math.radians(140)
        ls = fs.linesets[0] if fs.linesets else fs.linesets.new('ink')
        ls.select_by_collection = True; ls.collection_negation = 'EXCLUSIVE'
        ghost = bpy.data.collections.get('ghosts') or bpy.data.collections.new('ghosts')
        if ghost.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(ghost)
        ls.collection = ghost
        ls.select_by_visibility = True; ls.select_by_edge_types = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
        if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('ink')
        ls.linestyle.color = (0.06, 0.05, 0.05); ls.linestyle.alpha = 0.85; ls.linestyle.thickness = 1.0
        # slight hand-drawn wobble
        if not any(m.type == 'NOISE' for m in ls.linestyle.geometry_modifiers):
            m = ls.linestyle.geometry_modifiers.new('wobble', 'PERLIN_NOISE_1D'); m.frequency = 12; m.amplitude = 0.8
    return sc

def world_sky(top=(0.42, 0.62, 0.92), strength=1.0):
    w = bpy.data.worlds.get('sky') or bpy.data.worlds.new('sky'); bpy.context.scene.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld'); bg = nt.nodes.new('ShaderNodeBackground'); sky = nt.nodes.new('ShaderNodeTexSky')
    sky.sky_type = 'NISHITA'; sky.sun_disc = False; sky.sun_elevation = math.radians(18); sky.sun_rotation = math.radians(240); sky.altitude = 200; sky.air_density = 1.4; sky.dust_density = 2.5
    nt.links.new(sky.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = strength; nt.links.new(bg.outputs[0], out.inputs[0])
    return sky

def sun(elev_deg=18, azim_deg=240, energy=4.0, angle_deg=1.2, color=(1.0, 0.86, 0.68)):
    d = bpy.data.lights.new('sun', 'SUN'); d.energy = energy; d.angle = math.radians(angle_deg); d.color = color
    o = bpy.data.objects.new('sun', d); bpy.context.collection.objects.link(o)
    o.rotation_euler = (math.radians(90 - elev_deg), 0, math.radians(azim_deg)); return o

def painted(name, base, var=0.08, rough=0.85, stroke_scale=6.0, stroke_dir=0.0, paper=True):
    """a 'painted' material: base colour broken up by low-frequency value noise + directional brush streaks + paper grain"""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; Lk = nt.links
    bsdf = N['Principled BSDF']; bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Specular IOR Level'].default_value = 0.2
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Rotation'].default_value[2] = stroke_dir
    Lk.new(tc.outputs['Object'], mp.inputs[0])
    big = N.new('ShaderNodeTexNoise'); big.inputs['Scale'].default_value = 1.6; big.inputs['Detail'].default_value = 2
    streak = N.new('ShaderNodeTexWave'); streak.wave_type = 'BANDS'; streak.inputs['Scale'].default_value = stroke_scale; streak.inputs['Distortion'].default_value = 6; streak.inputs['Detail'].default_value = 3
    grain = N.new('ShaderNodeTexNoise'); grain.inputs['Scale'].default_value = 180; grain.inputs['Detail'].default_value = 1
    for n in (big, streak, grain): Lk.new(mp.outputs[0], n.inputs['Vector'])
    mix1 = N.new('ShaderNodeMath'); mix1.operation = 'MULTIPLY_ADD'; mix1.inputs[1].default_value = 0.5; Lk.new(streak.outputs['Fac'], mix1.inputs[0]); Lk.new(big.outputs['Fac'], mix1.inputs[2])
    mix2 = N.new('ShaderNodeMath'); mix2.operation = 'MULTIPLY_ADD'; mix2.inputs[1].default_value = 0.25 if paper else 0.0; Lk.new(grain.outputs['Fac'], mix2.inputs[0]); Lk.new(mix1.outputs[0], mix2.inputs[2])
    ramp = N.new('ShaderNodeValToRGB'); r = ramp.color_ramp
    c = base; dk = tuple(max(0, x * (1 - var * 2.2)) for x in c); lt = tuple(min(1, x * (1 + var * 1.6)) for x in c)
    r.elements[0].position = 0.35; r.elements[0].color = (*dk, 1); r.elements[1].position = 1.05; r.elements[1].color = (*lt, 1)
    Lk.new(mix2.outputs[0], ramp.inputs[0]); Lk.new(ramp.outputs[0], bsdf.inputs['Base Color'])
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.08; Lk.new(grain.outputs['Fac'], bump.inputs['Height']); Lk.new(bump.outputs[0], bsdf.inputs['Normal'])
    return m

def box(name, loc, size, mat, rot=(0, 0, 0), bevel=0.01, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); bpy.ops.object.transform_apply(scale=True)
    if bevel:
        b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = 2; b.limit_method = 'ANGLE'
    o.data.materials.append(mat)
    if parent: o.parent = parent
    return o

def look_at(cam, target):
    from mathutils import Vector
    d = Vector(target) - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
