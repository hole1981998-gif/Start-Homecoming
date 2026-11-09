# Event feedback popups — 09/11/2026

Base: latest fetched main ba22ba5. Branch: codex/event-feedback-popups. Owner supplied and authorized the 19 illustrations. Original PNGs preserved; CSS crops illustration above a live caption, following layout.png.

One non-interactive popup below the score, lasting 3,000 ms of wall time. Each new supported event replaces the previous popup immediately and restarts its lifetime. No queue, pause, gameplay/balance changes, or extra warning tags. Popup vui setting hides illustrations while resource feedback remains available. Terminal feedback appears inside the results panel without delaying results. Restart clears prior feedback. An accident causing zero HP keeps its accident caption; later unrelated HP depletion shows damage. Secret victory does not show an accident-failure illustration.

| Actual event | Caption / asset |
| --- | --- |
| Passenger boarded | ĐÓN KHÁCH / pickup |
| Passenger removed | CHIM CÚC! / drop |
| Militia charged player | XIN TÍ PHÍ / militia |
| Police caught player | VỀ ĐỒN NHÉ / police |
| Pothole hit | VA Ổ GÀ / pothole |
| Rolling barrel hit | THÙNG LĂN / barrel |
| Accident collision | TAI NẠNN / accident |
| Vendor collision | ỐI HÀNG RONG / vendor |
| Ambulance collision | CỨUUUUUU / ambulance |
| Barrier collision | ĐÀO ĐƯỜNG HẢ?! / barrier |
| Train collision | TÀUUUUUU!!! / train |
| Road repair pickup | SỬA CHỮA NÈ / repair |
| Road fuel pickup | TIẾP TẾ XĂNG / fuel |
| Fuel depleted | HẾT XĂNG RỒI! / empty |
| HP depleted | TOANGGGG XE / damage |
| Nitro used | BOOOOST!!! / nitro |
| Star used | SUPERSTAR!!! / star |
| Banana used | NÉ CHỐT! / banana |
| Grab used | NHẬN CUỐC! / grab |

## Automated validation

