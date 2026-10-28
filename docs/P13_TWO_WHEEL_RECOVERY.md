# Two-wheel crash presentation and seated NPC cleanup — 29 October 2026

Branch `codex/two-wheel-crash-recovery`, dependency `a71f51a`. Remote origin was fetched at the beginning of this feedback pass; main identified. These three feedback branches preserve the user-requested unmerged visual stack instead of claiming a fresh-main base. No merge.

Player motorcycle/motorbike now rotate onto the impact side after ejection, remain down during the driver's return, then lift in .28 s as the driver bends beside the bike. Visual return travel arrives slightly earlier to make room for that pickup gesture. The end follows the later of the existing driver-return deadline and vehicle slide-stop time. Render only: no added recovery delay, resources, damage immunity, collider, RNG or gameplay rules changed. Closed vehicles and tricycle recovery remain unchanged.

Open traffic had an authored seated driver in addition to the NPC spawned by wreck logic. Renderer now hides the seated model when wrecked/occupants released, and restores it for a healthy pooled vehicle. Covers motorcycle, motorbike and tricycle. New DEV fixtures: `recovery-motorcycle`, `recovery-motorbike`, `wreck-open-drivers`.

## Checks on final source

Windows / Node 24.22.1 / pnpm 11.25.0:

- `pnpm lint`: PASS exit 0.
- `pnpm typecheck`: PASS exit 0.
- `pnpm test --maxWorkers=2`: PASS exit 0, 71 files / 409 tests, 110.80 s.
- `pnpm build`: PASS exit 0, 3.19 s; existing >500 kB chunk warning.

New tests cover both bike kinds and impact sides, remaining down until return, short lift, high-speed slide deadline, no input crash-state mutation, closed-vehicle exclusion, and all three seated NPC models hidden/restored.

## Current browser evidence and self review

Actual in-app browser input, seed 7; no hidden-state mutation:

1. Start `recovery-motorcycle`, then `recovery-motorbike`. Both produced a real collision, -20 HP, ejection, bike down, driver return/pickup, upright bike and acceleration afterward. [Motorcycle motion](evidence/p13-feedback/recovery-motorcycle.webp), [motorbike motion](evidence/p13-feedback/recovery-motorbike.webp). Captured and inspected fall/return/upright frames; these are actual variable-interval screenshot recordings, not native video/60 FPS. Metadata beside each file records dimensions/time.
2. Start `wreck-open-drivers`: three wrecked open vehicle families shown without seated duplicates; spawned roadside NPC still present. [Current still](evidence/p13-feedback/wreck-open-drivers.png). Healthy pooled restoration is unit-tested, not manually forced through a complete pool reuse cycle.
3. Pause during motorcycle crash: HUD 0/2, 103 HP, distance 11 m; two saved screenshots are pixel-identical. Panel restart restored 0 m, 1/2, 123 HP and ready state. `vehicle-failure` produced 0 HP and the actual result screen; console error queries empty. Wind-right demo left ready for the user.

Codex game-designer self review: visual state now agrees with losing the rider; existing recovery cost and fair crash immunity are preserved. No balance adjustment proposed/applied. Tests protect both impact sides and long slides; manual captures cover seed 7 and default fixture speeds, not every collision/train interaction.

Codex UI/UX screenshot audit: step 1 clearly distinguishes fallen bike from upright/remounted bike; crash HUD/HP feedback remains visible. Step 2 removes the confusing extra seated character. Step 3 confirms pause/restart state cues. P2 limitation: distant open-vehicle silhouettes and small amber lamps remain subtle at the native narrow play canvas; no broad readability/accessibility certification or low-end performance claim. Pickup uses the existing recover pose with a short lift rather than a new hand-constrained animation. These are self reviews from actual screenshots/input/tests, not independent art approval.

Diff/scope/secrets checked before commit. Human review pending. CI on final revision not yet verified; GitHub integration previously returns 403 for PR creation, so no PR is claimed. No merge.
