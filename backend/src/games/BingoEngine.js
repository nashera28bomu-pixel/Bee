class BingoEngine {
    constructor(roomId, players) {
        this.roomId = roomId;
        this.players = players;
        this.drawnNumbers = new Set();
        this.playerCards = {};

        players.forEach(p => {
            this.playerCards[p.id] = this.generateValidBingoCard();
        });
    }

    getInstructions() {
        return [
            "Every player gets a unique 5x5 grid containing numbers ranging from 1 to 75.",
            "The center square is a 'FREE' slot given to every player automatically.",
            "Numbers will be called sequentially at random intervals.",
            "Mark off called numbers immediately on your board.",
            "Form a complete row, column, or diagonal line of 5 marked numbers and call BINGO to win!"
        ];
    }

    generateValidBingoCard() {
        // Standard Bingo matrix distribution rules
        const columns = { B: [1,15], I: [16,30], N: [31,45], G: [46,60], O: [61,75] };
        let card = Array(5).fill(null).map(() => Array(5).fill(0));

        Object.keys(columns).forEach((letter, colIndex) => {
            let [min, max] = columns[letter];
            let pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
            
            for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
                // Handle the traditional center FREE spot
                if (colIndex === 2 && rowIndex === 2) {
                    card[rowIndex][colIndex] = "FREE";
                    continue;
                }
                let randIdx = Math.floor(Math.random() * pool.length);
                card[rowIndex][colIndex] = pool.splice(randIdx, 1)[0];
            }
        });
        return card;
    }

    drawNextNumber() {
        if (this.drawnNumbers.size >= 75) return null;
        let num;
        do {
            num = Math.floor(Math.random() * 75) + 1;
        } while (this.drawnNumbers.has(num));

        this.drawnNumbers.add(num);
        return num;
    }

    verifyBingoClaim(playerId, markedMatrix) {
        // Validation barrier: Ensure the client isn't hacking their marked spots
        const originalCard = this.playerCards[playerId];
        
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (markedMatrix[r][c] === true) {
                    let val = originalCard[r][c];
                    if (val !== "FREE" && !this.drawnNumbers.has(val)) {
                        return false; // Cheat attempt caught!
                    }
                }
            }
        }

        // Check columns and rows for a complete win pattern
        let hasLine = false;
        
        // Row & Column checks
        for (let i = 0; i < 5; i++) {
            if (markedMatrix[i].every(val => val === true)) hasLine = true;
            if ([0,1,2,3,4].every(row => markedMatrix[row][i] === true)) hasLine = true;
        }

        // Diagonal checks
        if ([0,1,2,3,4].every(i => markedMatrix[i][i] === true)) hasLine = true;
        if ([0,1,2,3,4].every(i => markedMatrix[i][4 - i] === true)) hasLine = true;

        return hasLine;
    }
}

module.exports = BingoEngine;
