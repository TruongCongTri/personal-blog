# Writing and publishing reviews

Every review is a folder, and every folder is a set of plain files:

```
content/
  folders.json                    directors (the drawer's folders) and the order of their reviews
  reviews/
    civil-war-2024/
      review.json                 text in both languages, the body, the loose papers
      still.jpg                   any images the review uses, right next to it
      basement.jpg
```

The same layout is mirrored in Cloudflare R2, under `film-files/` in the bucket. The site reads
from R2 and caches it. You write and preview locally, then push.

## Workflow

```bash
npm run content:new -- dune-2021 denis-villeneuve   # 1. start a review from the template
#   edit content/reviews/dune-2021/review.json, drop images into that folder
npm run dev                                         # 2. preview (reload twice after an edit)
npm run content:check                               # 3. catch mistakes before publishing
npm run content:push                                # 4. upload what changed + refresh the live site
```

- `content:push -- --dry-run` shows what would be uploaded, without uploading.
- `content:push -- --prune` also deletes files from R2 that you deleted locally.
- `content:pull` downloads R2 into `content/`, e.g. on a new computer. Files you have edited
  locally are kept unless you add `--force`.

**Preview:** the site reads local files when `CONTENT_SOURCE=local`. It also falls back to them
while R2 is still empty. Images are then served from `content/` at `/media/...`.

**Live site:** once `folders.json` is in R2, the site reads R2. It refreshes hourly, or straight
away after a push when `REVALIDATE_SECRET` and `NEXT_PUBLIC_SITE_URL` are set in both places
(`.env.local` and the host).

**Filing a review before it's written:** only `slug`, `folder`, `title`, `year`, `color` and
`date` are required. Fill in `quote`, `verdict`, `excerpt`, `minutes` and `body` when the
analysis is done.

## Text in two languages

Any text field can be one string, used in both languages, or one string per language:

```json
"title": "Civil War",
"genre": { "en": "War", "vi": "Chiến tranh" }
```

## review.json

| field | what it is |
|---|---|
| `slug`, `folder` | the folder name, and the director's `slug` from folders.json (`content:new` fills both) |
| `tab` | short name on the folder tab (defaults to `title`) |
| `title`, `year` | the film |
| `color`, `theme` | the folder colour (`"#D71E1E"`); `"dark"` if the colour is light and needs black text |
| `date` | publish date (`"2026-09-14"`) |
| `genre` | the film's genre |
| `topic` | what the analysis is about, e.g. "War journalism" (optional, shown in the file info) |
| `quote`, `quoteBy` | the saying under test, and who said it (optional) |
| `verdict` | `agrees` · `against` · `between` (optional; shows "Pending" until set) |
| `excerpt` | the answer in one sentence (optional; used for the note on the folder) |
| `minutes` | reading time (optional) |
| `trailer` | YouTube video id, the part after `watch?v=` (optional) |
| `still` | image for the clipped print at the top of the sheet (optional; otherwise a colour plate) |
| `body` | the text, as a list of blocks (below). Leave it out or `[]` and the sheet says "The analysis is coming out soon" |
| `scraps` | the loose papers on the folder (below; optional, otherwise the standard set) |
| `desk` | height of the desk under the sheet on wide screens, in rem (default 34) |

### Body blocks

```json
"body": [
  { "type": "p", "text": { "en": "…", "vi": "…" } },
  { "type": "h", "text": { "en": "Upstairs, downstairs", "vi": "Trên lầu, dưới hầm" } },
  { "type": "quote", "text": { "en": "…", "vi": "…" }, "by": "Ki-taek" },
  { "type": "image", "src": "basement.jpg", "ratio": 1.5, "caption": { "en": "…", "vi": "…" },
    "clip": { "at": "corner-right", "tone": "brass" } }
]
```

The first paragraph gets the drop cap. Each image is a photo clipped onto the page. `ratio` is
width ÷ height, so the page keeps the space while the image loads. Use `"clip": false` for no clip.

### Loose papers (`scraps`)

Each review picks its own papers, because no two films leave the same things on the desk. List
them in the order they should appear on phones.

| type | fields (besides `place`) | held by default with |
|---|---|---|
| `note` | `text`, `label`, `color` (paper colour) | paperclip over the top |
| `stamp` | `label`, `text` (default: the verdict) | — |
| `trailer` | (uses the review's `trailer`) | bulldog clip |
| `photo` | `src`, `caption`, `alt`, `ratio` | paperclip over a corner |
| `ticket` | (film title and year, a seat) | paperclip across the side |
| `strip` | `frames`: up to 3 images (default: frames from the trailer) | clip over a corner |
| `sticker` | `text`, `sub`, `shape` (`round` · `label` · `badge`), `color`, `ink`, `icon` (`reel` · `clapper`) | — |
| `clipping` | `title`, `text`, `source`: a newspaper cutting | paperclip over the top |
| `ruler` | — | — |

**`place`** is where a paper lies on wide screens:

| key | meaning |
|---|---|
| `x` | % from the left of the folder |
| `y` | rem below the bottom of the sheet; negative values overlap the sheet |
| `r` | rotation, in degrees |
| `w` | width, in rem |
| `mobile` | `false` hides the paper on phones |

**`clip`** overrides how a paper is held. Use `false` for no clip, or an object:

| key | values |
|---|---|
| `kind` | `paper` · `binder` |
| `at` | `top` · `right` · `bottom` · `left` · `corner` · `corner-right` |
| `offset` | position along that edge, e.g. `"70%"` or `"2rem"` |
| `tilt` | degrees |
| `tone` | `silver` · `brass` · `red` · `blue` · `black` |

`scripts/review.template.json` shows every kind of paper.

## Images

- JPG or WebP, about 2000px on the long side, under 5MB. The site resizes them for each screen,
  so phones download small files.
- To replace an image, give it a new name. R2 serves images with a week-long cache.
- Absolute URLs (`https://…`) work too, but files next to the review are easier to keep together.

## Environment variables

See `.env.example`. `R2_*` gives access to the bucket. `NEXT_PUBLIC_R2_PUBLIC_URL` is its public
address; use a custom domain in production, because `r2.dev` is rate-limited. `REVALIDATE_SECRET`
lets a push refresh the live site.
