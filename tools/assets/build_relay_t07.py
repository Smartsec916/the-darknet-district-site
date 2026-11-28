"""Build the editable Relay T-07 props, animated GLBs and Blender previews."""
import json
import math
import random
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector


OUT = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
OUT.mkdir(parents=True, exist_ok=True)


def material(name, color, metal=0.0, roughness=.5, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Emission Color"].default_value = (*color, 1)
    shader.inputs["Emission Strength"].default_value = emission
    return mat


def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        edge = obj.modifiers.new("Machined edges", "BEVEL")
        edge.width = bevel
        edge.segments = 2
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


def box(name, location, size, mat, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, bevel)


def rod(name, start, end, radius, mat, sides=12):
    a, b = Vector(start), Vector(end)
    delta = b - a
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=sides, radius=radius, depth=delta.length, location=(a + b) / 2
    )
    obj = bpy.context.object
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return finish(obj, name, mat)


def dish(name, origin, direction, damaged, alloy, frame, copper):
    base, normal = Vector(origin), Vector(direction).normalized()
    rotation = normal.to_track_quat("Z", "Y")
    segments = 40
    vertices = [base]
    rings = 7
    for ring in range(1, rings + 1):
        r = ring / rings
        for index in range(segments):
            a = index * math.tau / segments
            dent = .12 * r * r * max(0, math.cos(a - .7)) ** 9 if damaged else 0
            local = Vector((r * .43 * math.cos(a), r * .43 * math.sin(a), .19 * r * r - dent))
            vertices.append(base + rotation @ local)
    faces = [(0, 1 + j, 1 + (j + 1) % segments) for j in range(segments)]
    for ring in range(rings - 1):
        start = 1 + ring * segments
        for j in range(segments):
            k = (j + 1) % segments
            faces.append((start + j, start + segments + j, start + segments + k, start + k))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, name, alloy)
    for face in mesh.polygons:
        face.use_smooth = True
    thickness = obj.modifiers.new("Reflector thickness", "SOLIDIFY")
    thickness.thickness = .024
    hub = base + normal * .34
    rod(name + " feed", hub - normal * .11, hub + normal * .045, .045, copper)
    for index in range(3):
        edge = vertices[1 + (rings - 1) * segments + index * 13]
        rod(name + " feed stay", edge, hub, .012, frame, 8)


def stencil(text, location, size, mat):
    bpy.ops.object.text_add(location=location, rotation=(math.pi / 2, 0, 0))
    obj = bpy.context.object
    obj.data.body = text
    obj.data.size = size
    obj.data.extrude = .001
    bpy.ops.object.convert(target="MESH")
    finish(bpy.context.object, text, mat)


def solar(side, damaged, frame, cells, copper):
    broken = damaged and side < 0
    rod("Solar array gimbal", (side * .91, 0, 0), (side * 1.57, 0, 0), .145, frame)
    for section in range(2):
        bend = .36 if broken and section else 0
        center = Vector((side * (2.12 + section * 1.15), 0, -.12 if bend else 0))

        def tile(name, x, y, z, size, mat):
            # Place all cells and rails in the same bent frame.
            a = -side * bend
            offset = Vector((x * math.cos(a) + z * math.sin(a), y, -x * math.sin(a) + z * math.cos(a)))
            obj = box(name, center + offset, size, mat, .01)
            obj.rotation_euler.y = a

        tile("Array backplane", 0, 0, 0, (1.11, 1.2, .064), frame)
        for y in (-.604, .604):
            tile("Array perimeter rail", 0, y, .037, (1.12, .047, .075), copper)
        for column in range(5):
            for row in range(5):
                if broken and (section, column, row) in {(1, 1, 3), (1, 1, 4), (1, 2, 3), (0, 0, 2)}:
                    continue
                tile("Photovoltaic tile", (column - 2) * .208, (row - 2) * .226, .044,
                     (.198, .214, .022), cells[(column + row + section) % len(cells)])


