import { useState } from "react";
import "./App.css";
import { initialGameState, parsePiece, stringifyPosition } from "../index.ts";

const chessGrid: null[][] = Array(8).fill(Array(8).fill(null));

function App() {
  const [gameState, setGameState] = useState(initialGameState);

  return (
    <>
      {chessGrid.map((array, row) => {
        return (
          <div key={row} className="flex flex-row">
            {array.map((_, column) => {
              const piece =
                gameState.pieces[stringifyPosition({ row, column })];
              const { type, color } = (piece && parsePiece(piece)) ?? {};
              return (
                <div
                  className="w-20 h-20 bg-red-400 border flex items-center justify-center"
                  key={column}
                >
                  <span
                    className={
                      "font-bold " + color === "w" ? "text-white" : "text-black"
                    }
                  >
                    {type}
                  </span>
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
