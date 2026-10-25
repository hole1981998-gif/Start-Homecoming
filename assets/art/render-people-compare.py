"""Render saved driver and user-adjusted duplicate without modifying their .blend."""
import bpy
from pathlib import Path
from mathutils import Vector

polished = 'PeoplePolished' in bpy.data.scenes and \
    Path(bpy.data.filepath).name == 'people-polished.blend'
scene = bpy.data.scenes['PeoplePolished' if polished else 'PeopleEdit']
bpy.context.window.scene = scene
for obj in scene.objects:
    obj.hide_render = True
if polished:
    driver = bpy.data.objects['chr_driver_root.002']
    def reveal(obj):
        obj.hide_render = False
        for child in obj.children:
            reveal(child)
    reveal(driver)
    for obj in bpy.data.collections['driver.adjusted'].objects:
        scene.collection.objects.link(obj)
        obj.hide_render = False
    bpy.data.objects['chr_driver_root.001'].location.x = -0.75
    driver.location.x = 0.75
else:
    for name in ('driver', 'driver.adjusted'):
        for obj in bpy.data.collections[name].objects:
            obj.hide_render = False
    root_original = bpy.data.objects['chr_driver_root']
    root_adjusted = bpy.data.objects['chr_driver_root.001']
    root_original.location.x = -0.75
    root_adjusted.location.x = 0.75

camera_data = bpy.data.cameras.new('comparison_camera')
camera = bpy.data.objects.new('comparison_camera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera.location = (3.0, -6.0, 2.9)
target = Vector((0, 0, 1.0))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 3.7

scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.color_type = 'MATERIAL'
scene.display.shading.light = 'STUDIO'
scene.display.shading.background_type = 'VIEWPORT'
scene.display.shading.background_color = (.78, .81, .80)
scene.display.shading.show_shadows = True
scene.display.shading.show_cavity = True
scene.render.resolution_x = 960
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.filepath = str(Path(bpy.data.filepath).parents[2] /
                            'art-preview' / ('driver-polished-compare.png' if polished else
                                             'driver-proportion-compare.png'))
bpy.ops.render.render(write_still=True)
