# PLAN.md — Implementation Plan

## File Structure

```
checkers-website/
├── index.html
├── style.css
└── js/
    ├── game.js   # Board state, rules, move generation
    ├── ai.js     # Minimax + alpha-beta pruning
    └── ui.js     # Rendering, events, mode/score management
```

`index.html` loads `style.css` and the three JS files (in order: `game.js`, `ai.js`, `ui.js`).

---

## Implementation Phases

### Phase 1 — Core Game Logic (`game.js`)

- Board representation: flat array of 32 dark squares (standard American indexing).
- Piece states: empty, red, white, red-king, white-king.
- Functions:
  - `getValidMoves(board, color)` — returns all legal moves for a side, enforcing mandatory capture.
  - `getJumpsForPiece(board, square)` — returns all jump chains from a given square.
  - `applyMove(board, move)` — returns a new board state after executing a move (including captures and kinging).
  - `isGameOver(board, color)` — returns win/draw/ongoing status.
  - `initialBoard()` — returns the starting board state.

### Phase 2 — AI Engine (`ai.js`)

- `minimax(board, depth, alpha, beta, maximizing)` — recursive search with alpha-beta pruning.
- `evaluate(board)` — static board evaluation (material + advancement + center control).
- `getBestMove(board, color, depth)` — entry point; returns the best move for the given side and depth.

### Phase 3 — HTML Structure (`index.html`)

- Mode selection screen: three mode buttons + difficulty selector.
- Game screen:
  - Score card (Player 1): name input, color swatch, score.
  - Board: 8×8 grid of `<div>` squares.
  - Score card (Player 2): name input, color swatch, score.
  - Turn status bar.
  - New Game / Change Mode buttons.
  - Light/dark mode toggle button.

### Phase 4 — Styling (`style.css`)

- CSS custom properties for light and dark themes (applied via `data-theme` attribute or `prefers-color-scheme` media query).
- Board square colors: `--sq-light` (cream), `--sq-dark` (green).
- Highlight overlays: yellow (last move), blue (hover potential move).
- Score card active/inactive state styles.
- Piece styles (red / white circles, crown indicator for kings).
- Responsive layout so the board and cards fit on typical screen sizes.

### Phase 5 — UI & Interaction (`ui.js`)

- `renderBoard(state)` — redraws the board from game state.
- `renderScoreCards(state)` — updates names, colors, scores, and active highlight.
- `renderStatus(state)` — updates the turn status text.
- Mouse events:
  - `mouseover` on squares: show blue potential-move highlight for hovered friendly piece.
  - `click` on squares: select piece → highlight destinations → execute move on destination click.
- Name input `input` event: propagate name change live to all displays.
- AI turn trigger: after each state update, if the current player is AI, schedule `getBestMove` via `setTimeout`.
- Game-over handling: display result, update scores, offer New Game.
- Color alternation logic: track which player index is Red each game; swap on new game.
- Theme toggle: flip `data-theme` between `light` and `dark`; persist preference in `localStorage`.

### Phase 6 — Integration & Polish

- Wire all phases together; verify the full game loop end-to-end.
- Test all three modes and AI difficulty levels.
- Verify light/dark mode toggle and system preference detection.
- Check score persistence and color alternation across multiple games.
- Visual polish: spacing, typography, transitions on piece movement/highlight.

---

## Data Structures

### `GameState` object (managed in `ui.js`, passed to `game.js` functions)
```js
{
  board: [...],          // 32-element array
  currentColor: 'red' | 'white',
  selected: null | squareIndex,
  validMoves: [...],     // moves for selected piece
  lastMove: null | move,
  gameOver: false | 'red' | 'white' | 'draw',
  players: [
    { name: string, color: 'red'|'white', score: number, isAI: boolean },
    { name: string, color: 'red'|'white', score: number, isAI: boolean },
  ],
  mode: 'hvh' | 'hva' | 'ava',
  difficulty: 'easy' | 'medium' | 'hard',
  gameIndex: number,     // increments each game, used to determine color swap
}
```

### Move object
```js
{
  from: squareIndex,
  to: squareIndex,
  captures: [squareIndex, ...],  // squares of captured pieces (empty if simple move)
}
```
