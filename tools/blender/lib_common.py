"""
Shared helpers for the workstation model scripts.

Run through Blender, never directly:
    blender -b -P tools/blender/build_desk.py -- --out assets-src/raw/desk.glb

Conventions
- Scene units are meters and match src/experience/config/layout.ts.
- Blender is Z-up and the front of every object faces -Y. The glTF exporter
  converts to Y-up, so the front ends up on +Z, facing the viewer.
- Each object origin sits on the desk plane at the center of the footprint.
- Everything is authored from scratch in these scripts. No third-party assets.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------


def parse_args():
    argv = sys.argv
    argv = argv[argv.index("--") + 1 :] if "--" in argv else []
    args = {"out": None, "ao_size": 1024, "ao_samples": 48, "preview": None}
    i = 0
    while i < len(argv):
        key = argv[i].lstrip("-").replace("-", "_")
        if key in args and i + 1 < len(argv):
            value = argv[i + 1]
            if key in ("ao_size", "ao_samples"):
                args[key] = int(value)
            else:
                # Blender treats relative paths oddly, so make them absolute.
                args[key] = os.path.abspath(value)
            i += 2
        else:
            i += 1
    return args


# ---------------------------------------------------------------------------
# Scene setup
# ---------------------------------------------------------------------------


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    return scene


_MATERIALS = {}


def hex_rgba(value, alpha=1.0):
    value = value.lstrip("#")
    r, g, b = (int(value[i : i + 2], 16) / 255.0 for i in (0, 2, 4))

    def to_linear(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (to_linear(r), to_linear(g), to_linear(b), alpha)


def material(
    name,
    color,
    metallic=0.0,
    roughness=0.5,
    emission=None,
    emission_strength=0.0,
    coat=0.0,
    coat_roughness=0.2,
):
    """Principled BSDF material, cached by name so slots are shared."""
    if name in _MATERIALS:
        return _MATERIALS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_rgba(color)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if coat > 0:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = coat_roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = hex_rgba(emission)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    _MATERIALS[name] = mat
    return mat


# Shared palette. Mirrors the site tokens, with enough tonal separation that
# each object stays readable on the dark stage.
PALETTE = {
    "desk_top": ("#17274a", 0.0, 0.5),
    "desk_dark": ("#121b30", 0.55, 0.45),
    "graphite": ("#2c3750", 0.85, 0.4),
    "graphite_dark": ("#161c2c", 0.8, 0.5),
    "aluminum": ("#6f7c99", 1.0, 0.32),
    "rubber": ("#0c1019", 0.0, 0.88),
    "felt": ("#101a30", 0.0, 0.96),
    "felt_light": ("#1f3050", 0.0, 0.96),
}


def pal(name, **kw):
    color, metallic, rough = PALETTE[name]
    return material(name, color, metallic, rough, **kw)


def screen_material(name, color="#0b2236"):
    """
    Material for a Screen mesh. The glTF exporter only writes UVs when a
    material uses a texture, so a tiny placeholder image is wired in. The app
    replaces this material with the real screen texture.
    """
    mat = material(name, color, 0.0, 0.25)
    tree = mat.node_tree
    image = bpy.data.images.new(f"{name}_placeholder", 4, 4, alpha=False)
    image.pixels = [0.04, 0.13, 0.21, 1.0] * 16
    node = tree.nodes.new("ShaderNodeTexImage")
    node.image = image
    bsdf = tree.nodes["Principled BSDF"]
    tree.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def emissive(name, color, strength):
    return material(name, color, 0.0, 0.4, emission=color, emission_strength=strength)


LED_CYAN = "#3ee0f0"
LED_VIOLET = "#9b8cff"
LED_DIM = "#1d4a5c"

# ---------------------------------------------------------------------------
# Geometry builders. All use bmesh directly so they run without a viewport.
# ---------------------------------------------------------------------------

_COLLECTION_PARTS = []


def _finish(bm, name, mat, loc=(0, 0, 0), rot=(0, 0, 0), smooth_angle=40.0):
    """Turn a bmesh into an object, with smooth shading and sharp hard edges."""
    limit = math.radians(smooth_angle)
    for face in bm.faces:
        face.smooth = True
    for edge in bm.edges:
        if len(edge.link_faces) == 2:
            if edge.calc_face_angle(0.0) > limit:
                edge.smooth = False
        else:
            edge.smooth = False
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if mat is not None:
        obj.data.materials.append(mat)
    obj.location = loc
    obj.rotation_euler = rot
    _COLLECTION_PARTS.append(obj)
    return obj


def box(name, size, loc, mat, bevel=0.0, segments=2, rot=(0, 0, 0)):
    """Box centered at loc, size = (x, y, z). Optional bevel on every edge."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    if bevel > 0:
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=min(bevel, min(size) * 0.45),
            segments=segments,
            profile=0.5,
            affect="EDGES",
        )
    return _finish(bm, name, mat, loc, rot)


