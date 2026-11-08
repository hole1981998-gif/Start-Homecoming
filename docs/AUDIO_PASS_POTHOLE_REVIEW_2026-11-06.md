# Traffic pass timing and pothole SFX review — 6 November 2026

**Revision under review:** `codex/traffic-pass-pothole-audio` from remote main `9791eab`, merged with the previously pushed audio branch `66572df`. **Scenario:** `?scenario=traffic&seed=17`. The owner authorized publishing the supplied shop music to GitHub in this turn. No simulation, spawn, economy or balance value changed.

## Change and reason

Traffic pass recordings contain an audible approach before their closest point. Playing one only when the traffic centre crossed the player made the loud pass arrive late. The cue now starts 1.1, 1.25 or 1.5 seconds of closing distance before centre crossing for motorcycles, cars or heavy vehicles, clamped to 6–40 m. Nearby passes predecode their clips before that threshold. Each vehicle still emits at most one pass. This timing is an estimate from the clip description and should be adjusted after listening to an in-game capture.

Six ElevenLabs Sound Effects v2 pothole clips replace the previous rattles: two each for light, medium and heavy vehicles. Their prompts request an immediate tire knock followed by short suspension/bodywork rattle. Both player and traffic pothole feedback use the matching weight; existing cooldown and variant rotation remain.

## Checks actually run

| Check | Result |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native tests/audio-feedback.test.ts tests/audio-director.test.ts --reporter=dot` | Pass, 10/10 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, exit 0; 79 files, 430/430 tests |
| `pnpm build` | Pass, exit 0; pre-existing 500 kB chunk advisory |

## Manual browser check

Codex in-app browser at port 5180: started the traffic fixture, dismissed the first-use safety cards, observed a run advance from 0 m to 683 m with speed, fuel and HP updating, and opened the local audition page displaying all six clip controls. The page and game both loaded. **CHƯA KIỂM TRA THỦ CÔNG:** audible timing relative to the visible passing vehicle, impact clarity through speakers, all vehicle weights in a run, failure/restart, and listener mix at normal volume. Browser automation exposes no audio capture; a visual playthrough cannot establish sound quality or synchrony.

## Codex self-review

**Game design, inference from event logic and the run:** Earlier approach timing should match the recording's Doppler movement and avoids a late pass after the vehicle has gone. The closing-speed threshold keeps the cue local. If several vehicles pass together, the shared `.45` second pass cooldown can suppress a second cue, limiting noise; verify with a dense-traffic listen before changing it. No difficulty or RNG change is proposed.

**UI/UX, inference from live view:** The run retained speed, resource and hazard visuals while the audio code changed. Pothole consequences remain visible through HP. Priority for the next listening pass is matching the strongest tire impact to the moment of contact and ensuring it does not mask the existing warning/voice mix. No UI layout change is proposed.
