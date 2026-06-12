const config = require('./config');

/**
 * Cymor Executive Core - Utility Helpers
 * Clean, scalable helper system for bot operations
 */

module.exports = {

    // ─────────────────────────────────────
    // 🎯 RANDOM ACTIVITY PICKER
    // ─────────────────────────────────────
    getRandomActivity: () => {
        const activities = config.activities;

        if (!Array.isArray(activities) || activities.length === 0) {
            return "optimizing intelligent automation systems 💻";
        }

        const index = Math.floor(Math.random() * activities.length);
        return activities[index];
    },


    // ─────────────────────────────────────
    // 🧹 SMART SESSION CLEANER (SAFE VERSION)
    // ─────────────────────────────────────
    initializeAutoPurge: (handledUsersSet, userStatesObj) => {

        const TWO_HOURS = 1000 * 60 * 60 * 2;

        setInterval(() => {

            // Clear temporary "greeted users" cache
            if (handledUsersSet && typeof handledUsersSet.clear === "function") {
                handledUsersSet.clear();
            }

            // Clean only inactive or empty states (safer than full wipe)
            for (const jid in userStatesObj) {

                const state = userStatesObj[jid];

                // Remove only invalid or null states
                if (!state || state === null || state === undefined) {
                    delete userStatesObj[jid];
                }

                // Optional: remove explicitly expired sessions
                if (state?.expiresAt && Date.now() > state.expiresAt) {
                    delete userStatesObj[jid];
                }
            }

            console.log("🧹 Cymor Core: Session cache optimized successfully.");

        }, TWO_HOURS);
    },


    // ─────────────────────────────────────
    // 🎮 EFOOTBALL MATCH FORMATTER
    // ─────────────────────────────────────
    formatMatchChallenge: (userName, userSquadName) => {

        const squadStrength = config?.personalInfo?.eFootball?.squadStrength || "Unknown";

        return `
⚔️ ═══════════════════ ⚔️
   ARENA CHALLENGE RECEIVED
⚔️ ═══════════════════ ⚔️

👤 Challenger: ${userName}
🛡️ Squad Name: ${userSquadName}
⚡ Cymor Squad Strength: ${squadStrength}

📌 Status: Match request logged successfully.
🎮 Note: Owner will respond when available.

🔥 Prepare for battle in the arena!
        `.trim();
    }
};
