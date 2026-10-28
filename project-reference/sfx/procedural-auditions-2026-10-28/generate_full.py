"""Build a broad, deterministic SFX audition library for Homecoming.

Run beside generate.py with Python 3. The output is for listening review, not runtime.
No external packages, ElevenLabs calls, voice lines, or music are involved.
"""

from __future__ import annotations

import json
import html
import math
import random
import struct
import wave
from pathlib import Path

import generate as g


ROOT = Path(__file__).resolve().parent
RATE = g.RATE


def pluck(audio: list[float], at: float, pitch: float, strength: float = .23,
          duration: float = .30, metallic: bool = False) -> None:
    partials = ((1.0, 1.0), (2.41, .33), (3.13, .10)) if metallic else ((1.0, 1.0), (2.0, .20))
    g.tone(audio, at, duration, pitch, pitch * .985, strength, duration / 3.4, partials)
    g.noise(audio, at, min(.055, duration), strength * .6, .012,
            round(at * 10000 + pitch), 1500 if metallic else 900, metallic)


def rattle(audio: list[float], at: float, count: int, spacing: float,
           pitch: float, strength: float, metallic: bool = False) -> None:
    for index in range(count):
        pluck(audio, at + index * spacing, pitch * (1 + .055 * (index % 3)),
              strength * (.83 ** index), .19, metallic)


def splash(audio: list[float], at: float, amount: float, seed: int) -> None:
    g.noise(audio, at, .38, amount, .09, seed, 4200)
    g.whoosh(audio, at + .03, .42, seed + 1, amount * .65)
    for index in range(4):
        pluck(audio, at + .16 + index * .057, 420 + 50 * index,
              amount * .08, .11)


def liquid(audio: list[float], at: float, amount: float, seed: int) -> None:
    g.noise(audio, at, .45, amount * .34, .22, seed, 1400)
    for index, pitch in enumerate((260, 310, 230, 350)):
        g.tone(audio, at + .06 + index * .078, .18, pitch, pitch * .7,
               amount * .14, .055)


def chime(audio: list[float], at: float, notes: tuple[int, ...],
          strength: float = .22, spacing: float = .12) -> None:
    for index, pitch in enumerate(notes):
        pluck(audio, at + index * spacing, pitch, strength * (.92 ** index), .30, True)


def scrape(audio: list[float], at: float, duration: float, seed: int,
           strength: float = .35) -> None:
    g.whoosh(audio, at, duration, seed, strength)
    g.noise(audio, at, duration, strength * .45, duration * .5,
            seed + 3, 2200, True)


