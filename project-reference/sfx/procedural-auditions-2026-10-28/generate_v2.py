"""V2 engine stems and longer interaction auditions for Homecoming.

Engine stems share a two-second phase grid. Equal-phase crossfades and a common
playback-rate change connect idle, cruise and fast running without a new attack.
The ramp preview renders the same mixing rule used by the future audio director.
"""

from __future__ import annotations

import html
import json
import math
import struct
import wave
from pathlib import Path

import generate as g
import generate_full as full


ROOT = Path(__file__).resolve().parent
RATE = g.RATE
LOOP_SECONDS = 2.0
LOOP_FRAMES = round(RATE * LOOP_SECONDS)
ENGINE_DIR = ROOT / "engine-v2"
INTERACTION_DIR = ROOT / "interaction-v2"

VEHICLES: dict[str, tuple[int, float, float]] = {
    # Integer base cycles keep each 2 s stem periodic. The last numbers shape
    # combustion pulse and roughness by vehicle without changing phase.
    "motorcycle": (58, .19, .055),
    "motorbike": (76, .22, .060),
    "car4": (50, .15, .038),
    "car7": (46, .18, .045),
    "tricycle": (43, .24, .062),
    "bus": (35, .30, .070),
    "truck": (33, .33, .080),
    "container": (30, .36, .085),
}

STATES = ("idle", "cruise", "fast")


def engine_stems(kind: str) -> dict[str, list[float]]:
    base, pulse_weight, grit = VEHICLES[kind]
    stems = {state: [0.0] * LOOP_FRAMES for state in STATES}
    # Every frequency is an integer Hz. A 2 s segment therefore contains a
    # whole number of periods; all stems and their deterministic grit align.
    for index in range(LOOP_FRAMES):
        t = index / RATE
        angle = 2 * math.pi * base * t
        pulse = max(0.0, math.sin(angle)) ** 4 - .18
        wobble = 1 + .075 * math.sin(2 * math.pi * 3 * t)
        grit_wave = (math.sin(2 * math.pi * (base * 7 + 13) * t + .6) +
                     .48 * math.sin(2 * math.pi * (base * 11 + 27) * t + 1.9) +
                     .28 * math.sin(2 * math.pi * (base * 17 + 41) * t + 2.4))
        # Periodic upper bands add load, air and tyre texture without breaking
        # the 2 s loop grid. Their balance changes between the three states.
        intake = sum(math.sin(2 * math.pi * (base * (9 + k * 3) + 17 * k) * t + 1.13 * k)
                     for k in range(1, 6)) / 5
        road = sum(math.sin(2 * math.pi * (690 + base * k + 37 * k) * t + 2.07 * k)
                   for k in range(1, 7)) / 6
        body = math.sin(angle) * .55 + math.sin(2 * angle + .12) * .25
        stems["idle"][index] = wobble * (body + pulse * pulse_weight * .67 +
                                           math.sin(3 * angle) * .065 + grit_wave * grit * .33 + intake * .025)
        stems["cruise"][index] = wobble * (body * .72 + pulse * pulse_weight +
                                             math.sin(3 * angle) * .19 +
                                             math.sin(4 * angle) * .10 + grit_wave * grit +
                                             intake * .19 + road * .055)
        stems["fast"][index] = wobble * (body * .49 + pulse * pulse_weight * 1.36 +
                                           math.sin(3 * angle) * .29 +
                                           math.sin(4 * angle) * .19 +
                                           math.sin(5 * angle) * .14 + grit_wave * grit * 1.25 +
                                           intake * .31 + road * .13)
    # One scale per vehicle preserves relative loudness between engine states.
    peak = max(abs(x) for stem in stems.values() for x in stem)
    scale = .37 / peak
    return {state: [x * scale for x in audio] for state, audio in stems.items()}


