require('dotenv').config();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const pino = require('pino');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const config = require('./config');

// ─────────────────────────────────────
// 🌐 RENDER SERVER KEEP-ALIVE
// ─────────────────────────────────────
const port = process.env.PORT || 3000;

http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Cymor Assistant Core: Active\n');
}).listen(port);

// 🤖 GEMINI AI INIT
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const aiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: config.systemPrompt
});

// 🧠 STATES
let ownerMode = "OFFLINE"; // OFFLINE = bot active
const clientStates = {};
const chatMemory = {};

// ─────────────────────────────────────
// 💾 MEMORY SYSTEM (per user)
// ─────────────────────────────────────
function getMemory(user) {
    if (!chatMemory[user]) chatMemory[user] = [];
    return chatMemory[user];
}

// ─────────────────────────────────────
// 🚀 MAIN BOT
// ─────────────────────────────────────
async function launchCymorCore() {

    const { state, saveCreds } = await useMultiFileAuthState('cymor_auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: Browsers.ubuntu('Chrome'),
        logger: pino({ level: 'silent' }),
        markOnlineOnConnect: false
    });

    sock.ev.on('creds.update', saveCreds);

    // 🔁 CONNECTION HANDLER
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('🚀 Cymor Assistant Online');
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error instanceof Boom
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

            if (shouldReconnect) launchCymorCore();
        }
    });

    // ─────────────────────────────────────
    // 💬 MESSAGE HANDLER
    // ─────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages }) => {

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const pushName = msg.pushName || "User";

        const body =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        const text = body.trim();
        const lower = text.toLowerCase();

        // ─────────────────────────────
        // 🔐 OWNER CONTROL MODE
        // ─────────────────────────────
        if (from === config.ownerNumber) {
            if (lower === "!online") {
                ownerMode = "ONLINE";
                return sock.sendMessage(from, { text: "🟢 Bot silent mode ON (owner online)" });
            }

            if (lower === "!offline") {
                ownerMode = "OFFLINE";
                return sock.sendMessage(from, { text: "🔴 Bot assistant mode ON (owner offline)" });
            }
        }

        // 🚫 If owner is ONLINE → bot stays silent
        if (ownerMode === "ONLINE") return;

        // ─────────────────────────────
        // 🎮 EFOOTBALL FEATURE
        // ─────────────────────────────
        if (lower.startsWith("challenge ")) {
            const squad = text.replace("challenge ", "");

            return sock.sendMessage(from, {
                text:
`⚽ eFootball Challenge Received

👤 Player: ${pushName}
🛡️ Squad: ${squad}
🔥 Cymor Squad Strength: ${config.personalInfo.eFootball.squadStrength}

Match request logged. Owner will respond when available.`
            });
        }

        // ─────────────────────────────
        // 💼 BUSINESS DETECTION
        // ─────────────────────────────
        if (
            lower.includes("bot") ||
            lower.includes("website") ||
            lower.includes("service") ||
            lower.includes("price") ||
            lower.includes("hire")
        ) {
            await sock.sendMessage(config.ownerNumber, {
                text:
`💼 NEW BUSINESS LEAD

👤 From: ${pushName}
📩 Message: ${text}`
            });
        }

        // ─────────────────────────────
        // 🧠 CHAT MEMORY SYSTEM
        // ─────────────────────────────
        const memory = getMemory(from);

        memory.push({
            role: "user",
            parts: [{ text }]
        });

        try {
            const result = await aiModel.generateContent({
                contents: memory
            });

            const reply = result.response.text();

            memory.push({
                role: "model",
                parts: [{ text: reply }]
            });

            return sock.sendMessage(from, {
                text: reply
            });

        } catch (err) {
            console.log(err);

            return sock.sendMessage(from, {
                text: "⚠️ I'm having trouble responding right now. Please try again shortly."
            });
        }
    });
}

// 🚀 START BOT
launchCymorCore();
