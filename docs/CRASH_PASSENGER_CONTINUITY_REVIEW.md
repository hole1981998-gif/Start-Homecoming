# Crash passenger continuity review

- **Revision/config:** `fix/crash-passenger-continuity`, config `p4b-nonreturning-passengers-1`.
- **Simulation:** deterministic seed 17; 3 riders hit traffic, 1 is selected to return and 2 are stranded. Regression asserts the two roadside entities exist on the collision frame, retain their IDs and coordinates through driver reboarding, and remain permanently unavailable to F pickup.
- **Browser check:** local Vite app, `?scenario=passenger-crash`. Started run, observed crash damage (70 to 50 HP), rider count returning to 2/2, and a roadside passenger cue; after reboarding, the two non-returners remain roadside rather than being spawned beside the vehicle. F eligibility remains covered by the focused simulation assertion.
- **Game designer self-review:** this preserves the RNG outcome and lost-passenger cost while removing the misleading teleport. It should make the penalty legible and consistent; no balance values or random probabilities changed.
- **UI/UX self-review:** non-returners now render as roadside entities during the crash and after reboarding, so each has one continuous position/model. Returning passengers retain their climb-back animation. Check visual readability again when passenger models are polished; current characters remain placeholder geometry.
- **Limit:** browser visual inspection was on the local prototype build, not a production art pass. No independent reviewer was involved.
