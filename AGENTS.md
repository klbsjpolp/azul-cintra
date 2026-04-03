# AGENTS.md

## Project Summary
- This repo is a React + TypeScript + Vite web prototype of **Azul: Stained Glass of Sintra** for 2 players (human vs AI).
- The most important behavior lives in game-rule and AI logic; UI changes should stay aligned with implemented rules.

## Code Areas
- `src/components/`: React UI for board state, factories, center, and turn flow.
- `src/utils/gameLogic.ts`: core game setup, drafting rules, band resolution, and scoring helpers.
- `src/utils/aiLogic.ts`: legal move generation and AI decision-making.
- `src/types/game.ts`: canonical game types, constants, and shared domain models.
- `src/utils/*.test.ts`: Vitest coverage for game rules and AI behavior.

## Working Rules
- Keep changes focused and minimal; prefer root-cause fixes over surface patches.
- Preserve existing game terminology and domain concepts such as factories, center, pattern bands, glazier position, broken glass, and discard tower.
- Avoid changing implemented rules unless the task explicitly requires a rules update.
- When changing behavior, update nearby tests and README scope notes if the public behavior or setup changes.
- Do not add dependencies unless they are clearly necessary for the task.

## Coding Style
- Follow the style already present in the file you are editing instead of reformatting unrelated code.
- Keep logic functions pure and testable when possible, especially in `src/utils/`.
- Use strict TypeScript-friendly patterns and keep shared types in `src/types/game.ts` when they are reused across modules.
- Prefer small helper extraction for complex rule checks rather than expanding component bodies.
- Avoid inline comments unless the user asks for them or a rule edge case truly needs clarification.

## Testing
- Prefer targeted Vitest coverage for rule and AI changes before broader validation.
- If you change `src/utils/gameLogic.ts` or `src/utils/aiLogic.ts`, add or update tests in the adjacent `*.test.ts` files.
- Use the existing project scripts for validation: `build`, `lint`, and `test`.

## UI Expectations
- Keep interactions readable and rules-driven.
- Favor clear state transitions over visual polish when there is a trade-off.
- Do not present illegal moves as selectable if the rules engine can determine legality ahead of time.
