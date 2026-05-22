class LudoEngine {
    constructor(roomId, players) {
        this.roomId = roomId;
        this.players = players; // Array of player objects: { id, name, color }
        this.turnIndex = 0;
        this.currentRoll = null;
        this.hasRolled = false;
        
        // Initial token positions (4 tokens per player). 0 means home base.
        this.gameState = {};
        players.forEach(p => {
            this.gameState[p.id] = {
                color: p.color,
                tokens: [0, 0, 0, 0], // Safe/Track positions
                hasWon: false
            };
        });

        // Common safe zones on a standard 52-tile board
        this.safePositions = [0, 1, 9, 14, 22, 27, 35, 40, 48]; 
        this.winningPosition = 57; // 52 tracks + 5 home column steps
    }

    getInstructions() {
        return [
            "Roll a 6 to release a token from your home base onto the starting tile.",
            "Tokens move clockwise around the track based on your dice value.",
            "Landing on an opponent's token sends them completely back to their home base!",
            "Safe zones marked with stars protect your tokens from being captured.",
            "Get all 4 tokens into the central home triangle to win the match."
        ];
    }

    rollDice(playerId) {
        if (this.players[this.turnIndex].id !== playerId || this.hasRolled) {
            throw new Error("Not your turn to roll!");
        }

        this.currentRoll = Math.floor(Math.random() * 6) + 1;
        this.hasRolled = true;

        // Check if player has any valid moves available with this roll
        const activeTokens = this.gameState[playerId].tokens;
        const hasValidMove = activeTokens.some(tokenPos => {
            if (tokenPos === 0 && this.currentRoll !== 6) return false;
            if (tokenPos + this.currentRoll > this.winningPosition) return false;
            return true;
        });

        // If no moves can be made, instantly pass turn
        if (!hasValidMove) {
            this.nextTurn();
            return { roll: this.currentRoll, turnPassed: true, nextPlayer: this.players[this.turnIndex].id };
        }

        return { roll: this.currentRoll, turnPassed: false };
    }

    moveToken(playerId, tokenIndex) {
        if (this.players[this.turnIndex].id !== playerId || !this.hasRolled) {
            throw new Error("Invalid move state!");
        }

        let tokens = this.gameState[playerId].tokens;
        let currentPos = tokens[tokenIndex];

        // Step 1: Handle leaving home base
        if (currentPos === 0 && this.currentRoll === 6) {
            tokens[tokenIndex] = 1; 
        } else if (currentPos > 0 && currentPos + this.currentRoll <= this.winningPosition) {
            tokens[tokenIndex] += this.currentRoll;
        } else {
            throw new Error("Illegal move selected.");
        }

        // Step 2: Collision detection (capturing opponents)
        let targetPos = tokens[tokenIndex];
        if (!this.safePositions.includes(targetPos)) {
            Object.keys(this.gameState).forEach(oppId => {
                if (oppId !== playerId) {
                    this.gameState[oppId].tokens = this.gameState[oppId].tokens.map(oppPos => {
                        // If opponent token shares global index, send them back to 0
                        return oppPos === targetPos ? 0 : oppPos;
                    });
                }
            });
        }

        // Step 3: Check for game victory condition
        if (tokens.every(pos => pos === this.winningPosition)) {
            this.gameState[playerId].hasWon = true;
        }

        // Step 4: Retain turn on a 6, otherwise rotate to next player
        if (this.currentRoll !== 6) {
            this.nextTurn();
        } else {
            this.hasRolled = false; // Reset roll barrier for same player
        }

        return this.gameState;
    }

    nextTurn() {
        this.hasRolled = false;
        this.currentRoll = null;
        this.turnIndex = (this.turnIndex + 1) % this.players.length;
    }
}

module.exports = LudoEngine;
