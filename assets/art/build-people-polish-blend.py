"""Package passengers with a copy of the owner's adjusted driver mesh.

Run with Blender 5.2: blender -b assets/art/people-edit-source.blend --python
assets/art/build-people-polish-blend.py
"""
from pathlib import Path

import bpy

root = Path(bpy.data.filepath).parents[2]
source = root / 'assets' / 'art' / 'people-proportions-pass.glb'
output = root / 'assets' / 'art' / 'people-polished.blend'
driver_output = root / 'assets' / 'art' / 'driver-adjusted-delivery.glb'
before = set(bpy.data.objects)
bpy.context.window.scene = bpy.data.scenes['PeopleEdit']
bpy.ops.import_scene.gltf(filepath=str(source))
imported = set(bpy.data.objects) - before
if not imported:
    raise RuntimeError('Character GLB produced no imported objects')

scene = bpy.data.scenes.new('PeoplePolished')
collection = bpy.data.collections.new('people_polished_editable')
scene.collection.children.link(collection)
generated_driver = next(obj for obj in imported if obj.name.startswith('chr_driver_root'))
def descendants(obj):
    return {obj, *(child for direct in obj.children for child in descendants(direct))}
generated_driver_parts = descendants(generated_driver)
for obj in imported:
    if obj in generated_driver_parts:
        continue
    collection.objects.link(obj)
    for previous_collection in tuple(obj.users_collection):
        if previous_collection is not collection:
            previous_collection.objects.unlink(obj)
for obj in generated_driver_parts:
    bpy.data.objects.remove(obj, do_unlink=True)

# The adjusted mesh is the actual Blender source for the delivered driver,
# rather than a procedural approximation of the owner's edited silhouette.
adjusted = bpy.data.collections['driver.adjusted']
driver_collection = bpy.data.collections.new('driver_adjusted_delivery')
scene.collection.children.link(driver_collection)
copies = {original: original.copy() for original in adjusted.objects}
for original, copy in copies.items():
    if original.data:
        copy.data = original.data.copy()
    driver_collection.objects.link(copy)
for original, copy in copies.items():
    copy.parent = copies.get(original.parent)
    copy.matrix_parent_inverse = original.matrix_parent_inverse.copy()
    copy.matrix_basis = original.matrix_basis.copy()
    copy['source_collection'] = 'driver.adjusted'
scene['source_glb'] = source.name
scene['reference_collection'] = 'PeopleEdit / driver.adjusted'
scene['note'] = 'Driver is an independent copy of owner-adjusted mesh; original remains untouched.'
bpy.context.window.scene = scene
for obj in scene.objects:
    obj.select_set(obj in copies.values())
bpy.context.view_layer.objects.active = copies[next(
    original for original in copies if original.parent not in copies)]
bpy.ops.export_scene.gltf(filepath=str(driver_output), export_format='GLB',
                          use_selection=True, export_apply=False)
for obj in scene.objects:
    obj.select_set(False)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(output), check_existing=False)
print(f'Saved {output}; {len(scene.objects)} objects in {scene.name}; driver {driver_output}')
