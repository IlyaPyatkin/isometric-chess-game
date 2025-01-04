import {
  columnsString,
  GameState,
  getAllPossibleMoves,
  getPlayingColor,
  initialGameState,
  parsePiece,
  Position,
  progressGame,
  stringifyPosition,
} from "./chess.ts";
import { getChessMove } from "./llm-api.ts";

let gameState: GameState = initialGameState;
const originalSize = 8;
const headerOffset = 1;
const columnsNum = originalSize + headerOffset * 2;
const maxColumnIndex = columnsNum - 1;
const rowsNum = columnsNum;
const maxRowIndex = rowsNum - 1;

const emptyCell: string = "*";
const columnSeparator: string = "   ";
const rowSeparator: string = "\n\n";

const playerColor = "w";

export const stringifyState = (state: GameState, flip?: boolean) => {
  const chessGrid: string[][] = Array(rowsNum)
    .fill(null)
    .map(() => Array(columnsNum).fill(emptyCell));

  for (let row = 0; row < rowsNum; row++) {
    for (let column = 0; column < columnsNum; column++) {
      const rowIndex = flip ? row : maxRowIndex - row;
      // Handle header sections
      if (
        row === 0 ||
        row === maxRowIndex ||
        column === 0 ||
        column === maxColumnIndex
      ) {
        const header =
          (column === 0 || column === maxColumnIndex) &&
          row !== 0 &&
          row !== maxRowIndex
            ? String(row)
            : (row === 0 || row === maxRowIndex) &&
                column !== 0 &&
                column !== maxColumnIndex
              ? columnsString[column - 1]
              : undefined;
        if (header) chessGrid[rowIndex][column] = header;
        continue;
      }

      // Handle pieces
      const piece =
        state.pieces[
          stringifyPosition({
            row: row - headerOffset,
            column: column - headerOffset,
          })
        ];
      if (!piece) continue;
      const { color, type } = parsePiece(piece);
      const letter = type === "knight" ? "n" : type[0];
      chessGrid[rowIndex][column] =
        color === "w" ? letter.toUpperCase() : letter;
    }
  }

  return chessGrid
    .map((columns) => columns.join(columnSeparator))
    .join(rowSeparator);
};

export const playChess = async () => {
  let performedWrongMove = false;
  while (true) {
    const playingColor = getPlayingColor(gameState);

    const possibleMoves = getAllPossibleMoves(gameState, playingColor);

    if (possibleMoves.length === 0) return console.log("Game over");
    const message = `
      Board state:\n${stringifyState(gameState)}
      Possible moves (${playingColor}):\n${possibleMoves}
      `;
    const isAiMove = playingColor !== playerColor;
    if (!performedWrongMove && !isAiMove) {
      console.log(message);
    }
    const input = isAiMove
      ? await getChessMove({
          prompt: `${message}\nEnter your move:`,
          possibleMoves: possibleMoves as [string, ...string[]],
        })
      : prompt("Enter your move:\n");
    if (input) {
      if (isAiMove) console.log(`AI move: ${input}`);
      performedWrongMove = false;
      const [from, to] = input.split("_");
      gameState = progressGame(gameState, {
        position: from as Position,
        moveTo: to as Position,
      });
    } else {
      performedWrongMove = true;
      console.log("Invalid move");
    }
  }
};

if (import.meta.main) {
  playChess();
}
