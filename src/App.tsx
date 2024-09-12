import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  columnsString,
  GameState,
  getAllAvailableMovePositions,
  getPieceMoves,
  getPlayingColor,
  initialGameState,
  parsePiece,
  Position,
  progressGame,
  stringifyPosition,
} from "../chess.ts";
import { twMerge } from "tailwind-merge";

const chessGrid: null[][] = Array(10).fill(Array(10).fill(null));

function App() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [selectedPiece, setSelectedPiece] = useState<Position>();
  const playingColor = getPlayingColor(gameState);
  const positions =
    selectedPiece &&
    getPieceMoves(gameState, selectedPiece)?.map(({ moveTo }) => moveTo);

  const onEscPress = useCallback(() => {
    setSelectedPiece(undefined);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscPress();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEscPress]);

  return (
    <>
      {chessGrid.map((array, row) => {
        return (
          <div key={row} className="flex flex-row">
            {array.map((_, column) => {
              const header =
                (column === 0 || column === 9) && row !== 0 && row !== 9
                  ? 9 - row
                  : (row === 0 || row === 9) && column !== 0 && column !== 9
                    ? columnsString[column - 1]
                    : undefined;
              const position = stringifyPosition({
                row: 9 - row - 1,
                column: column - 1,
              });
              const piece = gameState.pieces[position];
              const { type, color } = (piece && parsePiece(piece)) ?? {};
              return (
                <div
                  className="w-20 h-20 bg-red-400 border flex items-center justify-center relative"
                  key={column}
                >
                  <span
                    onClick={() => {
                      if (!piece || color !== playingColor) return;
                      setSelectedPiece(position);
                    }}
                    className={twMerge(
                      "font-bold",
                      piece && "cursor-pointer",
                      header
                        ? "text-blue-700"
                        : color === "b"
                          ? "text-black"
                          : "text-white",
                      selectedPiece === position && "bg-blue-700",
                    )}
                  >
                    {header || type}
                  </span>
                  {selectedPiece && positions?.includes(position) && (
                    <div
                      onClick={() => {
                        setGameState((state) =>
                          progressGame(state, {
                            position: selectedPiece,
                            moveTo: position,
                          }),
                        );
                      }}
                      className="absolute inset-0 bg-blue-700 opacity-50 cursor-pointer"
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

export default App;
