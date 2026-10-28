"""Deterministic gameplay revisions: sustained water, suspension and vehicle impacts.

Run with Python 3 from any directory. Uses only the standard library and the
existing procedural helpers; no downloaded sound or API is involved.
"""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

import generate as g
import generate_full as full


ROOT = Path(__file__).resolve().parent
RATE = g.RATE


def save(relative: str, samples: list[float]) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max(abs(value) for value in samples)
    if peak > .82:
        samples = [value * .82 / peak for value in samples]
    data = [max(-32768, min(32767, round(value * 32767))) for value in samples]
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(struct.pack(f'<{len(data)}h', *data))


def water_loop() -> list[float]:
    """A 2.4 s continuous tyre spray bed with a zero-crossing wrap."""
    count = round(2.4 * RATE)
    rng = random.Random(55243)
    low = mid = 0.0
    texture: list[float] = []
    alpha_low = 1 - math.exp(-2 * math.pi * 115 / RATE)
    alpha_mid = 1 - math.exp(-2 * math.pi * 2100 / RATE)
    for index in range(count):
        raw = rng.uniform(-1, 1)
        low += alpha_low * (raw - low)
        mid += alpha_mid * (raw - mid)
        t = index / RATE
        swell = .78 + .13 * math.sin(2 * math.pi * t / 2.4) + .07 * math.sin(2 * math.pi * 3 * t / 2.4)
        texture.append((.29 * mid + .10 * low) * swell)
    # The last 120 ms blends into the identical first 120 ms on the next cycle.
    fade = round(.12 * RATE)
    for index in range(fade):
        pos = count - fade + index
        blend = (index + 1) / fade
        texture[pos] = texture[pos] * (1 - blend) + texture[index] * blend
    seam = texture[-1] - texture[0]
    for index in range(256):
        texture[index] += seam * (1 - index / 256)
    return texture


def rattle(light: bool) -> list[float]:
    audio = g.blank(.85 if light else 1.15)
    seed = 5501 if light else 5502
    # Tyre/suspension bump followed by irregular short chassis knocks.
    g.tone(audio, .005, .20, 86 if light else 67, 43 if light else 32,
           .26 if light else .37, .055 if light else .073)
    g.noise(audio, .004, .16, .28 if light else .39, .035, seed, 560)
    knocks = ((.13, .18), (.23, .13), (.36, .11), (.49, .08)) if light else (
        (.13, .24), (.22, .19), (.35, .17), (.49, .12), (.68, .09), (.83, .06))
    for number, (at, strength) in enumerate(knocks):
        g.noise(audio, at, .075, strength, .017, seed + number + 1, 1250, True)
        full.pluck(audio, at, (155 if light else 115) * (1 + .035 * (number % 3)), strength * .36, .095)
    return audio


def collision(weight: str) -> list[float]:
    config = {
        'light': (1.05, 125, 73, .30, .36, 4),
        'medium': (1.43, 91, 47, .45, .48, 6),
        'heavy': (1.92, 63, 31, .58, .58, 9),
    }
    duration, high, low, body, crunch, clacks = config[weight]
    audio = g.blank(duration)
    seed = {'light': 88101, 'medium': 88102, 'heavy': 88103}[weight]
    # Short broadband crush and low body hit; no warning-like pitch or notes.
    g.tone(audio, .006, .27 if weight != 'heavy' else .39, high, low, body, .075 if weight != 'heavy' else .12)
    g.noise(audio, .008, .29 if weight == 'light' else .43, crunch, .075, seed, 1900)
    g.noise(audio, .018, .18, crunch * .65, .040, seed + 1, 850, True)
    for index in range(clacks):
        at = .11 + index * (.11 if weight == 'light' else .13)
        strength = (.20 if weight == 'light' else .27 if weight == 'medium' else .32) * (.76 ** index)
        g.noise(audio, at, .07, strength, .016, seed + 10 + index, 1800, True)
        full.pluck(audio, at, (205 if weight == 'light' else 142 if weight == 'medium' else 100) *
                   (1 + .045 * (index % 3)), strength * .35, .11, weight == 'heavy')
    if weight == 'heavy':
        g.noise(audio, .42, .92, .22, .35, seed + 50, 720)
    return audio


if __name__ == '__main__':
    save('road/water_roll_loop.wav', water_loop())
    save('road/pothole_rattle_light.wav', rattle(True))
    save('road/pothole_rattle_heavy.wav', rattle(False))
    for kind in ('light', 'medium', 'heavy'):
        save(f'interaction-v2/collision_{kind}.wav', collision(kind))
