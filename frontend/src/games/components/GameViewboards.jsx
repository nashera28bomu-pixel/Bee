import React, { useState, useEffect, useRef } from "react";
import { LudoAI, SnakeAI, BingoAI, WordAI } from "../AI/LocalAI";

// =======================================================
// 🎮 CYMOR ULTRA GAME VIEWBOARDS ENGINE
// =======================================================

// =======================================================
// 🎲 1. LUDO CYBER ARENA
// =======================================================
export function LudoViewboard({ isSolo, socket, room }) {

  const BOARD_SIZE = 36;

  const [diceRoll, setDiceRoll] = useState("🎲");

  const [isRolling, setIsRolling] = useState(false);

  const [turn, setTurn] = useState("PLAYER");

  const [winner, setWinner] = useState(null);

  const [tokens, setTokens] = useState([
    { pos: 0, color: "from-red-500 to-pink-500" },
    { pos: 3, color: "from-cyan-500 to-blue-500" },
    { pos: 6, color: "from-emerald-500 to-green-500" },
    { pos: 9, color: "from-yellow-400 to-orange-500" },
  ]);

  // =======================================================
  // 🎲 DICE ENGINE
  // =======================================================
  const rollDice = () => {

    if (isRolling || turn !== "PLAYER") return;

    setIsRolling(true);

    let spins = 0;

    const interval = setInterval(() => {

      setDiceRoll(Math.floor(Math.random() * 6) + 1);

      spins++;

      if (spins >= 12) {

        clearInterval(interval);

        const finalRoll =
          Math.floor(Math.random() * 6) + 1;

        setDiceRoll(finalRoll);

        setTokens((prev) => {

          const updated = [...prev];

          updated[0].pos =
            (updated[0].pos + finalRoll) %
            BOARD_SIZE;

          return updated;
        });

        setIsRolling(false);

        if (isSolo) {

          setTurn("AI");

          setTimeout(() => {

            const aiRoll =
              Math.floor(Math.random() * 6) + 1;

            setTokens((prev) => {

              const updated = [...prev];

              updated[1].pos =
                (updated[1].pos + aiRoll) %
                BOARD_SIZE;

              return updated;
            });

            setTurn("PLAYER");

          }, 1400);
        }
      }
    }, 90);
  };

  // =======================================================
  // 🏆 WIN DETECTION
  // =======================================================
  useEffect(() => {

    if (tokens[0].pos >= 35) {
      setWinner("YOU WON");
    }

    if (tokens[1].pos >= 35) {
      setWinner("AI WON");
    }

  }, [tokens]);

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* =======================================================
          🎮 BOARD
      ======================================================= */}

      <div className="lg:col-span-2 relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 via-black to-slate-950 shadow-[0_0_60px_rgba(99,102,241,0.25)]">

        {/* GRID */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
          {Array(36)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="border border-white/[0.03] bg-white/[0.01]"
              />
            ))}
        </div>

        {/* GLOW */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-44 h-44 rounded-full bg-indigo-500/20 blur-[100px]" />
        </div>

        {/* TOKENS */}
        {tokens.map((t, idx) => (

          <div
            key={idx}
            className={`absolute w-10 h-10 rounded-full bg-gradient-to-tr ${t.color} border-2 border-white flex items-center justify-center text-xs font-black shadow-2xl transition-all duration-500 hover:scale-110`}
            style={{
              left: `${(t.pos % 6) * 16.3 + 2.5}%`,
              top: `${Math.floor(t.pos / 6) * 16.3 + 2.5}%`,
            }}
          >
            {idx + 1}
          </div>

        ))}

        {/* WINNER */}
        {winner && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-50">

            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent mb-4">
              {winner}
            </h1>

            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 font-black uppercase tracking-wider"
            >
              Restart Match
            </button>

          </div>
        )}

      </div>

      {/* =======================================================
          🎛 HUD
      ======================================================= */}

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 flex flex-col justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Tactical Status
          </p>

          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mt-2">
            {turn === "PLAYER"
              ? "YOUR TURN"
              : "AI THINKING"}
          </h1>

        </div>

        {/* DICE */}
        <div className="flex justify-center my-10">

          <div
            className={`w-32 h-32 rounded-[2rem] flex items-center justify-center text-5xl font-black border border-indigo-500/30 bg-gradient-to-br from-slate-800 to-black shadow-[0_0_40px_rgba(99,102,241,0.25)] ${
              isRolling
                ? "animate-spin"
                : "animate-pulse"
            }`}
          >
            {diceRoll}
          </div>

        </div>

        {/* BUTTON */}
        <button
          onClick={rollDice}
          disabled={isRolling}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
        >
          {isRolling
            ? "Computing..."
            : "Roll Dice"}
        </button>

      </div>
    </div>
  );
}

