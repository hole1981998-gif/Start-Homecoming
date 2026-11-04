from pathlib import Path
from PIL import Image, ImageChops
import json
import shutil

root = Path(__file__).parent
times = json.loads((root / 'motion/times.json').read_text())[6:]
files = sorted((root / 'motion').glob('*.png'))[6:]
frames = [Image.open(path).convert('RGB') for path in files]
durations = [max(10, times[i + 1] - times[i]) for i in range(len(times) - 1)]
durations.append(durations[-1])
frames[0].save(root / 'water-reflection.webp', save_all=True, append_images=frames[1:],
               duration=durations, loop=0, quality=78, method=4)
shutil.copyfile(root / 'motion/130.png', root / 'water-reflection.png')
equal = ImageChops.difference(Image.open(root / 'pause-a.png').convert('RGB'),
                             Image.open(root / 'pause-b.png').convert('RGB')).getbbox() is None
metadata = dict(file='water-reflection.webp', frames=len(frames), size=frames[0].size,
                durationMs=sum(durations), startUnixMs=times[0], pausedFramesIdentical=equal,
                note='Real variable-interval browser screenshots, not native video or 60-FPS capture.')
(root / 'recording.json').write_text(json.dumps(metadata, indent=2))
print(json.dumps(metadata))