def write_wav(path: Path, audio: list[float], fade: bool = False) -> dict[str, float]:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fade:
        for index in range(len(audio)):
            edge = min(1.0, index / (RATE * .035),
                       (len(audio) - index - 1) / (RATE * .055))
            audio[index] *= max(0.0, edge)
    samples = [max(-32768, min(32767, round(x * 32767))) for x in audio]
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(struct.pack(f"<{len(samples)}h", *samples))
    rms = math.sqrt(sum((x / 32768) ** 2 for x in samples) / len(samples))
    return {"duration_seconds": round(len(audio) / RATE, 3),
            "peak": round(max(abs(x) for x in samples) / 32768, 4),
            "rms": round(rms, 4)}


def weights(speed: float) -> tuple[float, float, float]:
    speed = max(0.0, min(1.0, speed))
    if speed <= .50:
        f = speed / .50
        return 1 - f, f, 0.0
    f = (speed - .50) / .50
    return 0.0, 1 - f, f


def target_speed(t: float) -> float:
    # 0-1 idle; 1-3 accelerate to cruise; 3-4 hold; 4-5.5 climb to fast;
    # 5.5-6.5 hold; 6.5-8 and 8-9.5 decelerate; final idle tail.
    if t < 1: return 0.0
    if t < 3: return .5 * (t - 1) / 2
    if t < 4: return .5
    if t < 5.5: return .5 + .5 * (t - 4) / 1.5
    if t < 6.5: return 1.0
    if t < 8: return 1 - .5 * (t - 6.5) / 1.5
    if t < 9.5: return .5 * (1 - (t - 8) / 1.5)
    return 0.0


def ramp_preview(stems: dict[str, list[float]]) -> list[float]:
    audio = [0.0] * (RATE * 10)
    phase_index = 0.0
    last_speed = 0.0
    for index in range(len(audio)):
        t = index / RATE
        desired = target_speed(t)
        # Gentle low-pass on control signal prevents step changes at the
        # preview's segment boundaries; the same smoothing belongs in runtime.
        last_speed += (desired - last_speed) * (1 - math.exp(-1 / (RATE * .085)))
        a, b, c = weights(last_speed)
        playback_rate = .86 + last_speed * .38
        phase_index = (phase_index + playback_rate) % LOOP_FRAMES
        left = int(phase_index)
        right = (left + 1) % LOOP_FRAMES
        fraction = phase_index - left
        sample = 0.0
        for state, gain in zip(STATES, (a, b, c)):
            stem = stems[state]
            sample += gain * (stem[left] * (1 - fraction) + stem[right] * fraction)
        audio[index] = sample
    return audio


def tone_line(audio: list[float], at: float, length: float, start_hz: float,
              end_hz: float, amount: float, decay: float) -> None:
    g.tone(audio, at, length, start_hz, end_hz, amount, decay,
           ((1.0, 1.0), (2.0, .22), (3.0, .09)))


