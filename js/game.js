// js/game.js — Board state, rules, and move generation

const EMPTY     = 0;
const RED       = 1;
const WHITE     = 2;
const RED_KING  = 3;
const WHITE_KING = 4;

function isRed(piece)   { return piece === RED   || piece === RED_KING; }
function isWhite(piece) { return piece === WHITE || piece === WHITE_KING; }
function isKing(piece)  { return piece === RED_KING || piece === WHITE_KING; }
function isColor(piece, color) { return color === 'red' ? isRed(piece) : isWhite(piece); }
function isOpponent(piece, color) { return color === 'red' ? isWhite(piece) : isRed(piece); }

// Convert square index (0–31) to { row, col } on the 8×8 board.
// Even rows have dark squares at odd columns; odd rows at even columns.
function squareToCoords(sq) {
  const row    = Math.floor(sq / 4);
  const offset = sq % 4;
  const col    = (row % 2 === 0) ? offset * 2 + 1 : offset * 2;
  return { row, col };
}

// Convert { row, col } to a square index, or −1 if out of bounds or a light square.
function coordsToSquare(row, col) {
  if (row < 0 || row > 7 || col < 0 || col > 7) return -1;
  if ((row + col) % 2 === 0) return -1; // light square — not used
  return row % 2 === 0 ? row * 4 + (col - 1) / 2 : row * 4 + col / 2;
}

// Return the starting board.
// White occupies rows 0–2 (top, squares 0–11).
// Red occupies rows 5–7 (bottom, squares 20–31).
function initialBoard() {
  const board = new Array(32).fill(EMPTY);
  for (let sq = 0;  sq < 12; sq++) board[sq] = WHITE;
  for (let sq = 20; sq < 32; sq++) board[sq] = RED;
  return board;
}

// Return simple (non-capture) moves for the piece at sq.
function getSimpleMovesForPiece(board, sq) {
  const piece = board[sq];
  const { row, col } = squareToCoords(sq);
  const rowDirs = (piece === RED)   ? [-1]
                : (piece === WHITE) ? [1]
                : [-1, 1]; // kings move in both row directions
  const moves = [];
  for (const dr of rowDirs) {
    for (const dc of [-1, 1]) {
      const dest = coordsToSquare(row + dr, col + dc);
      if (dest !== -1 && board[dest] === EMPTY)
        moves.push({ from: sq, to: dest, captures: [] });
    }
  }
  return moves;
}

// Recursively find all complete jump chains starting from sq.
// `piece` is the jumping piece (may differ from board[sq] mid-chain).
// `captured` lists squares already jumped over this turn (prevents re-capture).
function getJumpsFromSquare(board, sq, piece, captured) {
  const { row, col } = squareToCoords(sq);
  const color   = isRed(piece) ? 'red' : 'white';
  const kingRow = color === 'red' ? 0 : 7;
  const rowDirs = (piece === RED)   ? [-1]
                : (piece === WHITE) ? [1]
                : [-1, 1];
  const jumps = [];

  for (const dr of rowDirs) {
    for (const dc of [-1, 1]) {
      const adjSq  = coordsToSquare(row + dr,       col + dc);
      const landSq = coordsToSquare(row + 2 * dr,   col + 2 * dc);

      if (adjSq === -1 || landSq === -1)          continue;
      if (captured.includes(adjSq))               continue; // already taken this piece
      if (!isOpponent(board[adjSq], color))        continue;
      if (board[landSq] !== EMPTY)                 continue;

      const newCaptured = [...captured, adjSq];
      const { row: landRow } = squareToCoords(landSq);

      // A man crowned at the landing square ends the jump chain immediately.
      if (!isKing(piece) && landRow === kingRow) {
        jumps.push({ from: sq, to: landSq, captures: newCaptured });
        continue;
      }

      // Advance the board temporarily and recurse.
      const tmp = [...board];
      tmp[sq]    = EMPTY;
      tmp[adjSq] = EMPTY;
      tmp[landSq] = piece;

      const further = getJumpsFromSquare(tmp, landSq, piece, newCaptured);
      if (further.length === 0) {
        jumps.push({ from: sq, to: landSq, captures: newCaptured });
      } else {
        for (const j of further)
          jumps.push({ from: sq, to: j.to, captures: j.captures });
      }
    }
  }

  return jumps;
}

// Return all jump chains available for the piece at sq.
function getJumpsForPiece(board, sq) {
  const piece = board[sq];
  return piece === EMPTY ? [] : getJumpsFromSquare(board, sq, piece, []);
}

// Return all legal moves for color, enforcing mandatory capture.
function getValidMoves(board, color) {
  const jumps = [], simples = [];
  for (let sq = 0; sq < 32; sq++) {
    if (!isColor(board[sq], color)) continue;
    jumps.push(...getJumpsFromSquare(board, sq, board[sq], []));
    simples.push(...getSimpleMovesForPiece(board, sq));
  }
  return jumps.length > 0 ? jumps : simples;
}

// Apply a move and return a new board (immutable — does not modify the original).
function applyMove(board, move) {
  const next = [...board];
  const piece = next[move.from];
  next[move.from] = EMPTY;
  for (const capSq of move.captures) next[capSq] = EMPTY;
  next[move.to] = piece;

  // Crown a man that reaches the far row.
  const { row } = squareToCoords(move.to);
  if (piece === RED   && row === 0) next[move.to] = RED_KING;
  if (piece === WHITE && row === 7) next[move.to] = WHITE_KING;

  return next;
}

// Return the winning color if the side to move has no legal moves, or null if ongoing.
function isGameOver(board, color) {
  if (getValidMoves(board, color).length === 0)
    return color === 'red' ? 'white' : 'red';
  return null;
}