// =======================================================
// 🔢 2. CYBER BINGO X
// =======================================================
export function BingoViewboard() {

  const [card, setCard] = useState([]);

  const [calledNumbers, setCalledNumbers] = useState([]);

  const [currentCall, setCurrentCall] =
    useState("--");

  const [score, setScore] = useState(0);

  // =======================================================
  // 🎲 GENERATE CARD
  // =======================================================
  useEffect(() => {

    const nums = Array.from(
      { length: 75 },
      (_, i) => i + 1
    ).sort(() => Math.random() - 0.5);

    const board = Array(5)
      .fill(null)
      .map((_, r) =>
        Array(5)
          .fill(null)
          .map((_, c) => {

            if (r === 2 && c === 2) {
              return {
                value: "FREE",
                marked: true,
              };
            }

            return {
              value: nums.pop(),
              marked: false,
            };
          })
      );

    setCard(board);

  }, []);

  // =======================================================
  // 🎯 DRAW NUMBER
  // =======================================================
  const drawNumber = () => {

    let num;

    do {
      num =
        Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(num));

    setCurrentCall(num);

    setCalledNumbers((prev) => [num, ...prev]);

  };

  // =======================================================
  // ✅ TOGGLE
  // =======================================================
  const toggleCell = (r, c) => {

    setCard((prev) =>
      prev.map((row, ri) =>
        row.map((cell, ci) => {

          if (ri === r && ci === c) {

            if (!cell.marked) {
              setScore((s) => s + 10);
            }

            return {
              ...cell,
              marked: !cell.marked,
            };
          }

          return cell;
        })
      )
    );
  };

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* BOARD */}
      <div className="lg:col-span-2 grid grid-cols-5 gap-3 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-2xl p-5">

        {card.map((row, r) =>
          row.map((cell, c) => (

            <div
              key={`${r}-${c}`}
              onClick={() => toggleCell(r, c)}
              className={`aspect-square rounded-2xl border flex items-center justify-center text-lg md:text-2xl font-black transition-all duration-300 cursor-pointer ${
                cell.marked
                  ? "bg-gradient-to-br from-emerald-500 to-cyan-500 border-white text-white scale-95 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
              }`}
            >
              {cell.value}
            </div>

          ))
        )}

      </div>

      {/* HUD */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 flex flex-col justify-between">

        <div className="text-center">

          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-3">
            Current Call
          </p>

          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center text-4xl font-black text-black animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.35)]">
            {currentCall}
          </div>

        </div>

        {/* SCORE */}
        <div className="my-8 text-center">

          <p className="text-xs uppercase tracking-widest text-slate-500">
            Score
          </p>

          <h1 className="text-5xl font-black text-emerald-400">
            {score}
          </h1>

        </div>

        {/* HISTORY */}
        <div className="rounded-2xl bg-black/30 border border-white/5 p-4 mb-5 max-h-[180px] overflow-y-auto">

          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            History
          </p>

          <div className="flex flex-wrap gap-2">

            {calledNumbers.map((n, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-lg bg-white/[0.04] text-xs"
              >
                {n}
              </span>
            ))}

          </div>

        </div>

        {/* BUTTON */}
        <button
          onClick={drawNumber}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all"
        >
          Draw Number
        </button>

      </div>
    </div>
  );
}

