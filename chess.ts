export const columnsString = "abcdefgh";
type Columns = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type Rows = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type Position = `${Columns}${Rows}`;
type NumeralPosition = { row: number; column: number };
export type Move = { position: Position; moveTo: Position };
type RelativeMove = [number, number];

type PieceColor = "w" | "b";
type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
type Piece = `${PieceColor}-${PieceType}`;

type Replace = {
  position: Position;
  pieceFrom: Piece;
  pieceTo?: Piece;
};

// For en passant, castling and promotion
type Transform = Move | Replace;

type BaseMove = {
  moveTo: Position;
  transform?: Transform;
};
type GameMove = {
  turn: PieceColor;
  move: Move;
  transform?: Transform;
};

type Pieces = Partial<Record<Position, Piece>>;

export type GameState = {
  moves: GameMove[];
  pieces: Pieces;
};

const didPieceMove = (state: GameState, position: Position): boolean => {
  return (
    state.pieces[position] !== initialGameState.pieces[position] ||
    state.moves.some(
      ({ move }) => move.position === position || move.moveTo === position,
    )
  );
};

const parsePosition = (position: Position): NumeralPosition => {
  const [column, row] = position.split("");
  return { column: columnsString.indexOf(column), row: parseInt(row) - 1 };
};

export const stringifyPosition = (position: NumeralPosition): Position => {
  return `${columnsString[position.column]}${position.row + 1}` as Position;
};

const movePosition = (
  position: Position,
  move: RelativeMove,
): Position | null => {
  const parsedPosition = parsePosition(position);
  const column = parsedPosition.column + move[0];
  const row = parsedPosition.row + move[1];
  if (column < 0 || column > 7 || row < 0 || row > 7) return null;

  return stringifyPosition({ column, row }) as Position;
};

const getPawnMoves = (state: GameState, position: Position): BaseMove[] => {
  const playingColor = getPlayingColor(state);
  const { pieces } = state;

  const direction = playingColor === "w" ? 1 : -1;
  const moves: BaseMove[] = [];

  const forwardPosition = movePosition(position, [0, direction]);
  if (forwardPosition) {
    if (!pieces[forwardPosition]) {
      const isPromotionRow =
        parsePosition(forwardPosition).row === (direction === 1 ? 7 : 0);
      moves.push({
        moveTo: forwardPosition,
        transform: isPromotionRow
          ? {
              position: forwardPosition,
              pieceFrom: `${playingColor}-pawn`,
              pieceTo: `${playingColor}-queen`, // todo: change this for underpromotion
            }
          : undefined,
      });
      if (!didPieceMove(state, position)) {
        const doubleForwardPosition = movePosition(position, [
          0,
          direction * 2,
        ]);
        if (doubleForwardPosition && !pieces[doubleForwardPosition]) {
          moves.push({ moveTo: doubleForwardPosition });
        }
      }
    }
  }

  const diagonalRightPosition = movePosition(position, [direction, direction]);
  if (diagonalRightPosition) {
    const piece = pieces[diagonalRightPosition];
    if (piece && getPieceColor(piece) !== playingColor)
      moves.push({ moveTo: diagonalRightPosition });
    if (!piece) {
      // todo: add en passant
    }
  }

  const diagonalLeftPosition = movePosition(position, [-direction, direction]);
  if (diagonalLeftPosition) {
    const piece = pieces[diagonalLeftPosition];
    if (piece && getPieceColor(piece) !== playingColor)
      moves.push({ moveTo: diagonalLeftPosition });
    if (!piece) {
      // todo: add en passant
    }
  }

  return moves;
};

const getKingMoves = (state: GameState, position: Position): BaseMove[] => {
  const playingColor = getPlayingColor(state);

  const moves: BaseMove[] = [];

  for (const rowDirection of [-1, 0, 1]) {
    for (const columnDirection of [-1, 0, 1]) {
      if (rowDirection === 0 && columnDirection === 0) continue;
      const moveTo = movePosition(position, [rowDirection, columnDirection]);
      if (moveTo) {
        const piece = state.pieces[moveTo];
        if (!piece || getPieceColor(piece) !== playingColor)
          moves.push({ moveTo });
      }
    }
  }
  // todo: add castling

  if (moves.length) {
    const positionsUnderAttack = getPositionsUnderAttack(state);
    moves.filter((move) => !positionsUnderAttack.includes(move.moveTo));
  }

  return moves;
};

