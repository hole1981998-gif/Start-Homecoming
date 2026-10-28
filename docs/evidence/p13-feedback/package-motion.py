from pathlib import Path
from PIL import Image
import json
import sys

root = Path(__file__).parent
name = sys.argv[1]
folder = root / (name + '-motion')
paths = sorted(folder.glob('*.png'))
times = json.loads((folder / 'times.json').read_text())
frames = [Image.open(p).convert('RGB') for p in paths]
assert len(frames) == len(times)
assert len({frame.size for frame in frames}) == 1
durations = [max(10, times[i + 1] - times[i]) for i in range(len(times) - 1)]
durations.append(durations[-1])
frames[0].save(root / (name + '.webp'), save_all=True, append_images=frames[1:], duration=durations, loop=0, quality=82)
data = dict(frames=len(frames), size=frames[0].size, durationMs=sum(durations),
            note='Actual variable-interval browser screenshots, no resizing; not native video or 60 FPS.')
(root / (name + '-recording.json')).write_text(json.dumps(data, indent=2))
print(json.dumps(data))
