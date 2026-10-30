"""Generate game SFX with ElevenLabs. Reads a local ignored .env; never logs the key.

Run: python generate.py [asset_name ...]
Existing files are kept, so a partial run can be resumed safely.
"""

from __future__ import annotations

import json
import os
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
    "water_entry_skim": (1.0, False, "A motorcycle tire slaps a shallow road puddle, crisp sharp splash and fast droplets hitting asphalt, close recording, no engine or voices."),
    "water_entry_wash": (1.4, False, "Car tires cut into a broad road puddle, sharp front splash followed by a fuller rolling spray, close recording, no engine or voices."),
    "water_entry_heavy": (1.7, False, "Heavy truck tires push through standing road water, deep forceful splash and thick uneven spray, close recording, no engine or voices."),
    "water_roll_shallow_loop": (5.0, True, "Light tire hiss over a shallow wet road puddle, fine irregular droplets and gentle ripples, close recording, no engine or voices."),
    "water_roll_deep_loop": (5.0, True, "Heavy tires rolling through standing road water, dense low rushing wash with uneven little splashes, close recording, no engine or voices."),
    "water_exit_spray": (1.1, False, "Wet vehicle tires leave a road puddle, brief tapering spray and scattered droplets on asphalt, close recording, no engine or voices."),
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
    "rain_road_loop": (7.0, True, "Steady light rain falling on a wet asphalt road, soft varied droplets, no thunder, traffic, voices or music."),
    "wind_road_loop": (7.0, True, "Steady roadside wind passing low shrubs and an open road, gentle uneven air rush, no whistles, voices or music."),
    "wet_tire_loop": (7.0, True, "Soft continuous tire hiss on damp asphalt beneath a moving vehicle, gently irregular texture, no engine, splashes, voices or music."),
    "engine_bike_texture_loop": (6.0, True, "Steady low motorcycle engine intake and mechanical vibration at constant RPM, no rev sweep, tires, horn, voices or music."),
    "engine_car_texture_loop": (6.0, True, "Steady compact car engine intake and mechanical vibration at constant RPM, no rev sweep, tires, horn, voices or music."),
    "engine_heavy_texture_loop": (6.0, True, "Steady heavy diesel truck engine intake and mechanical vibration at constant RPM, no rev sweep, tires, horn, voices or music."),
    "vehicle_coast": (1.4, False, "Road vehicle engine winds down into a quiet rolling tire hiss, close recording, no horn, voices or music."),
    "vehicle_stop": (1.0, False, "Wet road tires slow to a stop with a short rubber scuff and soft suspension settle, no horn, voices or music."),
    "driver_fall": (1.2, False, "Comic low-speed rider tumble onto wet asphalt, cloth rustle and soft body thump, no pain, voices or music."),
    "vehicle_switch": (0.9, False, "Car door closes with a neat latch and a brief solid cabin thump, close recording, no engine, voices or music."),
    "cargo_release": (1.0, False, "Loose cargo drops from a moving truck bed, metal latch snap and heavy object landing on asphalt, no engine or voices."),
    "cargo_barrel_roll": (3.0, False, "Hollow metal barrel rolls and wobbles over wet asphalt with irregular small clanks, close recording, no engine or voices."),
    "cargo_crate_roll": (3.0, False, "Wooden crate tumbles and skids over wet asphalt with uneven dry knocks, close recording, no engine or voices."),
    "ambulance_pass": (2.0, False, "Emergency road vehicle passes close on wet asphalt, quick tire rush and low body whoosh, no siren, voices or music."),
    "wind_gust": (1.6, False, "A sudden broad crosswind gust pushes past a moving road vehicle, strong airy rush fading naturally, no whistle or voices."),
    "police_capture": (1.2, False, "Police roadside stop, short metal handcuff click and firm paper stamp, stylized and playful, no siren or voices."),
    "banana_use": (0.8, False, "Cartoon banana peel slips onto wet asphalt with a soft slippery plop and tiny squeak, no voices or music."),
    "broken_car": (1.6, False, "Small car engine sputters twice and stalls, loose mechanical rattle fading out, no horn, voices or music."),
    "fuel_pickup": (0.8, False, "Fuel can picked up from asphalt, light metal handle clink and liquid slosh, neat cheerful game sound, no voices or music."),
    "repair_pickup": (0.8, False, "Small repair kit picked up, crisp metal tool click with a warm short chime, cheerful game sound, no voices or music."),
    "nitro_activate": (1.3, False, "Vehicle nitro boost activates with a tight pressure release and rising intake rush, brief powerful tail, no engine rev, voices or music."),
    "jump_launch": (0.8, False, "Punchy close motorcycle jump takeoff, loud suspension snap and quick rubber thump, no voices or music."),
    "jump_land": (1.1, False, "Vehicle lands on wet asphalt, firm rubber tire thump followed by a brief chassis settle, no crash, voices or music."),
    "star_activate": (0.9, False, "Protective game power activates, one warm glassy shimmer with a gentle bright tail, no melody, voices or music."),
    "grab_call": (0.7, False, "One short friendly phone call notification, rounded digital ping with a small soft echo, no melody or voices."),
    "passenger_pickup": (0.8, False, "Passenger climbs into a small road vehicle, quick door latch and seat fabric rustle, playful but natural, no voices."),
    "passenger_drop": (1.0, False, "Comic passenger ejection from a moving vehicle, springy seat pop and soft distant landing, no scream or voices."),
    "result_failure": (1.3, False, "Game run ends unsuccessfully, one low rounded mechanical pulse and soft falling tail, gentle not punitive, no melody or voices."),
    "result_fuel": (1.4, False, "Car engine runs out of fuel, clearly audible sputtering and low mechanical shudder fading to silence, close recording, no voices or music."),
    "result_train": (1.6, False, "Train collision ends a game run, heavy low metal resonance with a brief falling tail, no horn, voices or music."),
    "result_police": (1.4, False, "Police stop ends a game run, one firm paper stamp and subdued metal click with a short tail, no siren, voices or music."),
    "result_success": (1.5, False, "Game journey completed, a warm short rising glass-and-wood flourish with a satisfying final note, no speech or music bed."),
}


def api_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if key.startswith("sk_"):
        return key
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
