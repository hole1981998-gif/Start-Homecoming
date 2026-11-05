# Actor shade and shop beacon — 2026-11-05

Branch codex/actor-shade-shop-beacon from current main ed59ab7, retaining pending UI dependencies through 1530861. User explicitly requested actor shadows and a blinking shop light; no gameplay or balance change.

Cause: cloud shade was a transparent plane just above ground, so it could not darken elevated meshes. Actors also lacked consistently enabled receiveShadow. CloudShadowArt now shares the same eight world-space bounds, rotations and feather mask with Standard-material actor shaders; actors receive existing geometric shadows as well. The shader multiplies light in cloud footprints without changing paint colors, gameplay RNG, collision, resource logic or warning windows. Material hooks compose with previous hooks and are installed once per material; uniforms update in place. The player root is revisited for riders loaded after its initial creation. Basic-material markers are intentionally unlit.

Shop: warm emissive shader on existing signs and awning plus a small roof light strip. A slow two-second sine cycle modulates emissive output; low-effects/reduced-motion reduces amplitude to .18. No new real-time light/shadow map, overlay popup or production asset import. Shop updates only from simulation visual time, so pause freezes the beacon.

Validation: Windows PowerShell, bundled Node/pnpm. pnpm lint, pnpm typecheck, pnpm test --maxWorkers=2 (76 files / 416 tests), pnpm build passed exit 0. Added tests cover shared bounds matching rendered cloud patches, travel updates, material-hook idempotency, unchanged paint and composed shop/cloud shader uniforms. After adding the roof strip, lint/typecheck and affected tests/build were rerun; final results in evidence logs. Existing Three.js large-chunk warning remains.

Manual: Codex in-app browser, seed 17. shop-third started, rendered two shop phases, R opened shop; lights-car4 real W showed moving player/traffic and shaded player roof; crash fixture real W produced vehicle fall/recovery without shader errors; coast fixture reached fuel ending and real restart resumed it. Browser captured error/warning logs were empty in shop/car checks and error logs empty in crash check. Current screenshots inspected: docs/evidence/actor-shade-shop-2026-11-05/01-shop.png, 02-shop-pulse.png, 03-car-shadow.png, 04-obstacle-recovery.png.

Short diagnostics sample, lights-car4 seed17 at 120frames: 58.54FPS, frameP95 16.8ms, mean render CPU9.08ms, 802draw calls, 20492triangles. This is a short observed sample, not a hardware-wide performance guarantee or a before/after benchmark. No physical mobile-GPU test.

Game-designer self-review: F/R/resource/collision/ending rules unchanged; shop's signal is more distinct without altering its reach. No balance adjustment. UI/UX/art self-review from current screenshots and keyboard runs: actor color now belongs to the shadowed road, bright roof strip reinforces the existing red shop tag, no new floating text. Reduced-motion amplitude is conservative. Static images do not establish pulse timing; unit uniform updates and live shader execution supplement them. No independent expert review claimed. Cloud shading is a stylized receiver mask, not volumetric cloud simulation; low-end GPU cost should be watched on longer runs.

Human review pending. No merge. Commit/push/PR status reported separately.