def one_shot(key: str, duration: float) -> list[float]:
    a = g.blank(duration)
    seed = 1000 + sum((index + 1) * ord(letter) for index, letter in enumerate(key))
    if key == "accelerate":
        g.tone(a, .01, .59, 73, 132, .36, .36, ((1, 1), (2, .37), (3, .18)))
        g.whoosh(a, .08, .55, seed, .18)
    elif key == "brake":
        scrape(a, .02, .52, seed, .38)
        g.tone(a, .04, .43, 470, 190, .11, .19)
    elif key == "skid":
        scrape(a, .01, .76, seed, .54)
        g.tone(a, .04, .67, 540, 320, .09, .29)
    elif key == "coast":
        g.tone(a, .02, .69, 120, 55, .29, .28, ((1, 1), (2, .24)))
        g.whoosh(a, .03, .62, seed, .15)
    elif key == "stop":
        g.tone(a, .02, .28, 98, 38, .33, .082)
        pluck(a, .26, 165, .19, .17)
    elif key == "driver_fall":
        g.thump(a, .02, .74, seed)
        scrape(a, .10, .43, seed + 1, .20)
    elif key == "vehicle_break":
        g.tone(a, .01, .57, 93, 37, .41, .21, ((1, 1), (2, .45), (3, .2)))
        rattle(a, .20, 4, .095, 175, .18, True)
    elif key == "vehicle_switch":
        pluck(a, .02, 144, .29, .23)
        pluck(a, .20, 205, .24, .23)
        g.tone(a, .26, .33, 70, 115, .17, .20)
    elif key == "water_splash":
        splash(a, .015, .54, seed)
    elif key == "pothole":
        g.thump(a, .01, .80, seed)
        rattle(a, .13, 2, .075, 210, .13)
    elif key == "wind_gust":
        g.whoosh(a, .02, .98, seed, .45)
        g.tone(a, .10, .73, 145, 95, .08, .38)
    elif key == "cargo_release":
        pluck(a, .01, 195, .29, .22, True)
        pluck(a, .17, 126, .24, .25)
    elif key == "cargo_crate_roll":
        rattle(a, .03, 7, .16, 140, .13)
        g.whoosh(a, .02, 1.14, seed, .09)
    elif key == "cargo_barrel_roll":
        rattle(a, .04, 8, .14, 180, .14, True)
        g.tone(a, .05, 1.10, 100, 88, .15, .60)
    elif key == "cargo_crate_hit":
        g.thump(a, .015, .95, seed)
        rattle(a, .10, 2, .075, 130, .13)
    elif key == "cargo_barrel_hit":
        g.thump(a, .01, .95, seed)
        pluck(a, .065, 335, .20, .35, True)
        pluck(a, .24, 266, .10, .27, True)
    elif key == "train_approach":
        g.whoosh(a, .06, 1.47, seed, .27)
        g.tone(a, .02, 1.45, 55, 73, .20, 1.0, ((1, 1), (2, .28), (3, .10)))
        rattle(a, .10, 5, .25, 175, .10, True)
        chime(a, .25, (430, 430), .10, .50)
    elif key == "train_pass":
        g.whoosh(a, .08, 1.63, seed, .52)
        g.tone(a, .01, 1.72, 84, 52, .32, .95, ((1, 1), (2, .29)))
        rattle(a, .10, 10, .15, 148, .12, True)
    elif key == "train_clear":
        rattle(a, .02, 3, .17, 190, .14, True)
        g.tone(a, .02, .54, 80, 48, .14, .17)
    elif key == "police_warning":
        g.tone(a, .03, .31, 570, 640, .16, .18)
        g.tone(a, .44, .31, 570, 640, .14, .18)
        g.noise(a, .03, .75, .08, .30, seed, 3200, True)
    elif key == "militia_warning":
        pluck(a, .04, 265, .20, .30)
        pluck(a, .33, 235, .19, .30)
    elif key == "police_capture":
        pluck(a, .02, 226, .30, .24, True)
        g.tone(a, .24, .48, 360, 195, .15, .22)
    elif key == "banana_use":
        g.tone(a, .02, .39, 430, 170, .27, .16)
        scrape(a, .09, .38, seed, .22)
        pluck(a, .40, 320, .12, .14)
    elif key == "jam":
        pluck(a, .01, 155, .22, .22)
        g.tone(a, .16, .42, 280, 245, .11, .23, ((1, 1), (2, .15)))
        pluck(a, .40, 180, .11, .18)
    elif key == "accident":
        g.thump(a, .01, 1.08, seed)
        g.noise(a, .03, .39, .39, .13, seed + 1, 2600)
        rattle(a, .20, 4, .10, 230, .12, True)
    elif key == "broken_car":
        for index in range(3):
            g.tone(a, .03 + index * .20, .17, 95, 56, .20, .07,
                   ((1, 1), (2, .4), (3, .1)))
        pluck(a, .67, 105, .11, .14)
    elif key == "barrier_hit":
        g.thump(a, .02, .94, seed)
        rattle(a, .14, 3, .09, 145, .14)
    elif key == "vendor_near":
        rattle(a, .02, 3, .11, 215, .11, True)
    elif key == "vendor_hit":
        g.thump(a, .01, .90, seed)
        rattle(a, .12, 5, .10, 250, .16, True)
    elif key == "ambulance_pass":
        for index, pitch in enumerate((466, 390, 466, 390)):
            g.tone(a, .06 + .29 * index, .26, pitch, pitch, .11, .16)
        g.whoosh(a, .12, 1.14, seed, .15)
    elif key == "fuel_pickup":
        liquid(a, .02, .72, seed)
        chime(a, .27, (392, 523), .13)
    elif key == "repair_pickup":
        rattle(a, .02, 3, .10, 205, .15, True)
        chime(a, .35, (392, 494), .10)
    elif key == "nitro_activate":
        g.whoosh(a, .015, .73, seed, .58)
        g.tone(a, .03, .64, 84, 156, .30, .37, ((1, 1), (2, .20)))
    elif key == "jump":
        g.tone(a, .01, .52, 230, 570, .28, .20)
        g.whoosh(a, .09, .42, seed, .27)
    elif key == "landing":
        g.thump(a, .015, .80, seed)
        rattle(a, .13, 2, .095, 180, .10)
    elif key == "star_activate":
        chime(a, .02, (392, 494, 659, 784), .16, .14)
        g.whoosh(a, .22, .60, seed, .10)
    elif key == "grab_call":
        chime(a, .02, (523, 659), .17, .14)
        pluck(a, .32, 784, .08, .15, True)
    elif key == "passenger_reboard":
        pluck(a, .02, 180, .17, .19)
        scrape(a, .16, .23, seed, .10)
        pluck(a, .37, 300, .11, .15)
    elif key == "passenger_refuse":
        g.tone(a, .04, .36, 340, 230, .14, .19)
        pluck(a, .34, 215, .08, .16)
    elif key == "shop_open":
        pluck(a, .02, 350, .15, .29, True)
        chime(a, .20, (440, 523), .12)
    elif key == "shop_buy":
        pluck(a, .02, 620, .16, .24, True)
        pluck(a, .20, 810, .12, .24, True)
    elif key == "shop_upgrade":
        rattle(a, .02, 4, .095, 270, .13, True)
        chime(a, .40, (392, 523, 659), .11, .095)
    elif key == "shop_fuel":
        liquid(a, .02, .64, seed)
        pluck(a, .44, 490, .09, .16)
    elif key == "shop_repair":
        rattle(a, .02, 4, .13, 175, .16, True)
        pluck(a, .61, 440, .10, .16)
    elif key == "shop_fail":
        pluck(a, .02, 250, .14, .19)
        pluck(a, .22, 190, .13, .19)
    elif key == "qte_warning":
        pluck(a, .015, 420, .15, .22)
        pluck(a, .20, 420, .16, .22)
        pluck(a, .39, 490, .15, .22)
    elif key == "qte_confirm":
        chime(a, .02, (440, 587), .17, .16)
    elif key == "qte_miss":
        g.tone(a, .02, .40, 370, 230, .17, .20)
    elif key == "pause":
        pluck(a, .02, 295, .13, .15)
        pluck(a, .15, 220, .11, .15)
    elif key == "resume":
        pluck(a, .02, 220, .12, .15)
        pluck(a, .15, 315, .13, .15)
    elif key == "restart":
        g.whoosh(a, .01, .36, seed, .19)
        chime(a, .24, (392, 523), .11)
    elif key == "result_damage":
        g.thump(a, .02, .82, seed)
        g.tone(a, .22, .53, 245, 112, .17, .23)
    elif key == "result_fuel":
        g.tone(a, .02, .74, 122, 42, .22, .31)
        pluck(a, .60, 190, .08, .16)
    elif key == "result_train":
        g.thump(a, .01, 1.0, seed)
        rattle(a, .12, 3, .14, 190, .12, True)
        g.tone(a, .27, .45, 220, 105, .11, .18)
    elif key == "result_police":
        pluck(a, .02, 220, .20, .23, True)
        g.tone(a, .24, .49, 360, 190, .13, .21)
    elif key == "result_secret":
        chime(a, .02, (392, 494, 587, 784, 988), .15, .22)
        g.tone(a, .22, 1.10, 196, 196, .11, .56, ((1, 1), (2, .12)))
    else:
        raise ValueError(f"Unrecognised cue: {key}")
    return a


