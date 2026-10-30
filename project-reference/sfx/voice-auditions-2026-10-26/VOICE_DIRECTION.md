# Homecoming — voice direction (audition draft)

Status: selected short lines integrated into the game at the owner's request on 30 October 2026. Human listening review of pronunciation, timing and mix is pending; longer alternate takes remain audition only.

## Lines added for the 30 October integration

| Situation | A | B |
| --- | --- | --- |
| Vendor nearly clipped | `vendor_near_a.mp3` — “Ê, né gánh hàng coi!” | `vendor_near_b.mp3` — “Trời ơi, hàng tôi!” |
| Vendor cart hit | `vendor_hit_a.mp3` — “Ủa, tông thiệt luôn hả?” | `vendor_hit_b.mp3` — “Hàng rong chứ đâu phải bowling!” |
| Passenger passed | `passenger_ignored_a.mp3` — “Ê, quay lại coi!” | `passenger_ignored_b.mp3` — “Xe ơi, bỏ tôi thiệt hả?” |
| Passenger aboard on fall | `passenger_fall_a.mp3` — “Ê, coi chừng té!” | `passenger_fall_b.mp3` — “Ui da, lái cẩn thận!” |
| Storm bystander | `storm_crowd_a.mp3` — “Mưa dữ quá trời!” | `storm_crowd_b.mp3` — “Gió lớn ghê, vô nhà đi!” |

These ten files use ElevenLabs multilingual v2 and the Sarah voice. The exact delivery and Vietnamese pronunciation have not been approved by ear.

## Direction for ElevenLabs generations

- Write each spoken line for the character's immediate situation and intent, not as a neutral reading of a UI caption.
- Put an acting cue before the words it affects. Use a small emotional change or vocal beat within the line when it helps the meaning.
- Shape pauses with punctuation. Keep the spoken text brief enough for an active driving scene.
- Generate separate takes with different delivery, then audition pronunciation, emotion, timing, and clarity against rain, engine, and warning audio before selecting one.
- Keep clean voice files separate from ambience and SFX so they can be mixed later. Important gameplay warnings need equivalent visual cues and must remain readable with voices muted.
- Police should sound playful and firm, never humiliating or frightening. A roadside passenger should sound hopeful and human, not panicked.
- Owner feedback after the first two samples: male police delivery needs more humor. Try mock seriousness followed by a small laugh and a rhythmic payoff; avoid flat narration.

## Current auditions

| File | Character | Spoken words | Status |
| --- | --- | --- | --- |
| `police_expressive_take_b.mp3` | Police | “Chạy đâu... cho thoát con!” | Based on an illustrative line in `GAME_DESIGN.md`; performance unapproved |
| `passenger_expressive_take_b.mp3` | Roadside passenger | “Xe ơi! Cho tôi đi nhờ với!” | Proposed new line; wording and performance unapproved |
| `police_comic_take_c.mp3` | Police | “Chạy đâu... cho thoát con!” | Same words, stronger comic acting beat; unapproved |
| `police_comic_take_d_tay_lai_lua.mp3` | Police | “Tấp vào lề nào... tay lái lụa!” | Based on a second illustrative line in `GAME_DESIGN.md`; unapproved |

Both takes use ElevenLabs v4 and default voices available through the current API plan. Emotional direction was added with inline tags and more expressive voice settings. Vietnamese pronunciation and acting quality still require human listening review.

## Short-line audition pack — 26 October 2026

Owner direction: two lines per situation, ideally 1–2 seconds each. All durations below come from Windows audio metadata (seconds); files exist and are nonempty. The short takes selected in the audio director are integrated for trial, and remain **pending listening approval**.

| Situation | A | Duration | B | Duration |
| --- | --- | ---: | --- | ---: |
| Police stop, playful male | `police_short_a.mp3` — “Tấp lề nào!” | 1.25 | `police_short_b.mp3` — “Lái lụa!” | 1.83 |
| Militia stop, light but firm male | `militia_short_a.mp3` — “Dừng xe nhé!” | 1.18 | `militia_short_b.mp3` — “Kiểm tra chút nào!” | 1.67 |
| Roadside passenger, hopeful female | `passenger_short_a.mp3` — “Cho đi nhờ với!” | 1.52 | `passenger_short_b.mp3` — “Xe ơi, đợi tôi!” | 1.83 |
| Ride-hailing passenger, relieved female | `grab_short_a.mp3` — “Đúng xe rồi!” | 1.25 | `grab_short_b.mp3` — “Tôi ở đây nè!” | 1.44 |
| Stranded passenger, concerned female | `stranded_short_a.mp3` — “Xe hỏng rồi!” | 1.59 | `stranded_short_b.mp3` — “Cho đi nhờ nhé!” | 1.67 |
| Passenger drop-off, grateful female | `dropoff_short_a.mp3` — “Cảm ơn nha!” | 1.18 | `dropoff_short_b.mp3` — “Tới nơi rồi!” | 1.33 |

Generation: ElevenLabs `eleven_v4`, `vi`; stability 0.18, style 0.82, similarity boost 0.7, speed 1.18. Inline delivery tags set mood per line. Default voices: George for police, Daniel for militia, Sarah for passengers. The files still need a human ear for Vietnamese pronunciation and emotional fit in context; metadata confirms duration only.

## Driver pickup and kick auditions

The game design specifies F to pick up a nearby passenger and G to kick one passenger sideways in a comic beat. These are **driver** reactions proposed for those two events, with two variants each. Pickup takes are integrated for trial; the two driver kick lines remain audition only. None has been approved by ear.

| Situation | A | Duration | B | Duration |
| --- | --- | ---: | --- | ---: |
| Driver picks up passenger | `driver_pickup_short_a.mp3` — “Lên xe, triển thôi!” | 1.91 s | `driver_pickup_short_b.mp3` — “Ghế nóng đây rồi!” | 1.91 s |
| Driver kicks passenger out | `driver_kick_short_a.mp3` — “Bay nha!” | 1.44 s | `driver_kick_short_b.mp3` — “Hạ cánh đẹp nhé!” | 1.83 s |

Generation: ElevenLabs `eleven_v4`, Vietnamese, George default voice; stability 0.16, style 0.88, similarity boost 0.68, speed 1.2. Duration was measured from Windows audio metadata. Human listening is still needed for pronunciation, comic timing and clarity over game audio.

## Impact and passenger scream auditions

Two variants per situation; durations were measured from Windows audio metadata. These are proposals for listening review, with no game integration. The traffic lines are spoken by the driver of the other vehicle; the kick reactions are short vocal cries from the passenger.

| Situation | A | Duration | B | Duration |
| --- | --- | ---: | --- | ---: |
| Passenger hit by player vehicle | `passenger_hit_short_a.mp3` — “Ối, coi đường!” | 1.44 s | `passenger_hit_short_b.mp3` — “Ối! Tôi đây!” | 1.67 s |
| Obstacle vehicle hit | `traffic_hit_short_a.mp3` — “Ê, xe tôi!” | 1.91 s | `traffic_hit_short_b.mp3` — “Xe móp!” | 1.75 s |
| Passenger kicked out of vehicle | `passenger_kick_scream_a.mp3` — “Ááá!” | 0.94 s | `passenger_kick_scream_b.mp3` — “Ái!” | 1.44 s |

ElevenLabs `eleven_v4`, Vietnamese, Sarah for passenger and Daniel for other driver; stability 0.16, style 0.88, similarity boost 0.7, speed 1.2. Human listening review is needed for pronunciation and whether the vocal cries sound like real screams rather than read words. Voices remain optional flavor; impact and ejection must also be conveyed visually.