// =======================================================
// 🐍 3. ULTRA SNAKE ENGINE
// =======================================================
export function SnakeViewboard() {

  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);

  const [gameOver, setGameOver] =
    useState(false);

  const [speed, setSpeed] = useState(120);

  const state = useRef({
    snake: [{ x: 10, y: 10 }],
    food: { x: 5, y: 5 },
    dx: 1,
    dy: 0,
  });

  const GRID = 20;

  // =======================================================
  // 🎮 CONTROLS
  // =======================================================
  useEffect(() => {

    const handleKey = (e) => {

      const s = state.current;

      if (e.key === "ArrowUp" && s.dy === 0) {
        s.dx = 0;
        s.dy = -1;
      }

      if (e.key === "ArrowDown" && s.dy === 0) {
        s.dx = 0;
        s.dy = 1;
      }

      if (e.key === "ArrowLeft" && s.dx === 0) {
        s.dx = -1;
        s.dy = 0;
      }

      if (e.key === "ArrowRight" && s.dx === 0) {
        s.dx = 1;
        s.dy = 0;
      }
    };

    window.addEventListener("keydown", handleKey);

    return () =>
      window.removeEventListener(
        "keydown",
        handleKey
      );

  }, []);

  // =======================================================
  // 🧠 GAME LOOP
  // =======================================================
  useEffect(() => {

    if (gameOver) return;

    const loop = setInterval(() => {

      const s = state.current;

      const head = {
        x: s.snake[0].x + s.dx,
        y: s.snake[0].y + s.dy,
      };

      // COLLISION
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= GRID ||
        head.y >= GRID ||
        s.snake.some(
          (seg) =>
            seg.x === head.x &&
            seg.y === head.y
        )
      ) {
        setGameOver(true);
        return;
      }

      s.snake.unshift(head);

      // FOOD
      if (
        head.x === s.food.x &&
        head.y === s.food.y
      ) {

        setScore((p) => p + 10);

        setSpeed((prev) =>
          Math.max(prev - 3, 60)
        );

        s.food = {
          x: Math.floor(
            Math.random() * GRID
          ),
          y: Math.floor(
            Math.random() * GRID
          ),
        };

      } else {
        s.snake.pop();
      }

      draw();

    }, speed);

    return () => clearInterval(loop);

  }, [speed, gameOver]);

  // =======================================================
  // 🎨 DRAW ENGINE
  // =======================================================
  const draw = () => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // BACKGROUND
    ctx.fillStyle = "#020617";
    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // GRID
    ctx.strokeStyle = "rgba(255,255,255,0.03)";

    for (let i = 0; i < GRID; i++) {

      ctx.beginPath();
      ctx.moveTo(i * 20, 0);
      ctx.lineTo(i * 20, 400);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * 20);
      ctx.lineTo(400, i * 20);
      ctx.stroke();
    }

    const s = state.current;

    // FOOD
    ctx.fillStyle = "#06b6d4";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#06b6d4";

    ctx.fillRect(
      s.food.x * 20,
      s.food.y * 20,
      18,
      18
    );

    // SNAKE
    s.snake.forEach((seg, i) => {

      ctx.fillStyle =
        i === 0
          ? "#10b981"
          : "#34d399";

      ctx.shadowBlur =
        i === 0 ? 25 : 0;

      ctx.fillRect(
        seg.x * 20,
        seg.y * 20,
        18,
        18
      );
    });

    ctx.shadowBlur = 0;
  };

  // MOBILE BTN
  const move = (dx, dy) => {
    state.current.dx = dx;
    state.current.dy = dy;
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6">

      {/* TOP */}
      <div className="w-full flex justify-between items-center mb-5">

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500">
            Snake Score
          </p>

          <h1 className="text-4xl font-black text-emerald-400">
            {score}
          </h1>

        </div>

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500">
            Speed
          </p>

          <h1 className="text-2xl font-black text-cyan-400">
            {speed}ms
          </h1>

        </div>

      </div>

      {/* CANVAS */}
      <div className="relative rounded-[2rem] overflow-hidden border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]">

        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="bg-black"
        />

        {gameOver && (

          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">

            <h1 className="text-5xl font-black text-rose-500 mb-4">
              GAME OVER
            </h1>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 font-black uppercase"
            >
              Restart
            </button>

          </div>

        )}

      </div>

      {/* MOBILE CONTROLS */}
      <div className="grid grid-cols-3 gap-3 mt-8">

        <div />

        <button
          onClick={() => move(0, -1)}
          className="w-16 h-16 rounded-2xl bg-white/[0.05]"
        >
          ↑
        </button>

        <div />

        <button
          onClick={() => move(-1, 0)}
          className="w-16 h-16 rounded-2xl bg-white/[0.05]"
        >
          ←
        </button>

        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20" />

        <button
          onClick={() => move(1, 0)}
          className="w-16 h-16 rounded-2xl bg-white/[0.05]"
        >
          →
        </button>

        <div />

        <button
          onClick={() => move(0, 1)}
          className="w-16 h-16 rounded-2xl bg-white/[0.05]"
        >
          ↓
        </button>

        <div />

      </div>
    </div>
  );
}