def smooth_loop(audio: list[float], blend_seconds: float = .09) -> list[float]:
    blend = round(blend_seconds * RATE)
    for index in range(blend):
        fraction = index / max(1, blend - 1)
        source = audio[index]
        tail = audio[-blend + index]
        audio[-blend + index] = tail * (1 - fraction) + source * fraction
    audio[-1] = audio[0]
    return audio


def save_loop(path: Path, audio: list[float], target_peak: float) -> tuple[float, float]:
    audio = smooth_loop(audio)
    mean = sum(audio) / len(audio)
    audio = [sample - mean for sample in audio]
    scale = target_peak / max(abs(sample) for sample in audio)
    samples = [max(-32768, min(32767, round(sample * scale * 32767))) for sample in audio]
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(struct.pack(f"<{len(samples)}h", *samples))
    rms = math.sqrt(sum((sample / 32768) ** 2 for sample in samples) / len(samples))
    return len(audio) / RATE, rms


def engine_loop(kind: str) -> list[float]:
    # Integer harmonic frequencies and periodic modulation make the 2 s seam stable.
    parameters = {
        "motorcycle": (72, 4, .20, .06),
        "motorbike": (88, 5, .25, .07),
        "car4": (56, 4, .17, .05),
        "car7": (52, 5, .19, .055),
        "tricycle": (46, 3, .23, .065),
        "bus": (40, 6, .28, .07),
        "truck": (38, 6, .32, .08),
        "container": (34, 8, .35, .09),
    }
    base, cycles, harmonic_weight, grit = parameters[kind]
    rng = random.Random(3000 + base)
    audio = g.blank(2.0)
    low = 0.0
    alpha = 1 - math.exp(-2 * math.pi * (750 if base > 50 else 520) / RATE)
    for index in range(len(audio)):
        t = index / RATE
        pulse = 1 + .17 * math.sin(2 * math.pi * cycles * t)
        low += alpha * (rng.uniform(-1, 1) - low)
        audio[index] = pulse * (math.sin(2 * math.pi * base * t) * .35 +
                                math.sin(2 * math.pi * 2 * base * t) * harmonic_weight +
                                math.sin(2 * math.pi * 3 * base * t) * .07) + low * grit
    return audio


