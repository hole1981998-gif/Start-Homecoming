# QTE acceptance-window feedback and quiet road overlays — 2026-11-04

Branch codex/qte-window-feedback, based on main ed59ab7 with pending darker-menu and stable-road-tags changes retained (dependency head d0d8048).

Q/E now use a dim slate fill outside canChoose, white inside the actual acceptance window, and dim again when it closes. Selected direction retains teal and pulses brightness every 1.2s without changing position/scale. Reduced-motion uses a subtler .8–1 brightness range over 2.4s instead of the standard .55–1 range. No interaction timing, simulation or balance changes.

Removed road-action construction and all passenger F/officer/banana/train/cargo instruction tags. Visual impact/flavor popups are suppressed too. Only supply/shop/QTE world tags remain. Resource arcs/numbers, coasting/crash state next to the resource HUD, safe first-discovery/help screens and accessible live feedback are preserved. The now-obsolete popup preference is hidden. This owner request supersedes the earlier review's decision to retain essential action labels.

Validation: Windows PowerShell, bundled Node/pnpm. pnpm lint, pnpm typecheck, pnpm test --maxWorkers=2 (75 files, 414 tests), pnpm build all passed exit 0. After the final CSS/hidden-setting refinements, lint/typecheck/build passed again; targeted UI and RoadHud tests passed 7/7, including the new real Q-key/window progression assertions. Existing Three.js large chunk warning remains. No no-op tests, rule reductions or timing changes.

Manual: Codex in-app browser, seed 17, current screenshots in docs/evidence/qte-window-2026-11-04/ inspected during this run. Junction: W drove from 708m (inactive, slate rgb83/103/106, brightness .65) to 767m (active, white, brightness 1). Q selected correctly. Blocked-window: E selected, computed animation qte-selected-pulse/2.4s with reduced-motion enabled; sampled filter .999706. S held 700ms advanced to 1596m, canChoose inactive and brightness base .65 while selected pulse persisted. Passenger fixture: real F produced 2/2 riders, road-action absent and impact hidden. Shop-third: shop tag visible, R opened shop. Coast fixture: fuel ending occurred and real restart resumed the fixture. Tests additionally assert that passenger/officer/train/cargo entities cannot recreate action labels.

UI/UX self-review: brightness now communicates when input can be accepted; selected pulse has no layout movement. Distant dim text is intentionally secondary. Controls/help remain available after removing prompts. Physical touch, screen reader and non-reduced-motion visual playthrough not repeated; standard pulse rule is implemented but browser check used the active reduced-motion setting. Screenshots alone do not establish blink timing; computed running animation and keyboard state transitions supplement them.

Game designer self-review: Q/E acceptance and F/R operations still worked. Removing action hints reduces guidance, explicitly requested by owner; safe first-use cards/help remain the teaching path. No balance change applied or proposed. No independent review claimed.

Human review pending for this revision. Not merged. PR creation/remote CI status reported separately.
