# Two-wheel traffic wrecks — 29 October 2026

Branch `codex/traffic-bike-wreck-topple`, dependency `c2843c6`. Origin fetched before branching; preserves the requested unmerged visual stack, not a fresh-main base claim. No merge.

Motorcycle/motorbike traffic now tips onto its side over .28 s when wrecked and stays down until the existing wreck retirement removes it. Stable entity identity selects the fall side without advancing gameplay RNG. Resetting the art pose every frame restores an upright healthy pooled vehicle. Only the vehicle art root tilts: HUD markers remain upright. Existing seated-driver cleanup remains. Tricycle and closed vehicle poses stay unchanged.

Presentation only: no damage, collision, wreck lifetime, resource or spawn-rule changes. Regression test covers both two-wheel kinds and two entity identities, gradual tipping, remaining down at long ages, healthy reset and exclusion of three/four-wheel vehicles.

Manual: actual in-app browser, `wreck-open-drivers`, seed 7. Start and hold S 700 ms: both two-wheel wrecks down, player upright, tricycle upright and roadside occupants separate. [Still](evidence/p13-wreck-topple/wrecked-bikes.png), [motion](evidence/p13-wreck-topple/wreck-topple.webp). Native 1000×563 captures; variable interval, not native video/60 FPS. Pause captures pixel-identical; panel restart restored ready state, 0 m, 1/2, 123 HP. Console error query empty. Full pool reuse and both travel directions not manually exercised; reset/duration behavior unit-tested. No new terminal rules; terminal regression manually checked in dependency c2843c6, not repeated in this pass.

Codex game-designer self review: a wreck now reads as disabled without changing recovery or traffic difficulty. UI/UX screenshot self review: step 1 start → fallen bike silhouettes align with wreck state; step 2 pause → state frozen; step 3 restart → fresh upright player. Existing NPC/interaction cues remain upright. Dense roadside NPCs can overlap a wreck in projection at this narrow canvas size; no new overlay or layout change added. No independent art review or full accessibility/performance certification claimed.

Final gates: Windows / Node 24.22.1 / pnpm 11.25.0. `pnpm lint`, `pnpm typecheck`, `pnpm test --maxWorkers=2`, `pnpm build` all PASS exit 0 (`evidence/p13-wreck-topple/gates.json`). Tests: 71 files / 410 passed, 110.50 s. Build: 3.15 s, existing >500 kB chunk warning. Diff/scope/secrets checked before commit.

Human review pending. CI not yet verified; PR creation unavailable under the previously observed GitHub integration 403. No merge.
