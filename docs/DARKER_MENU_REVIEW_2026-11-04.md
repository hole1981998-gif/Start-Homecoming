# Darker menu palette — 2026-11-04

Base: ed59ab73ef91db676172f4234b836723739ed744 (current origin/main). Branch: codex/darker-menu.

CSS-only menu palette: muted blue-green #293d42 surfaces, #31484d cards, pale #e4ece8 text, #bdcfca secondary text, #99bbb1 primary actions. Existing texture is retained under a tinted overlay. Variables are scoped to panels; road tags and HUD keep their approved colors. No simulation/config/art changes.

Validation: Windows PowerShell, bundled Node/pnpm; pnpm lint, pnpm typecheck, pnpm test --maxWorkers=2, pnpm build all completed successfully (exit 0). Existing large Three.js chunk warning remains. No CSS-mirroring tests added.

Manual: Codex in-app browser, seed 17. Started shop-third, R opened shop, resumed, Esc paused, opened/closed help, restarted to start menu. Coast fixture reached fuel failure at 26m; result screen captured. Screenshots inspected in this session: docs/evidence/darker-menu-2026-11-04/01-start.png, 02-shop.png, 03-help.png, 04-result.png. No physical mobile/screen-reader testing.

UI/UX self-review from current screenshots and real interactions: menu no longer presents a large white patch against the storm scene; pale text and sage action fills retain hierarchy. Result screen retains existing scrolling on short viewports. Keyboard focus remains visible. No independent design review claimed.

Game designer self-review: start/shop/pause/help/restart and fuel ending checks passed. Color-only change gives no evidence for balance changes; no balance adjustment proposed or applied. Driving feel and overall fairness were not reassessed.

Human review: pending for this palette. Merge: not authorized for this new feature. PR/remote CI reported separately.
