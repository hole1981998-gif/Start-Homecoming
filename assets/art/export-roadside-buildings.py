"""Batch the editable market and midrise scenes by material for preview GLBs."""

from pathlib import Path
from math import pi

import bpy
from mathutils import Matrix


OUT = Path(__file__).resolve().parent
BUILDINGS = (
    ("CornerMarket", "homecoming_corner_market_root", "corner-market.glb", False),
    ("Scene", "homecoming_midrise_root", "roadside-midrise.glb", True),
)


def export_building(scene_name: str, root_name: str, filename: str,
                    upright_from_y: bool) -> None:
    bpy.context.window.scene = bpy.data.scenes[scene_name]
    root = bpy.data.objects[root_name]
    source = [obj for obj in root.children if obj.type == "MESH"]
    if not source:
        raise RuntimeError(f"{scene_name} has no source meshes")

    groups = {}
    temp_prefix = "__art_export_tmp__"
    try:
        for obj in source:
            duplicate = obj.copy()
            duplicate.data = obj.data.copy()
            bpy.context.scene.collection.objects.link(duplicate)
            duplicate.parent = None
            # The older midrise source runs along Blender Y; its preview contract
            # expects that length upright after export.
            upright = Matrix.Rotation(pi / 2, 4, "X") if upright_from_y else Matrix.Identity(4)
            duplicate.matrix_world = upright @ obj.matrix_world
            duplicate.name = temp_prefix + obj.name
            bpy.ops.object.select_all(action="DESELECT")
            duplicate.select_set(True)
            bpy.context.view_layer.objects.active = duplicate
            for modifier in list(duplicate.modifiers):
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            groups.setdefault(duplicate.material_slots[0].material.name, []).append(duplicate)

        for material_name, members in groups.items():
            bpy.ops.object.select_all(action="DESELECT")
            for obj in members:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = members[0]
            if len(members) > 1:
                bpy.ops.object.join()
            members[0].name = f"{temp_prefix}{root_name}_{material_name}"

        bpy.ops.object.select_all(action="DESELECT")
        for members in groups.values():
            members[0].select_set(True)
        bpy.context.view_layer.objects.active = next(iter(groups.values()))[0]
        bpy.ops.export_scene.gltf(
            filepath=str(OUT / filename), export_format="GLB", use_selection=True,
            use_active_scene=True, export_yup=True,
        )
        print({"glb": filename, "source_meshes": len(source), "material_batches": len(groups)})
    finally:
        for obj in list(bpy.context.scene.objects):
            if obj.name.startswith(temp_prefix):
                bpy.data.objects.remove(obj, do_unlink=True)
        bpy.ops.object.select_all(action="DESELECT")
        root.select_set(True)
        bpy.context.view_layer.objects.active = root


available = [building for building in BUILDINGS if building[0] in bpy.data.scenes]
if not available:
    raise RuntimeError("Open a CornerMarket or midrise Scene .blend before export")
for building in available:
    export_building(*building)
