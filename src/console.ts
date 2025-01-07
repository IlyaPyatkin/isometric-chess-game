import {
  GameState,
  getAllPossibleMoves,
  getPlayingColor,
  initialGameState,
  Position,
  progressGame,
  stringifyState,
} from "./chess.ts";
import { getChessMove } from "./llm-api.ts";

let gameState: GameState = initialGameState;

const playerColor = "w";

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
