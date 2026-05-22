class SnakeEngine {
    static getInstructions() {
        return [
            "Use your keyboard arrow keys or swipe gestures to steer the snake.",
            "Eat the glowing food orbs to grow longer and accelerate your score multiplier.",
            "Crashing head-first into your own body segments ends the simulation instantly.",
            "Colliding with the perimeter grid walls will result in sudden death.",
            "Survive as long as possible to secure a high-ranking position on the global leaderboard."
        ];
    }

    static calculateDynamicSpeed(score) {
        // Base delay is 150ms. Speed accelerates incrementally as the score climbs.
        const baseSpeed = 150;
        const reduction = Math.min(100, Math.floor(score / 5) * 8);
        return baseSpeed - reduction;
    }

    static verifyScoreIntegrity(pathLength, claimedScore) {
        // Anti-cheat verification
        // A player cannot physically achieve a score higher than their calculated path movements
        return claimedScore <= pathLength;
    }
}

module.exports = SnakeEngine;
