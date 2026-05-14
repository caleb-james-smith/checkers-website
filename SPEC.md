# SPEC.md — Checkers Website

## Overview

A browser-based Standard American Checkers game. Runs entirely in the browser as static files — no server or build step required.

---

## File Structure

Code is separated into dedicated files:
- `index.html` — markup and layout
- `style.css` — all styles, including light/dark mode variables
- `js/game.js` — game state, rules, and move generation
- `js/ai.js` — AI engine
- `js/ui.js` — rendering, event handling, and DOM interaction

---

## Game Rules (Standard American)

- 8×8 board; pieces occupy dark (green) squares only.
- Each side starts with 12 pieces on the three rows closest to them.
- **Regular pieces** move diagonally forward one square at a time.
- **Kings** are crowned when a piece reaches the far row; kings move diagonally in any direction one square at a time.
- **Captures** jump diagonally over an adjacent enemy piece into the empty square beyond; the captured piece is removed.
- **Multi-jump**: if another capture is available after landing, the piece must continue jumping in the same turn.
- **Mandatory capture**: if any capture is available, the player must take it. If multiple captures exist, the player may choose which one.
- **Win condition**: a player wins when the opponent has no legal moves (no pieces remaining or all pieces are blocked).
- **Draw**: not handled in v1.

---

## Board & Pieces

- Squares alternate off-white cream (light) and green (dark).
- The bottom-right corner square is always a light (cream) square.
- Pieces are placed on dark (green) squares at the start of each game.
- **Red** pieces are dark red; **White** pieces are off-white/white.
- Kings display a visual crown indicator (e.g., a crown icon or inner ring).

---

## Game Modes

| Mode | Description |
|------|-------------|
| Human vs Human | Two players alternate turns on the same screen. |
| Human vs AI | Human plays against the AI. |
| AI vs AI | Both sides are controlled by the AI; moves play out automatically with a short delay. |

### Mode Selection Screen
- Shown on load and after each completed game.
- Buttons for each of the three modes.
- AI difficulty selector (Easy / Medium / Hard) shown when at least one player is AI.

### AI vs AI Playback
- Moves execute with a configurable delay (default ~800 ms).
- A "Pause / Resume" button lets the viewer halt and continue.

---

## Players & Colors

- There are always exactly two players (Human or AI per slot, depending on mode).
- **Red always moves first** at the start of a game.
- **Colors alternate between games**: the player who was White in one game becomes Red in the next, and vice versa. This means the player who went second will go first in the next game.
- Each player has a **name** (default: "Player 1" / "Player 2", or "AI" for AI-controlled slots).

---

## Player Names

- Each player has an editable text box displaying their name.
- Name changes take effect live across all places the name appears (score card, turn status).
- In AI slots, the name field is read-only and displays "AI".

---

## Score Tracking

- Scores persist across games within a session.
- Scoring per game:
  - Win: **1 point**
  - Draw: **0.5 points** (each player)
  - Loss: **0 points**
- Scores reset when returning to the mode selection screen.

---

## Score Cards

Two score cards are displayed (one per player), each showing:
- Player name (editable text box)
- Piece color indicator (red or white swatch)
- Current score

---

## Turn Indicator

- The **active player's score card** is visually highlighted (e.g., border or background accent).
- A **written turn status** line below or above the board states whose turn it is (e.g., "Alice's turn — Red").

---

## Move Highlighting

- **Last move**: both the origin and destination squares of the most recent move are highlighted with a partially transparent yellow overlay.
- **Potential moves**: when hovering over a friendly piece (Human turns only), the valid destination squares for that piece are highlighted with a partially transparent blue overlay.

### Selected Piece Interaction
- Clicking a friendly piece selects it and shows its valid destination squares highlighted.
- Clicking a highlighted destination square executes the move.
- Clicking elsewhere or a different friendly piece deselects / re-selects.
- During a forced multi-jump, only the currently jumping piece may be interacted with.

---

## Light / Dark Mode

- Defaults to the user's system preference (`prefers-color-scheme`).
- A toggle button allows manual override.
- All UI elements (board, score cards, status text, buttons, backgrounds) have distinct and visually appealing styles for both modes.
- Board square colors (cream / green) are consistent across both modes; the surrounding UI adapts.

---

## AI Behavior

- Algorithm: Minimax with alpha-beta pruning.
- **Easy**: search depth 2.
- **Medium**: search depth 4.
- **Hard**: search depth 6.
- Evaluation function factors:
  1. Material count (piece = 1, king = 2).
  2. King advancement bonus (regular pieces closer to promotion row).
  3. Center-square control bonus.
- The AI plays both sides in AI vs AI mode using the same engine for each color.
- Move computation is wrapped in `setTimeout` to keep the UI responsive and introduce the playback delay.

---

## Controls

- **New Game** button: restarts in the same mode, swapping colors per the alternation rule.
- **Change Mode** button: returns to the mode selection screen and resets scores.
