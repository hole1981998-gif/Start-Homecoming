"""Package refined code-generated people beside the user's untouched edit scene.

Run with Blender 5.2: blender -b assets/art/people-edit-source.blend --python
assets/art/build-people-polish-blend.py
"""
from pathlib import Path

import bpy

root = Path(bpy.data.filepath).parents[2]
source = root / 'assets' / 'art' / 'people-proportions-pass.glb'
output = root / 'assets' / 'art' / 'people-polished.blend'
before = set(bpy.data.objects)
bpy.context.window.scene = bpy.data.scenes['PeopleEdit']
bpy.ops.import_scene.gltf(filepath=str(source))
imported = set(bpy.data.objects) - before
if not imported:
    raise RuntimeError('Character GLB produced no imported objects')

scene = bpy.data.scenes.new('PeoplePolished')
collection = bpy.data.collections.new('people_polished_editable')
scene.collection.children.link(collection)
for obj in imported:
    collection.objects.link(obj)
    for previous_collection in tuple(obj.users_collection):
        if previous_collection is not collection:
            previous_collection.objects.unlink(obj)
scene['source_glb'] = source.name
scene['reference_collection'] = 'PeopleEdit / driver.adjusted'
scene['note'] = 'Original PeopleEdit and driver.adjusted are preserved; polish is separate.'
bpy.context.window.scene = scene
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(output), check_existing=False)
print(f'Saved {output}; {len(imported)} objects in {scene.name}')
