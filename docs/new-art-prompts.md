# Game art generation prompts

Generation date: 2026-09-08

Generation method: built-in imagegen; one call per sheet; no retries or edits.

## Pip character atlas

```text
Use case: stylized-concept.
Asset type: production sprite atlas for a kid-friendly mobile 2D space platform game.
Create ONE new PNG image with a genuinely transparent background (real alpha, no painted checkerboard). Landscape 1536 x 1024 preferred. Exactly FOUR equal columns and TWO equal rows, eight isolated sprite cells, row-major order. Each cell has generous clear transparent padding, no visible grid. Character centered at the same scale in each cell; show the whole character and every limb. No adjacent-cell overlaps.
Subject: Pip, a cute orange fox astronaut. Small rounded body, big adorable fox ears, cream muzzle and tail tip, friendly eyes, cream padded space suit with dark navy gloves and boots, teal details and small cream jetpack. A clear bubble visor allows the fox face and orange ears to remain plainly readable. Consistent identity, proportions, outfit, head size, and right-facing orientation across frames. A charming handmade toy look with polished painterly 2D rendering, soft dimensional shading, subtly textured cream fabric, bold clean silhouettes, pale teal/lavender/cream/coral palette. Designed to be readable at small phone-screen size.
Eight frames, exactly this row-major order:
Top row, first cell: idle standing, facing right.
Top row, second cell: run pose A facing right, right foot forward and left foot back, opposite arm swing.
Top row, third cell: run pose B facing right, left foot forward and right foot back, visibly different opposite stride and arm swing.
Top row, fourth cell: airborne upward jump, facing right, knees tucked, arms bent.
Bottom row, first cell: falling, facing right, arms out for balance, legs down.
Bottom row, second cell: jetpack boost flying toward right, leaning forward, visible soft teal flame behind and below the jetpack, whole flame confined to this cell.
Bottom row, third cell: crouch facing right, knees deeply bent and body lower; preserve the character's size.
Bottom row, fourth cell: arms-up happy celebration facing right, both arms raised.
Keep all eight bodies anchored consistently within their cells and avoid random size changes. No text, numbers, captions, frames, grid lines, backgrounds, ground planes, extra characters or detached props. No cast shadows or glow crossing cell boundaries. Actual transparent alpha outside each character. This is a sprite sheet, not a finished game screen.
```

## Bop character atlas

```text
Use case: stylized-concept.
Asset type: production sprite atlas for a kid-friendly mobile 2D space platform game.
Create ONE new PNG image with a genuinely transparent background (real alpha, no painted checkerboard). Landscape 1536 x 1024 preferred. Exactly FOUR equal columns and TWO equal rows, eight isolated sprite cells in row-major order. Each cell has generous clear transparent padding, no visible grid. Character centered at the same scale in each cell; show the whole character and every limb. No adjacent-cell overlaps.
Subject: Bop, a mint green round little robot astronaut. Cute compact rounded toy body, oversized softly rounded head with navy glass face panel, expressive friendly pale cyan eyes and little smile, short jointed arms and legs, cream padded astronaut details, dark navy gloves and boots, pale teal highlights, tiny coral accents and a small cream jetpack. Friendly and huggable, consistent identity, proportions, face-panel and head size, outfit, and right-facing orientation in every frame. Whimsical polished painterly 2D toy space art, soft dimensional shading, subtly textured surfaces, bold readable silhouettes, pale teal/lavender/cream/coral palette, very clear small-screen readability.
Eight frames, exactly this row-major order:
Top row, first cell: idle standing, facing right.
Top row, second cell: run pose A facing right, right foot forward and left foot back, opposite arm swing.
Top row, third cell: run pose B facing right, left foot forward and right foot back, visibly different opposite stride and arm swing.
Top row, fourth cell: airborne upward jump facing right, knees tucked, arms bent.
Bottom row, first cell: falling facing right, arms out for balance, legs down.
Bottom row, second cell: jetpack boost flying toward right, leaning forward, visible soft teal flame behind and below the jetpack, whole flame confined to this cell.
Bottom row, third cell: crouch facing right, knees deeply bent and body lower; preserve the character's size.
Bottom row, fourth cell: arms-up happy celebration facing right, both arms raised and joyful eyes.
Keep all eight bodies anchored consistently within their cells and avoid random size changes. No text, numbers, captions, frames, grid lines, backgrounds, ground planes, extra characters or detached props. No cast shadows or glow crossing cell boundaries. Actual transparent alpha outside each character. This is a sprite sheet, not a finished game screen.
```

## Adventure objects atlas

```text
Use case: stylized-concept.
Asset type: production object, creature, island and sticker atlas for a kid-friendly mobile 2D space platform game.
Create ONE new SQUARE PNG with a genuinely transparent background (real alpha, no painted checkerboard), 2048 x 2048 preferred. Exactly FOUR equal columns and FOUR equal rows: sixteen individual cells in precise row-major order. Keep every full asset centered and contained in its own equal square cell, with generous clear transparent margins and no overlaps. Invisible grid only; absolutely no rendered grid, captions or numbers.
Shared style: whimsical rounded polished painterly 2D toy space art with soft dimensional shading, subtle pleasant texture, bold readable silhouettes, pale teal/lavender/cream/coral colors and warm gold accents, friendly cute shapes legible at small phone-screen size. All assets look like the same game art family. Creatures face right. Repeat-pose creatures retain identical design.
Exact sixteen cells:
Row 1 column 1: cute coral crablike ground crawler in idle stance, rounded coral shell, short legs, cheerful gentle eyes, no menace.
Row 1 column 2: the same coral crawler in a visibly distinct walking step, facing right.
Row 1 column 3: cute lilac beanlike hopper squatting low, little friendly face and tucked legs.
Row 1 column 4: the same lilac hopper jumping tall, elongated upward body and extended little legs.
Row 2 column 1: little turquoise round winged swooper calm, round body and soft tiny wings, friendly face.
Row 2 column 2: the same turquoise swooper with wings swept back during a fast horizontal dash to the right.
Row 2 column 3: smiling gold victory star sticker, rounded five-point star and tiny joyful face.
Row 2 column 4: glowing friendly teal-and-lavender circular portal sticker, rounded cream rim, inviting soft swirling center and contained halo.
Row 3 column 1: tiny lush mint garden floating island, clear flat grassy mint top with a few soft plants, tapered floating rock underside.
Row 3 column 2: pale cyan floating lift and ruins island, clear flat pale cyan platform top, small ancient rounded ruin details and luminous lift motif.
Row 3 column 3: purple crumbling rock floating island, clear flat top, a few cracked segments and contained little loose stones.
Row 3 column 4: warm coral and gold solar jetpad floating island, flat gold circular launch pad with coral rim and contained soft downward glow.
Row 4 column 1: silvery lavender moon floating island, clear cratered flat top and tapered lunar rock underside.
Row 4 column 2: teal and gold final beacon floating island with a tall glowing spire; show full spire and full island without cropping.
Row 4 column 3: sleepy crescent moon cuddled by a soft little sleep cloud sticker, eyes closed, cute calm face.
Row 4 column 4: plump soft cloud with a tiny sticking plaster bandage sticker, gentle hopeful retry expression.
The six floating islands are self-contained distinct miniature game-world thumbnails, three-quarter side view showing an obvious landing surface and hanging underside, equal visual weight. They must remain separately readable and recognizable.
No words, letters, numerals, logos, grid lines, borders, cell backgrounds, scene backdrops, cast shadows, extra assets or decorative clutter. No shadows or glow extending to another cell. Transparent alpha outside each asset.
```