def rounded_rect_points(width, height, radius, corner_segments=6):
    """Counter-clockwise outline of a rounded rectangle in the XY plane."""
    radius = min(radius, width / 2 - 1e-6, height / 2 - 1e-6)
    hx, hy = width / 2 - radius, height / 2 - radius
    corners = [(hx, hy, 0), (-hx, hy, 90), (-hx, -hy, 180), (hx, -hy, 270)]
    pts = []
    for cx, cy, start in corners:
        for i in range(corner_segments + 1):
            a = math.radians(start + 90.0 * i / corner_segments)
            pts.append((cx + radius * math.cos(a), cy + radius * math.sin(a)))
    return pts


def slab(
    name,
    width,
    depth,
    height,
    loc,
    mat,
    radius=0.02,
    bevel=0.003,
    segments=2,
    corner_segments=6,
    rot=(0, 0, 0),
    centered_z=True,
):
    """
    Rounded-rectangle plate: footprint width (X) by depth (Y), thickness
    height (Z). loc is the center (or bottom center when centered_z is False).
    """
    bm = bmesh.new()
    pts = rounded_rect_points(width, depth, radius, corner_segments)
    verts = [bm.verts.new((x, y, 0.0)) for x, y in pts]
    face = bm.faces.new(verts)
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [v for v in res["geom"] if isinstance(v, bmesh.types.BMVert)]
    for v in top:
        v.co.z += height
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    z_shift = -height / 2 if centered_z else 0.0
    for v in bm.verts:
        v.co.z += z_shift
    if bevel > 0:
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=min(bevel, height * 0.45),
            segments=segments,
            profile=0.5,
            affect="EDGES",
        )
    return _finish(bm, name, mat, loc, rot)


def cylinder(
    name, radius, height, loc, mat, vertices=32, bevel=0.0, segments=2, rot=(0, 0, 0), radius2=None
):
    """Cylinder along Z, centered at loc. radius2 gives a cone frustum."""
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        segments=vertices,
        radius1=radius,
        radius2=radius if radius2 is None else radius2,
        depth=height,
    )
    if bevel > 0:
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=min(bevel, radius * 0.45, height * 0.45),
            segments=segments,
            profile=0.5,
            affect="EDGES",
        )
    return _finish(bm, name, mat, loc, rot)


def knurled_cylinder(name, radius, height, loc, mat, teeth=28, depth=0.0016, rot=(0, 0, 0)):
    """Cylinder with a toothed side wall, for knobs."""
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, segments=teeth * 2, radius1=radius, radius2=radius, depth=height
    )
    for v in bm.verts:
        angle = math.atan2(v.co.y, v.co.x)
        index = round(angle / (math.pi / teeth))
        if index % 2 == 0:
            r = math.hypot(v.co.x, v.co.y)
            if r > 1e-6:
                s = (r - depth) / r
                v.co.x *= s
                v.co.y *= s
    bmesh.ops.bevel(
        bm,
        geom=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6],
        offset=min(0.0015, height * 0.2),
        segments=2,
        profile=0.5,
        affect="EDGES",
    )
    return _finish(bm, name, mat, loc, rot, smooth_angle=55.0)


