"""Batch SkylineShophouse source meshes by material for the preview GLB."""

import os

import bpy


scene = bpy.data.scenes['SkylineShophouse']
bpy.context.window.scene = scene
root = bpy.data.objects['homecoming_skyline_shophouse_root']
bpy.context.view_layer.update()
source = [obj for obj in root.children if obj.type == 'MESH']
if not source:
    raise RuntimeError('SkylineShophouse has no source meshes')

copies = []
for obj in source:
    duplicate = obj.copy()
    duplicate.data = obj.data.copy()
    scene.collection.objects.link(duplicate)
    duplicate.parent = None
    duplicate.matrix_world = obj.matrix_world.copy()
    duplicate.name = 'export_' + obj.name
    bpy.ops.object.select_all(action='DESELECT')
    duplicate.select_set(True)
    bpy.context.view_layer.objects.active = duplicate
    for modifier in list(duplicate.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    copies.append(duplicate)

groups = {}
for obj in copies:
    name = obj.material_slots[0].material.name
    groups.setdefault(name, []).append(obj)

batches = []
for name, members in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in members:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = members[0]
    if len(members) > 1:
        bpy.ops.object.join()
    members[0].name = 'skyline_material_' + name
    batches.append(members[0])

bpy.ops.object.select_all(action='DESELECT')
for obj in batches:
    obj.select_set(True)
bpy.context.view_layer.objects.active = batches[0]
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'skyline-shophouse.glb')
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True,
                          use_active_scene=True, export_yup=True)
for obj in batches:
    bpy.data.objects.remove(obj, do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
bpy.context.view_layer.objects.active = root
print({'glb': path, 'source_meshes': len(source), 'material_batches': len(groups)})
