const config = require('./config');

/**
 * Custom Utility Helpers for Cymor Executive Core
 */
module.exports = {
    
    /**
     * Dynamic Activity Picker
     * Pulls a random status phrase from the config matrix to display on user welcome.
     * @returns {string} A randomly selected activity statement.
     */
    getRandomActivity: () => {
        const activities = config.activities;
        if (!activities || activities.length === 0) {
            return "engineering advanced automation codes 💻";
        }
        return activities[Math.floor(Math.random() * activities.length)];
    },

    /**
     * Session Cache Cleaner
     * Automatically purges handled users from the memory tracking sets after a set duration 
     * (e.g., 6 hours) so returning users can receive the greetings layout again later.
     * @param {Set} handledUsersSet - The cache set tracking greeted contacts.
     * @param {object} userStatesObj - The state tracking database object.
     */
    initializeAutoPurge: (handledUsersSet, userStatesObj) => {
        const SIX_HOURS = 1000 * 60 * 60 * 6;
        setInterval(() => {
            handledUsersSet.clear();
            // Clear keys in userStates that aren't locked in an active session
            for (const jid in userStatesObj) {
                if (!userStatesObj[jid]) {
                    delete userStatesObj[jid];
                }
            }
            console.log("🧹 [System Maintenance]: Temporary user interaction caches cleared successfully.");
        }, SIX_HOURS);
    },

    /**
     * eFootball Invitation Formatter
     * Returns a structured layout confirming the game challenge criteria.
     * @param {string} userName - The name of the challenger.
     * @param {string} userSquadName - The team name provided by the challenger.
     * @returns {string} High-contrast textual notification.
     */
    formatMatchChallenge: (userName, userSquadName) => {
        return `✨ ──────────────── ✨\n` +
               `       *ARENA INVITE ACKNOWLEDGED* \n` +
               `✨ ──────────────── ✨\n\n` +
               `⚔️ *Challenger:* ${userName}\n` +
               `🛡️ *Target Squad:* ${userSquadName}\n` +
               `⚡ *Opponent:* ${config.alias} (Squad Strength: ${config.personalInfo.eFootball.squadStrength})\n\n` +
               `Match validation is logged. Simion will ping you with a co-op room code or friendly request code when he initiates his eFootball terminal! 🔥`;
    }
};
