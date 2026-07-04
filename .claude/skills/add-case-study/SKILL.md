---
name: add-case-study
description: Guided flow to add a new case study to Jason's portfolio site. Use when Jason wants to add new work/a new project/case study to the site. Interviews him for details (client, category, agency, keyframe captions), processes his media files, and updates data/projects.json.
---

# Add a case study

You are adding one project to the portfolio. All content lives in `data/projects.json`;
media lives in `assets/img` and `assets/vid`. Follow this flow, asking Jason for
information step by step (use AskUserQuestion for the multiple-choice steps). Jason is
not a developer — never make him edit files or run commands himself.

## Step 1 — Interview

Collect, in a conversational way (a couple of questions at a time, not a wall of form fields):

1. **Title** of the project.
2. **Summary** — 1–3 sentence case description (shown under the title and used for search).
3. **Details** — ask for each, all optional except Client:
   - Client, Type (e.g. "Social, Influencer Campaign"), Output, Industry, Agency, Awards.
4. **Categories** — one or more of (multiSelect):
   - `campaign` (Marketing / Campaign), `brand` (Design / Brand), `music` (Music),
     `influencer` (Influencer), `nobrief` (No Brief).
5. **Placement** — top of the index, bottom, or after a specific project.

Derive the `slug` from the title (lowercase, hyphens, no punctuation). Confirm it with Jason.

## Step 2 — Media / keyframes

Ask Jason to drag his media files into the chat, or to drop them in a folder and tell you
where. Accepted: images (jpg/png), videos (mp4/mov), or YouTube links (public videos only —
verify with `curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>"`).

For EACH keyframe ask:
- Its **order** in the story,
- An optional short **keyframe title** (e.g. "A Partnership Born"),
- The **caption** — the story text shown next to it.

Also ask which keyframe (or which separate image) is the **cover** for the index grid.

## Step 3 — Process media

Work from the project root (`/Users/jason.nitti/Desktop/Claude Nitti Site`). Keep original
uploads in `wix-backup/incoming/<slug>/` (create it) so there is always a pristine copy.

- **Images** → `sips -s format jpeg -s formatOptions 80 -Z 1600 <src> --out assets/img/<slug>-<nn>.jpg`
- **Videos** → `/opt/homebrew/bin/ffmpeg -y -i <src> -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 25 -preset medium -c:a aac -b:a 128k -movflags +faststart assets/vid/<slug>-<nn>.mp4`
  - Poster frame: `/opt/homebrew/bin/ffmpeg -y -ss 1 -i assets/vid/<slug>-<nn>.mp4 -frames:v 1 assets/vid/<slug>-<nn>.jpg`
  - Every file MUST end up under 100 MB (GitHub hard limit). If bigger, raise crf to 28.
- **YouTube** → no download; item is `{"type":"embed","src":"https://www.youtube-nocookie.com/embed/<ID>","poster":"https://i.ytimg.com/vi/<ID>/hqdefault.jpg"}`

## Step 4 — Update data/projects.json

Insert into the `projects` array at the agreed position, matching this schema exactly:

```json
{
  "slug": "example-project",
  "title": "Example Project",
  "summary": "One to three sentences about the work.",
  "categories": ["campaign"],
  "details": [
    {"label": "Client", "text": "…"},
    {"label": "Type", "text": "…"},
    {"label": "Output", "text": "…"},
    {"label": "Industry", "text": "…"},
    {"label": "Agency", "text": "…"},
    {"label": "Awards", "text": "…"}
  ],
  "cover": "assets/img/example-project-01.jpg",
  "items": [
    {"title": "Keyframe title", "caption": "Story text for this keyframe…",
     "type": "image", "src": "assets/img/example-project-01.jpg", "w": 1600, "h": 900},
    {"title": "", "caption": "…",
     "type": "video", "src": "assets/vid/example-project-02.mp4", "poster": "assets/vid/example-project-02.jpg"}
  ]
}
```

Validate the JSON afterwards (`python3 -c "import json; json.load(open('data/projects.json'))"`)
and check every referenced file exists.

## Step 5 — Verify and ship

1. Start the preview (`.claude/launch.json`, server name `site`) and check: the card appears
   on the index with its cover, the filter counts updated, the carousel steps through every
   keyframe with the right captions, videos play.
2. Show Jason a screenshot and get his sign-off.
3. Offer to commit and (if the GitHub remote is set up) push — pushing publishes the live site.
