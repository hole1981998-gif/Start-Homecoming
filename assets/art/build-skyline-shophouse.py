"""Create an editable five-level skyline shophouse in a new Blender scene.

The open file and its existing scenes remain active on disk. A .blend copy and
a material-batched GLB are produced in this folder for roadside art previews.
"""

import os
import runpy

import bpy
from mathutils import Vector


OUT = os.path.dirname(os.path.abspath(__file__))
NAME = 'SkylineShophouse'
if NAME in bpy.data.scenes:
    raise RuntimeError('SkylineShophouse already exists; preserve it before rebuilding')
scene = bpy.data.scenes.new(NAME)
bpy.context.window.scene = scene
root = bpy.data.objects.new('homecoming_skyline_shophouse_root', None)
scene.collection.objects.link(root)


def rgba(value):
    channels = [int(value[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return (*[pow(c, 2.2) for c in channels], 1)


def material(name, color, roughness=.8, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = rgba(color)
    shader = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = rgba(color)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return mat


plaster = material('skyline_warm_plaster', '#d5b393')
side = material('skyline_side_plaster', '#b9947d')
trim = material('skyline_terracotta_trim', '#aa6b55')
concrete = material('skyline_rain_concrete', '#8d8176')
recess = material('skyline_deep_recess', '#384f55')
glass = material('skyline_teal_glass', '#4c7d82', .31, .06)
lit = material('skyline_warm_windows', '#e4bb7a', .43)
rail = material('skyline_charcoal_rail', '#475c5f', .65, .08)
awning = material('skyline_green_awning', '#5f8981', .84)
wood = material('skyline_shop_wood', '#91694f', .85)
plant = material('skyline_balcony_green', '#5c9865', .85)
metal = material('skyline_roof_metal', '#738e8b', .56, .14)


def attach(obj, name, mat):
    obj.name = name
    obj.data.materials.append(mat)
    obj.parent = root
    return obj


def block(name, xyz, dims, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = bpy.context.object
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        soft = obj.modifiers.new('small_soft_edges', 'BEVEL')
        soft.width = bevel
        soft.segments = 1
        obj.modifiers.new('weighted_normals', 'WEIGHTED_NORMAL')
    return attach(obj, name, mat)


def beam(name, start, end, thick, mat):
    a, b = Vector(start), Vector(end)
    obj = block(name, (a + b) / 2, (thick, thick, (b - a).length), mat)
    obj.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    return obj


def panel(name, vertices, faces, mat):
    mesh = bpy.data.meshes.new(name + '_geometry')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return attach(obj, name, mat)


def cylinder(name, xyz, radius, depth, mat, vertices=10):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius,
                                        depth=depth, location=xyz)
    return attach(bpy.context.object, name, mat)


# Front is -Y in Blender (glTF +Z forward). A stepped mass avoids a box skyline.
block('ground_shop_volume', (0, 0, 1.73), (6.45, 6.65, 3.46), concrete, .05)
block('upper_warm_mass', (0, .15, 8.66), (6.24, 6.31, 10.4), plaster, .06)
block('upper_setback_penthouse', (.51, .61, 15.63), (4.80, 5.20, 3.52), side, .045)
block('side_stairwell_riser', (-2.64, .56, 9.28), (1.11, 5.00, 18.56), trim, .045)
block('ground_flood_stain', (0, -3.34, .30), (6.29, .045, .43), side)
for z in [3.42, 6.83, 10.26, 13.64]:
    block(f'floor_course_{z}', (0, -.05, z), (6.55, 6.75, .13), trim, .018)
    block(f'side_course_{z}', (3.19, .18, z), (.13, 5.92, .12), concrete)

# A recessed, wide storefront with layered canopy and signs.
block('shop_recess', (.51, -3.365, 1.45), (4.90, .06, 2.38), recess)
for index, x in enumerate([-1.42, -.14, 1.14]):
    block(f'shop_glass_{index}', (x, -3.416, 1.49), (1.05, .035, 1.76), glass)
    block(f'shop_sill_{index}', (x, -3.463, .56), (1.18, .095, .21), wood)
    for side_x in [-.56, .56]:
        block(f'shop_mullion_{index}_{side_x}', (x + side_x, -3.455, 1.48),
              (.065, .08, 1.88), rail)
block('shop_entry', (2.35, -3.43, 1.20), (.76, .065, 2.27), wood)
block('shop_entry_glass', (2.35, -3.47, 1.68), (.57, .025, .83), glass)
block('ground_sign_back', (0, -3.51, 2.92), (5.48, .12, .45), trim)
block('ground_sign_face', (0, -3.59, 2.94), (5.17, .03, .29), lit)
for x in [-1.9, -1.15, -.36, .48, 1.28, 2.0]:
    block(f'abstract_sign_mark_{x}', (x, -3.62, 2.94), (.31, .02, .085), recess)
panel('folded_rain_canopy', [(-3.12, -3.35, 2.62), (3.12, -3.35, 2.62),
                             (3.12, -4.25, 2.31), (-3.12, -4.25, 2.31)],
      [(0, 1, 2), (0, 2, 3)], awning)
block('awning_front_bead', (0, -4.27, 2.28), (6.38, .13, .14), trim)
for x in [-2.72, 2.72]:
    beam(f'awning_support_{x}', (x, -3.37, 2.22), (x, -4.18, 2.26), .07, rail)

# Four residential bands: bays stagger by floor, so the facade has rhythm.
for floor in range(3):
    z = 4.42 + floor * 3.43
    balcony_shift = .25 if floor == 1 else -.18 if floor == 2 else 0
    block(f'balcony_slab_{floor}', (balcony_shift, -3.54, z - .71),
          (5.45, 1.17, .16), concrete, .025)
    block(f'balcony_front_rail_{floor}', (balcony_shift, -4.08, z + .08),
          (5.45, .075, .09), rail)
    for x in [-2.34, -.78, .78, 2.34]:
        block(f'balcony_bar_{floor}_{x}', (x + balcony_shift, -4.07, z - .31),
              (.055, .055, .66), rail)
    for bay, x in enumerate([-1.34, 1.34]):
        block(f'front_recess_{floor}_{bay}', (x, -3.08, z + .38),
              (1.63, .035, 1.64), recess)
        block(f'front_window_{floor}_{bay}', (x, -3.13, z + .38),
              (1.39, .045, 1.39), lit if floor == 1 and bay == 0 else glass)
        block(f'front_lintel_{floor}_{bay}', (x, -3.18, z + 1.25),
              (1.82, .15, .13), trim)
        block(f'front_sill_{floor}_{bay}', (x, -3.22, z - .45),
              (1.77, .21, .10), concrete)
    if floor != 1:
        block(f'balcony_planter_{floor}', (2.15 + balcony_shift, -3.83, z - .51),
              (.59, .34, .28), trim, .02)
        for x in [1.98, 2.17, 2.36]:
            cylinder(f'balcony_leaf_{floor}_{x}', (x + balcony_shift, -3.84, z - .20),
                     .14, .39, plant, 7)

# Both side walls and rear remain legible during turns, unlike flat backlot boxes.
for side_x in [-1, 1]:
    sx = side_x * 3.15
    for floor in range(4):
        z = 4.30 + floor * 3.33
        for y in [-1.26, 1.41]:
            block(f'side_recess_{side_x}_{floor}_{y}', (sx, y, z),
                  (.035, 1.05, 1.30), recess)
            block(f'side_window_{side_x}_{floor}_{y}',
                  (sx + side_x * .035, y, z), (.04, .83, 1.06), glass)
            block(f'side_sill_{side_x}_{floor}_{y}',
                  (sx + side_x * .07, y, z - .68), (.12, 1.11, .12), concrete)
for floor in range(4):
    z = 4.30 + floor * 3.33
    for x in [-1.56, .34, 2.15]:
        block(f'rear_recess_{floor}_{x}', (x, 3.32, z),
              (1.03, .035, 1.34), recess)
        block(f'rear_window_{floor}_{x}', (x, 3.36, z),
              (.80, .04, 1.12), glass if floor != 1 else lit)
        block(f'rear_sill_{floor}_{x}', (x, 3.43, z - .68),
              (1.12, .15, .11), concrete)
block('rear_service_door', (-1.96, 3.37, 1.19), (.84, .075, 2.12), wood)
block('rear_gutter', (2.95, 3.38, 7.30), (.12, .14, 14.2), rail)

# A small roof terrace, staggered tank and sloped solar panel finish the skyline.
for x in [-1.72, .65, 2.75]:
    block(f'roof_parapet_front_{x}', (x, -2.52, 17.55),
          (x == .65 and 2.24 or .80, .18, .62), concrete)
block('roof_terrace_slab', (.52, .62, 17.43), (5.23, 5.61, .24), concrete)
for side_x in [-1, 1]:
    block(f'roof_side_parapet_{side_x}', (side_x * 2.98, .62, 17.79),
          (.17, 5.53, .51), concrete)
cylinder('rainwater_tank', (1.55, 1.57, 18.32), .74, 1.28, metal, 12)
cylinder('rainwater_tank_lid', (1.55, 1.57, 18.99), .79, .12, rail, 12)
block('solar_panel', (-.54, -.48, 18.04), (1.69, 1.09, .09), glass, .025).rotation_euler.x = -.29
for x in [-1.19, .11]:
    beam(f'solar_mount_{x}', (x, -.39, 17.56), (x, -.71, 17.98), .065, rail)
beam('roof_antenna', (-2.57, 1.58, 17.42), (-2.57, 1.58, 19.45), .035, rail)
for z in [18.42, 19.08]:
    beam(f'antenna_cross_{z}', (-2.90, 1.58, z), (-2.24, 1.58, z), .035, rail)

scene.unit_settings.system = 'METRIC'
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
bpy.context.view_layer.objects.active = root
runpy.run_path(os.path.join(OUT, 'export-skyline-shophouse.py'), run_name='__main__')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'skyline-shophouse.blend'), copy=True)
print({'scene': scene.name, 'meshes': sum(obj.type == 'MESH' for obj in scene.objects),
       'original_file_still_active': bpy.data.filepath})
