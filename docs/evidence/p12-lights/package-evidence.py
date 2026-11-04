from pathlib import Path
from PIL import Image, ImageChops
import json
import shutil

root = Path(__file__).parent
paths = sorted((root / 'car4-final-motion').glob('*.png'))
times = json.loads((root / 'car4-final-motion/times.json').read_text())
frames = [Image.open(p).convert('RGB') for p in paths]
assert len(frames) == len(times)
assert len({frame.size for frame in frames}) == 1, 'Do not resize browser evidence'
durations = [max(10, times[i + 1] - times[i]) for i in range(len(times) - 1)]
durations.append(durations[-1])
frames[0].save(root / 'vehicle-lights.webp', save_all=True, append_images=frames[1:], duration=durations, loop=0, quality=82)
shutil.copyfile(paths[3], root / 'indicator-left-on.png')
equal = ImageChops.difference(Image.open(root / 'pause-a.png').convert('RGB'), Image.open(root / 'pause-b.png').convert('RGB')).getbbox() is None
data = dict(frames=len(frames), size=frames[0].size, durationMs=sum(durations), pausedFramesIdentical=equal,
            note='Real variable-interval browser screenshots; no resizing, not native video or 60-FPS capture.',
            finalBrakeCheck='Start, Q, hold S for 700 ms; subsequent HUD read 37.0 km/h; console error query empty.')
(root / 'recording.json').write_text(json.dumps(data, indent=2))
print(json.dumps(data))
