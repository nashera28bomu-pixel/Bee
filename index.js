const helper = require('./helper');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const axios = require('axios');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

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
    const { state, saveCreds } = await useMultiFileAuthState('cymor_auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    // ─── 🔑 SMART PAIRING ENGINE (WITH AUTO-RETRY) ───
    let pairingTimeout;
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !sock.authState.creds.registered) {
            const botPhoneNumber = process.env.BOT_PHONE_NUMBER;
            
            const requestNewCode = async () => {
                if (sock.authState.creds.registered) return;
                try {
                    console.log(`📡 Generating fresh pairing code for ${botPhoneNumber}...`);
                    let code = await sock.requestPairingCode(botPhoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log(`\n╔══════════════════════════════════════════╗`);
                    console.log(`║   💎 CYMOR BOT PAIRING CODE GENERATED    ║`);
                    console.log(`╠══════════════════════════════════════════╣`);
                    console.log(`║          👉  ${code}  👈          ║`);
                    console.log(`╚══════════════════════════════════════════╝\n`);
                    
                    // If not paired in 110 seconds, trigger another code request
                    clearTimeout(pairingTimeout);
                    pairingTimeout = setTimeout(requestNewCode, 110000); 
                } catch (err) {
                    console.error("❌ Pairing Code Request Failed, retrying in 10s...");
                    setTimeout(requestNewCode, 10000);
                }
            };

            if (!pairingTimeout) await requestNewCode();
        }

        if (connection === 'open') {
            console.log('🚀 Cymor Assistant: Online and Connected!');
            clearTimeout(pairingTimeout);
        }

        if (connection === 'close') {
            const reconnect = (lastDisconnect.error instanceof Boom) ? 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (reconnect) launchCymorCore();
        }
    });

    // ─── 💬 MESSAGE PIPELINE ───
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

        // 🎵 Jukebox
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

        // 🤖 AI Chat State
        if (clientStates[from] === 'IN_GEMINI_CHAT') {
            if (lowerBody === 'exit') { 
                clientStates[from] = null; 
                return await sock.sendMessage(from, { text: "🤖 AI Session Ended. Have a lovely day!" }); 
            }
            const res = await aiModel.generateContent(body);
            const aiReply = res.response.text();
            return await sock.sendMessage(from, { 
                text: `${aiReply}\n\n_I will ensure Cymor sees your message once he is back._\n\n*Type exit to return to Menu.*` 
            }, { quoted: msg });
        }

        // 🎛️ Menu Logic Options
        if (body === '1') { clientStates[from] = 'IN_GEMINI_CHAT'; return await sock.sendMessage(from, { text: "🤖 *CymorAI Activated.*\nHow can I help you today? I'll make sure Simion sees this later." }); }
        if (body === '2') return await sock.sendMessage(from, { text: "💼 *Business Portal*\nPlease describe your project needs in detail. Simion will see this and get back to you. Have a lovely day!" });
        if (body === '3') return await sock.sendMessage(from, { text: "🎵 *Music Jukebox*\nSend `!play [Song Name]` to enjoy some music while you wait for Cymor!" });
        if (body === '4') return await sock.sendMessage(from, { text: "✨ *Brand Portfolio*\nBrowse our services: Site Dev, Bot creation, and Premium Edits. Have a lovely day!" });
        if (body === '5') return await sock.sendMessage(from, { text: "🎮 *eFootball Challenge*\nDrop your squad name! Cymor (3137 strength) will check this soon. Have a lovely day!" });
        if (body === '6') { 
            pendingNotifications.add(from);
            await sock.sendMessage(config.ownerNumber, { text: `🚨 Contact request from ${pushName} (${from})` });
            return await sock.sendMessage(from, { text: "✨ *Notification Sent!*\nCymor has been alerted. He will contact you soon. Have a lovely day!" });
        }

        // 🌟 Welcome Menu
        const greets = ["hi", "hello", "sasa", "niaje", "mambo", "hey"];
        if (greets.some(g => lowerBody.includes(g))) {
            const currentActivity = config.activities[Math.floor(Math.random() * config.activities.length)];
            const menu = `
╔═══════════════════════════╗
         *CYMOR EXECUTIVE ASSISTANT*
╚═══════════════════════════╝

Hi *${pushName}*! 👋 

Thanks for contacting Cymor! He is currently *offline* ${currentActivity}.

I am his digital assistant. You can browse the options below, play some MP3 music using *!play*, or simply come back later!

✨ ══════════════════════════ ✨
   *💬 [1]* Chat with CymorAI
   *💼 [2]* Business Request
   *🎵 [3]* Music Jukebox
   *✨ [4]* Brand Portfolio
   *🎮 [5]* eFootball Challenge
   *🤖 [6]* Request a Bot Like Me
✨ ══════════════════════════ ✨

*Select an option (1-6) to start.*
_Created by Legendary Smiley Cymor_
_Have a lovely day!_
`;
            return await sock.sendMessage(from, { text: menu.trim() }, { quoted: msg });
        }
    });
}

launchCymorCore();
