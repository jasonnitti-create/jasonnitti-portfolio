# PATTERNS.md — read this first, every session

This file exists so a fresh Claude session doesn't have to re-derive Jason's
voice, structure, and workflow rules from scratch. Read it before touching
`data/projects.json` or any case study copy.

## What this site is

Static HTML/CSS/JS, no build step, no framework. Everything editable lives
in `data/projects.json`. See [README.md](README.md) for the file map.

## Voice — non-negotiable

- **First person, always.** "I composed," "I designed," never "we" — Jason
  is the author of every case, even ones with agency partners. If a draft
  has "we," fix it before showing it.
- **Declarative, terse, editorial.** Short sentences. No adjective stacking
  ("innovative,” "cutting-edge," "seamless" — banned). Let the work carry
  the weight.
- **Lead with the tension or the constraint, not the client name.** Good:
  "They wanted their swoosh. The answer was already in the name." Bad:
  "SoftShox is a helmet company that needed a new logo."
  Good: "This isn't a book about finding your muse." Bad: "This book
  explores creativity through an innovative lens."
- **End beats on a turn, not a summary.** The last line of a caption should
  land an idea, not recap the image.

## Case study structure (data/projects.json)

Every project object:
```json
{
  "slug": "kebab-case-unique",
  "title": "Display Title",
  "summary": "1-4 short paragraphs, separated by \n\n. First-person. Sets
    up the tension/brief, then the resolution or approach.",
  "categories": ["campaign" | "brand" | "music" | "influencer" | "nobrief"],
  "details": [ {"label": "Client", "text": "..."}, ... ],
  "cover": "assets/img/xxx.jpg",
  "links": [ {"label": "...", "url": "..."} ],   // optional, e.g. buy links
  "items": [ { "title": "...", "caption": "...", "type": "image"|"video"|"embed",
               "src": "...", "poster": "..." (video/embed only) } ]
}
```

- `details` fields are freeform label/text pairs — Client, Type, Output,
  Industry, Agency, Role, Talent, Awards, Framework, Typography — use
  whichever apply, skip the rest. Don't force all of them.
- **Categories can combine.** Music + Influencer + Campaign is normal for a
  branded-entertainment/celebrity piece. `nobrief` = personal/self-initiated
  work (the book, Stereo Melon, Time Hopper). `brand` = identity/logo work.
- **Beat count is not fixed.** One-keyframe cases (Converse, Time Hopper)
  get no arrows/thumbs/counter automatically — that's a UI rule in
  `js/project.js`, not something to work around. Multi-beat cases run
  4-6 typically; go as long as the story earns.
- **A keyframe with no title/caption renders full-width** (no empty side
  panel) — this is intentional for embeds/frames that don't need commentary
  (see Stereo Melon's YouTube beats). Don't force copy onto every beat.
- **Keyframe selection matters.** Prefer a frame with the subject's likeness,
  the client's branding, or the concept visibly at work over a generic
  b-roll frame or a title card with nothing happening. When picking a video
  poster, scan several seconds of frames (`ffmpeg` contact sheet), don't
  grab frame zero.

## Content vs. structural requests — keep them separate

- **Content**: new case study, copy edits, category changes, reordering,
  captions. Point the session at 2-3 existing cases as style reference
  before drafting (e.g. "match the voice in SoftShox and the book case").
- **Structural**: nav, CSS, carousel behavior, filter logic, theme system.
  Different risk profile — review the diff before it touches published
  pages.
- Don't mix the two in one request. If asked to "add a case and also
  change the nav," split it into two turns.

## Adding new work

Use the `/add-case-study` skill — it interviews Jason for client/category/
agency/keyframes and handles media processing (resize, video encode, poster
extraction) to spec below. Don't hand-write a case without it unless Jason
explicitly wants a fast/manual pass.

## Media specs

- Images: `sips -s format jpeg -s formatOptions 80-85 -Z 1600` → `assets/img/`
- Video: `ffmpeg -vf "scale='min(1280,iw)':-2" -c:v libx264 -crf 25 -preset medium -c:a aac -b:a 128k -movflags +faststart` → `assets/vid/`
  (masthead loop: same but `-an`, since it's muted/ambient)
- Poster frames: pull from a contact sheet, not frame 0 — see "Keyframe
  selection" above.
- Every file must stay under 100MB (GitHub hard limit). Total repo should
  stay well under 1GB.
- Raw/original uploads go in `wix-backup/incoming/<project>/` — never
  published (see .gitignore) — that's Jason's permanent archive.

## Before pushing

1. Regenerate/verify `data/projects.json` is valid JSON and every `src`/
   `poster`/`cover` path exists on disk.
2. Preview locally (`python3 -m http.server 8360` or the preview tool) and
   click through the new/changed case: cover loads, carousel steps
   correctly, captions render, no console errors.
3. Show Jason a screenshot or the rendered page before committing — he
   reviews before push, not after.

## The push rule (live since launch)

The site is published — `main` on GitHub is Jason's durable archive of the
whole project (code + content), not just a deploy trigger. Once he approves
a change:

- **Commit and push it the same turn.** Don't leave finished work sitting
  only on his laptop "for later" — that's the one way this archive rule
  breaks.
- Say **"committed and pushed"** explicitly when done, not just "saved" or
  "done" — that phrase is the signal the change actually landed on GitHub,
  not only in the local working copy.
- If a change is genuinely half-done or experimental and shouldn't go live
  yet, say so plainly before starting, and confirm with Jason before
  pushing anything mid-stream.
- Quick sanity check anytime: `git status --short` (should be empty) and
  `git log --oneline -1` vs. `git log --oneline -1 origin/main` (should
  match). If they don't, something didn't get pushed — fix that first.
