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
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const config = require('./config');
const helpers = require('./helpers');

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

// ─────────────────────────────────────
// 🧠 STATES
// ─────────────────────────────────────
let botActive = true;              // true = bot replies, false = silent (owner online)
const clientStates = {};
const chatMemory = {};             // { jid: [ {role, parts} ] }
const handledLeads = new Set();    // jids already flagged as business leads this session
const lastMessageTimestamps = {};  // rate limiting
const handoverMap = {};            // { jid: expiryTimestamp } - bot paused for this chat
const firstReplyDone = new Set();  // jids that already got the signature

// ─────────────────────────────────────
// 💾 MEMORY PERSISTENCE
// ─────────────────────────────────────
const MEMORY_FILE = path.join(__dirname, 'memory.json');

function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
            const data = JSON.parse(raw);
            Object.assign(chatMemory, data);
            console.log('💾 Memory loaded from disk.');
        }
    } catch (err) {
        console.log('⚠️ Failed to load memory:', err.message);
    }
}

let saveTimeout = null;
function saveMemory() {
    // debounce writes so we don't hammer disk on every message
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            fs.writeFileSync(MEMORY_FILE, JSON.stringify(chatMemory), 'utf-8');
        } catch (err) {
            console.log('⚠️ Failed to save memory:', err.message);
        }
    }, 2000);
}

function getMemory(user) {
    if (!chatMemory[user]) chatMemory[user] = [];

    const mem = chatMemory[user];
    const limit = config.settings.memoryLimit;

    if (mem.length > limit) {
        chatMemory[user] = mem.slice(-limit);
    }

    return chatMemory[user];
}

// ─────────────────────────────────────
// 🚀 MAIN BOT
// ─────────────────────────────────────
let memoryLoaded = false;

async function launchCymorCore() {

    if (!memoryLoaded) {
        loadMemory();
        memoryLoaded = true;
    }

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
        markOnlineOnConnect: false,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    // ─────────────────────────────────────
    // 📱 PAIRING CODE (only if not registered)
    // ─────────────────────────────────────
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.BOT_NUMBER;

        if (!phoneNumber) {
            console.log('⚠️ BOT_NUMBER env variable not set. Cannot request pairing code.');
        } else {
            // Small delay so the socket is fully ready before requesting the code
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
                    console.log('═══════════════════════════════');
                    console.log(`📱 PAIRING CODE: ${code}`);
                    console.log('Enter this in WhatsApp > Linked Devices > Link a Device > Link with phone number');
                    console.log('═══════════════════════════════');
                } catch (err) {
                    console.log('⚠️ Failed to generate pairing code:', err.message);
                }
            }, 3000);
        }
    }

    // 🔁 CONNECTION HANDLER
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('🚀 Cymor Assistant Online');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error instanceof Boom
                ? lastDisconnect.error.output.statusCode
                : null;

            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`🔌 Connection closed (code: ${statusCode || 'unknown'}). Reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                setTimeout(() => launchCymorCore(), 3000);
            } else {
                console.log('🚪 Logged out. Delete cymor_auth_session folder and restart to re-pair.');
            }
        }
    });

    // ─────────────────────────────────────
    // 🧹 AUTO PURGE
    // ─────────────────────────────────────
    helpers.initializeAutoPurge(handledLeads, clientStates, chatMemory);

    // ─────────────────────────────────────
    // 💬 MESSAGE HANDLER
    // ─────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages }) => {

        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const pushName = msg.pushName || "User";
        const isFromMe = msg.key.fromMe;

        const body =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        const hasText = !!body;
        const text = body.trim();
        const lower = text.toLowerCase();

        // ─────────────────────────────────────
        // 🔐 OWNER CONTROL COMMANDS (from owner's own number, any chat)
        // ─────────────────────────────────────
        if (isFromMe && from === config.ownerNumber) {
            if (lower === "!boton") {
                botActive = true;
                return sock.sendMessage(from, { text: "🟢 Cymor Assistant is now ON" });
            }

            if (lower === "!botoff") {
                botActive = false;
                return sock.sendMessage(from, { text: "🔴 Cymor Assistant is now OFF" });
            }
        }

        // ─────────────────────────────────────
        // 🤝 HUMAN HANDOVER DETECTION
        // If the owner manually replies in any chat (not via commands above),
        // pause the bot for that chat for a while.
        // ─────────────────────────────────────
        if (isFromMe && from !== config.ownerNumber) {
            helpers.setHandover(handoverMap, from);
            return; // owner is handling this chat themselves, don't process further
        }

        // Ignore own messages beyond the above checks
        if (isFromMe) return;

        // ─────────────────────────────────────
        // 🚫 BOT OFF (owner online / manually handling things)
        // ─────────────────────────────────────
        if (!botActive) return;

        // ─────────────────────────────────────
        // 🤝 CHECK HANDOVER FOR THIS SPECIFIC CHAT
        // ─────────────────────────────────────
        if (helpers.isHandedOver(handoverMap, from)) return;

        // ─────────────────────────────────────
        // 🚦 RATE LIMIT
        // ─────────────────────────────────────
        if (helpers.isRateLimited(lastMessageTimestamps, from)) return;

        // ─────────────────────────────────────
        // 📎 NON-TEXT MESSAGE FALLBACK
        // ─────────────────────────────────────
        if (!hasText) {
            await sock.sendMessage(from, {
                text: "I can't view media right now, but tell me what you need in text and I'll help! 📝"
            });
            return;
        }

        // ─────────────────────────────────────
        // 🎮 EFOOTBALL FEATURE
        // ─────────────────────────────────────
        if (lower.startsWith("challenge ")) {
            const squad = text.replace(/^challenge\s*/i, "").trim() || "Unknown Squad";

            return sock.sendMessage(from, {
                text: helpers.formatMatchChallenge(pushName, squad)
            });
        }

        // ─────────────────────────────────────
        // 💼 BUSINESS LEAD DETECTION (once per session per user)
        // ─────────────────────────────────────
        if (helpers.isBusinessLead(lower) && !handledLeads.has(from)) {
            handledLeads.add(from);

            await sock.sendMessage(config.ownerNumber, {
                text: `💼 NEW BUSINESS LEAD\n\n👤 From: ${pushName}\n📩 Message: ${text}`
            });
        }

        // ─────────────────────────────────────
        // 🧠 CHAT MEMORY + AI REPLY
        // ─────────────────────────────────────
        const memory = getMemory(from);

        memory.push({
            role: "user",
            parts: [{ text }]
        });

        try {
            // Typing simulation
            await sock.sendPresenceUpdate('composing', from);
            await new Promise(r => setTimeout(r, helpers.getTypingDelay(text.length)));

            const result = await aiModel.generateContent({
                contents: memory
            });

            let reply = result.response.text();

            memory.push({
                role: "model",
                parts: [{ text: reply }]
            });

            saveMemory();

            const isFirstReply = !firstReplyDone.has(from);
            firstReplyDone.add(from);

            reply = helpers.appendSignature(reply, isFirstReply);

            await sock.sendPresenceUpdate('paused', from);

            return sock.sendMessage(from, { text: reply });

        } catch (err) {
            console.log('⚠️ Gemini error:', err.message);

            // Remove the unanswered user message so it doesn't poison future context
            memory.pop();

            await sock.sendPresenceUpdate('paused', from);

            return sock.sendMessage(from, {
                text: "⚠️ I'm having trouble responding right now. Please try again shortly."
            });
        }
    });
}

// 🚀 START BOT
launchCymorCore();
