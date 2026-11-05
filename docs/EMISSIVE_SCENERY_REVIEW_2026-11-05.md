# Emissive lights and roadside cloud receivers — 2026-11-05

Branch codex/emissive-scenery-shadows from current main ed59ab7, retaining pending dependencies through ba40561.

Owner correction: light-emitting surfaces should keep their emitted light in shade; roadside decorations should receive cloud shade too. The cloud hook now shades only reflected outgoing light and adds emissive radiance back unchanged. This composes with the shop pulse. Applied receivers to scenery after existing near batching/placement; world-position calculation now includes instance/batch transforms so windows, trees and rocks do not share an incorrect object-origin mask. Ground at/below .08m is excluded from the extra receiver tint to avoid doubling the existing ground cloud overlay. Existing geometric shadow receiving remains enabled. No gameplay/config/light source count change.

Regression coverage includes emissive material preservation, composed shader path and instanced/batched world-position code, alongside existing shared cloud footprint tests. Real WebGL browser checks supplement shader-source unit checks; these are not a pixel-perfect lighting proof for every material type.

Manual: Codex in-app browser, seed17. Shop-third start and real R opened shop; current 01-shop-lights.png captured and inspected. lights-car4: real W, pause/resume and further W, screenshots 02-roadside-shade.png and 03-scenery-travel.png inspected; bright lamps remain distinct from shaded body/scenery. Sampled browser error/warning logs empty. Coast fixture reached fuel ending, real restart resumed. Original user's tab not navigated.

Short diagnostics samples (not controlled before/after comparison): 120frames 47.37FPS, mean render CPU12.77ms; at240frames 52.94FPS, CPU9.92ms, frameP95 16.8ms, 1069draw calls / 44608triangles. Concurrent automated tests and startup shader compilation may affect measurements. No low-end/mobile hardware test; additional receiver shading has GPU cost.

UI/UX/art self-review: emission is independent of cloud tint, while bodies/decorations share the same footprint. Near scenery retains ordinary geometric shadow receiving. Basic-material unlit markers remain unlit. Shader uses vertex world position for per-fragment shading and handles instancing. No new popup or art asset. No independent reviewer claimed.

Game designer self-review: R/pause/input/fuel ending/restart worked in controlled fixtures; no balance, RNG, interaction window or collision change. No new balance proposal applied.

Validation outcomes and retry details reported after commands complete. Windows PowerShell, bundled Node/pnpm. Human review pending; not merged.

First full test run: 416 passed, discovery.test.ts exceeded its unchanged 5000ms timeout while browser rendering and simulation tests were running. Retrying the full suite with one worker after closing the temporary render tab; no rules, tests or timeouts relaxed. Lint/typecheck/build passed exit 0. Both original and retry logs will be retained.

Final full retry: pnpm test --maxWorkers=1 passed exit 0, 76 files / 417 tests, 160.15s. Lint/typecheck/production build passed exit 0. Original failure and successful retry evidence retained; no timeout or rule changed. Existing Three.js chunk-size warning remains.
