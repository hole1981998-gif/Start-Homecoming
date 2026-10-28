"""Generate restrained, cheerful UI sound auditions for Homecoming.

Two takes per discrete UI event. Uses only the standard library and generate.py.
No voice, music, network call, or game runtime change.
"""

from __future__ import annotations

import html
import json
from pathlib import Path

import generate as g


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "ui-modern"

# group, length, gesture, notes (Hz), peak ceiling, use guidance
RECIPES: dict[str, tuple[str, float, str, tuple[int, ...], float, str]] = {
    "menu_open": ("menu", .37, "open", (330, 440), .26, "Panel opens"),
    "menu_close": ("menu", .30, "close", (440, 330), .24, "Panel closes"),
    "menu_move": ("menu", .18, "tick", (392,), .20, "Keyboard/gamepad focus moves; cooldown"),
    "menu_select": ("menu", .27, "confirm", (392, 523), .27, "A menu action is committed"),
    "menu_back": ("menu", .25, "back", (392, 294), .23, "Return to previous panel"),
    "menu_hover": ("menu", .13, "tick", (370,), .15, "Optional pointer hover; rate limit heavily"),
    "toggle_on": ("controls", .27, "confirm", (330, 440), .23, "Setting enabled"),
    "toggle_off": ("controls", .25, "back", (392, 294), .21, "Setting disabled"),
    "slider_step": ("controls", .14, "tick", (330,), .16, "Only at meaningful slider steps, not every pixel"),
    "help_open": ("controls", .35, "open", (294, 392), .24, "Help panel opens"),
    "card_open": ("controls", .40, "open", (330, 440), .25, "First-discovery card, only in safe window"),
    "card_dismiss": ("controls", .27, "close", (392, 330), .22, "Card dismissed"),
    "toast_positive": ("feedback", .42, "positive", (392, 523), .28, "Optional positive toast; cooldown/group duplicates"),
    "toast_negative": ("feedback", .40, "negative", (370, 294), .25, "Optional negative toast; do not punish the player"),
    "reward_small": ("feedback", .53, "reward", (392, 494, 587), .29, "Discrete reward, never per distance/score tick"),
    "reward_major": ("feedback", .76, "reward", (392, 494, 587, 784), .33, "Rare milestone or major reward only"),
    "resource_gain": ("feedback", .32, "positive", (330, 440), .23, "Discrete fuel/HP gain, no continuous spam"),
    "resource_loss": ("feedback", .31, "negative", (330, 262), .22, "Discrete consequence; visual number remains primary"),
    "shop_enter": ("shop", .39, "open", (330, 440), .26, "Shop panel opens; choose instead of old shop_open"),
    "shop_category": ("shop", .20, "tick", (370,), .19, "Shop category changes"),
    "purchase_success": ("shop", .52, "purchase", (440, 587), .29, "Successful purchase only"),
    "purchase_fail": ("shop", .35, "negative", (330, 262), .23, "Cannot buy; do not play success cue"),
    "shop_upgrade": ("shop", .65, "reward", (392, 494, 659), .30, "Upgrade purchased; choose instead of old shop_upgrade"),
    "shop_service": ("shop", .45, "confirm", (392, 523), .26, "Fuel or repair service completed"),
    "vehicle_purchase": ("shop", .69, "purchase", (392, 523, 659), .32, "Vehicle purchase completed"),
    "inventory_select": ("actions", .22, "tick", (392,), .19, "Inventory focus/slot selection"),
    "item_use": ("actions", .34, "confirm", (370, 494), .25, "Item activation confirmation; gameplay SFX separate"),
    "pause": ("actions", .26, "close", (392, 330), .21, "Pause transition"),
    "resume": ("actions", .27, "open", (330, 392), .22, "Resume transition"),
    "restart": ("actions", .49, "open", (330, 440, 523), .27, "New run starts"),
    "result_open": ("actions", .48, "close", (392, 330, 294), .24, "Results panel appears; terminal event cue separate"),
}


def tap(audio: list[float], at: float, pitch: float, weight: float,
        variant: int, glass: bool = False) -> None:
    # A soft tactile transient with a warm, short resonant body.
    overtones = ((1.0, 1.0), (2.01, .20), (2.83, .075)) if glass else ((1.0, 1.0), (1.99, .14))
    g.tone(audio, at, .16 if glass else .12, pitch, pitch * .994,
           weight, .052 if glass else .036, overtones)
    g.noise(audio, at, .025, weight * (.33 if variant == 1 else .25),
            .006, 9200 + round(at * 1000) + variant, 2500, True)


def air(audio: list[float], at: float, duration: float,
        amount: float, variant: int) -> None:
    # Very small filtered movement; just enough to make panel transitions tactile.
    g.whoosh(audio, at, duration, 8800 + variant + round(at * 1000), amount)