def ambience_loop(kind: str) -> list[float]:
    seconds = 4.0
    rng = random.Random({"rain_light": 7001, "rain_heavy": 7002,
                         "wind": 7003, "wet_road": 7004}[kind])
    audio = g.blank(seconds)
    low = 0.0
    cutoff = {"rain_light": 2400, "rain_heavy": 4000,
              "wind": 230, "wet_road": 1700}[kind]
    alpha = 1 - math.exp(-2 * math.pi * cutoff / RATE)
    for index in range(len(audio)):
        t = index / RATE
        raw = rng.uniform(-1, 1)
        low += alpha * (raw - low)
        slow = 1 + .20 * math.sin(2 * math.pi * .5 * t)
        if kind == "rain_light":
            audio[index] = low * .18 * slow
        elif kind == "rain_heavy":
            audio[index] = low * .28 * slow
        elif kind == "wind":
            audio[index] = low * .32 * slow + .035 * math.sin(2 * math.pi * 62 * t)
        else:
            audio[index] = low * .15 * slow
    if kind.startswith("rain"):
        for number in range(18 if kind == "rain_light" else 45):
            at = rng.uniform(0, seconds - .08)
            g.noise(audio, at, .065, .06, .018, 8000 + number, 1200)
    return audio


# Duration and target peak are audition-level guide values, not an in-game mix.
SPECS: dict[str, tuple[str, float, float, str]] = {
    "accelerate": ("vehicle", .68, .42, "Engine surge; pitch to follow speed in runtime"),
    "brake": ("vehicle", .62, .43, "Wet tire hiss and slowing tone"),
    "skid": ("vehicle", .82, .47, "Brief rubber slide, limit repetition"),
    "coast": ("vehicle", .74, .35, "Power dies into rolling air"),
    "stop": ("vehicle", .48, .37, "Soft final engine stop"),
    "driver_fall": ("vehicle", .62, .43, "Low body fall; voice separate"),
    "vehicle_break": ("vehicle", .92, .50, "Sputter and panel rattle"),
    "vehicle_switch": ("vehicle", .63, .40, "Two latches and motor restart"),
    "water_splash": ("road", .76, .46, "Wet crossing; visual splash remains primary"),
    "pothole": ("road", .48, .43, "Suspension thump and small rattle"),
    "wind_gust": ("road", 1.05, .38, "Lateral gust, low and not startling"),
    "cargo_release": ("road", .48, .44, "Latch then falling item"),
    "cargo_crate_roll": ("road", 1.22, .31, "Rolling wood knocks; loop only while moving"),
    "cargo_barrel_roll": ("road", 1.24, .35, "Rolling metal knocks; loop only while moving"),
    "cargo_crate_hit": ("road", .52, .47, "Woody impact"),
    "cargo_barrel_hit": ("road", .59, .50, "Metallic impact"),
    "train_approach": ("hazard", 1.65, .43, "Low approaching rumble and bell; visual warning required"),
    "train_pass": ("hazard", 1.83, .52, "Crossing train rumble and clacks"),
    "train_clear": ("hazard", .62, .34, "Last wheels fading away"),
    "police_warning": ("hazard", .84, .37, "Rounded two-note whistle, avoid shrill siren"),
    "militia_warning": ("hazard", .75, .33, "Soft wooden knock warning"),
    "police_capture": ("hazard", .78, .45, "Confiscation latch and falling tone"),
    "banana_use": ("hazard", .58, .39, "Comic slip response"),
    "jam": ("hazard", .70, .40, "Muted traffic cluster"),
    "accident": ("hazard", .98, .52, "Low wreck and rattles"),
    "broken_car": ("hazard", .87, .43, "Stalled car sputter"),
    "barrier_hit": ("hazard", .63, .48, "Barrier impact"),
    "vendor_near": ("hazard", .42, .28, "Small roadside cart rattle"),
    "vendor_hit": ("hazard", .79, .47, "Cart objects clatter; avoid comic injury accent"),
    "ambulance_pass": ("hazard", 1.42, .33, "Distant, gentle siren and road air"),
    "fuel_pickup": ("item", .69, .35, "Liquid gulp and small positive note"),
    "repair_pickup": ("item", .72, .36, "Tool ratchet and small positive note"),
    "nitro_activate": ("item", .79, .49, "Air surge and rising engine"),
    "jump": ("item", .58, .40, "Elastic lift after Space"),
    "landing": ("item", .56, .43, "Suspension landing"),
    "star_activate": ("item", .88, .38, "Warm shimmer; do not loop per frame"),
    "grab_call": ("item", .55, .34, "Phone-like confirmation; pickup separately"),
    "passenger_reboard": ("npc", .56, .31, "Foot and door for passenger returning"),
    "passenger_refuse": ("npc", .50, .27, "Low neutral cue, optional beside visual feedback"),
    "shop_open": ("ui", .56, .32, "Small door bell"),
    "shop_buy": ("ui", .50, .32, "Coin and confirmation"),
    "shop_upgrade": ("ui", .82, .38, "Tool and rising notes"),
    "shop_fuel": ("ui", .68, .36, "Refuel at shop"),
    "shop_repair": ("ui", .72, .40, "Repair at shop"),
    "shop_fail": ("ui", .43, .25, "Soft unavailable action"),
    "qte_warning": ("ui", .65, .35, "Three compact warning taps; graphic cue required"),
    "qte_confirm": ("ui", .47, .34, "Turn confirmed"),
    "qte_miss": ("ui", .47, .29, "Missed turn; avoid punishment sting"),
    "pause": ("ui", .34, .25, "Pause menu open"),
    "resume": ("ui", .34, .25, "Pause menu closed"),
    "restart": ("ui", .57, .30, "New run start"),
    "result_damage": ("result", .89, .39, "HP failure"),
    "result_fuel": ("result", .89, .34, "Out of fuel and coast"),
    "result_train": ("result", .87, .46, "Train collision terminal"),
    "result_police": ("result", .81, .38, "Police confiscation terminal"),
    "result_secret": ("result", 1.45, .42, "Secret success, short warm flourish"),
}