def sparks(hot, gold):
    rng = random.Random(707)
    origin = Vector((-.44, -.77, .04))
    bursts = [(10, 4), (25, 3), (46, 6), (69, 3), (86, 4)]
    for index in range(12):
        direction = Vector((rng.uniform(-.9, .35), rng.uniform(-.9, -.34), rng.uniform(-.48, .68))).normalized()
        spark = rod("Service arc" if index < 3 else "Flying spark", (0, 0, 0), direction * rng.uniform(.07, .16),
                    .012 if index < 3 else .006, hot if index < 4 else gold, 6)
        # Rod geometry stays in local space, so all travel keys can share the same emitter.
        for start, length in bursts:
            delay = index % 3
            last = start + length + delay
            for frame, distance, scale in [
                (start + delay - 1, 0, .0001),
                (start + delay, .01, 1),
                (last - 1, .23 + index * .022, .55),
                (last, .32 + index * .027, .0001),
            ]:
                spark.location = origin + direction * distance
                spark.scale = (scale,) * 3
                spark.keyframe_insert("location", frame=frame)
                spark.keyframe_insert("scale", frame=frame)
        for frame in (1, 96):
            spark.location = origin
            spark.scale = (.0001,) * 3
            spark.keyframe_insert("location", frame=frame)
            spark.keyframe_insert("scale", frame=frame)
        if spark.animation_data and spark.animation_data.action:
            spark.animation_data.action.name = f"Spark {index + 1:02d}"


def build(damaged):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 1, 96
    scene.render.fps = 24
    scene.unit_settings.system = "METRIC"
    frame = material("Blackened frame", (.034, .047, .06), .8, .35)
    body = material("Gunmetal chassis", (.082, .103, .121), .68, .34)
    panel = material("Ceramic access panels", (.135, .171, .19), .54, .37)
    alloy = material("Dish alloy", (.34, .38, .41), .82, .26)
    copper = material("Oxidized fasteners", (.27, .136, .063), .76, .4)
    ink = material("Stenciled lettering", (.62, .69, .68), .08)
    cavity = material("Service cavity", (.012, .014, .017), .35, .72)
    indicator = material("Teal status", (.027, .65, .57), emission=3)
    warning = material("Amber fault", (.84, .24, .032), emission=2)
    cells = [material(f"Photovoltaic blue {i}", (.016 + i * .005, .053 + i * .008, .125 + i * .013), .55, .22)
             for i in range(4)]
    box("Central avionics chassis", (0, 0, 0), (1.88, 1.13, 1.06), body, .085)
    for x in (-.91, .91):
        box("End bulkhead", (x, 0, 0), (.18, 1.24, 1.14), frame, .05)
    for x in (-.52, .52):
        box("Top service panel", (x, 0, .56), (.66, .91, .10), panel)
        for y in (-.39, .39):
            box("Panel latch", (x, y, .62), (.25, .085, .064), copper)
    box("Designation panel", (.40, -.60, .08), (.83, .14, .72), panel)
    stencil("T-07", (.07, -.674, .06), .29, ink)
    stencil("RELAY", (.08, -.674, -.19), .115, ink)
    for x in (-.78, .79):
        for z in (-.39, .38):
            rod("Access panel bolt", (x, -.61, z), (x, -.70, z), .044, alloy, 8)
    for x in (-.68, -.58, -.48, -.38, -.28):
        box("Heat sink rib", (x, .09, -.57), (.037, .82, .108), frame)
    if damaged:
        box("Recessed service bay", (-.47, -.624, .04), (.55, .13, .60), cavity)
        for index in range(4):
            x = -.68 + index * .12
            rod("Exposed copper bus", (x, -.703, -.17), (x + .045, -.72, .25), .019, copper)
        lid = box("Hanging service cover", (-.28, -.78, -.35), (.54, .082, .43), panel)
        lid.rotation_euler = (.35, .30, -.21)
        box("Fault light", (-.77, -.71, -.14), (.048, .032, .075), warning, .008)
        sparks(material("White-hot spark", (1, .62, .22), emission=15),
               material("Copper spark", (1, .20, .025), emission=8))
    else:
        box("Sealed service cover", (-.46, -.619, .04), (.55, .12, .61), panel)
        for z in (-.12, .02):
            box("Service status light", (-.75, -.691, z), (.052, .035, .074), indicator, .008)
    for side in (-1, 1):
        solar(side, damaged, frame, cells, copper)
        root = Vector((side * .48, 0, side * .47))
        direction = Vector((side * .47, side * .32, side * .82)).normalized()
        hub = root + direction * .57
        rod("Reflector boom", root, hub, .072, frame)
        dish("Upper reflector" if side > 0 else "Lower reflector", hub, direction,
             damaged and side > 0, alloy, frame, copper)
    prop = list(scene.objects)
    root = bpy.data.objects.new("Relay T-07 | Damaged" if damaged else "Relay T-07 | Functional", None)
    scene.collection.objects.link(root)
    for obj in prop:
        obj.parent = root
    root["designation"] = "RELAY T-07"
    root["state"] = "OFFLINE" if damaged else "ONLINE"
    if damaged:
        root["spark_loop_seconds"] = 4
    return scene