const getQueenMoves = (state: GameState, position: Position): BaseMove[] => {
  const playingColor = getPlayingColor(state);
  const moves: BaseMove[] = [];

  for (const rowDirection of [-1, 0, 1]) {
    for (const columnDirection of [-1, 0, 1]) {
      if (rowDirection === 0 && columnDirection === 0) continue;
      for (let moveSize = 1; moveSize <= 7; moveSize++) {
        const moveTo = movePosition(position, [
          rowDirection * moveSize,
          columnDirection * moveSize,
        ]);
        if (moveTo) {
          const piece = state.pieces[moveTo];
          if (!piece || getPieceColor(piece) !== playingColor)
            moves.push({ moveTo });
          if (piece) break;
        }
      }
    }
  }

  return moves;
};

const getRookMoves = (state: GameState, position: Position): BaseMove[] => {
  const playingColor = getPlayingColor(state);
  const moves: BaseMove[] = [];

  for (const rowDirection of [-1, 0, 1]) {
    for (const columnDirection of [-1, 0, 1]) {
      if (Math.abs(rowDirection) === Math.abs(columnDirection)) continue;
      for (let moveSize = 1; moveSize <= 7; moveSize++) {
        const moveTo = movePosition(position, [
          rowDirection * moveSize,
          columnDirection * moveSize,
        ]);
        if (moveTo) {
          const piece = state.pieces[moveTo];
          if (!piece || getPieceColor(piece) !== playingColor)
            moves.push({ moveTo });
          if (piece) break;
        }
      }
    }
  }

  return moves;
};

const getBishopMoves = (state: GameState, position: Position): BaseMove[] => {
  const playingColor = getPlayingColor(state);
  const moves: BaseMove[] = [];

  for (const rowDirection of [-1, 1]) {
    for (const columnDirection of [-1, 1]) {
      for (let moveSize = 1; moveSize <= 7; moveSize++) {
        const moveTo = movePosition(position, [
          rowDirection * moveSize,
          columnDirection * moveSize,
        ]);
        if (moveTo) {
          const piece = state.pieces[moveTo];
          if (!piece || getPieceColor(piece) !== playingColor)
            moves.push({ moveTo });
          if (piece) break;
        }
      }
    }
  }

  return moves;
};

const getKnightMoves = (state: GameState, position: Position): BaseMove[] => {
  const playingColor = getPlayingColor(state);
  const moves: BaseMove[] = [];

  for (const rowDirection of [-2, -1, 1, 2]) {
    for (const columnDirection of [-2, -1, 1, 2]) {
      if (Math.abs(rowDirection) === Math.abs(columnDirection)) continue;
      const moveTo = movePosition(position, [rowDirection, columnDirection]);
      if (moveTo) {
        const piece = state.pieces[moveTo];
        if (!piece || getPieceColor(piece) !== playingColor)
          moves.push({ moveTo });
      }
    }
  }

  return moves;
};

export const initialGameState = {
  moves: [],
  pieces: {
    a1: "w-rook",
    b1: "w-knight",
    c1: "w-bishop",
    d1: "w-queen",
    e1: "w-king",
    f1: "w-bishop",
    g1: "w-knight",
    h1: "w-rook",
    a2: "w-pawn",
    b2: "w-pawn",
    c2: "w-pawn",
    d2: "w-pawn",
    e2: "w-pawn",
    f2: "w-pawn",
    g2: "w-pawn",
    h2: "w-pawn",

    a8: "b-rook",
    b8: "b-knight",
    c8: "b-bishop",
    d8: "b-queen",
    e8: "b-king",
    f8: "b-bishop",
    g8: "b-knight",
    h8: "b-rook",
    a7: "b-pawn",
    b7: "b-pawn",
    c7: "b-pawn",
    d7: "b-pawn",
    e7: "b-pawn",
    f7: "b-pawn",
    g7: "b-pawn",
    h7: "b-pawn",
  } as Pieces,
} satisfies GameState;

