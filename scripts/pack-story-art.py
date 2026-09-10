"""Repack the preserved story artwork. Optional tooling: Python 3 + Pillow."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
manifest_path = ROOT / 'docs/story-art-provenance.json'
manifest = json.loads(manifest_path.read_text())
sprites_path = ROOT / 'public/assets/sprites.json'
sprites = json.loads(sprites_path.read_text())

for asset in manifest['assets']:
    name = Path(asset['name']).stem
    source = Image.open(ROOT / asset['path'])
    if name.endswith('-scenes'):
        output = source.convert('RGB')
        rects = [frame['crop'] for frame in asset['frames']]
        quality = 80
    else:
        output = Image.new('RGBA', (1024, 1536))
        rects = []
        surfaces = {}
        for frame in asset['frames']:
            x, y, w, h = frame.get('optionalTrimmedCrop', frame['crop'])
            crop = source.crop((x, y, x + w, y + h)).convert('RGBA')
            crop.thumbnail((244, 244), Image.Resampling.LANCZOS)
            i = frame['index']
            target_x = i % 4 * 256 + (256 - crop.width) // 2
            target_y = i // 4 * 256 + (256 - crop.height) // 2
            output.paste(crop, (target_x, target_y))
            rects.append([target_x, target_y, crop.width, crop.height])
            if 'landingSurface' in frame:
                left, top, right = frame['landingSurface']
                surfaces[i] = [round((left-x)*crop.width/w, 4), round((top-y)*crop.height/h, 4), round((right-x)*crop.width/w, 4)]
        if surfaces:
            sprites.setdefault('_surfaces', {})[name] = surfaces
        quality = 84
    destination = ROOT / f'public/assets/{name}.webp'
    output.save(destination, format='WEBP', quality=quality, method=6, exact=True)
    sprites[name] = rects
    sprites['_sizes'][name] = list(output.size)
    asset['optimized'] = {'path': f'public/assets/{name}.webp', 'size': list(output.size),
                          'quality': quality, 'bytes': destination.stat().st_size, 'frames': rects}
    print(f'{name}: {len(rects)} frames, {destination.stat().st_size / 1024:.0f} KiB')

sprites_path.write_text(json.dumps(sprites, indent=2) + '\n')
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
