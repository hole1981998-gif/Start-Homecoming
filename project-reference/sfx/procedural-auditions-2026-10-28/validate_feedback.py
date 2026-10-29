"""Guard the audible tail of obstacle impacts used in the game."""

import math
import struct
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parent
checks = {
    'interaction-v2/collision_light.wav': (.65, .015),
    'interaction-v2/collision_medium.wav': (.95, .020),
    'interaction-v2/collision_heavy.wav': (1.45, .020),
    'road/pothole_rattle_light.wav': (.55, .010),
    'road/pothole_rattle_heavy.wav': (.85, .015),
}
for name, (at, minimum_rms) in checks.items():
    with wave.open(str(ROOT / name), 'rb') as wav:
        assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 44100), name
        assert wav.getnframes() > (at + .1) * 44100, name
        wav.setpos(round(at * 44100))
        window = struct.unpack('<4410h', wav.readframes(4410))
    rms = math.sqrt(sum(value * value for value in window) / len(window)) / 32768
    assert rms >= minimum_rms, (name, at, rms)
    print(f'{name}: RMS at {at:.2f}s = {rms:.3f}')
