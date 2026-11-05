# Sticky hamburger menu — 2026-11-05

Branch codex/sticky-controls-menu from current main ed59ab7 retaining pending game/UI fixes through ded81ea.

Root cause: pointerenter opened the menu before click, so click could toggle it closed; pointerleave then closed it while the cursor crossed the gap between hamburger and panel. Removed hover open/close and automatic focus-out close. Click toggles a persistent menu. Outside pointerdown, Escape (including after keyboard focus leaves the panel), M toggle or choosing an action closes it. Selected actions retain their existing behavior/focus management. No simulation/config or art change.

Meaningful regression coverage in the real UI/input test: hover alone does not open; click opens; pointerleave and focus movement keep it open; outside click closes; Escape closes without pausing the game; interior Help click works and collapses menu; existing pause/help/focus/restart/QTE checks retained.

Manual: Codex in-app browser seed17 shop-third. Started run, real hamburger click showed menu, captured/inspected 01-open-menu.png; real click on Help opened guidance (02-help-selected.png), closed help/resumed. Opened menu then clicked canvas: aria-expanded false. M then Esc: aria-expanded false. Opened menu and real Restart: start screen returned. Temporary test tab used; user-facing game will be opened visibly for handoff as requested. No physical touch-device test. Native cursor hover could not be driven separately via the available browser API; real interior click plus synthetic pointerleave regression cover the original failure.

UI/UX self-review: cursor can cross the gap freely; opening no longer fights hover; clear explicit dismissal, keyboard access and action selection remain. Game-designer self-review: menu actions/pause/restart work without changing gameplay/balance. No independent reviewer claimed.

Validation: Windows PowerShell, bundled Node/pnpm. Required gate outcomes appended after commands complete. Human review pending; not merged.

Final outcomes: lint, typecheck, full tests (77 files / 419 tests), production build passed exit 0. Final targeted UI regression and final build passed after adding global Escape dismissal. Existing Three.js chunk warning retained. Visible game opened at the start screen and marked to remain open; screenshot03-ready-to-play.png.
