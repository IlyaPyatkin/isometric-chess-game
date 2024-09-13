export const columnsString = "abcdefgh";
type Columns = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
type Rows = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type Position = `${Columns}${Rows}`;
type NumeralPosition = { row: number; column: number };
type Move = { position: Position; moveTo: Position };
type RelativeMove = [number, number];

export type PieceColor = "w" | "b";
export type PieceType =
  | "pawn"
  | "rook"
  | "knight"
  | "bishop"
  | "queen"
  | "king";
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
  isUnderAttack?: boolean;
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

const didPieceMove = (state: GameState, position: Position): boolean =>
  state.pieces[position] !== initialGameState.pieces[position] ||
  state.moves.some(
    ({ move }) => move.position === position || move.moveTo === position,
  );

const parsePosition = (position: Position): NumeralPosition => {
  const [column, row] = position.split("");
  return { column: columnsString.indexOf(column), row: parseInt(row) - 1 };
};

export const stringifyPosition = (position: NumeralPosition): Position =>
  `${columnsString[position.column]}${position.row + 1}` as Position;

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

export const parsePiece = (piece: Piece) => {
  const [color, type] = piece.split("-");
  return { color, type } as { color: PieceColor; type: PieceType };
};

const getPieceColor = (piece: Piece): PieceColor => parsePiece(piece).color;

const getPawnMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
  showAttackOnlyMoves?: boolean,
): BaseMove[] => {
  const { pieces } = state;

  const direction = playingColor === "w" ? 1 : -1;
  const moves: BaseMove[] = [];

  const forwardPosition = movePosition(position, [0, direction]);

  const isPromotionRow =
    forwardPosition &&
    parsePosition(forwardPosition).row === (direction === 1 ? 7 : 0);
  const promoteTo: Exclude<PieceType, "king" | "pawn"> = "queen"; // todo: change this for underpromotion
  const getPromotionTransform = (position: Position) =>
    isPromotionRow
      ? ({
          position,
          pieceFrom: `${playingColor}-pawn`,
          pieceTo: `${playingColor}-${promoteTo}`,
        } satisfies Replace)
      : undefined;

  if (forwardPosition) {
    if (!pieces[forwardPosition]) {
      moves.push({
        moveTo: forwardPosition,
        transform: getPromotionTransform(forwardPosition),
        isUnderAttack: false,
      });
      if (!didPieceMove(state, position)) {
        const doubleForwardPosition = movePosition(position, [
          0,
          direction * 2,
        ]);
        if (doubleForwardPosition && !pieces[doubleForwardPosition]) {
          moves.push({ moveTo: doubleForwardPosition, isUnderAttack: false });
        }
      }
    }
  }

  for (const diagonalDirection of [-1, 1]) {
    const diagonalPosition = movePosition(position, [
      diagonalDirection,
      direction,
    ]);
    if (diagonalPosition) {
      const piece = pieces[diagonalPosition];
      if (!piece || getPieceColor(piece) !== playingColor) {
        if (piece || showAttackOnlyMoves) {
          moves.push({
            moveTo: diagonalPosition,
            transform: getPromotionTransform(diagonalPosition),
          });
        }
      }
      if (!piece) {
        const sidePosition = movePosition(position, [diagonalDirection, 0])!;
        const sidePiece = pieces[sidePosition];
        if (sidePiece) {
          const { type, color } = parsePiece(sidePiece);
          if (type === "pawn" && color !== playingColor) {
            const { move: lastMove } = state.moves[state.moves.length - 1];
            if (
              lastMove.position ===
                movePosition(sidePosition, [0, direction * 2]) &&
              lastMove.moveTo === sidePosition
            ) {
              moves.push({
                isUnderAttack: false,
                moveTo: diagonalPosition,
                transform: {
                  position: sidePosition,
                  pieceFrom: sidePiece,
                  pieceTo: undefined,
                },
              });
            }
          }
        }
      }
    }
  }

  return moves;
};

const getKingMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
  positionsUnderAttack: Position[],
): BaseMove[] => {
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

  if (
    !positionsUnderAttack.includes(position) &&
    !didPieceMove(state, position)
  ) {
    const parsedPosition = parsePosition(position);
    const { row } = parsedPosition;
    for (const rookColumn of [0, 7]) {
      const direction = rookColumn === 0 ? -1 : 1;
      const rookPosition = stringifyPosition({ row, column: rookColumn });
      if (!didPieceMove(state, rookPosition)) {
        let obstacleFound = false;
        for (
          let column = parsedPosition.column + direction;
          column !== rookColumn;
          column += direction
        ) {
          const pathSquare = stringifyPosition({ row, column });
          if (
            positionsUnderAttack.includes(pathSquare) ||
            state.pieces[pathSquare]
          ) {
            obstacleFound = true;
            break;
          }
        }
        if (!obstacleFound) {
          moves.push({
            moveTo: stringifyPosition({
              row,
              column: parsedPosition.column + 2 * direction,
            }),
            isUnderAttack: false,
            transform: {
              position: rookPosition,
              moveTo: stringifyPosition({
                row,
                column: parsedPosition.column + direction,
              }),
            },
          });
        }
      }
    }
  }

  return moves;
};

const getQueenMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
): BaseMove[] => {
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

const getRookMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
): BaseMove[] => {
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

const getBishopMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
): BaseMove[] => {
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

const getKnightMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
): BaseMove[] => {
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

export const castlingGameState = {
  moves: [],
  pieces: {
    a1: "w-rook",
    e1: "w-king",
    h1: "w-rook",

    a8: "b-rook",
    e8: "b-king",
    h8: "b-rook",
  } as Pieces,
} satisfies GameState;

export const enPassantGameState = {
  moves: [{ turn: "w", move: { position: "f4", moveTo: "f5" } }],
  pieces: { f5: "w-pawn", g7: "b-pawn", e7: "b-pawn" } as Pieces,
} satisfies GameState;

const getOppositeColor = (color: PieceColor): PieceColor =>
  color === "w" ? "b" : "w";

const getPieceMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
  positionsUnderAttack: Position[],
  showAttackOnlyMoves?: boolean,
): BaseMove[] => {
  const piece = state.pieces[position];
  if (!piece) return [];
  const { type, color } = parsePiece(piece);
  if (playingColor !== color) return [];

  if (type === "pawn")
    return getPawnMoves(state, position, playingColor, showAttackOnlyMoves);
  if (type === "king")
    return getKingMoves(state, position, playingColor, positionsUnderAttack);
  if (type === "queen") return getQueenMoves(state, position, playingColor);
  if (type === "knight") return getKnightMoves(state, position, playingColor);
  if (type === "bishop") return getBishopMoves(state, position, playingColor);
  if (type === "rook") return getRookMoves(state, position, playingColor);

  return [];
};

const performMove = (
  state: GameState,
  { position: from, moveTo: to }: Move,
): GameState => {
  state.pieces[to] = state.pieces[from];
  delete state.pieces[from];
  return state;
};

const performGameMove = (state: GameState, { move, transform }: GameMove) => {
  performMove(state, move);
  if (transform) {
    if ("moveTo" in transform) performMove(state, transform);
    else {
      if (transform.pieceTo)
        state.pieces[transform.position] = transform.pieceTo;
      else delete state.pieces[transform.position];
    }
  }
};

export const getValidPieceMoves = (
  state: GameState,
  position: Position,
  playingColor: PieceColor,
) =>
  getPieceMoves(
    state,
    position,
    playingColor,
    getPositionsUnderAttack(state, playingColor),
  )
    .filter(({ moveTo, transform }) => {
      const gameMove = {
        turn: playingColor,
        move: { position, moveTo },
        transform,
      };
      const stateClone = structuredClone(state);
      performGameMove(stateClone, gameMove);
      return !getIsKingUnderAttack(stateClone, playingColor);
    })
    .map(({ moveTo }) => moveTo);

export const getPlayingColor = (state: GameState): PieceColor =>
  state.moves.length
    ? getOppositeColor(state.moves[state.moves.length - 1].turn)
    : "w";

const getPiecesPositions = (
  state: GameState,
  playingColor: PieceColor,
): Position[] =>
  (Object.keys(state.pieces) as Position[]).filter(
    (position) => getPieceColor(state.pieces[position]!) === playingColor,
  );

const getAllAvailableMoves = (
  state: GameState,
  playingColor: PieceColor,
  showAttackOnlyMoves: boolean,
): BaseMove[] =>
  getPiecesPositions(state, playingColor).flatMap((position) =>
    // to fix recursive call, we pass empty array as positionsUnderAttack which should be fine,
    // because later on we filter out all moves that don't cause squares to be under attack
    getPieceMoves(state, position, playingColor, [], showAttackOnlyMoves),
  );

export const getPositionsUnderAttack = (
  state: GameState,
  playingColor: PieceColor,
): Position[] =>
  getAllAvailableMoves(state, getOppositeColor(playingColor), true)
    .filter(({ isUnderAttack }) => isUnderAttack !== false)
    .map(({ moveTo }) => moveTo);

const getKingPosition = (
  state: GameState,
  playingColor: PieceColor,
): Position | undefined =>
  (Object.entries(state.pieces) as [Position, Piece][]).find(([_, piece]) => {
    const { type, color } = parsePiece(piece);
    return type === "king" && color === playingColor;
  })?.[0];

const getIsKingUnderAttack = (
  state: GameState,
  playingColor: PieceColor,
  positionsUnderAttack?: Position[],
): boolean | undefined => {
  const kingPosition = getKingPosition(state, playingColor);
  if (!kingPosition) return;
  positionsUnderAttack ??= getPositionsUnderAttack(state, playingColor);
  return positionsUnderAttack.includes(kingPosition);
};

export const progressGame = (state: GameState, move: Move): GameState => {
  state = structuredClone(state);
  const playingColor = getPlayingColor(state);
  const { position: from, moveTo: to } = move;

  const positionsUnderAttack = getPositionsUnderAttack(state, playingColor);
  const possibleMoves = getPieceMoves(
    state,
    from,
    playingColor,
    positionsUnderAttack,
  );

  const baseMove = possibleMoves.find((move) => move.moveTo === to);
  if (baseMove) {
    const gameMove = {
      turn: playingColor,
      move,
      transform: baseMove.transform,
    };
    performGameMove(state, gameMove);
    state.moves.push(gameMove);
  }
  if (
    !baseMove ||
    getIsKingUnderAttack(state, playingColor, positionsUnderAttack)
  )
    throw new Error(`[${from}, ${to}] is not a valid move`);

  return state;
};
