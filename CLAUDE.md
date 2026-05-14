# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Project

Open `index.html` directly in a browser. No build step, server, or npm required.

## File Layout

- `index.html` — markup only
- `style.css` — all styles and theme variables
- `js/game.js` — board state, rules, move generation
- `js/ai.js` — minimax AI with alpha-beta pruning
- `js/ui.js` — rendering, events, score and mode management

Never merge these into fewer files or add a build tool without explicit instruction.

## Key Architecture Decisions

**Board representation**: 32-element flat array covering only the dark (green) squares, row-major from the top-left dark square. Do not use a 64-square array.

**AI depths**: Easy = 2, Medium = 4, Hard = 6.

**Theming**: A `data-theme="light|dark"` attribute on `<html>` controls the theme via CSS custom properties. System preference is read on load; user override is saved to `localStorage`. Never inject colors from JS.

**Highlights**: Last-move (yellow) and hover/potential-move (blue) highlights are CSS classes on square elements, not inline styles.

## Game Rules to Preserve

- Red always moves first at the start of a game.
- Players swap colors each new game (so the player who went second goes first next game).
- Captures are mandatory; multi-jump chains must be completed in a single turn.
- Scores within a session: win = 1, draw = 0.5, loss = 0. Reset on returning to mode selection.

## Spec, Plan, and Decisions

Before writing code, consult `SPEC.md`, `PLAN.md`, and `DECISIONS.md`. Record any new architectural or design choices in `DECISIONS.md`.
