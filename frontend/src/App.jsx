import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Dashboard from "./components/Dashboard";

import {
  LudoViewboard,
  BingoViewboard,
  SnakeViewboard,
  WordViewboard,
} from "./games/components/GameViewboards";

// ======================================================
// 🌐 CYMOR ULTRA NETWORK ENGINE
// ======================================================
const socket = io(window.location.origin, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export default function App() {

  // ======================================================
  // 🎮 PLAYER CORE STATE
  // ======================================================
  const [user] = useState({
    username:
      "Player_" + Math.floor(1000 + Math.random() * 9000),
  });

  const [activeGame, setActiveGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const [systemMessage, setSystemMessage] =
    useState("Initializing Arcade Matrix...");

  const [onlinePlayers, setOnlinePlayers] = useState(1);

  const [ping, setPing] = useState(0);

  const [gameClock, setGameClock] = useState(
    new Date().toLocaleTimeString()
  );

  // ======================================================
  // ⏰ LIVE CLOCK
  // ======================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setGameClock(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ======================================================
  // 🌐 SOCKET EVENTS
  // ======================================================
  useEffect(() => {

    socket.on("connect", () => {
      setSystemMessage("Connected to Cymor Network");
    });

    socket.on("disconnect", () => {
      setSystemMessage("Network disconnected...");
    });

    socket.on("lobby_update", (data) => {
      setLobbyPlayers(data.players);

      setOnlinePlayers(data.players.length);

      setSystemMessage("Lobby synchronized successfully");
    });

    socket.on("game_started", (payload) => {
      console.log("Game started:", payload);

      setSystemMessage("Match launched successfully");

      setTimeout(() => {
        setIsGameStarted(true);
      }, 1200);
    });

    // Fake ping simulation
    const pingInterval = setInterval(() => {
      setPing(Math.floor(Math.random() * 40) + 10);
    }, 2000);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("lobby_update");
      socket.off("game_started");

      clearInterval(pingInterval);
    };
  }, []);

  // ======================================================
  // 🚀 GAME LAUNCHER
  // ======================================================
  const handleLaunchGame = (
    gameType,
    mode,
    roomCode = null
  ) => {

    setActiveGame(gameType);

    setGameMode(mode);

    setSystemMessage(`Launching ${gameType} Engine...`);

    if (mode === "Solo") {

      setTimeout(() => {
        setIsGameStarted(true);
      }, 1000);
    }

    if (mode === "Multiplayer" && roomCode) {

      setCurrentRoom(roomCode);

      socket.emit("join_room", {
        room: roomCode,
        username: user.username,
        gameType,
      });

      setSystemMessage("Searching multiplayer nodes...");
    }
  };

  // ======================================================
  // ❌ TERMINATE SESSION
  // ======================================================
  const terminateSession = () => {

    setActiveGame(null);

    setGameMode(null);

    setCurrentRoom(null);

    setLobbyPlayers([]);

    setIsGameStarted(false);

    setSystemMessage("Arcade session terminated");
  };

  // ======================================================
  // 🎨 APP UI
  // ======================================================
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white font-sans">

      {/* ======================================================
          🌌 ULTRA BACKGROUND FX
      ====================================================== */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%),linear-gradient(to_bottom,#020617,#000000)]" />

      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[140px]" />

      <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px]" />

      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

      {/* ======================================================
          🧠 MAIN SYSTEM
      ====================================================== */}

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ======================================================
            🔥 TOP ELITE NAVBAR
        ====================================================== */}

        <header className="w-full border-b border-white/10 backdrop-blur-2xl bg-black/30">

          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

            {/* LOGO */}
            <div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                CYMOR ARCADE X
              </h1>

              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                Elite Multiplayer Gaming Network
              </p>
            </div>

            {/* LIVE METRICS */}
            <div className="hidden md:flex items-center gap-5">

              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500">
                  Online
                </p>

                <h2 className="font-black text-cyan-400">
                  {onlinePlayers}
                </h2>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500">
                  Ping
                </p>

                <h2 className="font-black text-emerald-400">
                  {ping}ms
                </h2>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500">
                  Time
                </p>

                <h2 className="font-black text-indigo-400">
                  {gameClock}
                </h2>
              </div>

            </div>
          </div>
        </header>

        {/* ======================================================
            🎮 MAIN GAME SECTION
        ====================================================== */}

        <main className="flex-1 flex items-center justify-center p-4 md:p-8">

          {!activeGame ? (

            <div className="w-full animate-fade-in">

              {/* SYSTEM STATUS */}
              <div className="max-w-6xl mx-auto mb-6">

                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 backdrop-blur-xl">

                  <div className="flex items-center gap-3">

                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />

                    <p className="text-sm font-mono text-cyan-200">
                      {systemMessage}
                    </p>

                  </div>
                </div>
              </div>

              {/* DASHBOARD */}
              <Dashboard
                user={user}
                onLaunchGame={handleLaunchGame}
              />
            </div>

          ) : (

            <div className="w-full max-w-7xl flex flex-col items-center">

              {/* ======================================================
                  🎯 ACTIVE SESSION BAR
              ====================================================== */}

              <div className="w-full mb-6 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-4">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  {/* LEFT */}
                  <div>

                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                      Active Game Session
                    </p>

                    <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                      {activeGame}
                    </h1>

                    <div className="flex gap-2 mt-2 flex-wrap">

                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                        {gameMode}
                      </span>

                      {currentRoom && (
                        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
                          ROOM: {currentRoom}
                        </span>
                      )}

                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex gap-3">

                    <button
                      onClick={terminateSession}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
                    >
                      Exit Match
                    </button>

                  </div>
                </div>
              </div>

              {/* ======================================================
                  🎲 GAME OR LOBBY
              ====================================================== */}

              {isGameStarted ? (

                <div className="w-full flex justify-center animate-fade-in">

                  {activeGame === "Ludo" && (
                    <LudoViewboard
                      socket={socket}
                      room={currentRoom}
                      isSolo={gameMode === "Solo"}
                    />
                  )}

                  {activeGame === "Bingo" && (
                    <BingoViewboard
                      isSolo={gameMode === "Solo"}
                    />
                  )}

                  {activeGame === "Snake" && (
                    <SnakeViewboard />
                  )}

                  {activeGame === "WordGame" && (
                    <WordViewboard />
                  )}

                </div>

              ) : (

                // ======================================================
                // 👥 MULTIPLAYER LOBBY
                // ======================================================

                <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-3xl p-8 shadow-[0_0_40px_rgba(99,102,241,0.2)]">

                  <div className="text-center mb-8">

                    <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                      MATCHMAKING GRID
                    </h1>

                    <p className="text-sm text-slate-400 mt-2">
                      Waiting for players to synchronize...
                    </p>

                  </div>

                  {/* ROOM CODE */}
                  <div className="mb-8 text-center">

                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">
                      Room Code
                    </p>

                    <div className="inline-flex px-6 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">

                      <span className="text-2xl font-black tracking-[0.25em] text-cyan-300">
                        {currentRoom}
                      </span>

                    </div>
                  </div>

                  {/* PLAYERS */}
                  <div className="space-y-4">

                    {lobbyPlayers.map((p) => (

                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-5 py-4"
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-black">
                            {p.username.charAt(0)}
                          </div>

                          <div>

                            <h2 className="font-bold">
                              {p.username}
                            </h2>

                            <p className="text-xs text-slate-500">
                              {p.id === socket.id
                                ? "LOCAL PLAYER"
                                : "CONNECTED PLAYER"}
                            </p>

                          </div>
                        </div>

                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                          ONLINE
                        </div>

                      </div>
                    ))}

                  </div>

                  {/* START BUTTON */}
                  {lobbyPlayers.length > 0 &&
                    lobbyPlayers[0].id === socket.id && (

                    <button
                      onClick={() =>
                        socket.emit("start_game", {
                          room: currentRoom,
                        })
                      }
                      className="w-full mt-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-black font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                    >
                      Launch Match
                    </button>

                  )}

                </div>

              )}

            </div>

          )}

        </main>

        {/* ======================================================
            ⚡ FOOTER
        ====================================================== */}

        <footer className="border-t border-white/5 bg-black/20 backdrop-blur-xl">

          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">

            <p className="text-xs text-slate-500">
              Powered by CymorTechServices
            </p>

            <p className="text-xs text-slate-600">
              Made by the Legendary Smiley Cymor.
            </p>

          </div>
        </footer>

      </div>
    </div>
  );
}
