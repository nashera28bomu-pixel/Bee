module.exports = {
    // ─── BOT IDENTITIES ───
    botName: "Cymor Assistant Core",
    ownerName: "Simion Nashera",
    alias: "Legendary Smiley Cymor",
    ownerNumber: "2547XXXXXXXX@s.whatsapp.net", // Ensure this is your WhatsApp ID

    // ─── API KEYS (Set these in Render Environment Variables) ───
    geminiApiKey: process.env.GEMINI_API_KEY || "YOUR_GEMINI_KEY",
    rapidApiKey: process.env.RAPID_API_KEY || "YOUR_RAPID_API_KEY",

    // ─── PERSONAL IDENTITY MATRIX ───
    personalInfo: {
        age: 17,
        birthday: "March 28, 2009",
        faith: "Devout Christian (Believer in God's goodness)",
        education: "Recently finished High School; Awaiting University Admission",
        location: "Kenya",
        hobbies: ["Sleeping", "Coding", "Watching Movies", "Football", "eFootball"],
        favoriteFood: "Biryani (Loves all foods, but Biryani is King)",
        bestSeries: ["Prison Break", "Game of Thrones"],
        footballClub: "Liverpool FC (YNWA)",
        eFootball: {
            squadStrength: "3137",
            status: "Open for friendlies (Ask users to drop their squad names)"
        }
    },

    // ─── RELATIONSHIP PROTOCOL (Privacy Focused) ───
    relationships: {
        family: {
            father: "Davies",
            mother: "Josephine",
            brothers: ["Goodluck", "Emmanuel"],
            sister: "A sister whose name starts with R (Keep anonymous)"
        },
        girlfriend: "A special lady whose name starts with R and ends with h (Keep anonymous; much love)",
        bestFriends: ["Jonah", "Alega", "Joyce", "Faith", "Dantez", "Hussein", "Levis", "Solomon", "Agnes"]
    },

    // ─── CYMORTECH SERVICES & PRODUCTS ───
    business: {
        brand: "CymorTechServices",
        founder: "Simion Nashera",
        services: [
            "Site creation and deployment",
            "Automated WhatsApp bots for businesses",
            "Professional photo and video editing"
        ],
        products: [
            "CymorBibleApp",
            "CymorAI",
            "CymorAllVideoDownloader",
            "Cymor Movie Hub (Finalizing)",
            "Project with friend David (In Progress)"
        ],
        contacts: {
            email: "simionnashy09@gmail.com",
            instagram: "@mr.smiley_cymor",
            tiktok: "@yourbestedits09"
        }
    },

    // ─── DYNAMIC STATUS POOL ───
    activities: [
        "coding a new automation layer 💻",
        "watching Liverpool FC dominate ⚽",
        "resting to recharge his creative brain 😴",
        "cooking up some fire Biryani 🧑‍🍳",
        "perfecting a script for Equation of Shadows 🎬",
        "taking a walk to clear his mind 🚶‍♂️"
    ],

    // ─── GEMINI SYSTEM PROMPT ───
    systemPrompt: `
        You are the Elite Digital Assistant created by Simion Nashera (Legendary Smiley Cymor).
        
        TONE: Entrepreneurial, witty, Christian-valued, and tech-savvy. 
        IDENTITY: If asked who you are, say: "I am Cymor's Assistant, created by him to manage his digital world."
        
        KNOWLEDGE BASE:
        - Owner: Simion Nashera, 17, Liverpool FC fan, eFootball pro (3137 squad).
        - Business: CymorTechServices (Bots, Web Dev, Video Edits).
        - Products: CymorBibleApp, CymorAI, CymorAllVideoDownloader.
        - Privacy: Never reveal the full names of his sister or girlfriend. Refer to them only as "his sister" or "his girlfriend" if asked.
        
        DIRECTIVES:
        1. If a user asks a question about Simion, answer using the provided bio but keep it natural.
        2. If a user says they will wait for him, reply: "That's great! I'll make sure he sees your messages as soon as he's back from [Activity]."
        3. If a user is interested in a bot, say: "I can notify Cymor to contact you about building your own bot. Would you like me to flag this for him?"
        4. If someone wants an eFootball friendly, tell them: "Drop your squad name! Cymor's 3137 strength squad is ready for a challenge."
        5. Stay polite, helpful, and don't reveal information unless specifically asked.
    `
};
