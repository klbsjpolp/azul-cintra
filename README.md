# Azul: Stained Glass of Sintra (Web)

Digital prototype of **Azul: Stained Glass of Sintra** for 2 players (Human vs AI), built with React + TypeScript.

## Rules Implemented (Pattern Strips)

The strip/pattern logic follows the official Sintra rules model:

- Tile bag uses **5 colors** with **20 panes per color** (100 panes total).
- Each player board has **8 double-sided pattern strips**.
- Strips are randomized at setup; the strip with **2 joker spaces** starts with that side face down.
- The glazier can place only on strips **under or to the right** of its current position.
- When drafting, panes can be placed only into matching spaces on the chosen strip:
  - matching color spaces
  - joker spaces
- If a reachable strip can accept that color, the player must choose such a strip.
- Excess panes go to broken glass.
- Completing a strip:
  - move 1 pane to the palace window
  - discard the others to the tower
  - first completion flips the strip
  - second completion removes the strip

## Current Scope

Implemented:

- Turn flow (factories, center, drafting, reset action).
- Pattern-strip validation and joker handling.
- Strip flipping/removal progression.
- AI move generation over legal strip targets.
- Unit tests for strip rules and AI option generation.

Not fully implemented yet:

- Full official end-game scoring for all board-side variants.
- Full parity with every rulebook edge case and UI scoring summary.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Vitest

## Run

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm test
npm run build
```

## Rule Sources

- Official rulebook (EN, Asmodee/Next Move):  
  [Azul: Stained Glass of Sintra Rules PDF](https://cdn.svc.asmodee.net/production-nextmove/uploads/sites/4/2024/06/EN-Azul-Sintra-Rules_2024_compressed.pdf)

