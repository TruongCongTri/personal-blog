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
| `extraScraps` | papers added to the standard set, e.g. a newspaper clipping pinned beside a paragraph (`place.on: "paper"`, `place.near`) |
| `object` | the film's object on the standard desk: a real photo `{ "src", "ratio", "w", "title", "alt", "credit", "url" }`, or a drawn one (`dogtags` · `press` · `rifle` · `deed`) |
| `takeaways` | short points from the essay, each put on the desk as a torn-off paper: `[{ "title", "label", "text" }]` (optional, up to three in the standard set) |
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

Headings mark the essay's parts: `"level": 2` (the default) for a main part, `"level": 3` for a
point within it. They are listed in the progress card on the right as "#" links that jump to
them, with a check for each part read and a bar filling up for the current one. The opening
paragraphs before the first heading are listed as "Introduction".

The first paragraph gets the drop cap. Each image is a photo clipped onto the page. `ratio` is
width ÷ height, so the page keeps the space while the image loads. Use `"clip": false` for no clip.

### Loose papers (`scraps`)

Each review picks its own papers, because no two films leave the same things on the desk. List
them in the order they should appear on phones.

| type | fields (besides `place`) | held by default with |
|---|---|---|
| `note` | `text`, `label`, `paper` (`sticky` · `lined` · `grid` · `kraft` · `index`), `color` | paperclip over the top |
| `stamp` | `label`, `text` (default: the verdict) | — |
| `trailer` | (uses the review's `trailer`) | bulldog clip |
| `photo` | `src` (an image next to the review, or `yt:maxres1`…`yt:maxres3` for a trailer frame), `caption`, `source`, `alt`, `ratio`. Opens large on click | masking tape |
| `torn` | `title`, `label`, `text`, `color`, `edge` (`bottom` · `top` · `both`): a piece of coloured paper torn off a sheet | — |
| `ticket` | (film title and year, a seat) | paperclip across the side |
| `strip` | `frames`: up to 3 images (default: frames from the trailer) | clip over a corner |
| `sticker` | `text`, `sub`, `shape` (`round` · `label` · `badge`), `color`, `ink`, `icon` (`reel` · `clapper`) | — |
| `clipping` | `title`, `text`, `source`: a newspaper cutting | paperclip over the top |
| `object` | `kind`: `dogtags` · `press` · `rifle` · `deed`, an object from the film, drawn | — |
| `ruler` | — | — |

**`place`** is where a paper lies on wide screens:

| key | meaning |
|---|---|
| `x` | % from the left of the folder |
| `y` | rem below the bottom of the sheet; negative values overlap the sheet |
| `r` | rotation, in degrees |
| `w` | width, in rem |
| `s` | size, as a scale: `0.8` smaller, `1.2` bigger |
| `on` | `"paper"` to lay it on the sheet itself; `y` is then % down page 1 (0 = top, 100 = bottom) |
| `mobile` | `false` hides the paper on phones |

**`clip`** overrides how a paper is held. Use `false` for no clip, or an object:

| key | values |
|---|---|
| `kind` | `paper` (paperclip) · `binder` (bulldog clip) · `tape` (masking tape) · `pin` (push pin) |
| `at` | `top` · `right` · `bottom` · `left` · `corner` · `corner-right` |
| `offset` | position along that edge, e.g. `"70%"` or `"2rem"` |
| `tilt` | degrees |
| `tone` | `silver` · `brass` · `red` · `blue` · `black` |

`scripts/review.template.json` shows every kind of paper.

**Stills open large:** clicking a photo or a film-strip frame grows it out of the desk into a
large view with a caption card (title and `source`); closing shrinks it back.

**Without a `scraps` list,** a review gets the standard set, varied for that film from its slug:
the note's paper, how each thing is held, sizes, sticker colours and small shifts in position.
The same film always gets the same desk. On wide screens papers overlap; some lie on the sheet, the rest on
the desk. They can be dragged off the folder; dropped too far away, they spring back to rest just
beside it. The one touched last comes
to the top of the pile.

## Images

- JPG or WebP, about 2000px on the long side, under 5MB. The site resizes them for each screen,
  so phones download small files.
- To replace an image, give it a new name. R2 serves images with a week-long cache.
- Absolute URLs (`https://…`) work too, but files next to the review are easier to keep together.

## Environment variables

See `.env.example`. `R2_*` gives access to the bucket. `NEXT_PUBLIC_R2_PUBLIC_URL` is its public
address; use a custom domain in production, because `r2.dev` is rate-limited. `REVALIDATE_SECRET`
lets a push refresh the live site.

## Soundtracks

Music for a folder is set in `lib/discography.ts`, not in the review files. Each movie lists its
tracks and the review it belongs to (`postSlug`). Opening that folder plays its tracks in order
and loops them; elsewhere the site is quiet. Each film resumes where it stopped, down to the
second, and that is remembered across visits.

Upload the files to the bucket under `movies/<id>/`. They should be AAC `.m4a` at 128–160 kbps,
next to a `poster.webp`, which is used for the lock-screen / Dynamic Island artwork.

The music keeps playing in the background: other tabs, other apps, and a locked screen, on
desktop, Android and iOS. The lock screen / notification / Dynamic Island shows play, pause,
skip and a scrubber.

**For a fast start**, export new tracks as *faststart* m4a, so the index sits at the front of the
file and playback can begin after the first few kilobytes. The current files already are:

```bash
ffmpeg -i input.wav -c:a aac -b:a 144k -movflags +faststart track.m4a
```

**Copyright:** the songs belong to their rights holders. The Terms of Use (`/legal/terms`, the
"Music" section) say so, list every song automatically from `lib/discography.ts`, and promise
removal on request. To take a song down:

1. Remove the track (or the whole entry) from `lib/discography.ts` and deploy.
2. Delete its `.m4a` from the bucket (`movies/<id>/`) in the Cloudflare dashboard, so the file
   can't be reached directly either.

## Object photos

Each folder's object is a real photograph, cut out of its background (a transparent `object.webp`
next to the review). Use only photos you may reuse, such as public domain, CC0 or Creative Commons
images from Wikimedia Commons, and fill in `credit` and `url`. The credit appears in the large
view and in the Terms of Use ("Photographs of objects"). For CC BY-SA images, note
"(background removed)": the cut-out counts as an adaptation and is shared under the same licence.