def render(key: str, variant: int) -> list[float]:
    _, duration, gesture, notes, _, _ = RECIPES[key]
    audio = g.blank(duration)
    pitch_shift = 1.0 if variant == 1 else .967
    timing_shift = 0 if variant == 1 else .012
    notes = tuple(note * pitch_shift for note in notes)
    if gesture == "tick":
        tap(audio, .018, notes[0], .27 if key != "menu_hover" else .19,
            variant, glass=variant == 2)
    elif gesture in ("open", "close", "back"):
        air(audio, .01, min(.25, duration - .04), .12 if gesture == "open" else .08, variant)
        spacing = .115 if variant == 1 else .095
        for index, pitch in enumerate(notes):
            tap(audio, .035 + index * spacing + timing_shift, pitch,
                .19 * (.91 ** index), variant, glass=gesture == "open")
    elif gesture == "confirm":
        tap(audio, .02, notes[0], .22, variant)
        tap(audio, .115 + timing_shift, notes[-1], .21, variant, glass=True)
    elif gesture == "positive":
        tap(audio, .035, notes[0], .20, variant, glass=True)
        tap(audio, .16 + timing_shift, notes[-1], .18, variant, glass=True)
        air(audio, .07, .20, .045, variant)
    elif gesture == "negative":
        tap(audio, .02, notes[0], .18, variant)
        tap(audio, .15 + timing_shift, notes[-1], .15, variant)
    elif gesture == "reward":
        for index, pitch in enumerate(notes):
            tap(audio, .025 + index * (.135 if variant == 1 else .125),
                pitch, .18 * (.92 ** index), variant, glass=True)
        air(audio, .12, min(.36, duration - .15), .055, variant)
    elif gesture == "purchase":
        tap(audio, .02, 275 * pitch_shift, .19, variant)
        for index, pitch in enumerate(notes):
            tap(audio, .12 + index * (.135 if variant == 1 else .12),
                pitch, .20 * (.90 ** index), variant, glass=True)
    else:
        raise ValueError(gesture)
    return audio


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for key, (group, duration, gesture, notes, peak, guidance) in RECIPES.items():
        for variant, suffix in ((1, "a"), (2, "b")):
            file_name = f"ui-modern/{key}_{suffix}.wav"
            seconds, rms = g.save(file_name, render(key, variant), peak)
            manifest.append({"key": key, "take": suffix, "group": group,
                             "file": f"{key}_{suffix}.wav", "bus": "ui",
                             "duration_seconds": round(seconds, 3),
                             "rms": round(rms, 4), "guidance": guidance})
    (OUT / "MANIFEST.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    groups: dict[str, list[str]] = {}
    for key, (group, _, _, _, _, guidance) in RECIPES.items():
        players = "".join(
            f'<label>Take {suffix.upper()}<audio controls preload="none" '
            f'src="{html.escape(key)}_{suffix}.wav"></audio></label>'
            for suffix in ("a", "b"))
        groups.setdefault(group, []).append(
            f'<article><div><strong>{html.escape(key.replace("_", " ").title())}</strong>'
            f'<small>{html.escape(guidance)}</small></div><div class="takes">{players}</div></article>')
    sections = "\n".join(
        f'<section><h2>{html.escape(group.title())}</h2>{"".join(rows)}</section>'
        for group, rows in groups.items())
    page = ("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
            "<title>Homecoming — UI sound auditions</title>"
            "<style>body{font:15px system-ui;background:#171e20;color:#eff2ee;margin:0 auto;padding:24px;max-width:1050px}"
            "h1{margin-bottom:4px}p,small{color:#aebeba}section{margin:30px 0}h2{border-bottom:1px solid #46524e;padding-bottom:8px}"
            "article{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:1px solid #33403c;padding:12px 0}"
            "small{display:block;margin-top:4px}.takes{display:flex;gap:12px}label{font-size:12px;color:#b7c4c0}"
            "audio{display:block;width:195px;margin-top:4px}@media(max-width:750px){article,.takes{display:block}audio{width:100%}label{display:block;margin-top:8px}}"
            "</style><h1>Homecoming UI sound auditions</h1>"
            "<p>62 short WAV drafts, two takes per action. Quiet, modern and upbeat. Listen at moderate volume."
            " Drafts only; no file is integrated into the game.</p>" + sections + "</html>\n")
    (OUT / "LISTEN_UI.html").write_text(page, encoding="utf-8")
    print(f"Generated {len(manifest)} UI WAVs for {len(RECIPES)} actions")
    print(f"Longest UI cue: {max(row['duration_seconds'] for row in manifest):.2f}s")