Windows, bundled Node/pnpm, Vitest/jsdom. lint, typecheck, full tests and production build passed (exit 0). Full suite: 83 files / 465 tests, pnpm test --maxWorkers=1. After the final secret-victory exclusion and popup preference wiring, affected suite passed: 5 files / 21 tests; lint, typecheck and build passed again. Production build retains the existing large chunk warning. Exact outputs are in evidence/event-popups-2026-11-09/*.txt. Tests exercise real simulation/input event paths, failure suppression, independent event sequence, timer/replacement/reset/preference and terminal hosting.

## Browser checks and self-review

In-app Chromium browser, current local build, seed 17. Passenger scenario: Start, F boarded, G removed; second popup replaced first immediately; then disappeared after approximately 3 seconds (2,739 ms remaining after capture overhead). Items scenario: actual 1/2 inputs triggered nitro and star feedback and consumed items. Coast scenario: fuel depletion popup and terminal results remained readable; restart worked (the fixture quickly depletes again). events-train: W input caused actual train terminal event; train illustration appeared inside results. Browser console error log was empty. Evidence: 01–07 PNGs captured this review. Other mapped collisions covered by simulation tests, not claimed as manually driven. Touch, screen reader behavior and every QTE/popup combination have not been manually checked.

Game designer self-review from these inputs and simulation assertions: feedback confirms consequences without changing control timing, RNG or difficulty. Latest-event replacement prevents a backlog. No balance proposal applied. UI/UX self-review: illustration/text hierarchy matches supplied layout; overlay does not intercept inputs; terminal placement keeps result controls available. QTE mode uses smaller popup width; combination coverage remains a manual limitation.

Art integration self-assessment from current screenshots (not independent review): silhouette/readability 8/10; value/contrast 8; color/mood 7; shape language 8; light/weather/material 7; UI/typography 8; consistency 7; accessibility/performance 6. Reasons: owner art reads clearly at compact size, warm captions contrast with dark road, bright event cards are more saturated than the game but transient. Text remains live and popup is optional; nineteen PNGs add about 3.2 MB, and screen reader/performance profiling is not certified. No criterion below 6; owner retains final art approval.

Human review: pending for this revision. Merge: not performed. PR creation status recorded in handoff.
## Corrected visuals — 09/11/2026 follow-up

Owner replaced all 19 source files and requested 60–65% size. Continued the same unmerged feature branch; fetched origin/main remains ba22ba5. Every normalized asset matches the new supplied file byte-for-byte (dimensions and hashes in evidence/event-popup-visual-refresh/asset-validation.txt).

Supersedes the initial cropped-art/live-visible-caption layout: render the complete supplied PNG, including its baked caption and border. Intrinsic height:auto preserves differing aspect ratios. Removed the extra CSS border, colored background and fixed aspect crop that caused the lower edge artifact. The live caption remains visually hidden for assistive technology. All gameplay/QTE/result width limits are scaled by .625 (46% to 28.75%, 220px to 137.5px); event mappings and three-second replacement logic unchanged.

Manual current in-app Chromium, passenger scenario, seed17: Start + F shows corrected pickup; G replaces with corrected drop; expires and Escape pauses correctly. Current image natural size501x255 rendered124.594x63.406px, preserving ratio; parent border0px. Screenshots pickup.png/drop.png show complete art without an extra lower frame. Game left open paused for owner. Other nineteen originals verified by byte comparison; each individual event was not manually re-driven this visual-only revision.

Game designer self-review: smaller feedback exposes more road; no balance or timing changes. UI/UX self-review from these current screenshots: reduced obstruction and single intact image remove mismatched border/caption seams; baked caption is smaller, owner can assess readability in live play. Self-assessed art rubric: silhouette7, contrast7, mood7, shape8, materials7, typography6, consistency8, accessibility/performance6 out of10. Compact caption is the limiting criterion; assistive text retained. No independent expert review claimed.

Validation Windows bundled Node/pnpm: lint/typecheck/build exit0; existing chunk-size warning retained. Full tests result in evidence/event-popup-visual-refresh/tests.txt. No new simulation logic or tests for constants introduced. Human review pending; not merged. Earlier PR creation remains blocked by GitHub connector permission403.

Final visual-refresh full-suite result: pnpm test --maxWorkers=1 exit0, 83 files / 465 tests passed in 231.81s. lint/typecheck/build also exit0 on this CSS/assets revision.

## Traffic feedback, consistent size and soft entry — follow-up

Same unmerged popup feature, origin/main fetched before changes. Ordinary traffic contacts now map to accident feedback, including different traffic models/directions/wrecks because mapping uses the common traffic event. Existing explicitly illustrated special contacts (ambulance, vendor, barrel, train, barrier) retain their dedicated captions. Missing-target traffic feedback (blocked junction) does not incorrectly become a vehicle accident. Same-tick accident remains visible if HP also reaches zero.

Sizing investigation: asset aspect ratios range about1.83–1.96, producing only modest height differences at equal width. The large discrepancy came from QTE and terminal width overrides. Removed both shrink factors; all contexts now use the road's inline container width, min(28.75cqw,137.5px), while preserving intrinsic image proportions and complete borders. No new image processing.

Entry motion: one320ms ease-out bounce per event, .96→1.02→1 scale and +3→−1→0px travel. No looping or exit jump. Alternating animation names retrigger even identical successive events. OS reduced-motion disables it. Current in-app browser reports prefers-reduced-motion=true, confirmed computed duration0s; therefore normal-motion subjective feel was NOT manually observed in this environment. Static CSS defines the limited motion above.

Current manual check: Chromium in-app, traffic-ram seed17, Start and W700ms actually collided with small traffic car; bus HP168→160 and accident popup appeared. Current screenshot evidence/popup-collision-bounce/traffic.png. Road width433px, popup width124.594px. Escape pause worked, game left open. No balance changes. Test coverage adds actual ordinary-traffic contact to existing subtype tests. Prior secret-ending guard remains.

Self-review, game designer: hit feedback now covers ordinary vehicles without changing collision damage or RNG. UI/UX: consistent viewport-relative width avoids state-dependent shrinking; one brief low-amplitude entrance avoids continuous distraction. Limitation: motion feel with OS reduction disabled and every vehicle model not manually driven. No independent reviewer claimed. Automated gate outputs stored beside screenshot; human review pending, not merged. PR remains unavailable due earlier connector403.

Final validation: lint/typecheck/build and pnpm test --maxWorkers=1 all exit0; 83 files / 466 tests passed in231.49s on this revision.

## Stronger spring entry and fade-out

Owner requested a clearer up/down spring and a gradual exit. Entry is now520ms: start8px down/.93 scale, rise7px/1.06, settle3px/.985, rebound1px/1.01, rest. Runs once per event, no loop; reduced-motion still disables displacement. Popup appears immediately at opacity1, stays fully opaque for2300ms, then linearly fades over700ms, hidden at3000ms. Replacement during fade immediately restores opacity1 and starts a fresh lifetime. Wall-clock fading also works paused/ended. Added lifecycle test for exact fade midpoint, replacement restoration and final expiry.

Manual: current in-app Chromium, passenger seed17, Start/F displayed immediately; expiry observed, G showed new popup and Escape pause worked. Screenshot evidence/popup-spring-fade/popup.png. OS reduced-motion enabled in this browser, so spring subjective feel is not manually certified. Self-review UI/UX: stronger single rebound remains bounded6%/7px; fade avoids abrupt disappearance without delaying replacement. Game designer: controls, balance and event timing unchanged. No independent reviewer claimed. Gate outputs stored alongside evidence; human review pending, not merged.

Owner steering supersedes timings above: final lifetime2500ms, opaque1800ms + fade700ms; stronger580ms spring with11px start,10px rise,5px settle,2px rebound and peak1.09 scale. Supplied image bytes untouched; CSS rounded inset2.5% hides baked bright frame on all19 images. Current browser pickup screenshot final.png confirms clean edge; observed opacity0.952429 during fade then hidden. Separate temporary test tab used after owner was already playing; owner game preserved. Full suite before final timing adjustment:83files/467tests exit0; final affected suite2files/17tests exit0, with lint/typecheck/build rerun exit0. Normal-motion subjective check remains limited by reduced-motion preference.
