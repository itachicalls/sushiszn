# Sushi Szn

It's sushi season! A kawaii arcade game — swipe with chopsticks to catch flying sushi, build combos, trigger FEVER TIME, and dodge the angry wasabi.

Built with Vite + TypeScript + Phaser 3. Fully responsive: plays fullscreen on desktop and mobile.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Project layout

- `src/game/scenes/` — Boot, Title, Play, Result
- `src/game/entities/` — sushi pieces, chopsticks avatar
- `src/game/systems/` — spawner, score, combo, fever, procedural audio
- `src/game/config/` — balance tuning, sushi roster, responsive layout helpers
- `public/assets/` — kawaii sprite art (generated, chroma-keyed via `scripts/chromakey.mjs`)

## Token

CA `0x98d94d8e9711abc3975878efcb1c1b2ff8e244bc` · built on sushiswap
