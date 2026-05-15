# DECISIONS.md — Design & Architecture Decisions

## Tech Stack: Plain HTML/CSS/JS

No framework, no build step, no npm. Three dedicated files: `index.html`, `style.css`, and JS modules under `js/`.

**Why:** Simplest possible deployment (open `index.html` in a browser). No toolchain to maintain.

---

## Board Representation: 32-Square Array

Standard American checkers uses only the 32 dark squares. Indexing only those squares (row-major, top-left dark square = 0) avoids storing 32 empty cells and simplifies move generation logic.

**Why:** Conventional for checkers engines; keeps move tables compact.

---

## AI Algorithm: Minimax with Alpha-Beta Pruning

Synchronous minimax search with alpha-beta pruning. Depths: 2 (Easy), 4 (Medium), 6 (Hard).

**Why:** Sufficient for a playable checkers AI without web workers or async complexity. Alpha-beta typically prunes ~half the tree, making depth 6 feasible within a single frame budget at checkers branching factors (~4–8 moves average).

**Trade-off:** No iterative deepening or transposition table in v1. If Hard AI becomes too slow on complex midgame positions, reduce depth or add a move-count cutoff.

---

## Color Alternation Between Games

At the start of each new game, the two players swap colors. Red always moves first, so this also means the player who went second will go first in the next game.

**Why:** Fairness — neither player has a permanent first-move advantage across multiple games.

**Implementation note:** Determine active color assignment by checking whether `gameIndex` is even or odd, then map player indices accordingly.

---

## Board Square Colors

Light squares: off-white cream. Dark squares: green. Bottom-right square is light.

**Why:** Classic tournament board aesthetic; the cream/green combination is visually distinct and readable in both light and dark UI themes.

---

## Theme Implementation: `data-theme` + CSS Custom Properties

A `data-theme="light|dark"` attribute on `<html>` controls the theme. CSS custom properties define all colors. System preference is read via `window.matchMedia('(prefers-color-scheme: dark)')` on load; user override is saved to `localStorage`.

**Why:** Cleanest CSS approach — no class toggling on every element, no JS color injection. `localStorage` persists the override across sessions.

---

## Highlight Strategy: CSS Overlay Classes

Highlights (yellow for last move, blue for hover/potential) are applied as additional CSS classes on square elements rather than inline styles.

**Why:** Keeps all color values in `style.css` and makes light/dark variants easy to adjust.

---

## HvH Board Flip: CSS `rotate(180deg)` on `#board`

In Human vs Human mode the board rotates 180° between turns so each player sees their own pieces at the bottom. This is implemented by toggling a `flipped` CSS class on `#board` (`transform: rotate(180deg); transition: transform 0.4s ease`) and counter-rotating each piece (`rotate(180deg)`) so pieces remain upright. Hover and lifted states combine the counter-rotation with their scale transforms.

**Why CSS rotation rather than re-rendering in reversed row order:** Re-rendering avoids the need to counter-rotate pieces, but it destroys and recreates the DOM on every flip, cannot be animated, and gives no smooth visual transition. CSS rotation gives a fluid 0.4 s spin with no DOM churn; browsers correctly route pointer events through CSS transforms so click and hover handling are unaffected.

**Trade-off:** The board snaps back to the standard (Red-at-bottom) orientation on game over, because `flipped` is only applied when `!state.gameOver`. This avoids the awkward case where the board is flipped from the loser's perspective when the win is announced.

---

## AI Player Names: Editable with Mode-Aware Fallback

AI name inputs are editable (no `readonly` attribute). If the field is cleared and blurred, the blur handler restores a mode-appropriate default: `"AI"` in Human vs AI, `"AI 1"` / `"AI 2"` in AI vs AI.

**Why:** Allowing custom AI names (e.g. "Deep Blue") is a minor UX improvement with no downside. The fallback on empty blur prevents a nameless player from breaking the status bar text.

---

## Score Persistence: Session-Only (In-Memory)

Scores are stored in the `GameState` JS object and reset when the user returns to the mode selection screen.

**Why:** No backend, no `localStorage` persistence needed for scores — scores are naturally scoped to a play session. Simplicity outweighs persistence here.
