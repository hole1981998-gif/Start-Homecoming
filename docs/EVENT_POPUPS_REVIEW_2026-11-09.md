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