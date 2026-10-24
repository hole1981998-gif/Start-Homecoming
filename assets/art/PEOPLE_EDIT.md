# NPC source for Blender editing

Open `people-edit-source.blend` in Blender. The active `PeopleEdit` scene contains all 13 current near-detail characters, with one collection per archetype. Mesh parts and transform pivots retain names from `src/art/people.ts`; each figure is spaced on a grid only for editing. The driver is included alongside 12 passengers.

This is an editable **static stand-pose export** of the current runtime meshes and materials. The game still builds characters from `src/art/people.ts`; changes to the `.blend` do not appear in the game until the edited models are exported and integrated in a later pass. Pose logic, timing, and collision are not encoded as Blender actions or armatures in this file.

`people-edit-source.glb` is the import snapshot used to make the `.blend`. `export-people-to-gltf.mjs` can regenerate that snapshot from the TypeScript source, but regeneration replaces the snapshot; keep your edited `.blend` separate from the generated source.