def torus(name, major, minor, loc, mat, major_segments=48, minor_segments=10, rot=(0, 0, 0)):
    bm = bmesh.new()
    for i in range(major_segments):
        a = 2 * math.pi * i / major_segments
        for j in range(minor_segments):
            b = 2 * math.pi * j / minor_segments
            r = major + minor * math.cos(b)
            bm.verts.new((r * math.cos(a), r * math.sin(a), minor * math.sin(b)))
    bm.verts.ensure_lookup_table()
    for i in range(major_segments):
        for j in range(minor_segments):
            a0, a1 = i, (i + 1) % major_segments
            b0, b1 = j, (j + 1) % minor_segments
            bm.faces.new(
                (
                    bm.verts[a0 * minor_segments + b0],
                    bm.verts[a1 * minor_segments + b0],
                    bm.verts[a1 * minor_segments + b1],
                    bm.verts[a0 * minor_segments + b1],
                )
            )
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return _finish(bm, name, mat, loc, rot)


def uv_sphere(name, radius, loc, mat, scale=(1, 1, 1), u=24, v=16, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=radius)
    for vert in bm.verts:
        vert.co.x *= scale[0]
        vert.co.y *= scale[1]
        vert.co.z *= scale[2]
    return _finish(bm, name, mat, loc, rot)


def extrude_profile(name, points_yz, width, loc, mat, bevel=0.004, segments=2, rot=(0, 0, 0)):
    """Side profile in the YZ plane, extruded along X by width and centered."""
    bm = bmesh.new()
    verts = [bm.verts.new((-width / 2, y, z)) for y, z in points_yz]
    face = bm.faces.new(verts)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    for v in [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]:
        v.co.x += width
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    if bevel > 0:
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=bevel,
            segments=segments,
            profile=0.5,
            affect="EDGES",
        )
    return _finish(bm, name, mat, loc, rot)


def screen_plane(name, width, height, loc, mat, radius=0.0, rot=(0, 0, 0)):
    """
    Flat (optionally rounded) rectangle in the XZ plane facing -Y, with UVs
    mapped 0..1 across the face so a texture can be applied in the app.
    """
    bm = bmesh.new()
    if radius > 0:
        pts = rounded_rect_points(width, height, radius, 5)
    else:
        pts = [(width / 2, height / 2), (-width / 2, height / 2), (-width / 2, -height / 2), (width / 2, -height / 2)]
    # Build in XZ, normal toward -Y.
    verts = [bm.verts.new((x, 0.0, z)) for x, z in pts]
    face = bm.faces.new(verts[::-1])
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    if face.normal.y > 0:
        face.normal_flip()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for loop in face.loops:
        x, _, z = loop.vert.co
        loop[uv_layer].uv = (x / width + 0.5, z / height + 0.5)
    obj = _finish(bm, name, mat, loc, rot)
    return obj


# ---------------------------------------------------------------------------
# Joining, UVs, ambient occlusion, export
# ---------------------------------------------------------------------------


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def apply_transforms(objs):
    select_only(objs)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def join(objs, name):
    """Join parts into one mesh object with one slot per unique material."""
    apply_transforms(objs)
    select_only(objs)
    bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    obj.data.name = name
    # Merge duplicate slots that point at the same material.
    bpy.ops.object.material_slot_remove_unused()
    return obj


def weld(obj, distance=1e-5):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=distance)
    bm.to_mesh(obj.data)
    bm.free()


def unwrap(obj, uv_name="AO"):
    """Smart UV project into a dedicated non-overlapping layer."""
    mesh = obj.data
    layer = mesh.uv_layers.get(uv_name) or mesh.uv_layers.new(name=uv_name)
    mesh.uv_layers.active = layer
    select_only([obj])
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")