def preview(scene):
    scene.world = bpy.data.worlds.new("Dark orbital space")
    scene.world.use_nodes = True
    sky = scene.world.node_tree.nodes.get("Background")
    sky.inputs["Color"].default_value = (.019, .030, .049, 1)
    sky.inputs["Strength"].default_value = .5
    bpy.ops.object.camera_add(location=(5.7, -10, 6.9))
    camera = bpy.context.object
    camera.rotation_euler = (-camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 8.7
    scene.camera = camera
    for name, position, energy, color, size in [
        ("Cool key", (1, -5, 6), 1100, (.78, .89, 1), 5),
        ("Warm rim", (-3, 3, 4), 1250, (1, .70, .43), 3),
        ("Solar fill", (4, -1, 5), 700, (.52, .74, 1), 4),
    ]:
        bpy.ops.object.light_add(type="AREA", location=position)
        lamp = bpy.context.object
        lamp.name = name
        lamp.rotation_euler = (-lamp.location).to_track_quat("-Z", "Y").to_euler()
        lamp.data.energy, lamp.data.color, lamp.data.shape, lamp.data.size = energy, color, "DISK", size
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1250, 790
    scene.render.resolution_percentage = 100
    tree = bpy.data.node_groups.new("Relay spark glow", "CompositorNodeTree")
    scene.compositing_node_group = tree
    tree.interface.new_socket(name="Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    nodes = tree.nodes
    layer = nodes.new("CompositorNodeRLayers")
    glare = nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Fog Glow"
    output = nodes.new("NodeGroupOutput")
    tree.links.new(layer.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], output.inputs["Image"])


def combine_spark_tracks(path):
    """Publish one synchronized glTF clip for all spark emitters."""
    data = path.read_bytes()
    size = struct.unpack_from("<I", data, 12)[0]
    document = json.loads(data[20:20 + size])
    clip = {"name": "Service Panel Sparks", "samplers": [], "channels": []}
    for track in document["animations"]:
        offset = len(clip["samplers"])
        clip["samplers"].extend(track["samplers"])
        for channel in track["channels"]:
            clip["channels"].append({**channel, "sampler": channel["sampler"] + offset})
    document["animations"] = [clip]
    payload = json.dumps(document, separators=(",", ":")).encode("utf-8")
    payload += b" " * (-len(payload) % 4)
    binary = data[20 + size:]
    header = struct.pack("<4sIIII", b"glTF", 2, 20 + len(payload) + len(binary), len(payload), 0x4E4F534A)
    path.write_bytes(header + payload + binary)


for damaged in (False, True):
    scene = build(damaged)
    stem = "relay-t07-damaged" if damaged else "relay-t07-functional"
    scene.frame_set(1)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / (stem + ".glb")), export_format="GLB",
        export_extras=True, export_apply=True, export_animations=damaged,
        export_animation_mode="SCENE",
    )
    if damaged:
        combine_spark_tracks(OUT / (stem + ".glb"))
    preview(scene)
    scene.frame_set(48 if damaged else 1)
    scene.render.filepath = str(OUT / (stem + ".png"))
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / (stem + ".blend")))
    bpy.ops.render.render(write_still=True)
