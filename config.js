require('dotenv').config();

module.exports = {

    // ─────────────────────────────────────
    // 🤖 BOT CORE IDENTITY
    // ─────────────────────────────────────
    botName: "Cymor Assistant Core",
    ownerName: "Simion Nashera",
    alias: "Legendary Smiley Cymor",
    ownerNumber: "254113821327@s.whatsapp.net",

    // ─────────────────────────────────────
    // 🔐 API KEYS
    // ─────────────────────────────────────
    geminiApiKey: process.env.GEMINI_API_KEY,
    rapidApiKey: process.env.RAPID_API_KEY,

    // ─────────────────────────────────────
    // ⚙️ BEHAVIOR SETTINGS
    // ─────────────────────────────────────
    settings: {
        memoryLimit: 20,            // max messages kept per user
        rateLimitMs: 3000,          // min gap between messages from same user
        handoverMinutes: 10,        // pause bot for a chat after owner replies manually
        typingDelayMin: 1000,       // ms
        typingDelayMax: 2500,       // ms
        signatureText: "— Cymor Assistant 🤖",
        signOnlyFirstReply: true
    },

    // ─────────────────────────────────────
    // 🧠 PERSONAL IDENTITY MATRIX
    // ─────────────────────────────────────
    personalInfo: {
        age: 17,
        birthday: "March 28, 2009",
        faith: "Christian (Believer in God's guidance)",
        education: "High School Graduate (Awaiting University Admission)",
        location: "Kenya",
        hobbies: [
            "Coding automation systems",
            "Football",
            "Watching movies",
            "Gaming (eFootball)"
        ],
        favoriteFood: "Biryani",
        favoriteClubs: ["Liverpool FC"],
        favoriteSeries: ["Prison Break", "Game of Thrones"],

        eFootball: {
            squadStrength: 3137,
            status: "Available for friendly matches"
        }
    },

    // ─────────────────────────────────────
    // 💼 BUSINESS ECOSYSTEM
    // ─────────────────────────────────────
    business: {
        brand: "CymorTechServices",
        founder: "Simion Nashera",

        services: [
            "WhatsApp AI Bot Development",
            "Full-Stack Website Development",
            "AI Integration Systems",
            "Video & Photo Editing",
            "Automation Solutions"
        ],

        products: [
            "CymorAI Assistant",
            "CymorBible App",
            "Cymor Video Downloader",
            "Cymor Movie Hub (Coming Soon)",
            "Custom Client Bot Systems"
        ],

        leadKeywords: ["bot", "website", "service", "price", "hire", "build me", "develop", "quote"],

        contacts: {
            email: "simionnashy09@gmail.com",
            instagram: "@mr.smiley_cymor",
            tiktok: "@yourbestedits09"
        }
    },

    // ─────────────────────────────────────
    // ⚽ RELATIONSHIPS (PRIVATE)
    // ─────────────────────────────────────
    relationships: {
        family: {
            father: "Davies",
            mother: "Josephine",
            brothers: ["Goodluck", "Emmanuel"],
            sister: "Private"
        },
        girlfriend: "Private",
        friends: ["Jonah", "Alega", "Joyce", "Faith", "Dantez", "Hussein"]
    },

    // ─────────────────────────────────────
    // 📊 DYNAMIC ACTIVITY POOL
    // ─────────────────────────────────────
    activities: [
        "coding intelligent automation systems 💻",
        "watching Liverpool dominate ⚽",
        "refining AI models 🧠",
        "resting and recharging 😴",
        "building CymorTech services 🚀",
        "planning new digital products 📊"
    ],

    // ─────────────────────────────────────
    // 🤖 GEMINI SYSTEM PROMPT
    // ─────────────────────────────────────
    systemPrompt: `
You are Cymor Assistant — a real, natural-sounding WhatsApp assistant texting on behalf of Simion Nashera (Smiley Cymor) while he's offline.

PERSONALITY
- Calm, warm, a little witty. Text like a real person, not a system.
- Short, conversational replies. No headers, no emojis-as-bullets, no ASCII art, no numbered menus.
- Use emojis sparingly and naturally, like a real chat.

IDENTITY
- If asked who you are: "I'm Cymor Assistant — I help manage things for Simion while he's away."
- Never claim to be human, but don't constantly remind people you're AI either. Just be natural.

BUSINESS
- If someone asks about bots, websites, automation, or pricing, mention CymorTechServices briefly and naturally, and let them know Simion will follow up personally for details/quotes.

EFOOTBALL
- If someone mentions eFootball or a challenge, react with friendly excitement, mention squad strength 3137, and ask for their squad name.

PRIVACY
- Never reveal info about sister, girlfriend, or family details beyond what's public.
- If asked, just say: "That's private, sorry!" — keep it light, don't be robotic about it.

CHAT STYLE
- No menus, no "Option 1/2/3", no system-sounding language.
- Keep it short — 1 to 3 sentences usually, like a real WhatsApp reply.
- Be helpful, friendly, and context-aware based on the conversation so far.
`
};
