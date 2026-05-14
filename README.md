# Checkers

A browser-based Standard American Checkers game with three game modes and a computer opponent. No installation or build step required.

## Setup

1. Clone or download this repository.
2. Open `index.html` in any modern web browser.

That's it — no server, no dependencies, no npm.

## How to Play

### Mode Selection

On load you'll see three mode buttons:

| Mode | Description |
|------|-------------|
| Human vs Human | Two players share the same screen and alternate turns. |
| Human vs AI | You play against the computer. |
| AI vs AI | Watch two computer opponents play each other. |

When at least one player is the AI, an **Easy / Medium / Hard** difficulty selector appears (search depths 2, 4, and 6 respectively).

### Game Rules (Standard American Checkers)

- The board is 8×8; pieces move on the dark (green) squares only.
- **Red moves first.** Between games, players automatically swap colors so the advantage alternates.
- Regular pieces move diagonally forward one square at a time.
- A piece reaching the far row is **crowned a king** and may move in any diagonal direction.
- Captures are **mandatory** — if a jump is available you must take it.
- **Multi-jump**: after a capture, if another jump is available from the landing square, the turn continues with the same piece.
- A player wins when the opponent has no legal moves (no pieces left or all pieces are blocked).

### Controls

- **Click a piece** to select it; valid destination squares highlight in blue on hover.
- **Click a highlighted square** to move.
- The **last move** is marked with a yellow highlight.
- **New Game** — restart in the same mode (colors swap automatically).
- **Change Mode** — return to the mode selection screen (resets scores).
- In AI vs AI mode, a **Pause / Resume** button controls playback.

### Player Names & Scores

- Each player's name can be edited directly in the score card text box; changes appear live everywhere the name is shown.
- Scores accumulate across games in a session: **1 point** for a win, **0.5** for a draw, **0** for a loss.
- Scores reset when you return to the mode selection screen.

## Light / Dark Mode

The site follows your system's color-scheme preference by default. Use the toggle button in the UI to switch manually; your choice is remembered across sessions.

## File Structure

```
checkers-website/
├── index.html      # Markup and layout
├── style.css       # All styles and theme variables
└── js/
    ├── game.js     # Board state, rules, move generation
    ├── ai.js       # Minimax AI with alpha-beta pruning
    └── ui.js       # Rendering, events, score and mode management
```
