import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Dashboard from './components/Dashboard';

// Import our elite, breathtaking graphical game interfaces
import { 
  LudoViewboard, 
  BingoViewboard, 
  SnakeViewboard, 
  WordViewboard 
} from './games/components/GameViewboards';

// Automatically connect to the backend server hosting the app
const socket = io(window.location.origin);

export default function App() {
  const [user, setUser] = useState({ username: 'Player_' + Math.floor(1000 + Math.random() * 9000) });
  const [activeGame, setActiveGame] = useState(null); // 'Ludo', 'Bingo', 'Snake', 'WordGame'
  const [gameMode, setGameMode] = useState(null);     // 'Solo', 'Multiplayer'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false); // Track multiplayer match states

  useEffect(() => {
    // Listen for real-time multiplayer updates from the Cymor network
    socket.on('lobby_update', (data) => {
      setLobbyPlayers(data.players);
    });

    socket.on('game_started', (payload) => {
      console.log("Game execution initialized successfully:", payload);
      setIsGameStarted(true); // Transitions the lobby screen to the active board matrix
    });

    return () => {
      socket.off('lobby_update');
      socket.off('game_started');
    };
  }, []);

  const handleLaunchGame = (gameType, mode, roomCode = null) => {
    setActiveGame(gameType);
    setGameMode(mode);

    if (mode === 'Solo') {
      setIsGameStarted(true); // Solo engines bypass matchmaking and start instantly
    }

    if (mode === 'Multiplayer' && roomCode) {
      setCurrentRoom(roomCode);
      socket.emit('join_room', {
        room: roomCode,
        username: user.username,
        gameType: gameType
      });
    }
  };

  const terminateSession = () => {
    setActiveGame(null);
    setGameMode(null);
    setCurrentRoom(null);
    setIsGameStarted(false);
    setLobbyPlayers([]);
    // Reload components cleanly to completely wipe dynamic transient state caches
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased overflow-x-hidden">
      {/* Background ambient cosmic lighting configurations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />

      {!activeGame ? (
        <Dashboard user={user} onLaunchGame={handleLaunchGame} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 w-full max-w-6xl mx-auto">
          
          {/* TOP LIVE TRACK METRIC STRIP */}
          <div className="w-full flex justify-between items-center mb-6 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-500 font-mono">Terminal Node: </span>
              <span className="text-xs font-mono font-bold text-indigo-400">{activeGame}</span>
            </div>
            <button 
              onClick={terminateSession}
              className="text-xs font-mono text-rose-400 hover:text-rose-300 hover:underline transition underline-offset-4"
            >
              [Abort Session]
            </button>
          </div>

          {/* ACTIVE GAMEPLAY PORT OR MULTIPLAYER WAITING LOBBY */}
          {isGameStarted ? (
            <div className="w-full flex justify-center items-center animate-fade-in">
              {activeGame === 'Ludo' && <LudoViewboard isSolo={gameMode === 'Solo'} socket={socket} room={currentRoom} />}
              {activeGame === 'Bingo' && <BingoViewboard isSolo={gameMode === 'Solo'} />}
              {activeGame === 'Snake' && <SnakeViewboard />}
              {activeGame === 'WordGame' && <WordViewboard />}
            </div>
          ) : (
            /* MULTIPLAYER LOBBY WAITING SCREEN */
            <div className="w-full max-w-xl p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center shadow-2xl">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
                Syncing Room Grid
              </h2>
              <p className="text-xs text-slate-400 font-mono mb-6">
                ROOM DECK CODE: <span className="text-cyan-400 font-bold tracking-widest">{currentRoom}</span>
              </p>
              
              <div className="mb-6 text-left">
                <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-3 font-mono">
                  Connected Node Manifest ({lobbyPlayers.length}/4)
                </h3>
                <div className="space-y-2">
                  {lobbyPlayers.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                      <span className="font-medium text-slate-300 font-mono text-sm">
                        {p.username} {p.id === socket.id && <span className="text-indigo-400 text-xs">(You)</span>}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">
                        {p.color}
                      </span>
                    </div>
                  ))}
                </div>

                {lobbyPlayers.length > 0 && lobbyPlayers[0].id === socket.id && (
                  <button 
                    onClick={() => socket.emit('start_game', { room: currentRoom })}
                    className="w-full mt-8 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-sm uppercase tracking-widest text-slate-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Launch Simulation Match
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
