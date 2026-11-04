# Player golden-brown helmet — 28 October 2026

Branch `codex/player-golden-brown-helmet`, visual dependency `ac6c549` (`codex/water-world-density`). Separate from the water-detail change as required by the per-feature branch rule. The stack retains the requested unmerged visual work, not an updated-main claim. Both requested changes are present on this final branch.

Player helmet shell and brim use golden brown `#a77736`. Applied to the loaded driver template before riding/fallen clones are made, procedural player/fallen fallback and legacy placeholder. Source GLB is unchanged. Named helmet materials are cloned before tinting; skin, dark straps/band and NPC drivers keep their own materials/colors. No animation, simulation, balance or asset shape changes.

Regression test protects shared-material isolation and idempotent recoloring rather than merely restating the color constant.

## Browser and self review

Real in-app browser, seed 7, `p62-water-baseline`, actual Start then pause. [Current screenshot](evidence/p10-helmet/golden-brown-helmet.png), 568×634 around 65 m, shows the loaded player's golden-brown helmet together with the preceding fine-detail large water surface. Shader error query returned no entries. The loaded riding model was observed; crash/fallback variants use the same tint path but were not independently exercised in the browser this round.

Game-designer self review: identity/color change only, with no effect on handling or game rules. UI/UX self review from this capture: helmet is visibly warmer/darker than the prior cream and remains distinct from the teal jacket and water. No independent art review or all-lighting/device validation is claimed.

## Gates / handoff

Windows, Node 24.22.1, pnpm 11.25.0. Actual final checks: `pnpm lint` PASS exit 0; `pnpm typecheck` PASS exit 0; `pnpm test --maxWorkers=2` PASS exit 0, 68 files / 400 tests, 94.71 s; `pnpm build` PASS exit 0, 2.71 s, existing Three.js >500 kB chunk warning. `git diff --check` passed before commit. Human review pending; no merge. PR creation remains unavailable under the previously observed integration HTTP 403; local checks do not certify remote CI.
