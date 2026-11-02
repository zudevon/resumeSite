# DeVon Rasch — Résumé Arcade

A Pokémon-Blue-inspired résumé: a small top-down town where every building is a chapter of the résumé. Built with vanilla JavaScript and Canvas; no frameworks, no build step, no dependencies.

## Play

- **Arrow keys / WASD** — walk
- **Enter / Space / Z** — interact
- **Esc / X** — back
- **M** — toggle sound

Walk into a building's door to enter. Inside, talk to the guide or read the PC / bookshelf to open that section. **Standard Résumé** is always available in the top bar.

## Local preview

```bash
python3 -m http.server 8765
# open http://localhost:8765
```

Opening `index.html` directly also works, because the site uses classic scripts rather than ES modules.

## Content

All résumé copy lives in `js/data.js`. That is the single source of truth for the game panels, the standard résumé view, and the printable version. Updating content there updates every view.

- `world.buildings` maps each building to a résumé section and door tile.
- `collegiate.projects`, `collegiate.coursework`, and `collegiate.activities` are ready for more content.
- `ai.work` and `ai.stack` drive the Lab.

## Deploy

This repo is served by GitHub Pages from the `master` branch root.

- New arcade: `https://zudevon.github.io/resumeSite/`
- Archived original site: `https://zudevon.github.io/resumeSite/classic/`

Push to `master` and Pages rebuilds automatically. No Actions, no build step.

`pre-arcade` is a git tag pointing at the original site before the arcade migration.

## Structure

```
index.html          game shell
css/style.css       palette, console shell, panels, print styles
js/data.js          résumé content (single source of truth)
js/art.js           original pixel art, drawn procedurally
js/engine.js        maps, movement, collision, camera
js/ui.js            dialogue, panels, standard résumé, sound, routing
js/main.js          boot + wiring
classic/            archived original résumé site
```

## Notes

- Original pixel art only. No Nintendo sprites, logos, or assets.
- This is a personal homage and is not affiliated with Nintendo.
- Phone number intentionally omitted; use email, LinkedIn, or GitHub.
