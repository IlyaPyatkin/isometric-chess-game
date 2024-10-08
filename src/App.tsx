import { useCallback, useEffect, useRef, useState } from "react";
import {
  columnsString,
  GameState,
  getPlayingColor,
  getPositionsUnderAttack,
  getValidPieceMoves,
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
  const positionsUnderAttack = getPositionsUnderAttack(gameState, playingColor);
  const possibleMoves =
    selectedPiece && getValidPieceMoves(gameState, selectedPiece, playingColor);

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

  const [points, setPoints] = useState<
    Partial<Record<Position, { x: number; y: number }>>
  >({});

  return (
    <>
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
                        : (row === 0 || row === 9) &&
                            column !== 0 &&
                            column !== 9
                          ? columnsString[column - 1]
                          : undefined;
                    const position = stringifyPosition({
                      row: 9 - row - 1,
                      column: column - 1,
                    });
                    const piece = gameState.pieces[position];
                    const { color } = (piece && parsePiece(piece)) ?? {};
                    const isPossibleMove =
                      selectedPiece && possibleMoves?.includes(position);
                    const canBeSelected = piece && color === playingColor;
                    return (
                      <div
                        style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
                        className={twMerge(
                          "border",
                          "aspect-square flex-1 flex items-center justify-center relative",
                        )}
                        key={column}
                        onClick={() => {
                          if (isPossibleMove) {
                            setSelectedPiece(undefined);
                            setGameState((state) => {
                              try {
                                state = progressGame(state, {
                                  position: selectedPiece,
                                  moveTo: position,
                                });
                              } catch (e) {
                                console.error(e);
                                if (
                                  typeof e === "object" &&
                                  e &&
                                  "message" in e
                                )
                                  alert(e.message);
                              }
                              return state;
                            });
                          } else {
                            if (!canBeSelected) return;
                            setSelectedPiece(position);
                          }
                        }}
                      >
                        {header && (
                          <span className="font-bold text-3xl absolute text-white">
                            {header}
                          </span>
                        )}
                        <PointCatcher
                          setPoint={(point) =>
                            setPoints((points) => {
                              points = { ...points };
                              points[position] = point;
                              return points;
                            })
                          }
                        />
                        {selectedPiece === position && (
                          <div className="absolute inset-0 opacity-50 bg-red-500" />
                        )}
                        {positionsUnderAttack.includes(position) && (
                          <div className="absolute inset-0 opacity-50 bg-purple-700" />
                        )}
                        {isPossibleMove && (
                          <div className="absolute inset-0 opacity-50 bg-blue-700 cursor-pointer" />
                        )}
                        {canBeSelected && (
                          <div className="absolute inset-0 opacity-50 bg-yellow-500 cursor-pointer" />
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

      {(Object.entries(points) as [Position, { x: number; y: number }][]).map(
        ([position, point], index) => {
          const piece = gameState.pieces[position];
          const { type, color } = (piece && parsePiece(piece)) ?? {};
          return !point ? null : (
            <div
              key={index}
              className="absolute items-center justify-center flex"
              style={{ left: point.x, top: point.y, width: 10, height: 10 }}
            >
              {type && color && <Piece type={type} color={color} />}
            </div>
          );
        },
      )}
    </>
  );
}

const PointCatcher = ({
  setPoint,
}: {
  setPoint: (point: { x: number; y: number }) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rect = ref.current?.getClientRects();
    if (!rect) return;
    const { x, y } = rect[0];
    setPoint({ x, y });
  }, []);

  return (
    <div
      ref={ref}
      className={twMerge(
        // "bg-blue-700",
        "w-1 h-1 absolute left-[95px] top-[-60px]",
      )}
    />
  );
};

const Piece = ({ type, color }: { type: PieceType; color: PieceColor }) => {
  let offset = 0;
  if (type === "rook") offset = 1;
  if (type === "knight") offset = 2;
  if (type === "bishop") offset = 4;
  if (type === "queen") offset = 6;
  if (type === "king") offset = 7;
  if (color === "w") offset += 8;

  return (
    <div
      className="image-rendering-pixelated pointer-events-none"
      style={{
        width: 11,
        height: 30,
        transform: "scale(5)",
        overflow: "hidden",
        display: "inline-block",
      }}
    >
      <img
        src={pieceImage}
        alt={"Piece"}
        className="object-none w-auto h-auto max-w-none max-h-none"
        style={{ marginLeft: -offset * 11 }}
      />
    </div>
  );
};

export default App;