def _glb_output_group():
    name = "glTF Material Output"
    group = bpy.data.node_groups.get(name)
    if group:
        return group
    group = bpy.data.node_groups.new(name, "ShaderNodeTree")
    group.interface.new_socket("Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    return group


def bake_ao(obj, size, samples, uv_name="AO", distance=0.28):
    """
    Bake ambient occlusion into one image and hook it up as the glTF
    occlusion texture for every non-emissive material on obj.
    """
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False
    scene.render.bake.margin = 6
    scene.render.bake.use_clear = True

    world = bpy.data.worlds.new("bake_world")
    world.use_nodes = True
    scene.world = world
    world.light_settings.distance = distance

    image = bpy.data.images.new(f"{obj.name}_ao", size, size, alpha=False, float_buffer=False)
    image.colorspace_settings.name = "Non-Color"

    # An active, selected image node in every material is what the baker writes to.
    nodes_added = []
    for slot in obj.material_slots:
        tree = slot.material.node_tree
        node = tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        node.select = True
        tree.nodes.active = node
        nodes_added.append((slot.material, node))

    obj.data.uv_layers.active = obj.data.uv_layers[uv_name]
    select_only([obj])
    bpy.ops.object.bake(type="AO")

    # Wire the baked image as the occlusion input for the glTF exporter.
    group = _glb_output_group()
    for mat, tex_node in nodes_added:
        tree = mat.node_tree
        bsdf = tree.nodes.get("Principled BSDF")
        emits = bsdf and bsdf.inputs["Emission Strength"].default_value > 0
        if emits:
            tree.nodes.remove(tex_node)
            continue
        uv_node = tree.nodes.new("ShaderNodeUVMap")
        uv_node.uv_map = uv_name
        tree.links.new(uv_node.outputs["UV"], tex_node.inputs["Vector"])
        sep = tree.nodes.new("ShaderNodeSeparateColor")
        tree.links.new(tex_node.outputs["Color"], sep.inputs["Color"])
        out = tree.nodes.new("ShaderNodeGroup")
        out.node_tree = group
        tree.links.new(sep.outputs["Red"], out.inputs["Occlusion"])
    return image


def export_glb(path, objs):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    select_only(objs)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_cameras=False,
        export_lights=False,
        export_extras=False,
        export_animations=False,
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_vertex_color="NONE",
    )


def stats(objs):
    tris = 0
    for o in objs:
        mesh = o.data
        mesh.calc_loop_triangles()
        tris += len(mesh.loop_triangles)
    mats = {s.material.name for o in objs for s in o.material_slots if s.material}
    return {"triangles": tris, "materials": len(mats)}


def render_preview(prefix, objs, views=None, size=(1000, 650), samples=32):
    """Cycles stills from a few angles so models can be reviewed before use."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"

    world = bpy.data.worlds.new("preview_world")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hex_rgba("#0b1220")
    bg.inputs["Strength"].default_value = 0.6
    scene.world = world

    # Lights: soft key, cyan rim, violet accent.
    def area(name, loc, energy, color, size_m):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.color = hex_rgba(color)[:3]
        data.size = size_m
        light = bpy.data.objects.new(name, data)
        light.location = loc
        scene.collection.objects.link(light)
        direction = Vector((0, 0, 0.4)) - Vector(loc)
        light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    area("key", (1.6, -2.6, 2.6), 380, "#dbe9ff", 2.4)
    area("rim_cyan", (-2.4, 2.0, 1.6), 260, LED_CYAN, 1.2)
    area("accent_violet", (2.6, 1.4, 0.8), 90, LED_VIOLET, 1.0)

    # Camera aimed at the bounding box center.
    corners = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    hi = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    center = (lo + hi) / 2
    radius = (hi - lo).length * 0.72
    cam_data = bpy.data.cameras.new("preview_cam")
    cam_data.lens = 70
    cam = bpy.data.objects.new("preview_cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    views = views or {"front34": (-24, 18), "right34": (28, 16), "front": (0, 6)}
    for label, (azimuth, elevation) in views.items():
        az, el = math.radians(azimuth), math.radians(elevation)
        direction = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
        cam.location = center + direction * radius * 3.1
        cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = f"{prefix}_{label}.png"
        bpy.ops.render.render(write_still=True)


def build_and_export(objs, args, ao_size=None, bake=True):
    """Weld, unwrap, bake AO, export, preview. Returns stats."""
    ao_size = ao_size or args["ao_size"]
    main = objs[0]
    if bake:
        weld(main)
        unwrap(main)
        bake_ao(main, ao_size, args["ao_samples"])
    result = stats(objs)
    if args["out"]:
        export_glb(args["out"], objs)
    if args["preview"]:
        os.makedirs(os.path.dirname(args["preview"]), exist_ok=True)
        render_preview(args["preview"], objs)
    print("MODEL_STATS", main.name, result)
    return result
