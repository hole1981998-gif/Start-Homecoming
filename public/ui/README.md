# UI artwork — 29 October 2026

Generated using the built-in ImageGen tool for this feature, following the owner's request for colored, minimal flat-shaded icons and a subtle paper surface. These are UI-only assets; scene/VFX assets and game balance are unchanged. The reference images were inspected locally and are not included in this repository or in generation inputs.

## Active files

- `flat-icons-v2.png`: transparent 1254×1254 atlas, 4 columns × 5 rows. Colored silhouettes, broad flat shadow planes, no line art. The generated silhouettes slightly overrun their nominal grid. Inspected alpha bounding boxes in `src/ui-icons.ts` define padded 5:4 sprite windows, preserving the complete silhouette and excluding neighbouring objects. No source pixels are modified.
- `ivory-paper-v1.png`: 1254×1254 paper texture. The active CSS overlays it with near-white `#fafaf6` at high opacity, leaving only faint grain. The owner rejected the visibly yellow/ivory treatment.

Atlas order, left to right, top to bottom:

1. Fuel / repair / scooter / compact car
2. Bus / truck / nitro / star
3. Banana / Grab phone / engine / shield
4. Economy / passenger / wind / train
5. Coins / bag / barrier / parcel

Functional symbols (hamburger, pause, restart and Help) remain simple controls. Illustrative content uses the colored atlas. Shop vehicle cards, the garage and purchase confirmation now use thumbnails rendered from each actual player model in `src/art/vehicle-catalog.ts`, via `src/vehicle-thumbnails.ts`. The atlas vehicle cells are category symbols rather than vehicle thumbnails. QTE shows only the circular Q/E labels, with no visible straight-ahead arrow or central text.

## Generation prompts

The initial atlas prompt specified one coherent transparent game icon atlas, exactly 4 columns × 5 rows, the above subject order, consistent scale and camera, isolated silhouettes and no labels or tile backgrounds. It requested chunky volumetric low-poly objects. That detailed rendered style was rejected by the owner; it is not the active asset.

The final edit prompt was:

> Edit target: this existing game UI sprite atlas. Preserve EXACTLY its square canvas, transparent alpha, 4 columns x 5 rows, exact per-cell subject identities/order, object centers and scale. CHANGE ONLY VISUAL STYLE. The previous version is FAR TOO detailed and too much like rendered 3D toys. Redraw every icon as an extremely simple flat-shaded game inventory pictogram. Strong graphic silhouette, 2 or at most 3 LARGE SOLID COLOR AREAS per object, one darker side panel to imply a little depth. Broad shapes only, almost paper cutouts or a simple gouache silhouette with a single shadow plane. Example desired toolbox: one tan rectangle, one dark green lid, one simple handle and a pale latch; NO bevels, bolts, metallic hardware, grain, seams, facets, specular highlights, mesh detail, soft volume gradients or cast shadows. Example car: blocky coral car silhouette, just one dark window shape and two solid wheels, NO detailed lights, grille, door seams or tires. Example canister: olive or muted yellow flat silhouette, simple handle cutout and ONE dark side plane. Very restrained olive, dark green, cream, muted terracotta, deep blue. No outlines and absolutely NOT wire/line art. No 3D-rendered materials, no glossy highlights, no ambient occlusion, no photorealistic surface detail, no decorative texture, no tiny facets. No tile backgrounds, no borders, no text, no labels, no numbers, no logos. All icons on transparent background. Keep cell padding so CSS can use the exact same 4x5 sprite mapping. Simplification is the entire purpose of this edit.

Texture prompt:

> Use case: stylized-concept. Asset type: seamless tileable warm ivory handmade paper texture for the background of readable game UI panels. Square flat scan, perfectly uniform lighting and average color approximately hex EFE4C9. Very subtle fine paper fibers, delicate irregular natural grain and tiny pale flecks. Minimal low-contrast texture, only about 2-4 percent variation, enough to feel tactile at 256px tile scale without interfering with dark text. Edge-to-edge material only. No objects, icons, writing, marks, stains, creases, borders, vignette, lighting gradient, shadows, grain clumps or watermark. Warm cream/ivory, not white, not grey, not brown. Seamless repeat on all edges.

The final near-white treatment is applied in CSS rather than modifying the source texture. Both source PNGs are preserved with their original alpha/data; no image processing or resizing was applied.
