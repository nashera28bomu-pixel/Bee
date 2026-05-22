import React, { useState } from 'react';

const GAMES_MANIFEST = [
  {
    id: 'Ludo',
    title: 'Ludo Arena',
    description: 'A tactical turn-based strategy board game. Roll 6s, navigate safe grids, and destroy rival tokens.',
    accent: 'from-red-500 to-orange-500',
    instructions: [
      "Roll a 6 to deploy tokens from your home bay.",
      "Land on enemy tiles to execute standard captures.",
      "Safe stars offer full armor configurations against strikes."
    ]
  },
  {
    id: 'Bingo',
    title: 'Bingo Nexus',
    description: 'A high-speed probability layout tracking array. Race across matrix configurations to verify full lines.',
    accent: 'from-blue-500 to-indigo-500',
    instructions: [
      "Generate clean 5x5 numerical grids.",
      "Track dynamic server audio calls immediately.",
      "Submit instant verification patterns for checking."
    ]
  },
  {
    id: 'Snake',
    title: 'Snake Arcade',
    description: 'A retro structural navigation velocity simulation. Absorb energy orbs and dodge sudden boundary collisions.',
    accent: 'from-emerald-500 to-teal-500',
    instructions: [
      "Steer directional vectors carefully via arrows/swipes.",
      "Each node feeding increases global kinetic mass speed.",
      "Perimeter boundaries trigger immediate system resets."
    ]
  },
  {
    id: 'WordGame',
    title: 'Word Matrix',
    description: 'An alphanumeric anagram optimization engine. Deconstruct characters to secure vocabulary score structures.',
    accent: 'from-purple-500 to-pink-500',
    instructions: [
      "Rearrange chaotic string clusters into coherent words.",
      "Longer string constructs trigger point multipliers.",
      "Race against the decay rate on the countdown loop."
    ]
  }
];

export default function Dashboard({ user, onLaunchGame }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-between z-10">
      
      {/* HEADER HUD */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/5 pb-8 mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            CYMOR <span className="text-indigo-500 font-medium">GAMEHUB</span>
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-1">Multi-Game Core Interface v1.0</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-mono text-slate-300">{user.username}</span>
        </div>
      </header>

      {/* GAMES GRID */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {GAMES_MANIFEST.map((game) => (
          <div 
            key={game.id}
            className="group relative rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/[0.02] transform hover:-translate-y-1"
          >
            <div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.accent} opacity-80 group-hover:opacity-100 transition duration-300 mb-4 shadow-lg`} />
              <h3 className="text-xl font-bold text-slate-200 group-hover:text-white transition">{game.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{game.description}</p>
            </div>

            <button
              onClick={() => setSelectedGame(game)}
              className="w-full mt-6 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition duration-200 text-slate-300 group-hover:text-white"
            >
              Access Game Terminal
            </button>
          </div>
        ))}
      </main>

      {/* FOOTER METRICS */}
      <footer className="text-center text-xs text-slate-600 font-mono">
        &copy; 2026 CymorTechServices. Built by the Legendary Smiley Cymor🔝.
      </footer>

      {/* CONFIGURATION SLIDEOVER / MODAL */}
      {selectedGame && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-8 shadow-2xl relative overflow-hidden">
            
            <button 
              onClick={() => { setSelectedGame(null); setRoomCode(''); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-lg transition font-mono"
            >
              &times;
            </button>

            <h3 className="text-2xl font-black text-white mb-4">Initialize: {selectedGame.title}</h3>
            
            {/* INSTRUCTIONS SUBDECK */}
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">System Instructions</h4>
              <ul className="space-y-1.5">
                {selectedGame.instructions.map((ins, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span> {ins}
                  </li>
                ))}
              </ul>
            </div>

            {/* SELECTION MODES */}
            <div className="space-y-4">
              <button
                onClick={() => { onLaunchGame(selectedGame.id, 'Solo'); setSelectedGame(null); }}
                className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-slate-200 group-hover:text-white">Solo Mode</div>
                  <div className="text-xs text-slate-500">Play locally offline backed by custom AI entities.</div>
                </div>
                <span className="text-lg text-slate-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </button>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div>
                  <div className="font-bold text-slate-200">Global Multiplayer</div>
                  <div className="text-xs text-slate-500">Sync with synchronized remote player connection nodes.</div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Custom Room ID"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-950 border border-white/10 focus:border-indigo-500 focus:outline-none text-slate-200 font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal"
                  />
                  <button
                    disabled={!roomCode.trim()}
                    onClick={() => { onLaunchGame(selectedGame.id, 'Multiplayer', roomCode); setSelectedGame(null); }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 disabled:text-slate-500 font-semibold text-sm transition text-white shadow-md shadow-indigo-600/10"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
