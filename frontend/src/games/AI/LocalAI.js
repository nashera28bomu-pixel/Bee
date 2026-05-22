/**
 * CYMOR GAMEHUB - LOCAL ARTIFICIAL INTELLIGENCE ENGINES
 * Engineered for low-latency, deterministic, realistic human-like behaviors in solo modes.
 */

export const LudoAI = {
    /**
     * Analyzes the current board layout and selects the absolute best token index to move.
     * @param {Array} tokens - Array of 4 positions for the AI player [pos1, pos2, pos3, pos4]
     * @param {Object} opponentTokensMap - Map of opponent player positions: { player1: [positions], player2: [positions] }
     * @param {number} roll - The current dice roll value (1-6)
     * @param {Array} safePositions - Array of global safe tile indices
     * @param {number} winningPosition - The terminal target tile index (e.g., 57)
     * @returns {number} The chosen token index (0-3) to move.
     */
    evaluateBestMove(tokens, opponentTokensMap, roll, safePositions, winningPosition) {
        let bestTokenIndex = -1;
        let highestWeight = -100;

        for (let i = 0; i < tokens.length; i++) {
            let currentPos = tokens[i];
            let targetPos = currentPos + roll;
            let weight = 0;

            // Scenario 1: Token is at home (0)
            if (currentPos === 0) {
                if (roll === 6) weight += 80; // Highly prioritize deploying new tokens
                else continue; // Invalid move
            }

            // Scenario 2: Move exceeds the winning threshold
            if (targetPos > winningPosition) continue; // Invalid move

            // Scenario 3: Token can safely reach the home triangle exactly
            if (targetPos === winningPosition) weight += 90;

            // Scenario 4: Aggression Logic - Check if movement captures an opponent token
            if (!safePositions.includes(targetPos)) {
                let canCapture = false;
                Object.values(opponentTokensMap).forEach(oppTokens => {
                    if (oppTokens.includes(targetPos)) canCapture = true;
                });
                if (canCapture) weight += 100; // Capture option gets maximum priority!
            }

            // Scenario 5: Defensive Logic - Check if leaving current tile exposes token to risk
            if (safePositions.includes(currentPos) && !safePositions.includes(targetPos)) {
                weight -= 15; // De-prioritize leaving a designated safe tile
            }

            // Scenario 6: Escape Logic - Check if current position is threatened by an opponent right behind it
            Object.values(opponentTokensMap).forEach(oppTokens => {
                oppTokens.forEach(oppPos => {
                    if (currentPos - oppPos > 0 && currentPos - oppPos <= 6) {
                        weight += 30; // Run away from trailing opponents!
                    }
                });
            });

            // General progression weight (Moving forward is generally good)
            weight += (targetPos * 0.1);

            if (weight > highestWeight) {
                highestWeight = weight;
                bestTokenIndex = i;
            }
        }

        // Fallback: If no smart logic weights trigger, find the first legal token available
        if (bestTokenIndex === -1) {
            bestTokenIndex = tokens.findIndex(pos => pos === 0 ? roll === 6 : pos + roll <= winningPosition);
        }

        return bestTokenIndex;
    }
};

export const BingoAI = {
    /**
     * Simulates the computer scanning its card layout and marking off a hit.
     * @param {Array} matrix5x5 - The AI's internal tracking board grid
     * @param {number} calledNumber - The raw active digit drawn from the server pool
     * @returns {Array|null} The modified matrix if a match occurred, otherwise null.
     */
    processIncomingNumber(matrix5x5, calledNumber) {
        let matched = false;
        const updatedMatrix = matrix5x5.map(row => 
            row.map(cell => {
                if (cell && cell.value === calledNumber) {
                    matched = true;
                    return { ...cell, marked: true };
                }
                return cell;
            })
        );
        return matched ? updatedMatrix : null;
    }
};

export const SnakeAI = {
    /**
     * Calculates the next absolute direction the snake head should pivot toward.
     * @param {Object} head - Current {x, y} coordinate of the snake's head segment
     * @param {Object} food - Target {x, y} coordinate of the energy apple
     * @param {Array} body - Array of body coordinates [{x, y}, ...] to prevent self-sabotage
     * @param {number} gridSize - The total grid bound parameters (e.g., 20)
     * @param {string} currentDirection - The active moving heading vector ('UP', 'DOWN', 'LEFT', 'RIGHT')
     * @returns {string} The optimized target heading vector.
     */
    calculateNextHeading(head, food, body, gridSize, currentDirection) {
        const headings = [
            { dir: 'UP', x: 0, y: -1 },
            { dir: 'DOWN', x: 0, y: 1 },
            { dir: 'LEFT', x: -1, y: 0 },
            { dir: 'RIGHT', x: 1, y: 0 }
        ];

        let safeHeadings = [];

        headings.forEach(h => {
            // Anti-backtrack protection
            if (currentDirection === 'UP' && h.dir === 'DOWN') return;
            if (currentDirection === 'DOWN' && h.dir === 'UP') return;
            if (currentDirection === 'LEFT' && h.dir === 'RIGHT') return;
            if (currentDirection === 'RIGHT' && h.dir === 'LEFT') return;

            const nextX = head.x + h.x;
            const nextY = head.y + h.y;

            // Check wall boundaries
            const hitWall = nextX < 0 || nextY < 0 || nextX >= gridSize || nextY >= gridSize;
            
            // Check body collisions
            const hitBody = body.some(segment => segment.x === nextX && segment.y === nextY);

            if (!hitWall && !hitBody) {
                // Calculate Manhattan Distance to target food block
                const distance = Math.abs(nextX - food.x) + Math.abs(nextY - food.y);
                safeHeadings.push({ dir: h.dir, dist: distance });
            }
        });

        if (safeHeadings.length === 0) {
            return currentDirection; // Total trap scenario: maintain velocity trajectory until collision
        }

        // Sort headings to pick the vector that puts the snake closest to food coordinates
        safeHeadings.sort((a, b) => a.dist - b.dist);
        return safeHeadings[0].dir;
    }
};

export const WordAI = {
    /**
     * Analyzes an array string cluster pool against an authorized anagram mapping list.
     * @param {string} scrambledString - The jumbled characters target
     * @param {Array} localDictionary - Array of valid language comparison strings
     * @returns {Array} An array containing all match solutions found.
     */
    solveAnagrams(scrambledString, localDictionary) {
        const cleanPool = scrambledString.toUpperCase().split('');
        
        // Helper to check if a word can be formed from our character pool
        const canFormWord = (word) => {
            let poolCopy = [...cleanPool];
            for (let char of word) {
                let idx = poolCopy.indexOf(char);
                if (idx === -1) return false;
                poolCopy.splice(idx, 1);
            }
            return true;
        };

        return localDictionary.filter(word => word.length >= 3 && canFormWord(word));
    }
};
