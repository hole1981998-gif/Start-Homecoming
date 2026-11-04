"""Build a stylized roadside fishing skiff in a new Blender scene.

Run from the connected Blender with runpy.run_path. Existing scenes are retained;
the .blend is saved as a copy, and only the skiff scene is selected for GLB export.
"""

import math
import os
import runpy

import bpy
from mathutils import Vector


OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
SCENE_NAME = 'CoastalBoat'
if SCENE_NAME in bpy.data.scenes:
    raise RuntimeError('CoastalBoat scene already exists; preserve it before rebuilding')

scene = bpy.data.scenes.new(SCENE_NAME)
bpy.context.window.scene = scene
root = bpy.data.objects.new('homecoming_coastal_boat_root', None)
scene.collection.objects.link(root)


def hex_rgba(value):
    rgb = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return (*[pow(c, 2.2) for c in rgb], 1)


def mat(name, color, roughness=.76, metallic=0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = hex_rgba(color)
    bsdf = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = hex_rgba(color)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return material


hull = mat('boat_storm_teal', '#558f91', .69)
keel = mat('boat_deep_keel', '#345b66', .81)
stripe = mat('boat_warm_stripe', '#d7a96b', .69)
wood = mat('boat_weathered_wood', '#927455', .88)
canvas = mat('boat_oat_canvas', '#d8c89f', .91)
canvas_edge = mat('boat_canvas_edge', '#ad7556', .82)
metal = mat('boat_dark_metal', '#435860', .57, .18)
net = mat('boat_net_green', '#829d87', .92)
orange = mat('boat_buoy_coral', '#d67f57', .65)
shade = mat('boat_shadow', '#2c464c', .93)


def attach(obj, name, material):
    obj.name = name
    obj.data.materials.append(material)
    obj.parent = root
    return obj


def block(name, location, dimensions, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('soft_edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 1
        obj.modifiers.new('weighted_normals', 'WEIGHTED_NORMAL')
    return attach(obj, name, material)


def beam(name, start, end, thickness, material):
    start, end = Vector(start), Vector(end)
    direction = end - start
    obj = block(name, (start + end) / 2, (thickness, thickness, direction.length), material)
    obj.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()
    return obj


def panels(name, vertices, faces, material):
    mesh = bpy.data.meshes.new(name + '_mesh')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return attach(obj, name, material)


# Bow points toward Blender +Y. The glTF importer converts the up axis for Three.js.
stations = [
    (-1.55, .59, .64, .34, .17),
    (-.90, .72, .67, .43, .11),
    (.05, .79, .68, .47, .10),
    (1.13, .58, .70, .31, .18),
    (1.79, .08, .72, .055, .33),
]
for side, side_name in [(-1, 'port'), (1, 'starboard')]:
    for i in range(len(stations) - 1):
        a, b = stations[i], stations[i + 1]
        vertices = [
            (side * a[1], a[0], a[2]), (side * b[1], b[0], b[2]),
            (side * b[3], b[0], b[4]), (side * a[3], a[0], a[4]),
        ]
        panels(f'hull_{side_name}_{i}', vertices, [(0, 1, 2), (0, 2, 3)], hull)
        beam(f'gunwale_{side_name}_{i}', vertices[0], vertices[1], .075, wood)
        beam(f'paint_stripe_{side_name}_{i}',
             (side * (a[1] * .98), a[0], a[2] - .13),
             (side * (b[1] * .98), b[0], b[2] - .13), .048, stripe)
        beam(f'rib_{side_name}_{i}', vertices[0], vertices[3], .055, wood)
        bottom = [(0, a[0], a[4] - .025), (0, b[0], b[4] - .025),
                  vertices[2], vertices[3]]
        panels(f'keel_{side_name}_{i}', bottom, [(0, 1, 2), (0, 2, 3)], keel)

panels('stern_transom', [(-.59, -1.55, .64), (.59, -1.55, .64),
                          (.34, -1.55, .17), (-.34, -1.55, .17)],
       [(0, 1, 2), (0, 2, 3)], hull)
beam('bow_prow', (0, 1.43, .56), (0, 1.84, .75), .10, stripe)
block('inner_floor_planks', (0, -.16, .25), (1.08, 2.45, .08), wood)
for y in [-.93, .12, .94]:
    block(f'cross_bench_{y}', (0, y, .48), (1.20, .29, .09), stripe, .025)
for side in [-1, 1]:
    for y in [-1.13, -.25, .60]:
        beam(f'inner_frame_{side}_{y}', (side * .46, y, .26),
             (side * .67, y, .63), .055, wood)

# A short canvas canopy keeps the silhouette human-scaled without hiding the bow.
for side in [-1, 1]:
    for y in [-1.06, .21]:
        beam(f'canopy_post_{side}_{y}', (side * .54, y, .58),
             (side * .58, y, 1.42), .065, wood)
for y in [-1.09, .24]:
    beam(f'canopy_ridge_{y}', (-.59, y, 1.42), (.59, y, 1.42), .055, wood)
panels('canopy_left', [(-.72, -.99, 1.32), (0, -.99, 1.53),
                       (0, .16, 1.53), (-.72, .16, 1.32)],
       [(0, 1, 2), (0, 2, 3)], canvas)
panels('canopy_right', [(0, -.99, 1.53), (.72, -.99, 1.32),
                        (.72, .16, 1.32), (0, .16, 1.53)],
       [(0, 1, 2), (0, 2, 3)], canvas)
for side in [-1, 1]:
    beam(f'canvas_edge_{side}', (side * .73, -.99, 1.31),
         (side * .73, .16, 1.31), .035, canvas_edge)

# Working-boat details visible from gameplay, side and top angles.
block('outboard_motor', (0, -1.78, .47), (.28, .30, .42), metal, .04)
block('outboard_prop', (0, -1.79, .17), (.46, .055, .065), shade)
beam('tiller_handle', (0, -1.62, .60), (-.27, -1.05, .72), .045, metal)
block('fish_crate', (-.26, .63, .43), (.48, .47, .30), wood, .018)
block('crate_lid', (-.26, .63, .60), (.52, .50, .045), stripe)
for side in [-1, 1]:
    beam(f'lashed_oar_{side}', (side * .70, -.27, .78),
         (side * .87, 1.24, .68), .042, wood)
    block(f'oar_blade_{side}', (side * .89, 1.34, .67),
          (.16, .37, .035), wood, .015)
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6,
                                     radius=1, location=(.35, -.52, .56))
buoy = bpy.context.object
buoy.scale = (.16, .16, .16)
attach(buoy, 'orange_lifebuoy', orange)
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6,
                                     radius=1, location=(.20, .86, .53))
fishing_net = bpy.context.object
fishing_net.scale = (.31, .19, .12)
attach(fishing_net, 'rolled_fishing_net', net)

scene.unit_settings.system = 'METRIC'
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
runpy.run_path(os.path.join(OUTPUT_DIR, 'export-coastal-boat.py'), run_name='__main__')
glb_path = os.path.join(OUTPUT_DIR, 'coastal-fishing-boat.glb')
blend_path = os.path.join(OUTPUT_DIR, 'coastal-fishing-boat.blend')
bpy.ops.wm.save_as_mainfile(filepath=blend_path, copy=True)
print({'scene': scene.name, 'meshes': sum(obj.type == 'MESH' for obj in scene.objects),
       'glb': glb_path, 'blend_copy': blend_path,
       'original_file_still_active': bpy.data.filepath})
