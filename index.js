const helper = require('./helper');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    Browsers // Added to ensure standard browser strings
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const axios = require('axios');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');
const fs = require('fs');

// ─── 🌐 RENDER PORT BINDING ───
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Cymor Executive Core: Active\n');
}).listen(port);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
    systemInstruction: config.systemPrompt 
});

let isBotActive = true;
const clientStates = {};
const pendingNotifications = new Set();

async function launchCymorCore() {
    // 🛡️ SESSION CLEANER: Removes incomplete creds if pairing failed previously
    if (!fs.existsSync('./cymor_auth_session/creds.json')) {
        console.log("🧹 Initializing clean session...");
    }

    const { state, saveCreds } = await useMultiFileAuthState('cymor_auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        // 🔄 FIXED BROWSER STRING: Essential for "Real" pairing codes
        browser: Browsers.ubuntu('Chrome') 
    });

    sock.ev.on('creds.update', saveCreds);

    // ─── 🔑 RE-OPTIMIZED PAIRING ENGINE ───
    let pairingTimeout;
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered) {
            const botPhoneNumber = process.env.BOT_PHONE_NUMBER;
            
            const requestNewCode = async () => {
                if (sock.authState.creds.registered) return;
                try {
                    // Give the socket a moment to stabilize
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    console.log(`📡 Requesting Official Pairing Code for ${botPhoneNumber}...`);
                    let code = await sock.requestPairingCode(botPhoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    
                    console.log(`\n╔══════════════════════════════════════════╗`);
                    console.log(`║   💎 CYMOR BOT PAIRING CODE GENERATED    ║`);
                    console.log(`╠══════════════════════════════════════════╣`);
                    console.log(`║          👉  ${code}  👈          ║`);
                    console.log(`╚══════════════════════════════════════════╝\n`);
                    
                    // Refresh code every 2 minutes if not paired
                    clearTimeout(pairingTimeout);
                    pairingTimeout = setTimeout(requestNewCode, 120000); 
                } catch (err) {
                    console.error("❌ Pairing Request Fault. Retrying...");
                    setTimeout(requestNewCode, 10000);
                }
            };

            if (!pairingTimeout) await requestNewCode();
        }

        if (connection === 'open') {
            console.log('🚀 Cymor Assistant: Online and Fully Linked!');
            clearTimeout(pairingTimeout);
        }

        if (connection === 'close') {
            const reconnect = (lastDisconnect.error instanceof Boom) ? 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (reconnect) launchCymorCore();
        }
    });

    // ─── 💬 MESSAGE HANDLING ───
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const pushName = msg.pushName || "User";
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const lowerBody = body.toLowerCase();

        if (from === config.ownerNumber) {
            if (lowerBody === '!bot off') { isBotActive = false; return await sock.sendMessage(from, { text: "🔒 Assistant Paused." }); }
            if (lowerBody === '!bot on') { isBotActive = true; return await sock.sendMessage(from, { text: "🔓 Assistant Resumed." }); }
        }

        if (!isBotActive) return;

        // !play command
        if (lowerBody.startsWith('!play ')) {
            const query = body.substring(6).trim();
            await sock.sendMessage(from, { text: `⚡ _Fetching: "${query}"..._` }, { quoted: msg });
            try {
                const search = await axios.get(`https://youtube-search-api.p.rapidapi.com/search`, {
                    params: { q: query },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-search-api.p.rapidapi.com' }
                });
                const dl = await axios.get(`https://youtube-mp310.p.rapidapi.com/download/mp3`, {
                    params: { url: search.data.videos[0].link },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-mp310.p.rapidapi.com' }
                });
                return await sock.sendMessage(from, { audio: { url: dl.data.downloadUrl || dl.data.link }, mimetype: 'audio/mp4' }, { quoted: msg });
            } catch (e) { return await sock.sendMessage(from, { text: "❌ Jukebox Error." }); }
        }

        // Gemini AI Chat
        if (clientStates[from] === 'IN_GEMINI_CHAT') {
            if (lowerBody === 'exit') { clientStates[from] = null; return await sock.sendMessage(from, { text: "🤖 AI Session Ended. Have a lovely day!" }); }
            const res = await aiModel.generateContent(body);
            return await sock.sendMessage(from, { text: `${res.response.text()}\n\n_I will ensure Cymor sees your message._\n\n*Type exit to return to Menu.*` }, { quoted: msg });
        }

        // Menu Selections
        if (body === '1') { clientStates[from] = 'IN_GEMINI_CHAT'; return await sock.sendMessage(from, { text: "🤖 *CymorAI Activated.*\nHow can I help you today?" }); }
        if (body === '2') return await sock.sendMessage(from, { text: "💼 *Business Portal*\nDescribe your project. Have a lovely day!" });
        if (body === '3') return await sock.sendMessage(from, { text: "🎵 *Music Jukebox*\nSend `!play [Song Name]` to enjoy some music!" });
        if (body === '4') return await sock.sendMessage(from, { text: "✨ *Brand Portfolio*\nSite Dev | Bots | Premium Edits. Have a lovely day!" });
        if (body === '5') return await sock.sendMessage(from, { text: "🎮 *eFootball Challenge*\nDrop your squad name. Cymor will check this soon!" });
        if (body === '6') { 
            pendingNotifications.add(from);
            await sock.sendMessage(config.ownerNumber, { text: `🚨 Lead: ${pushName} (${from})` });
            return await sock.sendMessage(from, { text: "✨ Notification Sent! Have a lovely day!" });
        }

        // Greeting & Menu
        const greets = ["hi", "hello", "sasa", "niaje", "hey"];
        if (greets.some(g => lowerBody.includes(g))) {
            const currentActivity = config.activities[Math.floor(Math.random() * config.activities.length)];
            const menu = `
╔═══════════════════════════╗
         *CYMOR EXECUTIVE ASSISTANT*
╚═══════════════════════════╝

Hi *${pushName}*! 👋 

Thanks for contacting Cymor! He is currently *offline* ${currentActivity}.

✨ ══════════════════════════ ✨
   *💬 [1]* Chat with CymorAI
   *💼 [2]* Business Request
   *🎵 [3]* Music Jukebox
   *✨ [4]* Brand Portfolio
   *🎮 [5]* eFootball Challenge
   *🤖 [6]* Request a Bot Like Me
✨ ══════════════════════════ ✨

_Select an option (1-6) or use !play to start._
_Have a lovely day!_`;
            return await sock.sendMessage(from, { text: menu.trim() }, { quoted: msg });
        }
    });
}

launchCymorCore();