function getPieceColor(piece: Piece): PieceColor {
  return parsePiece(piece).color;
}

function getPieceType(piece: Piece): PieceType {
  return parsePiece(piece).type;
}

export function parsePiece(piece: Piece) {
  const [color, type] = piece.split("-");
  return { color, type } as { color: PieceColor; type: PieceType };
}

function getPiecesPositions(state: GameState, color: PieceColor): Position[] {
  return (Object.keys(state.pieces) as Position[]).filter(
    (position) => getPieceColor(state.pieces[position]!) === color,
  );
}

function getOppositeColor(color: PieceColor): PieceColor {
  return color === "w" ? "b" : "w";
}

export function getPieceMoves(
  state: GameState,
  position: Position,
): BaseMove[] {
  const playingColor = getPlayingColor(state);
  const piece = state.pieces[position];
  if (!piece) return [];
  const { type, color } = parsePiece(piece);
  if (playingColor !== color) return [];

  if (type === "pawn") return getPawnMoves(state, position);
  if (type === "king") return getKingMoves(state, position);
  if (type === "queen") return getQueenMoves(state, position);
  if (type === "knight") return getKnightMoves(state, position);
  if (type === "bishop") return getBishopMoves(state, position);
  if (type === "rook") return getRookMoves(state, position);

  return [];
}

export const getPlayingColor = (state: GameState): PieceColor => {
  return state.moves.length
    ? getOppositeColor(state.moves[state.moves.length - 1].turn)
    : "w";
};

function performGameMove(state: GameState, { move, transform }: GameMove) {
  performMove(state, move);
  if (transform) {
    if ("moveTo" in transform) performMove(state, transform);
    else {
      if (transform.pieceTo)
        state.pieces[transform.position] = transform.pieceTo;
      else delete state.pieces[transform.position];
    }
  }
}

function performMove(
  state: GameState,
  { position: from, moveTo: to }: Move,
): GameState {
  state.pieces[to] = state.pieces[from];
  delete state.pieces[from];
  return state;
}

const getAllAvailableMoves = (
  state: GameState,
  color: PieceColor,
): BaseMove[] => {
  return getPiecesPositions(state, color).flatMap((position) =>
    getPieceMoves(state, position),
  );
};

export const getAllAvailableMovePositions = (
  state: GameState,
  color: PieceColor,
): Position[] => {
  return getAllAvailableMoves(state, color).map(({ moveTo }) => moveTo);
};

const getPositionsUnderAttack = (state: GameState): Position[] => {
  return getAllAvailableMovePositions(
    state,
    getOppositeColor(getPlayingColor(state)),
  );
};

const getKingPosition = (state: GameState): Position => {
  const playingColor = getPlayingColor(state);
  return (Object.entries(state.pieces) as [Position, Piece][]).find(
    ([_, piece]) => {
      const { type, color } = parsePiece(piece);
      return type === "king" && color === playingColor;
    },
  )![0];
};

const getIsKingUnderAttack = (state: GameState): boolean =>
  getPositionsUnderAttack(state).includes(getKingPosition(state));

export function progressGame(state: GameState, move: Move): GameState {
  state = structuredClone(state);
  const playingColor = getPlayingColor(state);
  const { position: from, moveTo: to } = move;

  const possibleMoves = getPieceMoves(state, from);

  const baseMove = possibleMoves.find((move) => move.moveTo === to);
  let isKingUnderAttack = false;
  if (baseMove) {
    const gameMove = {
      turn: playingColor,
      move,
      transform: baseMove.transform,
    };
    performGameMove(state, gameMove);
    isKingUnderAttack = getIsKingUnderAttack(state);
    state.moves.push(gameMove);
  }
  if (!baseMove || isKingUnderAttack)
    throw new Error(`[${from}, ${to}] is not a valid move`);

  return state;
}