def interaction(key: str, duration: float) -> list[float]:
    a = g.blank(duration)
    seed = 29000 + sum((index + 1) * ord(letter) for index, letter in enumerate(key))
    if key == "water_splash":
        full.splash(a, .01, .50, seed)
        g.whoosh(a, .11, 1.05, seed + 1, .34)
        g.noise(a, .22, 1.12, .28, .45, seed + 2, 3200)
        for i in range(7): full.pluck(a, .33 + i * .12, 340 + i * 25, .055, .13)
    elif key == "pothole":
        g.thump(a, .01, .88, seed)
        full.rattle(a, .17, 3, .12, 170, .14)
        tone_line(a, .15, .53, 180, 105, .10, .21)
    elif key == "wind_gust":
        g.whoosh(a, .03, 2.42, seed, .46)
        g.noise(a, .26, 2.18, .20, 1.25, seed + 2, 450)
        tone_line(a, .26, 1.95, 140, 94, .09, 1.3)
    elif key == "cargo_release":
        full.pluck(a, .01, 170, .29, .22, True)
        g.whoosh(a, .15, .55, seed, .20)
        full.pluck(a, .48, 120, .18, .20)
    elif key == "cargo_crate_roll":
        for i in range(12):
            at = .02 + i * (.20 + i * .003)
            full.pluck(a, at, 145 - i * 2.5, .17 * (.97 ** i), .21)
        g.whoosh(a, .05, 2.66, seed, .18)
        g.noise(a, .16, 2.50, .14, 2.15, seed + 1, 950)
    elif key == "cargo_barrel_roll":
        for i in range(14):
            at = .02 + i * (.18 + i * .003)
            full.pluck(a, at, 215 - i * 3, .15 * (.98 ** i), .29, True)
        tone_line(a, .06, 2.97, 105, 83, .16, 2.3)
        g.whoosh(a, .07, 2.89, seed, .15)
    elif key == "cargo_crate_hit":
        g.thump(a, .01, .99, seed)
        full.rattle(a, .17, 5, .15, 135, .12)
        g.noise(a, .22, .75, .18, .32, seed + 3, 1200)
    elif key == "cargo_barrel_hit":
        g.thump(a, .01, 1.02, seed)
        full.rattle(a, .12, 5, .18, 295, .15, True)
        tone_line(a, .20, .84, 370, 250, .12, .40)
    elif key == "train_approach":
        g.whoosh(a, .12, 3.35, seed, .38)
        tone_line(a, .02, 3.45, 44, 69, .29, 2.15)
        full.rattle(a, .20, 10, .31, 180, .11, True)
        full.chime(a, .86, (390, 390), .10, .73)
        full.chime(a, 2.15, (390, 390), .12, .51)
    elif key == "train_pass":
        g.whoosh(a, .08, 4.10, seed, .58)
        tone_line(a, .02, 4.19, 82, 45, .34, 3.25)
        full.rattle(a, .16, 24, .17, 160, .13, True)
        g.noise(a, 1.18, 2.55, .27, 1.53, seed + 1, 750)
    elif key == "train_clear":
        full.rattle(a, .02, 6, .18, 178, .14, True)
        tone_line(a, .06, 1.12, 70, 43, .14, .52)
        g.whoosh(a, .07, 1.03, seed, .15)
    elif key == "police_warning":
        tone_line(a, .04, .37, 560, 620, .16, .20)
        tone_line(a, .57, .37, 560, 620, .15, .20)
        g.noise(a, .10, 1.14, .07, .55, seed, 2400, True)
    elif key == "militia_warning":
        full.pluck(a, .03, 245, .19, .30)
        full.pluck(a, .39, 225, .18, .30)
        full.pluck(a, .75, 205, .14, .30)
    elif key == "police_capture":
        full.pluck(a, .01, 240, .27, .33, True)
        tone_line(a, .27, .85, 380, 180, .17, .34)
        full.pluck(a, .81, 153, .10, .24)
    elif key == "banana_use":
        tone_line(a, .02, .51, 490, 155, .27, .23)
        g.whoosh(a, .11, .63, seed, .24)
        full.pluck(a, .53, 320, .13, .18)
    elif key == "jam":
        full.pluck(a, .02, 165, .19, .25)
        for at, hz in ((.25, 285), (.74, 260), (1.17, 295)):
            tone_line(a, at, .34, hz, hz - 20, .12, .22)
        g.noise(a, .21, 1.60, .12, .72, seed + 2, 1100)
    elif key == "accident":
        g.thump(a, .01, 1.11, seed)
        g.noise(a, .05, 1.12, .39, .38, seed + 1, 2300)
        full.rattle(a, .21, 7, .17, 215, .13, True)
    elif key == "broken_car":
        for i in range(7):
            at = .02 + i * (.21 + i * .006)
            tone_line(a, at, .20, 96 - i * 5, 56 - i * 2, .23 * (.93 ** i), .09)
        full.rattle(a, 1.46, 3, .17, 135, .10, True)
    elif key == "barrier_hit":
        g.thump(a, .01, .98, seed)
        full.rattle(a, .16, 5, .14, 160, .13)
    elif key == "vendor_near":
        full.rattle(a, .03, 8, .15, 225, .105, True)
        g.noise(a, .15, .94, .09, .48, seed + 1, 1200)
    elif key == "vendor_hit":
        g.thump(a, .01, .90, seed)
        full.rattle(a, .18, 8, .16, 255, .15, True)
        g.noise(a, .19, 1.24, .20, .55, seed + 3, 1800)
    elif key == "ambulance_pass":
        for i, hz in enumerate((430, 365, 430, 365, 430, 365, 430, 365)):
            tone_line(a, .10 + i * .37, .31, hz, hz, .085, .23)
        g.whoosh(a, .17, 2.91, seed, .27)
        tone_line(a, .19, 2.84, 77, 54, .12, 1.53)
    elif key == "vehicle_collision":
        g.thump(a, .01, 1.17, seed)
        g.noise(a, .03, .90, .45, .33, seed + 1, 2600)
        full.rattle(a, .14, 6, .16, 260, .16, True)
        g.whoosh(a, .31, .90, seed + 2, .12)
    elif key == "passenger_hit":
        g.thump(a, .01, .76, seed)
        g.noise(a, .08, .53, .24, .19, seed + 1, 1000)
        g.whoosh(a, .13, .57, seed + 2, .10)
    else:
        raise ValueError(key)
    return a


