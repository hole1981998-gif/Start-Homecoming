# Lamp shadow regression and finished window passengers — 2026-11-05

Branch codex/lamps-final-passengers from current main ed59ab7 retaining pending work through 234ca41.

Root causes missed in the preceding fix: Three MeshBasicMaterial lenses still had receiveShadow enabled by the generic receiver traversal, and additive headlight ground washes rendered before cloud decals (order1). Removing emissive tint alone could not fix either path. Lamp binding now disables shadow receiving, receiver traversal keeps Basic materials unshadowed on subsequent frames, and ground washes render at order2 after cloud overlays while retaining depth testing against physical objects.

Closed-vehicle and articulated-tractor passenger windows still used two primitive cylinder/sphere meshes. Replaced these with the same finished createPersonArt/roadsideArchetype cast used for roadside NPCs, keyed to rider id. The finished far LOD retains head/face/hair/accessory silhouettes at gameplay scale; seated pose and window anchors are preserved, legs/pelvis stay hidden inside the cabin. Small window figures do not cast their own shadow-map passes, but still receive cloud/scene shade. Cached model reused until rider changes; replaced model disposed. No new asset generation/import, capacity/roster/seat-layout or gameplay rule changes.

Validation: Windows PowerShell, bundled Node/pnpm. pnpm lint, pnpm typecheck, pnpm test --maxWorkers=1: 77 files / 419 tests passed; pnpm build passed. After window LOD/size refinement, lint/typecheck and final build passed, affected lighting/window tests 9/9 passed. Tests cover all eight vehicle families' lenses remaining unshadowed after receiver traversal, wash render order/depth testing, finished head/torso rig, window height, rider-model caching/replacement. Existing large Three.js chunk warning.

Manual/current screenshots: Codex in-app browser, seed17, visual-vehicles-car7/bus/truck/container plus lights-car4. Started each, real W for bus/lamp fixtures, pause worked, no sampled browser shader errors. Shop-third earlier two-slot behavior retained via dependency; no transaction changes. Coast fixture fuel failure and real restart worked. 01-car7-final-passengers.png, 02-bus-final-passengers.png, 03-container-passenger.png, 04-unshadowed-lamps.png, 05-truck-passengers.png captured and inspected in docs/evidence/lamps-passengers-2026-11-05/. Container's forward cabin is partly occluded from this rear camera: screenshot alone does not prove that passenger's anatomy; shared window-model tests and runtime no-error check supplement it.

Performance observation, not controlled benchmark: first near-LOD full-bus sample34.29FPS/26.71ms renderCPU/196724triangles led to using finished farLOD, 0.85 scale and no per-window cast passes. Final short sample59.51FPS, frameP95 16.8ms, renderCPU11.03ms, 2138draw calls/145752triangles. Concurrent test load/startup may affect these samples. Physical low-end/mobile testing not performed.

UI/UX/art self-review: lamps now preserve unlit brightness and their ground wash stays above cloud shade, while body material remains shaded. Heads use the existing finished cast rather than legacy primitives, sized for windows. Full-bus cost reduced without changing roster. Static screenshots alone do not prove brightness invariance over every cloud position; all-family material assertions and live driving supplement them. No independent reviewer claimed.

Game-designer self-review: movement/pause/fuel ending/restart worked in controlled fixtures. No simulation/config/RNG, passenger pickup/capacity or balance changes. No balance proposal applied.

Human review pending. Not merged; commit/push/PR status reported separately.
