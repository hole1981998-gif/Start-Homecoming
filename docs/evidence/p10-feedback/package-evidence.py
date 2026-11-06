"""Package real screenshot samples at measured timing; no synthetic gameplay frames."""
from pathlib import Path
from PIL import Image, ImageChops
import json
import shutil

root = Path(__file__).parent
records = []
for name in ['bike-star-nitro', 'final-water', 'wind-final', 'car-final']:
    folder = root / f'{name}-motion'
    times = json.loads((folder / 'times.json').read_text())
    files = sorted(folder.glob('*.png'))
    frames = [Image.open(file).convert('RGB') for file in files]
    durations = [max(10, times[i + 1] - times[i]) for i in range(len(times) - 1)]
    durations.append(durations[-1])
    frames[0].save(root / f'{name}.webp', save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, quality=78, method=4)
    records.append(dict(file=f'{name}.webp', frames=len(frames), size=frames[0].size,
                        durationMs=sum(durations), startUnixMs=times[0],
                        note='Real variable-interval browser screenshots; not native video or 60-FPS capture.'))
shutil.copyfile(root / 'bike-star-nitro-motion/030.png', root / 'final-star-nitro.png')
shutil.copyfile(root / 'final-water-motion/095.png', root / 'final-water.png')
shutil.copyfile(root / 'wind-final-motion/130.png', root / 'final-wind.png')
pause_equal = ImageChops.difference(Image.open(root / 'pause-a.png').convert('RGB'),
                                  Image.open(root / 'pause-b.png').convert('RGB')).getbbox() is None
(root / 'recordings.json').write_text(json.dumps(dict(recordings=records, pausedFramesIdentical=pause_equal), indent=2))
print(json.dumps(dict(recordings=records, pausedFramesIdentical=pause_equal), indent=2))
