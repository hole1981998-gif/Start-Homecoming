# Vehicle lighting — 28–29 October 2026

Branch `codex/vehicle-lighting`, dependency `d761ad2` (rain anchors). This preserves the user-requested unmerged visual stack; it is not a claim of a new updated-main base. Rain anchors were committed and pushed separately on `codex/rain-ground-anchors`.

Actual lens areas now light up on all eight vehicles: motorcycle, motorbike, tricycle, car4, car7, bus, truck and container. Headlights have soft warm ground washes; rear lamps brighten under braking; Q/E route choice selects the physical left/right indicators. Hazards blink on both sides for the player's crash/fuel stop and healthy stopped traffic. Wrecked traffic lamps are dark. Traffic without turn intent does not invent a turn signal. Pause uses frozen active time.

The container's rear lamps and sockets follow its articulated trailer. Each vehicle owns its lamp materials without changing shared paint or reflectors; disposal restores originals before releasing resources. Ground washes are one bounded instanced draw (64 maximum), not shadow-casting scene lights. No simulation rules, balance values or weather penalties changed. DEV-only `lights-<kind>` fixtures use the real junction window and disable unrelated random spawns.

Regression tests cover all eight factories at near/far detail, physical indicator side after adapter rotation, detached trailer alignment/material binding, brake/turn/hazard states, material ownership and ground-wash bound/reset/direction.

## Actual validation

Windows / Node 24.22.1 / pnpm 11.25.0. Final source gates (`vehicle-lights-complete-*.log`):

- `pnpm lint`: PASS, exit 0.
- `pnpm typecheck`: PASS, exit 0.
- `pnpm test --maxWorkers=2`: PASS, exit 0, 69 files / 405 tests, 103.89 s.
- `pnpm build`: PASS, exit 0, 2.74 s; existing Three.js chunk >500 kB warning.

In-app browser, seed 7, each `lights-<kind>` fixture: actual Start and Q/E route input accepted on all eight vehicles, corresponding final screenshots inspected, console error queries empty (`manual-checks.json`). Car4 motion capture shows blinking lamps and ground washes; actual Start → Q → hold S 700 ms checked brake response, subsequent HUD read 37.0 km/h. Final pause captures compared by the packaging script. Reload returns the demo to its start screen. Screenshots are native window sizes, not a claimed phone/device matrix.

[Motion evidence](evidence/p12-lights/vehicle-lights.webp) is assembled from real variable-interval screenshots, not native video/60-FPS capture; exact dimensions/duration and pause comparison are in `recording.json`. [Indicator on](evidence/p12-lights/indicator-left-on.png) and [braking](evidence/p12-lights/braking-final.png) supply still context. Raw captures and obsolete intermediate screenshots are ignored. No external reference image is included.

## Codex self review and limits

Game designer: the lamp cues communicate existing turn/brake/stopped states without changing driving difficulty, RNG or reaction windows. No balance proposal applied. All directions on every vehicle, every terminal state and a long normal run were not manually exercised; tests cover signal logic, but do not establish complete gameplay regression coverage.

UI/UX: real lens areas avoid floating overlapping marker spheres; amber signals and red brake lamps remain distinguishable under the teal/gold grade. The soft wash helps read facing direction without another HUD overlay. Evidence is current browser captures plus actual keyboard input, not an independent art review. Small lens readability at distant LOD and performance on low-end hardware remain limits; no performance claim is made from the empty sample file. No full accessibility/device audit claimed.

Diff/scope checked before commit. Human review pending. CI on the final pushed revision is not verified. PR creation remains unavailable under the previously observed GitHub integration HTTP 403; this branch is pushed for review without claiming a PR exists. No merge.
