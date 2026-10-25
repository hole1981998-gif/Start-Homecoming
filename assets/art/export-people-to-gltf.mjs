/** Export the current runtime characters as editable geometry for Blender. */
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;
  async readAsArrayBuffer(blob) {
    try { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
    catch (error) { this.onerror?.(error); }
  }
  async readAsDataURL(blob) {
    try {
      const data = Buffer.from(await blob.arrayBuffer()).toString('base64');
      this.result = `data:${blob.type};base64,${data}`;
      this.onloadend?.();
    } catch (error) { this.onerror?.(error); }
  }
}
globalThis.FileReader = NodeFileReader;

const source = resolve('src/art/people.ts');
const temporary = resolve('src/art/.people-blender-export.mjs');
const output = resolve(process.argv[2] ?? 'assets/art/people-edit-source.glb');
const compiled = ts.transpileModule(await readFile(source, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
try {
  await writeFile(temporary, compiled);
  const { createPersonArt, passengerArchetypes } = await import(`file:///${temporary.replaceAll('\\', '/')}`);
  const cast = ['driver', ...passengerArchetypes];
  const gallery = new THREE.Group();
  gallery.name = 'homecoming_people_edit_source';
  for (const [index, archetype] of cast.entries()) {
    const actor = createPersonArt(archetype, 'near');
    actor.setPose('stand', 0);
    // The grid is only a Blender editing layout. Each actor retains its own local origin.
    actor.root.position.set((index % 4) * 2.2, 0, Math.floor(index / 4) * 2.2);
    gallery.add(actor.root);
  }
  const glb = await new GLTFExporter().parseAsync(gallery, { binary: true, onlyVisible: true });
  await writeFile(output, Buffer.from(glb));
  console.log(`${cast.length} characters; ${Buffer.byteLength(Buffer.from(glb))} bytes; ${output}`);
} finally {
  await unlink(temporary).catch(() => {});
}
