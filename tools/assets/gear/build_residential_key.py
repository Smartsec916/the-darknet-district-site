"""Build the District residential access card at real scale (Blender background script).

Run with blender -b -P tools/assets/gear/build_residential_key.py -- OUTPUT.glb APARTMENT
"""
import math
from pathlib import Path
import sys

import bpy


def material(name, color, metallic, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


def plate(name, x, y, z, width, height, depth, radius, mat):
    # Round the planar corners independently of the thin laminate thickness.
    ring = []
    for i, (cx, cy) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
        for j in range(5):
            a = math.pi * (i / 2 + j / 8)
            ring.append((x + cx * (width / 2 - radius) + radius * math.cos(a),
                         y + cy * (height / 2 - radius) + radius * math.sin(a)))
    n = len(ring)
    verts = [(px, py, pz) for pz in (z - depth / 2, z + depth / 2) for px, py in ring]
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    faces.extend((i, (i + 1) % n, (i + 1) % n + n, i + n) for i in range(n))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(mat)
    return obj


def print_line(name, value, x, y, size):
    font = bpy.data.curves.new(name, "FONT")
    font.body = value
    font.size = size
    obj = bpy.data.objects.new(name, font)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, .00091)
    font.materials.append(ink)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)


output, apartment = sys.argv[sys.argv.index("--") + 1:]
if not apartment.isdecimal():
    raise ValueError("Supply the registered apartment number")
bpy.ops.wm.read_factory_settings(use_empty=True)
edge = material("Brushed edge", (.22, .24, .25), .76, .52)
face = material("Graphite composite", (.023, .031, .036), .32, .53)
gold = material("Contact alloy", (.63, .43, .18), .78, .32)
ink = material("Printed ivory", (.84, .86, .80), .04, .56)
led = material("Cyan status", (.08, .72, .75), .1, .32)
shader = led.node_tree.nodes.get("Principled BSDF")
shader.inputs["Emission Color"].default_value = (.02, .72, .85, 1)
shader.inputs["Emission Strength"].default_value = 1.4
plate("Worn rim", 0, 0, 0, .0856, .054, .0014, .0032, edge)
plate("Composite face", 0, 0, .00077, .0851, .05355, .00014, .0031, face)
plate("Reverse laminate", 0, 0, -.00077, .0851, .05355, .00014, .0031, face)
for x in range(2):
    for y in range(3):
        plate("Chip contact", -.032 + x * .0043, .008 + y * .0029, .00087,
              .004, .0026, .00006, .00055, gold)
plate("Identification light", .033, .016, .00087, .007, .0014, .00006, .00055, led)
print_line("Issuer", "OLD TOWN   /   RESIDENTIAL", -.035, -.003, .0031)
print_line("Cardholders", "Kade & Lace", -.035, -.014, .007)
print_line("Apartment number", apartment, .014, -.014, .009)
Path(output).parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=output, export_format="GLB", export_cameras=False,
                          export_lights=False, export_animations=False)
