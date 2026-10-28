"""Encode browser screenshots with measured wall-clock durations; requires Pillow.

This only packages captured evidence. It never renders, modifies or simulates the game.
Original PNG sequences remain local and are ignored by Git to avoid committing duplicates.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
records = []
for folder in sorted(root.glob('*-motion')):
    clock = folder / 'times.json'
    if not clock.exists():
        continue
    times = json.loads(clock.read_text(encoding='utf-8'))
    frames = [Image.open(folder / f'{i:03}.png').convert('RGB') for i in range(len(times))]
    durations = [max(10, times[i + 1] - times[i]) for i in range(len(times) - 1)] + [50]
    output = root / f'{folder.name.removesuffix("-motion")}-realtime.webp'
    frames[0].save(output, save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, quality=75, method=3)
    records.append({'file': output.name, 'frames': len(frames), 'size': frames[0].size,
                    'durationMs': sum(durations), 'startUtc': datetime.fromtimestamp(
                        times[0] / 1000, timezone.utc).isoformat(),
                    'note': 'Real browser captures at variable sample intervals; not native video or a 60-FPS capture.'})
(root / 'recordings.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Encoded {len(records)} recordings')
