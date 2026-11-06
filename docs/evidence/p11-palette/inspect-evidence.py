"""Read-only analysis of the supplied reference and actual browser captures."""
from pathlib import Path
from PIL import Image, ImageChops
import json

root = Path(__file__).parent
reference = Image.open(root / 'reference.jpg').convert('RGB')
quantized = reference.quantize(colors=12)
palette = quantized.getpalette()
colors = []
for count, index in sorted(quantized.getcolors(), reverse=True):
    rgb = palette[index * 3:index * 3 + 3]
    colors.append(dict(hex='#' + ''.join(f'{c:02x}' for c in rgb),
                       fraction=round(count / (reference.width * reference.height), 4)))
equal = ImageChops.difference(Image.open(root / 'pause-a.png').convert('RGB'),
                             Image.open(root / 'pause-b.png').convert('RGB')).getbbox() is None
result = dict(referenceSize=reference.size, quantizedReferenceColors=colors,
              captureSizes={name: Image.open(root / name).size for name in
                            ['water-before.png', 'water-after.png', 'city-final.png', 'powers-after.png']},
              pausedFramesIdentical=equal,
              note='Palette clusters describe the supplied image, not a perceptual match score. Screenshots are unmodified.')
(root / 'analysis.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
