// js/ai.js — Minimax AI with alpha-beta pruning

// The four dark squares nearest the board centre (used for the centre-control bonus).
const CENTER_SQUARES = new Set([13, 14, 17, 18]);

// Static board evaluation from Red's perspective.
// Positive → Red advantage; negative → White advantage.
function evaluate(board) {
  let score = 0;
  for (let sq = 0; sq < 32; sq++) {
    const piece = board[sq];
    if (piece === EMPTY) continue;

    const sign = isRed(piece) ? 1 : -1;
    const { row } = squareToCoords(sq);

    // Material: a king is worth twice a man.
    score += sign * (isKing(piece) ? 2 : 1);

    // Advancement: nudge non-kings toward their promotion row.
    if (!isKing(piece)) {
      const adv = isRed(piece) ? (7 - row) / 7   // Red promotes at row 0
                               :      row  / 7;  // White promotes at row 7
      score += sign * adv * 0.1;
    }

    // Centre control.
    if (CENTER_SQUARES.has(sq)) score += sign * 0.15;
  }
  return score;
}

// Minimax with alpha-beta pruning.
// Red is always the maximising player; White the minimising player.
function minimax(board, depth, alpha, beta, color) {
  const moves = getValidMoves(board, color);

  // Terminal: the side to move has no legal moves and loses.
  if (moves.length === 0) return color === 'red' ? -10000 : 10000;

  // Leaf node: return the static evaluation.
  if (depth === 0) return evaluate(board);

  const nextColor = color === 'red' ? 'white' : 'red';

  if (color === 'red') {
    let best = -Infinity;
    for (const move of moves) {
      const ev = minimax(applyMove(board, move), depth - 1, alpha, beta, nextColor);
      if (ev > best)  best  = ev;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // beta cut-off
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const ev = minimax(applyMove(board, move), depth - 1, alpha, beta, nextColor);
      if (ev < best)  best  = ev;
      if (best < beta) beta = best;
      if (alpha >= beta) break; // alpha cut-off
    }
    return best;
  }
}

// Return the best move for color at the given search depth.
// Moves are shuffled before scoring so that equally-rated choices vary between games.
function getBestMove(board, color, depth) {
  const moves = getValidMoves(board, color);
  if (moves.length === 0) return null;

  // Fisher-Yates shuffle.
  for (let i = moves.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [moves[i], moves[j]] = [moves[j], moves[i]];
  }

  // Depth 0: no look-ahead — pick any move at random.
  if (depth === 0) return moves[0];

  const maximizing = color === 'red';
  const nextColor  = color === 'red' ? 'white' : 'red';
  let bestMove  = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const score = minimax(applyMove(board, move), depth - 1, -Infinity, Infinity, nextColor);
    if (maximizing ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove  = move;
    }
  }

  return bestMove;
}
