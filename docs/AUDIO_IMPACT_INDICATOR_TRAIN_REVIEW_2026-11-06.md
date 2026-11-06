# Impact, indicator and train review — 6 November 2026

**Branch:** `codex/impact-indicator-train-audio`, based on remote main `9791eab` and the previously pushed sound branch `a55abb8`. **Scenario:** `?scenario=p61-train-left&seed=17`. Owner requested clearer potholes, person/vendor impacts, steering/QTE indicator ticks and an audible animated crossing train. Simulation and balance values were not changed.

## Changes

- Raise player pothole impact gain from 1 to 1.35 and traffic pothole gain from .55 to .75. This is a mix adjustment to the six earlier ElevenLabs clips.
- Add two short padded “thụp” takes for a roadside passenger hit and police/militia contact. The hit trigger stays tied to the simulation's actual contact; passenger scream is a separate voice event. Add two cart/tray clatter takes for an actual vendor collision, replacing the earlier generic cart hit.
- Add an ElevenLabs relay tick while A/D steering is held and while a valid Q/E junction choice remains active. One .52-second cooldown prevents key repeat and per-frame update from stacking ticks. A rejected Q/E choice is silent.
- Add a seamless four-second train-wheel loop only while a nearby train is crossing. Predecode on approach, fade on exit/pause, stop on reset. The older one-shot pass could play before train motion began. Wheel rotation is now a deterministic function of simulation time, so it animates when moving and freezes on pause.

## Checks actually run

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm lint` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native tests/art-moving-events.test.ts tests/audio-feedback.test.ts tests/audio-director.test.ts --reporter=dot` | Pass, 18/18 |
| `pnpm build` | Pass, exit 0; pre-existing chunk-size advisory |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, exit 0; 79 files, 430/430 tests |

## Manual browser check

Codex in-app browser on port 5181: started the `p61-train-left` fixture, dismissed safe first-use cards, observed the train visually crossing from the right road edge at distance 12 m to the left road edge at distance 51 m while the run advanced. The six-clip audition page loaded controls for every generated file. **CHƯA KIỂM TRA THỦ CÔNG:** audible punch/volume through speakers, relay cadence, train loop seam and masking, passenger/vendor collision timing by ear, full failure/restart. Browser automation exposes no audio capture. A visual playthrough does not establish the mix.

## Codex self-review

**Game design, inference from event logic and observed train fixture:** Impact sounds now reinforce the same contact event as damage or passenger reaction without altering fairness, collision bounds or RNG. A single relay cooldown should keep rapid A/D input from making a loud click stream. The active-crossing gate keeps rail rumble from warning too early. Listen with rain and music at normal levels before raising any cue further.

**UI/UX, inference from fixture view:** The train was visible in two distinct positions and the first-use card paused before danger. The crossing warning remains visual; audio can be muted. The Q/E indicator only confirms an accepted choice. The remaining priority is perceived synchrony and clarity on actual speakers, not a layout change.
