const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import our elite game engines
const LudoEngine = require('./games/LudoEngine');
const BingoEngine = require('./games/BingoEngine');
const SnakeEngine = require('./games/SnakeEngine');
const WordEngine = require('./games/WordEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allows easy matching for development and production environments
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Memory storage to track active real-time rooms and matches
const activeRooms = {}; 
const activeGames = {}; 

// Serve built frontend PWA assets automatically
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

io.on('connection', (socket) => {
    console.log(`📡 Device Connected to Cymor Network: ${socket.id}`);

    // ==========================================
    // 🏢 LOBBY & MATCHMAKING MANAGEMENT
    // ==========================================

    socket.on('join_room', (data) => {
        const { room, username, gameType } = data;
        
        socket.join(room);

        if (!activeRooms[room]) {
            activeRooms[room] = {
                id: room,
                gameType: gameType,
                players: []
            };
        }

        // Add player to the room metadata if they aren't already registered
        const playerExists = activeRooms[room].players.some(p => p.id === socket.id);
        if (!playerExists) {
            const colors = ["Red", "Green", "Yellow", "Blue"];
            const assignedColor = colors[activeRooms[room].players.length % 4];
            
            activeRooms[room].players.push({
                id: socket.id,
                username: username,
                color: assignedColor
            });
        }

        console.log(`👤 ${username} (${socket.id}) entered Room [${room}] for ${gameType}`);

        // Broadcast updated player roster to everyone in the room
        io.to(room).emit('lobby_update', {
            players: activeRooms[room].players,
            gameType: gameType
        });
    });

    // ==========================================
    // 🎮 UNIVERSAL GAME INITIALIZER (With Instructions)
    // ==========================================

    socket.on('start_game', (data) => {
        const { room } = data;
        const lobby = activeRooms[room];

        if (!lobby) return socket.emit('error', { message: "Room execution structure not found." });

        let instructions = [];
        let initialPayload = {};

        // Instantiate respective engine rules safely based on choice
        switch (lobby.gameType) {
            case 'Ludo':
                activeGames[room] = new LudoEngine(room, lobby.players);
                instructions = activeGames[room].getInstructions();
                initialPayload = { gameState: activeGames[room].gameState, currentTurn: lobby.players[0].id };
                break;
                
            case 'Bingo':
                activeGames[room] = new BingoEngine(room, lobby.players);
                instructions = activeGames[room].getInstructions();
                initialPayload = { playerCards: activeGames[room].playerCards };
                break;

            case 'Snake':
                instructions = SnakeEngine.getInstructions();
                break;

            case 'WordGame':
                const wordGameInstance = new WordEngine();
                activeGames[room] = wordGameInstance; // Keep an instance for score validation calls later
                instructions = wordGameInstance.getInstructions();
                initialPayload = wordGameInstance.generatePuzzleLevel();
                break;

            default:
                return socket.emit('error', { message: "Invalid game selection." });
        }

        // Fire game state to all players instantly with a payload setup
        io.to(room).emit('game_started', {
            instructions: instructions,
            gameType: lobby.gameType,
            data: initialPayload
        });
    });

    // ==========================================
    // 🎲 LUDO GAMEPLAY REAL-TIME PIPE
    // ==========================================

    socket.on('ludo_roll_dice', (data) => {
        const { room } = data;
        const engine = activeGames[room];

        if (!engine) return;

        try {
            const outcome = engine.rollDice(socket.id);
            io.to(room).emit('ludo_dice_result', {
                playerId: socket.id,
                roll: outcome.roll,
                turnPassed: outcome.turnPassed,
                nextPlayer: engine.players[engine.turnIndex].id
            });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('ludo_move_piece', (data) => {
        const { room, tokenIndex } = data;
        const engine = activeGames[room];

        if (!engine) return;

        try {
            const updatedState = engine.moveToken(socket.id, tokenIndex);
            
            io.to(room).emit('ludo_state_update', {
                gameState: updatedState,
                nextPlayer: engine.players[engine.turnIndex].id
            });

            // Check if this player completely completed their token routes
            if (updatedState[socket.id].hasWon) {
                io.to(room).emit('game_over', { winner: socket.id, username: activeRooms[room].players.find(p => p.id === socket.id).username });
            }
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // ==========================================
    // 🔢 BINGO GAMEPLAY REAL-TIME PIPE
    // ==========================================

    socket.on('bingo_draw_number', (data) => {
        const { room } = data;
        const engine = activeGames[room];

        if (!engine) return;

        const drawn = engine.drawNextNumber();
        if (drawn) {
            io.to(room).emit('bingo_number_called', { number: drawn });
        } else {
            io.to(room).emit('error', { message: "All integers successfully pulled from container matrix!" });
        }
    });

    socket.on('bingo_claim_win', (data) => {
        const { room, matrix } = data;
        const engine = activeGames[room];

        if (!engine) return;

        const isLegitWin = engine.verifyBingoClaim(socket.id, matrix);
        if (isLegitWin) {
            io.to(room).emit('game_over', { 
                winner: socket.id, 
                username: activeRooms[room].players.find(p => p.id === socket.id).username 
            });
        } else {
            socket.emit('error', { message: "Invalid Bingo claim. Game lines do not match server history parameters." });
        }
    });

    // ==========================================
    // 🐍/📝 SINGLE-PLAYER SCORE INTEGERS LOG
    // ==========================================

    socket.on('arcade_submit_score', (data) => {
        const { gameType, score, metrics } = data;
        
        if (gameType === 'Snake') {
            const isValid = SnakeEngine.verifyScoreIntegrity(metrics.pathLength, score);
            socket.emit('score_validated', { success: isValid, score: isValid ? score : 0 });
        } 
        else if (gameType === 'WordGame') {
            const dummyEngine = new WordEngine();
            const validation = dummyEngine.validateWord(metrics.word);
            socket.emit('word_validated', { isValid: validation.isValid, addedPoints: validation.score });
        }
    });

    // ==========================================
    // 🔌 CLEANUP ON DISCONNECT
    // ==========================================

    socket.on('disconnect', () => {
        console.log(`🔌 Node Connection Severed: ${socket.id}`);

        // Scan rooms to wipe dead sockets instantly
        Object.keys(activeRooms).forEach(room => {
            const lobby = activeRooms[room];
            lobby.players = lobby.players.filter(p => p.id !== socket.id);

            if (lobby.players.length === 0) {
                delete activeRooms[room];
                delete activeGames[room];
                console.log(`🧹 Structural cleanup complete. Empty Room [${room}] completely purged.`);
            } else {
                // Update remaining players inside the engine structure
                io.to(room).emit('lobby_update', { players: lobby.players });
                io.to(room).emit('player_disconnected', { id: socket.id });
            }
        });
    });
});

// Single-page router fallback configuration
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

server.listen(PORT, () => {
    console.log(`⚡ Cymor GameHub Architecture Online || Port Connection Address: ${PORT}`);
});
