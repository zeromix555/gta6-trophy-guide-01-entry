# Vice City Platinum — GTA 6 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/zeromix555/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/zeromix555/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze — 0 online), built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Checklist tracker** — every trophy with its official name, description and grade as PlayStation publishes them. Tick one off and it stays ticked (saved in `localStorage`).
- **Guides in our own words** — each trophy has a guide that says what to do, where and how, and when it can be missed, with its sources named and linked beside it (PowerPyx, Exophase, GTA Zone, Sixshore, Leonida Intel, EGamers). A few cryptic trophies whose exact trigger launch-era guides had not yet pinned down say so honestly instead of inventing a method.
- **Roadmap to the platinum** — three stages in the order the game wants them: story (60–80 h), the 100% Completion checklist (~100 h), then Strangers & Freaks and cleanup (~10 h). About 200 hours total; difficulty 4/10 (PowerPyx).
- **Missables** — exactly one trophy is flagged as potentially missable: **Positive Mental Attitude** (the first meditation spot can be missed in Chapter 1). Everything else is safe in free-roam after the story.
- **Next-up planner** — your next 15 steps in roadmap order, missable first, earned trophies dropping out automatically.
- **Filters & search** — by kind (story, missable, collectibles, activities, online), by grade, by text, plus hide-earned.
- **Spoiler setting** — hides the names and descriptions of story trophies until they are earned.
- **Notes & keys** — a notes field on every trophy for your own locations, loadouts and routes.
- **Export / import** — progress, notes and settings as one JSON file, so you can back up or move browsers.
- **Dark + light themes**, and a print stylesheet for a paper checklist.
- **Fully offline** — static files under `app/` only; no network request at runtime, no Rockstar logo, artwork or game screenshots.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Any static server works — `app/` is the root, `app/index.html` is the page. No build step, no dependencies.

## How it is built

- `app/index.html` — the page: header with progress, tabs, checklist + detail pane.
- `app/style.css` — light/dark themes and layout.
- `app/app.js` — rendering, filters, search, tabs, spoiler setting, deep links (`#view=roadmap`, `#trophy=<id>`, `#spoiler=on`).
- `app/progress.js` — saved state: earned trophies, notes, settings; export/import.
- `app/roadmap.js` — the three roadmap stages and the Next-up ordering.
- `app/data/trophies.json` — the official 55-trophy list with each trophy's guide, sources, kind, missable flag, count and roadmap stage.
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the kit's `vendor/makefun-frontend.ts` (Node 22, standard library only).

Verify the hand-in locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

Official names, descriptions and grades as PlayStation publishes them, via [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and PSNProfiles (agreeing on all 55). Difficulty, time and missable estimates from [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/). All guide text is written for this entry; sources are cited, never copied.

## License

MIT — see [LICENSE](LICENSE).