if __name__ == "__main__":
    manifest = []
    for key, (group, duration, peak, note) in SPECS.items():
        folder = ROOT / group
        folder.mkdir(parents=True, exist_ok=True)
        filename = f"{key}.wav"
        seconds, rms = g.save(f"{group}/{filename}", one_shot(key, duration), peak)
        manifest.append({"key": key, "bus": "sfx", "file": f"{group}/{filename}",
                         "duration_seconds": round(seconds, 3), "peak_target": peak,
                         "rms": round(rms, 4), "note": note})
    for kind in ("motorcycle", "motorbike", "car4", "car7", "tricycle", "bus", "truck", "container"):
        path = ROOT / "engine" / f"{kind}_loop.wav"
        seconds, rms = save_loop(path, engine_loop(kind), .34)
        manifest.append({"key": f"engine_{kind}", "bus": "sfx", "file": str(path.relative_to(ROOT)).replace("\\", "/"),
                         "duration_seconds": seconds, "peak_target": .34,
                         "rms": round(rms, 4), "note": "2 s looping engine bed; speed-dependent pitch/volume in runtime"})
    for kind in ("rain_light", "rain_heavy", "wind", "wet_road"):
        path = ROOT / "ambience" / f"{kind}_loop.wav"
        seconds, rms = save_loop(path, ambience_loop(kind), .28)
        manifest.append({"key": f"ambience_{kind}", "bus": "ambience", "file": str(path.relative_to(ROOT)).replace("\\", "/"),
                         "duration_seconds": seconds, "peak_target": .28,
                         "rms": round(rms, 4), "note": "4 s ambience bed; duck under warnings and voice"})
    (ROOT / "MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    first_drafts = [
        ("pickup", "01", "Driver pickup A"), ("pickup", "02", "Driver pickup B"),
        ("kick", "01", "Passenger ejection A"), ("kick", "02", "Passenger ejection B"),
        ("passenger_hit", "01", "Roadside passenger impact A"),
        ("passenger_hit", "02", "Roadside passenger impact B"),
        ("traffic_hit", "01", "Traffic vehicle impact A"),
        ("traffic_hit", "02", "Traffic vehicle impact B"),
    ]
    review_rows = ([{"key": title, "bus": "first drafts", "file": f"{key}_{variant}.wav",
                     "note": "Earlier A/B audition; kept for comparison"}
                    for key, variant, title in first_drafts] + manifest)
    groups: dict[str, list[str]] = {}
    for row in review_rows:
        label = row["file"].split("/", 1)[0] if "/" in row["file"] else "first drafts"
        file_name = html.escape(row["file"], quote=True)
        groups.setdefault(label, []).append(
            f'<article><div><b>{html.escape(row["key"])}</b><small>{html.escape(row["note"])}</small></div>'
            f'<audio controls preload="none" src="{file_name}"></audio></article>')
    sections = "\n".join(f"<section><h2>{html.escape(group.title())}</h2>{''.join(rows)}</section>"
                         for group, rows in groups.items())
    page = ("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            "<title>Homecoming SFX auditions</title>"
            "<style>body{font:16px system-ui;background:#171d20;color:#eff1ec;margin:0 auto;padding:24px;max-width:900px}"
            "h1{margin-bottom:4px}p{color:#b8c6c3}section{margin:28px 0}h2{border-bottom:1px solid #44504d;padding-bottom:7px}"
            "article{display:flex;gap:20px;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #34403d}"
            "small{display:block;color:#a8b9b5;margin-top:3px}audio{width:280px;max-width:100%}"
            "@media(max-width:650px){article{display:block}audio{margin-top:8px;width:100%}}</style>"
            "<h1>Homecoming SFX auditions</h1><p>76 gameplay WAV drafts. Listen at moderate volume; no voice or music."
            " Nothing here is approved or integrated into the game. "
            "<a href=\"ui-modern/LISTEN_UI.html\" style=\"color:#aee0cf\">Open the modern UI sound pack (62 takes)</a>.</p>"
            + sections + "</html>\n")
    (ROOT / "LISTEN.html").write_text(page, encoding="utf-8")
    print(f"Generated {len(manifest)} files across {len(SPECS)} one-shots, 8 engine loops, 4 ambience loops")
    print(f"Longest one-shot: {max(x['duration_seconds'] for x in manifest if not x['file'].endswith('_loop.wav')):.2f}s")
