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

## Explicit image scale pulse

Owner requested additional scale-up/down. Added a single440ms image pulse1→1.04→.98→1, separate from outer spring translation. Reduced-motion uses a smaller380ms1→1.015→.995→1 pulse while outer movement remains disabled. Event replacement alternates names and restarts the pulse. No loop, no changes to1800ms opaque/700ms fade lifetime.

Current browser gameplay: in-app Chromium passenger seed17 Start/F then G. Measured reduced-motion=true with image animation popup-scale-b/0.38s and actual transform scale1.00873 after F; G switched to popup-scale-a and measured1.00036 during new animation. Screenshot evidence/popup-scale-pulse/popup.png. Temporary QA tab closed; owner game left available. This verifies animation playback in the actual reduced-motion environment; normal-motion subjective feel not certified. UI/UX self-review: tiny transient pulse adds feedback without moving the popup anchor; game designer self-review: no simulation or balance effects. No independent review claimed. Gate outputs stored beside screenshot. Human review pending; not merged.

## Menu, shop and results hierarchy; actual fine amounts

Owner follow-up: reduce/slow scale, show paid fines, add color hierarchy, require an explicit purchase decision, unify service/upgrade vehicle pickers, enlarge shop R and prioritize results. Same unmerged UI feature. No prices, damage, fine rules, spawn rules or scoring changed.

Popup: inner scale pulse now680ms, 1→1.02→.99→1; reduced-motion600ms1→1.008→.997→1. Outer spring slowed740ms with scale peak1.035 (reduced-motion still suppresses displacement). Lifetime remains1800ms opaque +700ms fade. PopupEvent carries optional moneyLoss copied from the actual paid amount in police/militia collision logic, capped by available money, independent of later income. Live text below illustration displays the paid loss and clears on replacement. Terminal result retains loss text while using the permanent result-reason illustration instead of duplicate transient art.

Shop: each category has a distinct muted color, currency and action hierarchy clarified. Both service and upgrade target pickers share labels, select styling and fuel/HP readout. Selecting a vehicle opens a dedicated compact confirmation view; garage/category navigation removed during decision, Cancel and Confirm stay together, default focus goes to discard selector or Cancel. Continue is hidden+disabled while pending; resume and help handlers also reject attempts to bypass the pending decision. Failed purchase stays pending; cancellation or a successful transaction restores Continue. Existing pure transaction validation unchanged.

Results: actual DOM and visual order now title, score, distance/time, leaderboard, replay, permanent reason illustration and explanation, remaining money and secondary options. Existing approved event images reused for fuel/damage/accident/train/police; no new art generation. Point score remains the largest value. Shop road tag uses19px bold interaction text instead of10px.

Current manual Chromium in-app, seed17, current build:
1. shop-third Start/R, service target screenshot service.png; upgrade target changed to spare, upgrade.png shows matching control with spare resources.
2. Select Ba gác: confirm.png shows Cancel/Confirm together without Continue; Escape did not leave or dismiss. Cancel restored shop. Repeated choice, selected qa-spare, confirmed purchase: wallet4000.6→3700.6, active Ba gác, riders2/4 retained, Continue restored.
3. events-militia W3100ms: actual collision, popup showed −110 tiền under image (militia.png), HUD91.5 after income and fee; pause worked. Police low-money cap covered by simulation test rather than a manually driven second collision.
4. coast: actual fuel failure, result-final.png shows top metrics then leaderboard, reason art below replay; replay started a fresh running coasting fixture with canvas focus. No claims from screenshot alone about input.

Self-review UI/UX from these current screenshots: P1 accidental resume during purchase fixed with a guarded decision state; result priorities readable before scrolling; matching vehicle pickers reduce ambiguity. Narrow screens retain scroll for catalog and secondary result options; the primary purchase decision fits the observed viewport. Keyboard focus and Escape verified; physical touch/screen-reader audit and all resolution permutations not certified. Game designer self-review: consequence feedback is accurate and no economy/timing/balance changes. Muted blue/green/purple/coral accents preserve dark mood. No independent reviewer claimed. Tests added for actual fine payment cap, displayed/cleared amount and resume rejection during purchase. Gate outputs in evidence/menu-shop-result-hierarchy. Human review pending; not merged. Earlier GitHub PR connector403 limitation remains.

