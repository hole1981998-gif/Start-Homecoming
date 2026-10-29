from pathlib import Path
from PIL import Image, ImageChops
import json

root = Path(__file__).parent
times = json.loads((root / 'motion/times.json').read_text())
frames = [Image.open(p).convert('RGB') for p in sorted((root / 'motion').glob('*.png'))]
assert len(frames) == len(times)
assert len({frame.size for frame in frames}) == 1
durations = [max(10, times[i + 1] - times[i]) for i in range(len(times) - 1)]
durations.append(durations[-1])
frames[0].save(root / 'wreck-topple.webp', save_all=True, append_images=frames[1:], duration=durations, loop=0, quality=82)
equal = ImageChops.difference(Image.open(root / 'pause-a.png'), Image.open(root / 'pause-b.png')).getbbox() is None
data = dict(frames=len(frames), size=frames[0].size, durationMs=sum(durations), pausedFramesIdentical=equal,
            note='Real variable-interval browser screenshots, no resizing; not native video/60 FPS.')
(root / 'recording.json').write_text(json.dumps(data, indent=2))
print(json.dumps(data))
