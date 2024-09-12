import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  columnsString,
  GameState,
  getPieceMoves,
  getPlayingColor,
  initialGameState,
  parsePiece,
  PieceColor,
  PieceType,
  Position,
  progressGame,
  stringifyPosition,
} from "./chess.ts";
import { twMerge } from "tailwind-merge";
import boardImage from "./assets/chess_board.png";
import pieceImage from "./assets/chess_pieces.png";
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
    <div
      className="absolute inset-0 items-center flex"
      style={{ padding: 410 }}
    >
      <div className="relative flex-1">
        <img
          src={boardImage}
          className="absolute w-full h-full object-contain self-center image-rendering-pixelated"
          alt="Board"
        />
        <div className="isometric w-full h-full object-contain aspect-square">
          {chessGrid.map((array, row) => {
            return (
              <div key={row} className="flex flex-row flex-1">
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
                  const isDestination =
                    selectedPiece && positions?.includes(position);
                  const canBeSelected = piece && color === playingColor;
                  return (
                    <div
                      className={twMerge(
                        "border",
                        "aspect-square flex-1 flex items-center justify-center relative",
                        canBeSelected && "bg-yellow-500 bg-opacity-50",
                        (canBeSelected || isDestination) && "cursor-pointer",
                      )}
                      key={column}
                      onClick={() => {
                        if (isDestination) {
                          setGameState((state) =>
                            progressGame(state, {
                              position: selectedPiece,
                              moveTo: position,
                            }),
                          );
                        } else {
                          if (!canBeSelected) return;
                          setSelectedPiece(position);
                        }
                      }}
                    >
                      <span
                        className={twMerge(
                          "font-bold text-3xl absolute",
                          header
                            ? "text-white"
                            : color === "b"
                              ? "text-black"
                              : "text-white",
                          selectedPiece === position && "bg-blue-700",
                        )}
                      >
                        {header || type}
                      </span>
                      {type && color && <Piece type={type} color={color} />}
                      {selectedPiece && positions?.includes(position) && (
                        <div className="absolute inset-0 bg-blue-700 opacity-50 cursor-pointer" />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const Piece = ({ type, color }: { type: PieceType; color: PieceColor }) => {
  let offset = 1;
  if (type === "rook") offset = 1;
  if (type === "knight") offset = 2;
  if (type === "bishop") offset = 4;
  if (type === "queen") offset = 6;
  if (type === "king") offset = 7;
  if (color === "w") offset += 8;
  return (
    <div
      className="image-rendering-pixelated"
      style={{
        width: 11,
        height: 30,
        transform: "scale(4)",
        overflow: "hidden",
        display: "inline-block",
      }}
    >
      <img
        src={pieceImage}
        alt={"Piece"}
        className="object-none w-auto h-auto max-w-none max-h-none"
        style={{
          marginLeft: -offset * 11,
        }}
      />
    </div>
  );
};

export default App;
