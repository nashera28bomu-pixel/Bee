import React, { useState, useEffect, useRef } from 'react';
import { LudoAI, SnakeAI, BingoAI, WordAI } from '../AI/LocalAI';

// ==========================================
// 🎲 1. LUDO ARENA VIEWBOARD
// ==========================================
export function LudoViewboard({ isSolo, socket, room }) {
  const [diceRoll, setDiceRoll] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [tokens, setTokens] = useState([0, 0, 0, 0]); // AI tokens could be added similarly
  const [currentTurn, setCurrentTurn] = useState(true);

  const triggerDiceRoll = () => {
    if (isRolling || !currentTurn) return;
    setIsRolling(true);
    
    // Smooth cinematic shuffle animation
    let counter = 0;
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(finalRoll);
        setIsRolling(false);
        
        if (isSolo && finalRoll !== 6 && tokens.every(p => p === 0)) {
          // If solo and no moves possible, pass turn to AI smoothly
          setCurrentTurn(false);
          setTimeout(() => handleAiTurn(finalRoll), 1200);
        }
      }
    }, 80);
  };

  const handleAiTurn = (playerRoll) => {
    // Simulate smart Ludo AI calculation pathing
    const aiTokens = [0, 10, 24, 0]; 
    const bestMove = LudoAI.evaluateBestMove(aiTokens, { user: tokens }, playerRoll, [0, 1, 9, 14, 22], 57);
    console.log(`AI chose token node asset: ${bestMove}`);
    setCurrentTurn(true);
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
      {/* Dynamic Token Track Mapping Grid */}
      <div className="md:col-span-2 aspect-square max-w-[450px] mx-auto bg-slate-900/80 rounded-2xl border border-white/5 relative p-2 grid grid-cols-15 gap-0.5 shadow-inner">
        {/* Visual placeholders representing classic cross quadrants */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-700">Cymor Core Matrix Grid</div>
        </div>
        {/* Simple rendering map overlay of player's tokens */}
        {tokens.map((pos, idx) => (
          <div 
            key={idx} 
            onClick={() => pos > 0 || diceRoll === 6 ? setTokens(prev => { const n=[...prev]; n[idx]+=diceRoll; return n; }) : null}
            className={`absolute bottom-6 left-${6 + idx * 8} w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 border-2 border-white flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-500/50 cursor-pointer transform hover:scale-110 active:scale-95 transition values-all`}
          >
            T{idx+1}
          </div>
        ))}
      </div>

      {/* Control Console */}
      <div className="flex flex-col justify-between p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
        <div>
          <h4 className="text-sm font-semibold tracking-widest uppercase text-indigo-400 font-mono mb-1">Tactical HUD</h4>
          <p className="text-xs text-slate-400">Status: {currentTurn ? "Your Turn" : "AI Processing"}</p>
        </div>

        {/* Breathtaking Glowing Dice Element */}
        <div className="my-8 flex justify-center">
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-indigo-500/40 flex items-center justify-center text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300 shadow-2xl shadow-indigo-500/10 ${isRolling ? 'animate-bounce' : ''}`}>
            {diceRoll || '🎲'}
          </div>
        </div>

        <button
          onClick={triggerDiceRoll}
          disabled={!currentTurn || isRolling}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-bold text-sm tracking-wider uppercase text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          {isRolling ? "Computing..." : "Roll Matrix Particle"}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 🔢 2. BINGO NEXUS VIEWBOARD
// ==========================================
export function BingoViewboard({ isSolo }) {
  const [card, setCard] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentCall, setCurrentCall] = useState(null);

  useEffect(() => {
    // Generate traditional clean matrix parameters seamlessly
    let pool = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let initialCard = Array(5).fill(null).map((_, r) => 
      Array(5).fill(null).map((_, c) => {
        if (r === 2 && c === 2) return { value: "FREE", marked: true };
        return { value: pool.pop(), marked: false };
      })
    );
    setCard(initialCard);
  }, []);

  const drawNumber = () => {
    let nextNum;
    do {
      nextNum = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(nextNum) && calledNumbers.length < 75);

    setCurrentCall(nextNum);
    setCalledNumbers(prev => [nextNum, ...prev]);
  };

  const toggleCell = (r, c) => {
    setCard(prev => prev.map((row, ri) => row.map((cell, ci) => {
      if (ri === r && ci === c) {
        return { ...cell, marked: !cell.marked };
      }
      return cell;
    })));
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
      {/* 5x5 Matrix Screen */}
      <div className="md:col-span-2 grid grid-cols-5 gap-3 p-2 bg-slate-950/60 rounded-2xl border border-white/5">
        {card.map((row, r) => row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            onClick={() => toggleCell(r, c)}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center font-mono font-bold transition-all duration-300 cursor-pointer ${
              cell.marked 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-[0.98]' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <span className="text-lg md:text-2xl">{cell.value}</span>
          </div>
        )))}
      </div>

      {/* Side HUD Display Panels */}
      <div className="flex flex-col justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
        <div className="text-center">
          <h4 className="text-xs font-semibold tracking-widest text-slate-400 uppercase font-mono mb-4">Ball Call Dropper</h4>
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-2xl font-black text-slate-950 shadow-xl shadow-emerald-500/20 animate-pulse">
            {currentCall || '--'}
          </div>
        </div>

        <div className="my-6 flex-1 overflow-y-auto max-h-[150px] p-2 bg-black/20 rounded-xl border border-white/5 font-mono text-xs text-slate-500">
          <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider">History Log:</div>
          <div className="flex flex-wrap gap-1.5">
            {calledNumbers.map((n, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300">{n}</span>)}
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={drawNumber} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-widest text-slate-300 transition">
            Draw Call Vector
          </button>
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition">
            Declare BINGO!
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🐍 3. SNAKE ARCADE VIEWBOARD
// ==========================================
export function SnakeViewboard() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Internal mutable engine parameters
  const grid = 20;
  const state = useRef({
    snake: [{ x: 10, y: 10 }],
    food: { x: 5, y: 5 },
    dx: 1,
    dy: 0,
    gameLoop: null
  });

  useEffect(() => {
    const handleKeys = (e) => {
      const s = state.current;
      if (e.key === 'ArrowUp' && s.dy === 0) { s.dx = 0; s.dy = -1; }
      if (e.key === 'ArrowDown' && s.dy === 0) { s.dx = 0; s.dy = 1; }
      if (e.key === 'ArrowLeft' && s.dx === 0) { s.dx = -1; s.dy = 0; }
      if (e.key === 'ArrowRight' && s.dx === 0) { s.dx = 1; s.dy = 0; }
    };
    window.addEventListener('keydown', handleKeys);
    
    // Start interval
    state.current.gameLoop = setInterval(updateFrame, 110);

    return () => {
      window.removeEventListener('keydown', handleKeys);
      clearInterval(state.current.gameLoop);
    };
  }, [gameOver]);

  const updateFrame = () => {
    if (gameOver) return;
    const s = state.current;
    
    // Calculate heading shifting step
    const head = { x: s.snake[0].x + s.dx, y: s.snake[0].y + s.dy };
    
    // Wall and self collision limits
    if (head.x < 0 || head.y < 0 || head.x >= grid || head.y >= grid || s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      setGameOver(true);
      clearInterval(s.gameLoop);
      return;
    }

    s.snake.unshift(head);

    // Food collision ingestion validation check
    if (head.x === s.food.x && head.y === s.food.y) {
      setScore(p => p + 10);
      s.food = {
        x: Math.floor(Math.random() * grid),
        y: Math.floor(Math.random() * grid)
      };
    } else {
      s.snake.pop();
    }

    // Canvas Frame Refresh
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw glowing neon food vector
    ctx.fillStyle = '#f43f5e';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e';
    ctx.fillRect(s.food.x * 20, s.food.y * 20, 18, 18);

    // Draw cybernetic snake node tracks
    s.snake.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#10b981' : '#34d399';
      ctx.shadowBlur = i === 0 ? 20 : 0;
      ctx.shadowColor = '#10b981';
      ctx.fillRect(segment.x * 20, segment.y * 20, 18, 18);
    });
    ctx.shadowBlur = 0; // reset
  };

  return (
    <div className="flex flex-col items-center p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
      <div className="w-full flex justify-between items-center mb-4 px-2 font-mono text-sm">
        <span className="text-slate-400">MULTIPLIER PAYLOAD: <span className="text-emerald-400">{(score/100)+1}x</span></span>
        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">SCORE: {score}</span>
      </div>

      <div className="relative border border-emerald-500/30 rounded-2xl p-1 bg-slate-950/80 shadow-2xl shadow-emerald-500/5">
        <canvas ref={canvasRef} width={400} height={400} className="rounded-xl" />
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center p-6">
            <h3 className="text-2xl font-black text-rose-500 uppercase tracking-widest mb-1">Grid Impact Termination</h3>
            <p className="text-xs text-slate-400 font-mono mb-6">Core system parameters completely forced offline.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-widest text-slate-200 hover:bg-white/10 transition">
              Re-engage Core Matrix
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 📝 4. WORD MATRIX VIEWBOARD
// ==========================================
export function WordViewboard() {
  const [levelData, setLevelData] = useState({ scrambled: "YORCM", words: [] });
  const [inputValue, setInputValue] = useState("");
  const [solvedWords, setSolvedWords] = useState([]);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  const handleVerifyWordSubmit = (e) => {
    e.preventDefault();
    const clean = inputValue.trim().toUpperCase();
    
    // Call our lightweight regex/array system tracking engine
    const check = WordAI.solveAnagrams(levelData.scrambled, ["CYMOR", "CRY", "MY"]);
    
    if (check.includes(clean) && !solvedWords.includes(clean)) {
      setSolvedWords(p => [...p, clean]);
      setInputValue("");
    }
  };

  return (
    <div className="w-full max-w-xl p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8 font-mono text-xs text-slate-400">
        <span>MATRIX DECAY: <span className={timer < 15 ? 'text-rose-500 animate-pulse font-bold' : 'text-purple-400'}>{timer}s</span></span>
        <span>VERIFIED ENTRIES: <span className="text-purple-400">{solvedWords.length}</span></span>
      </div>

      {/* Breathtaking Scrambled Letter Cluster Blocks */}
      <div className="flex gap-3 mb-8">
        {levelData.scrambled.split('').map((char, i) => (
          <div key={i} className="w-14 h-14 rounded-xl bg-gradient-to-b from-purple-500/10 to-pink-500/5 border border-purple-500/30 shadow-xl flex items-center justify-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 transform hover:scale-105 transition duration-200">
            {char}
          </div>
        ))}
      </div>

      <form onSubmit={handleVerifyWordSubmit} className="w-full flex gap-2 mb-6">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toUpperCase())}
          placeholder="Compile String Matrix..."
          className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-slate-200 font-mono tracking-widest focus:outline-none focus:border-purple-500 transition placeholder:font-sans placeholder:tracking-normal text-sm"
        />
        <button type="submit" className="px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-purple-500/10">
          Inject
        </button>
      </form>

      {/* Discovered Words Track Registry */}
      <div className="w-full p-4 bg-black/20 border border-white/5 rounded-xl min-h-[80px]">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Compiled Data:</div>
        <div className="flex flex-wrap gap-2">
          {solvedWords.map((w, idx) => (
            <span key={idx} className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 font-mono text-xs text-purple-300 animate-fade-in">
              ✓ {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
