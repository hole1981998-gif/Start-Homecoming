"""Generate game SFX with ElevenLabs. Reads a local ignored .env; never logs the key.

Run: python generate.py [asset_name ...]
Existing files are kept, so a partial run can be resumed safely.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
API = "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128"
MODEL = "eleven_text_to_sound_v2"
PROMPTS = {
    "water_roll_loop": (5.0, True, "Continuous close tire spray as a motorcycle rolls through a shallow puddle on wet asphalt, soft irregular splashes, no engine, no voices, no music."),
    "water_entry_splash": (1.2, False, "A motorcycle tire enters a shallow puddle on asphalt, brief close splash and gritty water spray, no engine, no voices."),
    "pothole_light": (1.3, False, "Motorcycle tire drops into a pothole and rebounds, dull rubber thump followed by loose suspension and frame rattle, close dry recording."),
    "pothole_heavy": (1.7, False, "Heavy road truck crosses a pothole, deep tire thump and rough chassis rattle, a few irregular metallic knocks, close dry recording."),
    "collision_light": (1.5, False, "Two small motorcycles collide at low speed, short plastic crack and metal scrape, small loose pieces settling, close dry recording."),
    "collision_medium": (1.8, False, "Two road cars collide, sharp sheet-metal crunch and glass rattle followed by a short scrape, close dry recording."),
    "collision_heavy": (2.4, False, "Heavy truck hits a road car, deep body impact and tearing sheet metal followed by rolling debris, close dry recording."),
    "barrier_hit": (1.6, False, "Moving car strikes a roadside metal barrier, hard steel clang and scraping vibration fading quickly, close dry recording."),
    "cargo_crate_hit": (1.3, False, "Car hits a wooden cargo crate on wet asphalt, hollow wood splinter crack and pieces bouncing, close dry recording."),
    "cargo_barrel_hit": (1.6, False, "Vehicle strikes a loose metal barrel on asphalt, hollow metallic bang then irregular rolling clatter, close dry recording."),
    "vendor_cart_hit": (1.8, False, "Motorcycle clips a small street vendor pushcart, wooden frame crack and loose metal utensils clattering, close dry recording, no voices."),
    "ambulance_hit": (1.8, False, "Road car collides with an ambulance, close sheet-metal crunch and brief glass rattle, no siren, no voices, no music."),
    "train_hit": (2.5, False, "Road vehicle collides with the side of a passing train, very heavy metal impact and short debris rattle, close dry recording, no horn."),
    "pedestrian_hit": (1.0, False, "Motorcycle bumps a pedestrian at low speed, brief cloth rustle, soft body thud and shoe scuff, no voice, no scream, no gore."),
}


def api_key() -> str:
    env = ROOT / ".env"
    for line in env.read_text(encoding="utf-8-sig").splitlines():
        if line.startswith("ELEVENLABS_API_KEY="):
            key = line.partition("=")[2].strip().strip('"\'')
            if key.startswith("sk_"):
                return key
    raise RuntimeError(".env needs an ELEVENLABS_API_KEY starting with sk_")


def generate(name: str, key: str) -> None:
    destination = HERE / f"{name}.mp3"
    if destination.exists():
        print(f"skip {name}: already exists")
        return
    seconds, loop, prompt = PROMPTS[name]
    body = json.dumps({"text": prompt, "model_id": MODEL, "duration_seconds": seconds,
                       "prompt_influence": .55, "loop": loop}).encode("utf-8")
    request = urllib.request.Request(API, data=body, headers={
        "xi-api-key": key, "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            data = response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace").replace(key, "[redacted]")
        raise RuntimeError(f"{name}: HTTP {error.code}: {detail[:400]}") from None
    if len(data) < 1024 or not (data.startswith(b"ID3") or data[0] == 0xff):
        raise RuntimeError(f"{name}: response was not a valid MP3 payload")
    destination.write_bytes(data)
    print(f"generated {name}: {len(data)} bytes")


if __name__ == "__main__":
    names = sys.argv[1:] or list(PROMPTS)
    unknown = set(names) - PROMPTS.keys()
    if unknown:
        raise SystemExit(f"Unknown asset names: {', '.join(sorted(unknown))}")
    key = api_key()
    for name in names:
        generate(name, key)