Final gates Windows bundled Node/pnpm: pnpm lint exit0; pnpm typecheck exit0; pnpm test --maxWorkers=1 exit0,83files/470tests in220.55s; pnpm build exit0 (existing large-chunk warning). Targeted suite24tests passed before the final resume-help guard/DOM ordering; full suite above includes those final changes. Fetched origin/main remains ba22ba5. CI on pushed revision not yet observed; human review pending, not merged.

## Police, militia and train playback; police final vehicle loss

Owner asked to play these contacts and illustrate failure after police confiscate the usable fleet. Reused the supplied police image for permanent police-result illustration (already mapped); clarified title to Hết xe để về nhà! and explanation that the current vehicle was confiscated and no usable reserve remains. Added deterministic QA scenario events-police-last: two normal police entities at70m/130m and the existing reserve. This only affects the explicit development scenario, not normal spawns/fines/mechanics.

Current browser manual checks, in-app Chromium seed17, real inputs:
- Police-last: replay/W3100ms reached first officer near68m; popup VỀ ĐỒN NHÉ with actual −201.4 tiền, player switched to car4. Continued W5000ms reached second near127m, result police, wallet0, permanent police illustration plus no-usable-vehicle explanation. Evidence01-police.png/02-police-final.png.
- Militia: Start/W3100ms, popup XIN TÍ PHÍ and −110 tiền, wallet91.5, vehicle remained motorcycle, pause worked (03-militia.png).
- Train: Start/W3100ms, terminal at68m despite reserve, permanent train art and explanation visible (04-train.png).

Visible playable tabs left for owner: events-police-last, events-militia, events-train. Start/Replay and hold W straight to reproduce; optional banana/nitro inputs remain available but were not used in these failure checks. Existing owner game not navigated away.

Added simulation test for two police encounters, first vehicle removed, both confiscations counted, no usable vehicle left, police terminal result and popup paid metadata. Initial test incorrectly expected two disabled instances to remain; actual existing switch removes the first confiscated instance. Corrected assertion to check confiscation count2, original active absent and remaining instances disabled; gameplay code unchanged. Browser confirms the existing behavior.

Game designer self-review: QA proves intended escalation and reserve behavior without new difficulty or balance. UI/UX self-review from current screenshots: event fee is below popup, permanent result art survives feedback expiry; final reason now explicit. No independent review or all-device accessibility claim. Gate outputs alongside evidence. Human review pending, not merged; previous PR403 limitation remains.

## Manrope typography and lighter fee text

Owner steering: use Manrope throughout game UI; remove fine background and make it smaller/lighter. Bundled original Google Fonts Manrope variable TTF200–800 (164700bytes) with Vietnamese coverage and SIL OFL1.1 license/provenance in public/fonts/manrope. Root, form controls and version text inherit/use Manrope; baked text inside supplied illustrations stays part of those PNGs. No remote font request at runtime. Fine label now transparent background, no padding/frame,14px weight500 (previously18px weight900).

Current in-app Chromium seed17 events-militia actual W3100ms collision: DOM confirms Manrope family, document.fonts.check true,14px weight500, rgba(0,0,0,0) background; screenshot evidence/manrope-typography/militia.png. Shop-third Start/R/chooseBa gác: shop.png confirms Vietnamese text and both decision buttons fit with new font; cancelled normally. Owner's three event tabs preserved, temporary QA tab closed. UI/UX self-review: fine is subordinate to illustration while still contrasting with road; font Vietnamese accents render in inspected HUD/menu. Game designer self-review: no mechanics or balance changes. No independent review/full screen-reader certification claimed.

Final verification: police scenario revision full suite83files/471tests exit0 in277.80s, lint/typecheck/build exit0. Initial failed targeted assertion retained as evidence (corrected test assumption documented above). After final CSS/font-only change, lint/typecheck/build rerun exit0 and affected UI/event suite6files/26tests exit0; manual font and fine screenshots above. Existing production chunk-size warning remains. Human review pending, not merged.
