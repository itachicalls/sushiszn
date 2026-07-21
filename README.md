# Sushi Szn

It's sushi season! A kawaii arcade game — swipe with chopsticks to catch flying sushi, build combos, trigger FEVER TIME, and dodge the angry wasabi.

Built with Vite + TypeScript + Phaser 3. Fully responsive: plays fullscreen on desktop and mobile.

## Features

- **40 levels across 4 seasons** — Sakura Spring, Beach Summer, Maple Autumn, Snowy Winter — each with its own background, hazards, and weather. Earn 2+ stars to unlock the next level.
- **Seasonal hazards** — angry wasabi, soy sauce spills, spicy chili rolls, and grumpy fugu.
- **Sushi shop** — spend coins earned in runs on chopstick reach, lucky golden fish, fever boosts, extra hearts, and hazard guards.
- **Sushi school** — kawaii sensei teaches you how to play.
- **Endless mode** — the classic 60-second score attack with grades.
- Pause anywhere; audio survives app switching on mobile.

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

- `src/game/scenes/` — Boot, Title, LevelSelect, HowTo, Shop, Play, Pause, Result
- `src/game/entities/` — sushi pieces, chopsticks avatar
- `src/game/systems/` — spawner, score, combo, fever, procedural audio
- `src/game/config/` — balance tuning, sushi roster, responsive layout helpers
- `public/assets/` — kawaii sprite art (generated, chroma-keyed via `scripts/chromakey.mjs`)

## Token

CA `0x98d94d8e9711abc3975878efcb1c1b2ff8e244bc` · built on sushiswap
