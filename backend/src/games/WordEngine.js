class WordEngine {
    constructor() {
        // Core elite dictionary subset array
        this.dictionary = ["CODE", "NODE", "GAME", "PLAY", "CHIPS", "LUDO", "BINGO", "SNAKE", "CYMOR", "MATRIX", "ENGINE", "ROUTER"];
    }

    getInstructions() {
        return [
            "You are presented with a jumbled pool of character tiles.",
            "Rearrange and link adjacent letters to assemble actual hidden terms.",
            "Longer words distribute substantial, exponential score payloads.",
            "You are racing against a ticking countdown clock; speed counts!",
            "Duplicate submissions of identical words will yield zero points."
        ];
    }

    generatePuzzleLevel() {
        const seedWords = ["CYMOR", "MATRIX", "ENGINE", "ROUTER"];
        const baseWord = seedWords[Math.floor(Math.random() * seedWords.length)];
        
        // Shuffle letters securely
        let scrambled = baseWord.split('').sort(() => Math.random() - 0.5).join('');
        
        return {
            scrambled: scrambled,
            maxLength: baseWord.length
        };
    }

    validateWord(word) {
        const cleanWord = word.trim().toUpperCase();
        return {
            isValid: this.dictionary.includes(cleanWord),
            score: cleanWord.length * 100
        };
    }
}

module.exports = WordEngine;
