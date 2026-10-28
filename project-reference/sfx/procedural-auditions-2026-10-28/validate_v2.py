"""Check the exported V2 audition WAVs without third-party packages."""

import json
import math
import struct
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parent
manifest = json.loads((ROOT / "V2_MANIFEST.json").read_text(encoding="utf-8"))


def samples(name):
    with wave.open(str(ROOT / name), "rb") as wav:
        assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 44100), name
        count = wav.getnframes()
        data = struct.unpack(f"<{count}h", wav.readframes(count))
    assert count > 0 and max(abs(x) for x in data) < 32767, name
    return data


assert len(manifest["engine"]) == 32
assert len(manifest["interactions"]) == 24
classes = {"short": 0, "medium": 0, "long": 0}
worst_loop_jump = 0
for row in manifest["engine"]:
    audio = samples(row["file"])
    if row["state"] == "ramp_preview":
        assert len(audio) == 441000, row["file"]
        # No abrupt edit on the six transition boundaries in the render.
        for t in (1, 3, 4, 5.5, 6.5, 8, 9.5):
            i = int(t * 44100)
            assert abs(audio[i] - audio[i - 1]) < 3500, (row["file"], t)
    else:
        assert len(audio) == 88200, row["file"]
        seam = abs(audio[0] - audio[-1])
        worst_loop_jump = max(worst_loop_jump, seam)
        assert seam < 1500, (row["file"], seam)

for row in manifest["interactions"]:
    audio = samples(row["file"])
    category = row["length_class"]
    classes[category] += 1
    duration = len(audio) / 44100
    assert abs(duration - row["duration_seconds"]) < .002, row["file"]
    assert ((category == "short" and duration < 1) or
            (category == "medium" and 1 <= duration < 2) or
            (category == "long" and duration >= 2)), row["file"]
    # Long cues need actual body/tail beyond their first second.
    if category == "long":
        body = audio[44100:min(len(audio), 88200)]
        rms = math.sqrt(sum(x * x for x in body) / len(body)) / 32768
        assert rms > .005, (row["file"], rms)

assert all(classes.values()), classes
print(f"V2 OK: 24 engine loops, 8 ramp previews, 24 interactions {classes}; worst loop seam {worst_loop_jump}/32768")