// =======================================================
// 📝 WORD MATRIX X
// =======================================================
export function WordViewboard() {

  const [letters] = useState("CYMOR");

  const [input, setInput] = useState("");

  const [words, setWords] = useState([]);

  const [timer, setTimer] = useState(60);

  const [score, setScore] = useState(0);

  // TIMER
  useEffect(() => {

    if (timer <= 0) return;

    const countdown = setTimeout(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearTimeout(countdown);

  }, [timer]);

  // SUBMIT
  const submitWord = (e) => {

    e.preventDefault();

    const clean =
      input.trim().toUpperCase();

    const valid =
      WordAI.solveAnagrams(letters, [
        "CYMOR",
        "CRY",
        "MY",
        "ROOM",
        "COY",
      ]);

    if (
      valid.includes(clean) &&
      !words.includes(clean)
    ) {

      setWords((prev) => [...prev, clean]);

      setScore((s) => s + clean.length * 10);

      setInput("");

    }
  };

  return (
    <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8">

      {/* TOP */}
      <div className="flex justify-between items-center mb-8">

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500">
            Time Left
          </p>

          <h1
            className={`text-4xl font-black ${
              timer < 15
                ? "text-rose-500 animate-pulse"
                : "text-cyan-400"
            }`}
          >
            {timer}s
          </h1>

        </div>

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500">
            Score
          </p>

          <h1 className="text-4xl font-black text-emerald-400">
            {score}
          </h1>

        </div>

      </div>

      {/* LETTERS */}
      <div className="flex justify-center gap-4 mb-8">

        {letters.split("").map((l, i) => (

          <div
            key={i}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-black shadow-[0_0_30px_rgba(168,85,247,0.35)]"
          >
            {l}
          </div>

        ))}

      </div>

      {/* INPUT */}
      <form
        onSubmit={submitWord}
        className="flex gap-3 mb-8"
      >

        <input
          value={input}
          onChange={(e) =>
            setInput(
              e.target.value.toUpperCase()
            )
          }
          placeholder="TYPE WORD..."
          className="flex-1 px-5 py-4 rounded-2xl bg-black/30 border border-white/10 outline-none focus:border-purple-500"
        />

        <button
          type="submit"
          className="px-8 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 font-black uppercase tracking-widest"
        >
          Submit
        </button>

      </form>

      {/* WORDS */}
      <div className="rounded-2xl bg-black/30 border border-white/5 p-5 min-h-[120px]">

        <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
          Solved Words
        </p>

        <div className="flex flex-wrap gap-3">

          {words.map((w, i) => (

            <span
              key={i}
              className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold animate-pulse"
            >
              ✓ {w}
            </span>

          ))}

        </div>

      </div>
    </div>
  );
    }