INTERACTIONS: dict[str, tuple[float, float, str]] = {
    "water_splash": (1.42, .46, "medium; crossing and draining water"),
    "pothole": (.73, .42, "short; suspension bounce and loose body"),
    "wind_gust": (2.62, .36, "long; lateral gust with moving body"),
    "cargo_release": (.84, .40, "short; latch, falling air, ground touch"),
    "cargo_crate_roll": (3.05, .34, "long; uneven wood knocks with deceleration"),
    "cargo_barrel_roll": (3.28, .36, "long; metallic wheel pulses"),
    "cargo_crate_hit": (1.15, .46, "medium; impact and scattered wood"),
    "cargo_barrel_hit": (1.22, .49, "medium; impact and metal tail"),
    "train_approach": (3.75, .42, "long; distant rumble, repeated bell and approach"),
    "train_pass": (4.45, .51, "long; train body and sequential wheel clacks"),
    "train_clear": (1.35, .32, "medium; tail wheels recede"),
    "police_warning": (1.35, .34, "medium; two compact warning notes, no continuous siren"),
    "militia_warning": (1.20, .31, "medium; three rounded knocks"),
    "police_capture": (1.20, .40, "medium; latch and falling tone"),
    "banana_use": (.86, .36, "short; comic slide with small landing"),
    "jam": (2.05, .37, "long; muted traffic cluster"),
    "accident": (1.65, .50, "medium; impact and settling parts"),
    "broken_car": (2.20, .40, "long; declining sputter and rattle"),
    "barrier_hit": (1.00, .47, "medium; barrier impact and rattling"),
    "vendor_near": (1.32, .25, "medium; roadside cart passing"),
    "vendor_hit": (1.62, .45, "medium; cart and object clatter"),
    "ambulance_pass": (3.30, .30, "long; distant passing vehicle and soft siren"),
    "vehicle_collision": (1.38, .51, "medium; metal, rubber and panel tail"),
    "passenger_hit": (.84, .38, "short; soft cloth and body reaction"),
}


