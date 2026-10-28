"""Generate deterministic, short procedural SFX auditions for Homecoming.

Uses only Python's standard library. These WAVs are reference takes, not game assets.
"""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path


RATE = 44100
OUT = Path(__file__).resolve().parent


def blank(seconds: float) -> list[float]:
    return [0.0] * round(seconds * RATE)


def envelope(t: float, duration: float, attack: float, decay: float) -> float:
    if t < 0 or t >= duration:
        return 0.0
    return min(1.0, t / attack) * math.exp(-t / decay)


def tone(
    audio: list[float], start: float, duration: float, f0: float, f1: float,
    amplitude: float, decay: float, partials: tuple[tuple[float, float], ...] = ((1.0, 1.0),),
) -> None:
    begin = round(start * RATE)
    phase = 0.0
    for i in range(min(round(duration * RATE), len(audio) - begin)):
        t = i / RATE
        frequency = f0 + (f1 - f0) * (t / duration)
        phase += 2 * math.pi * frequency / RATE
        harmonic = sum(weight * math.sin(phase * multiple) for multiple, weight in partials)
        audio[begin + i] += amplitude * envelope(t, duration, .004, decay) * harmonic


def noise(
    audio: list[float], start: float, duration: float, amplitude: float,
    decay: float, seed: int, cutoff: float, highpass: bool = False,
) -> None:
    rng = random.Random(seed)
    begin = round(start * RATE)
    alpha = 1 - math.exp(-2 * math.pi * cutoff / RATE)
    low = 0.0
    for i in range(min(round(duration * RATE), len(audio) - begin)):
        t = i / RATE
        raw = rng.uniform(-1, 1)
        low += alpha * (raw - low)
        filtered = raw - low if highpass else low
        audio[begin + i] += amplitude * envelope(t, duration, .003, decay) * filtered


def whoosh(audio: list[float], start: float, duration: float, seed: int, amount: float) -> None:
    rng = random.Random(seed)
    low = 0.0
    begin = round(start * RATE)
    for i in range(min(round(duration * RATE), len(audio) - begin)):
        t = i / RATE
        position = t / duration
        swell = math.sin(math.pi * position) ** 1.5
        cutoff = 350 + 3300 * position
        alpha = 1 - math.exp(-2 * math.pi * cutoff / RATE)
        low += alpha * (rng.uniform(-1, 1) - low)
        audio[begin + i] += amount * swell * low


def thump(audio: list[float], start: float, size: float, seed: int) -> None:
    tone(audio, start, .23, 118 * size, 48 * size, .7, .072)
    noise(audio, start, .14, .38, .028, seed, 440)


def pickup(variant: int) -> list[float]:
    audio = blank(.70)
    seed = 100 + variant
    # Small door/latch click, followed by a warm, playful two-note response.
    noise(audio, .012, .055, .37, .013, seed, 2500, highpass=True)
    tone(audio, .02, .13, 245, 180, .18, .05)
    notes = (392, 523) if variant == 1 else (440, 587)
    for offset, pitch in zip((.13, .31), notes):
        tone(audio, offset, .30, pitch, pitch * .996, .27, .12,
             ((1.0, 1.0), (2.0, .22), (3.02, .1)))
    if variant == 2:
        noise(audio, .27, .035, .18, .01, seed + 20, 1800, highpass=True)
    return audio


def kick(variant: int) -> list[float]:
    audio = blank(.78)
    seed = 200 + variant
    # Springy release and moving air; a distant soft landing, leaving room for a scream.
    tone(audio, .01, .27, 510 if variant == 1 else 620, 165, .43, .11,
         ((1.0, 1.0), (2.01, .17)))
    noise(audio, .012, .065, .27, .018, seed, 2100, highpass=True)
    whoosh(audio, .07, .39 if variant == 1 else .46, seed + 12, .39)
    thump(audio, .56 if variant == 1 else .60, .7, seed + 22)
    return audio


def passenger_hit(variant: int) -> list[float]:
    audio = blank(.57)
    seed = 300 + variant
    # Muted cloth and shoe scuff. Avoid a violent, explosive impact.
    thump(audio, .015, .78 if variant == 1 else .68, seed)
    noise(audio, .05, .29, .35, .095, seed + 11, 1250)
    whoosh(audio, .09, .30, seed + 12, .10)
    if variant == 2:
        noise(audio, .30, .12, .20, .042, seed + 20, 900)
    return audio


def traffic_hit(variant: int) -> list[float]:
    audio = blank(.88)
    seed = 400 + variant
    # Rubber scrape, broad metal crunch and a few loose panel rattles.
    thump(audio, .018, 1.2 if variant == 1 else 1.06, seed)
    noise(audio, .025, .28, .62, .074, seed + 1, 3100)
    noise(audio, .13, .43, .27, .16, seed + 2, 1900, highpass=True)
    for offset, pitch in ((.08, 377), (.17, 611), (.27, 845)):
        tone(audio, offset, .33, pitch * (1.0 if variant == 1 else .86),
             pitch * (1.0 if variant == 1 else .86) * .98, .12, .095,
             ((1.0, 1.0), (2.36, .2)))
    whoosh(audio, .28, .43, seed + 3, .13)
    return audio


def save(name: str, audio: list[float], peak_target: float) -> tuple[float, float]:
    # Remove DC and fade file boundaries to avoid clicks on playback.
    mean = sum(audio) / len(audio)
    for i in range(len(audio)):
        fade = min(1.0, i / (RATE * .004), (len(audio) - 1 - i) / (RATE * .012))
        audio[i] = (audio[i] - mean) * max(0.0, fade)
    peak = max(abs(sample) for sample in audio)
    scale = peak_target / peak
    samples = [max(-32768, min(32767, round(sample * scale * 32767))) for sample in audio]
    with wave.open(str(OUT / name), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(struct.pack(f"<{len(samples)}h", *samples))
    rms = math.sqrt(sum((sample / 32768) ** 2 for sample in samples) / len(samples))
    return len(audio) / RATE, rms


if __name__ == "__main__":
    for label, factory, target in (
        ("pickup", pickup, .40),
        ("kick", kick, .48),
        ("passenger_hit", passenger_hit, .42),
        ("traffic_hit", traffic_hit, .58),
    ):
        for variant in (1, 2):
            name = f"{label}_{variant:02}.wav"
            duration, rms = save(name, factory(variant), target)
            print(f"{name}: {duration:.2f}s, peak={target:.2f}, RMS={rms:.3f}")
