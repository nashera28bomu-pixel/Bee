const config = require('./config');

/**
 * Cymor Executive Core - Utility Helpers
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
    // 🧹 SMART SESSION CLEANER
    // ─────────────────────────────────────
    initializeAutoPurge: (handledUsersSet, userStatesObj, chatMemory) => {

        const TWO_HOURS = 1000 * 60 * 60 * 2;

        setInterval(() => {

            if (handledUsersSet && typeof handledUsersSet.clear === "function") {
                handledUsersSet.clear();
            }

            for (const jid in userStatesObj) {
                const state = userStatesObj[jid];

                if (!state || state === null || state === undefined) {
                    delete userStatesObj[jid];
                    continue;
                }

                if (state?.expiresAt && Date.now() > state.expiresAt) {
                    delete userStatesObj[jid];
                }
            }

            // Trim oversized memory entries that may have slipped past the cap
            if (chatMemory) {
                for (const jid in chatMemory) {
                    if (chatMemory[jid].length > config.settings.memoryLimit) {
                        chatMemory[jid] = chatMemory[jid].slice(-config.settings.memoryLimit);
                    }
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

        return `⚽ Challenge accepted, ${userName}! Squad "${userSquadName}" vs my squad (strength ${squadStrength}) — I've logged this, Simion will hit you up to set a time. Get ready! 🔥`;
    },


    // ─────────────────────────────────────
    // ⏱️ RANDOM TYPING DELAY
    // ─────────────────────────────────────
    getTypingDelay: (textLength = 0) => {
        const { typingDelayMin, typingDelayMax } = config.settings;
        const base = typingDelayMin + Math.random() * (typingDelayMax - typingDelayMin);
        // slight scaling for longer messages, capped
        const extra = Math.min(textLength * 15, 1500);
        return Math.floor(base + extra);
    },


    // ─────────────────────────────────────
    // 🚦 RATE LIMIT CHECK
    // ─────────────────────────────────────
    isRateLimited: (lastMessageTimestamps, jid) => {
        const now = Date.now();
        const last = lastMessageTimestamps[jid] || 0;

        if (now - last < config.settings.rateLimitMs) {
            return true;
        }

        lastMessageTimestamps[jid] = now;
        return false;
    },


    // ─────────────────────────────────────
    // 🤝 HANDOVER CHECK (owner replied manually)
    // ─────────────────────────────────────
    isHandedOver: (handoverMap, jid) => {
        const expiry = handoverMap[jid];
        if (!expiry) return false;

        if (Date.now() > expiry) {
            delete handoverMap[jid];
            return false;
        }

        return true;
    },

    setHandover: (handoverMap, jid) => {
        const minutes = config.settings.handoverMinutes;
        handoverMap[jid] = Date.now() + (minutes * 60 * 1000);
    },


    // ─────────────────────────────────────
    // 🏷️ LEAD KEYWORD DETECTOR
    // ─────────────────────────────────────
    isBusinessLead: (lowerText) => {
        const keywords = config.business.leadKeywords || [];
        return keywords.some(k => lowerText.includes(k));
    },


    // ─────────────────────────────────────
    // ✍️ SIGNATURE APPENDER
    // ─────────────────────────────────────
    appendSignature: (reply, isFirstReply) => {
        const { signatureText, signOnlyFirstReply } = config.settings;

        if (!signatureText) return reply;

        if (signOnlyFirstReply && !isFirstReply) {
            return reply;
        }

        return `${reply}\n\n${signatureText}`;
    }
};