if __name__ == "__main__":
    ENGINE_DIR.mkdir(parents=True, exist_ok=True)
    INTERACTION_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {"engine": [], "interactions": []}
    for kind in VEHICLES:
        stems = engine_stems(kind)
        for state, audio in stems.items():
            path = ENGINE_DIR / f"{kind}_{state}_loop.wav"
            stats = write_wav(path, audio)
            manifest["engine"].append({"vehicle": kind, "state": state,
                                       "file": str(path.relative_to(ROOT)).replace("\\", "/"), **stats})
        path = ENGINE_DIR / f"{kind}_ramp_preview.wav"
        stats = write_wav(path, ramp_preview(stems), fade=True)
        manifest["engine"].append({"vehicle": kind, "state": "ramp_preview",
                                   "file": str(path.relative_to(ROOT)).replace("\\", "/"), **stats})
    for key, (duration, peak, description) in INTERACTIONS.items():
        path = INTERACTION_DIR / f"{key}.wav"
        stats = g.save(str(path.relative_to(ROOT)).replace("\\", "/"),
                       interaction(key, duration), peak)
        manifest["interactions"].append({"key": key,
                                         "file": str(path.relative_to(ROOT)).replace("\\", "/"),
                                         "duration_seconds": round(stats[0], 3),
                                         "rms": round(stats[1], 4),
                                         "length_class": description.split(";", 1)[0],
                                         "description": description})
    (ROOT / "V2_MANIFEST.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    groups: dict[str, list[str]] = {}
    for kind in VEHICLES:
        name = html.escape(kind)
        path = f"engine-v2/{name}_ramp_preview.wav"
        groups.setdefault("Engine ramp previews", []).append(
            f'<article><div><b>{name}</b><small>Idle → cruise → fast → cruise → idle, 10 s</small></div>'
            f'<audio controls preload="none" src="{path}"></audio></article>')
        for state in STATES:
            loop_path = f"engine-v2/{name}_{state}_loop.wav"
            groups.setdefault("Individual engine loops", []).append(
                f'<article><div><b>{name} · {state}</b><small>2 s; player repeats automatically</small></div>'
                f'<audio controls loop preload="none" src="{loop_path}"></audio></article>')
    for key, (_, _, description) in INTERACTIONS.items():
        groups.setdefault("Longer interaction SFX", []).append(
            f'<article><div><b>{html.escape(key.replace("_", " "))}</b>'
            f'<small>{html.escape(description)}</small></div>'
            f'<audio controls preload="none" src="interaction-v2/{html.escape(key)}.wav"></audio></article>')
    for name, description in (
        ("interaction-v2/collision_light.wav", "Light collision · current game cue"),
        ("interaction-v2/collision_medium.wav", "Medium collision · current game cue"),
        ("interaction-v2/collision_heavy.wav", "Heavy collision · current game cue"),
        ("road/pothole_rattle_light.wav", "Light pothole · current game cue"),
        ("road/pothole_rattle_heavy.wav", "Heavy pothole · current game cue"),
        ("road/water_roll_loop.wav", "Water roll · current game loop"),
    ):
        loop = " loop" if "water_roll_loop" in name else ""
        groups.setdefault("Current game mix cues", []).append(
            f'<article><div><b>{description}</b></div>'
            f'<audio controls{loop} preload="none" src="{name}"></audio></article>')
    sections = "\n".join(
        f'<section><h2>{html.escape(group)}</h2>{"".join(rows)}</section>'
        for group, rows in groups.items())
    page = ("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            "<title>Homecoming engine and hazard V2 auditions</title>"
            "<style>body{font:15px system-ui;background:#171e20;color:#eff2ee;margin:0 auto;padding:24px;max-width:940px}"
            "h1{margin-bottom:4px}p,small{color:#b2c0bd}section{margin:28px 0}h2{border-bottom:1px solid #42514c;padding-bottom:7px}"
            "article{display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid #34413c;padding:11px 0}"
            "small{display:block;margin-top:3px}audio{width:290px;max-width:100%}@media(max-width:700px){article{display:block}audio{width:100%;margin-top:9px}}"
            "</style><h1>Engine and interaction SFX — V2</h1>"
            "<p>Review the current game engine, collision, pothole and water cues, plus earlier interaction drafts."
            " Browser players audition individual files; use the game to judge the full mix.</p>" + sections + "</html>\n")
    (ROOT / "LISTEN_V2.html").write_text(page, encoding="utf-8")
    print(f"Engine stems: {len(VEHICLES) * 3}; ramp previews: {len(VEHICLES)}; interaction cues: {len(INTERACTIONS)}")
