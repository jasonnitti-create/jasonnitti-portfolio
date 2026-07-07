# Jason Nitti — Portfolio

Hand-built static portfolio. No frameworks, no build step, no subscription.
Hosted free on GitHub Pages.

## How it works

```
index.html          the filterable portfolio index (masthead video + grid)
project.html        one template that renders any case study (?p=<slug>)
about.html          bio page
data/projects.json  ALL content lives here — titles, captions, categories
css/style.css       all styling (colors/fonts at the top in :root)
js/main.js          index page logic (filter, search, grid)
js/project.js       case-study page logic (story carousel)
assets/img/         optimized images
assets/vid/         optimized videos + poster frames
assets/masthead.mp4 the looping homepage video
stimulation/        standalone book microsite → jasonnitti.com/stimulation
ghostwriterinthemachine/  standalone essay-series microsite (scroller)
                    → jasonnitti.com/ghostwriterinthemachine
wix-backup/         RAW originals downloaded from Wix — kept local,
                    NOT published (see .gitignore). This is your archive.
```

## Editing content

Everything editable is in `data/projects.json`. Each project looks like:

```json
{
  "slug": "converse",
  "title": "Converse",
  "summary": "Four years shaping stories…",
  "categories": ["campaign"],
  "details": [{ "label": "Client", "text": "Converse" }],
  "cover": "assets/img/….jpg",
  "items": [
    { "type": "video", "src": "assets/vid/….mp4", "poster": "assets/vid/….jpg",
      "title": "Keyframe title", "caption": "The story for this keyframe…" }
  ]
}
```

- **Reorder projects** — reorder them in the `projects` array.
- **Change a category** — valid keys: `campaign`, `brand`, `music`, `nobrief`.
  A project can have several.
- **Edit a caption** — change the item's `caption` text.
- **Hide a project** — delete its block (or move it to the bottom).

## Previewing locally

From this folder, run:

```
python3 -m http.server 8360
```

then open http://localhost:8360 in a browser.

## Publishing (GitHub Pages)

Pushing to the `main` branch of the GitHub repo publishes the site
automatically via GitHub Pages (Settings → Pages → Deploy from branch).
