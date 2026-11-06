# Continuous road cue projection — 2026-11-04

Branch codex/stable-road-tags started from current main ed59ab7. Includes the pending darker-menu feature so the running preview retains the owner's preceding palette change. Source revision 5696fe0.

## Problem and behavior

Supply tags were clamped to 32–61% screen height and Q/E to 40–52%, making them sit in the middle of the screen while a separate linear scale ramp enlarged them. Their elevated anchors and different transform origins compounded the apparent motion. Q/E additionally projected onto the newly selected future route, relocating immediately on a choice.

Tags now use the ground projection without vertical clamps, bottom-center scale origins, a perspective-like distance ramp, and a fixed 120m presentation range matching visible road scenery. Q/E anchors exclude the pending route choice; historical turns are retained. Horizontal viewport protection keeps Q/E visible at the edges. Simulation warning/interaction/decision windows and balance remain unchanged. Supply labels may naturally leave the viewport with their world objects rather than pinning over the driving corridor.

## Current manual checks / self-review

Codex in-app browser, seed 17. Junction fixture: real W input moved 708m to 750m; Q anchor top advanced 24.34% to 28.55%, scale .258 to .371, consistent with the approaching road. Current screenshots 01-far.png and 02-approach.png were captured and inspected. Blocked-window: real E and Q selected the corresponding tag; current 03-selected.png shows stable roadside anchors and E fill. Shop-third: red tag followed shop, real R opened shop. Supplies: white fuel/repair tags followed near pickup positions (05-supplies.png). Coast fixture reached a fuel ending and real restart resumed the fixture. Pause worked. Evidence is in docs/evidence/stable-tags-2026-11-04/.

UI/UX self-review: no middle-screen vertical plateau; anchors and growth now describe one approaching object. Q/E stay visible at screen edges. Distant tags are intentionally small and become readable nearer; physical touch/screen-reader and broad multi-aspect testing were not repeated. Screenshots do not prove sustained smoothness or frame pacing; observations cover these controlled keyboard runs.

Game designer self-review: earlier presentation exposes an existing junction/supply at 120m without extending accepted Q/E or pickup windows. No economy/RNG/collision tuning. Human judgement of the driving feel remains useful; no claim of independent reviewer or overall fairness certification.

## Validation

Windows PowerShell, bundled Node/pnpm. Added behavior regression coverage for distant supply visibility, unclamped movement, speed-independent placement and junction-anchor stability after choosing either exit. Required commands and output: lint.log, typecheck.log, tests.log, build.log in the evidence folder. Final gate outcomes reported with handoff. Existing large Three.js chunk warning remains. No source/config/assets modified outside the UI projection and pending menu palette.

Human review pending for this revision; no merge authorization inferred from the previous feature's merge request.

Final required gates: lint, typecheck, full tests and production build passed (exit 0 each). Stripped UTF-8 output copies are committed as lint.txt, typecheck.txt, tests.txt and build.txt.
