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
const http = require('http'); // Required for Render Port Binding
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

// ─── 🌐 RENDER DUMMY SERVER (Fixes "No open ports detected") ───
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Cymor Assistant Core is Operational\n');
}).listen(port);

// Initialize Gemini Core Configuration
const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
    systemInstruction: config.systemPrompt 
});

// App Engine State Repositories
let isBotActive = true;
const sessionHistory = new Set();
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

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log('🚀 Cymor Executive Core is completely initialized and listening.');
            
            // ─── 🔑 RENDER PAIRING CODE GENERATOR MODULE ───
            if (!sock.authState.creds.registered) {
                const botPhoneNumber = process.env.BOT_PHONE_NUMBER;
                
                if (botPhoneNumber) {
                    console.log(`📡 Requesting pairing code for: ${botPhoneNumber}`);
                    // 5-second delay to ensure socket stability before requesting code
                    setTimeout(async () => {
                        try {
                            let code = await sock.requestPairingCode(botPhoneNumber);
                            code = code?.match(/.{1,4}/g)?.join("-") || code;
                            console.log(`\n==================================================`);
                            console.log(`🔑 CYMOR ASSISTANT BOT PAIRING CODE FOR WHATSAPP:`);
                            console.log(`👉 [ ${code} ] 👈`);
                            console.log(`==================================================\n`);
                        } catch (err) {
                            console.error("❌ Critical Failure generating pairing code:", err);
                        }
                    }, 5000);
                } else {
                    console.log("⚠️ BOT_PHONE_NUMBER is not set in Environment Variables.");
                }
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (shouldReconnect) launchCymorCore();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const pushName = msg.pushName || "Mkuu";
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const lowerBody = body.toLowerCase();

        // ─── 🛡️ OWNER RECOGNITION & REMOTE TOGGLE ───
        if (from === config.ownerNumber) {
            if (lowerBody === '!bot off') {
                isBotActive = false;
                await sock.sendMessage(from, { text: "🔒 *System Status:* Assistant framework deactivated globally." });
                return;
            }
            if (lowerBody === '!bot on') {
                isBotActive = true;
                await sock.sendMessage(from, { text: "🔓 *System Status:* Assistant framework operational and active." });
                return;
            }
        }

        if (!isBotActive) return;

        // ─── 🎵 RAPIDAPI MUSIC JUKEBOX SYSTEM ───
        if (lowerBody.startsWith('!play ')) {
            const songQuery = body.substring(6).trim();
            if (!songQuery) {
                await sock.sendMessage(from, { text: "⚠️ Please specify a track title." }, { quoted: msg });
                return;
            }

            await sock.sendMessage(from, { text: `⚡ _Processing: "${songQuery}"..._` }, { quoted: msg });

            try {
                const searchResponse = await axios.get(`https://youtube-search-api.p.rapidapi.com/search`, {
                    params: { q: songQuery },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-search-api.p.rapidapi.com' }
                });

                const targetTrack = searchResponse.data.videos?.[0];
                const conversionResponse = await axios.get(`https://youtube-mp310.p.rapidapi.com/download/mp3`, {
                    params: { url: targetTrack.link },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-mp310.p.rapidapi.com' }
                });

                const downloadUrl = conversionResponse.data.downloadUrl || conversionResponse.data.link;
                await sock.sendMessage(from, { audio: { url: downloadUrl }, mimetype: 'audio/mp4', ptt: false }, { quoted: msg });
                if (clientStates[from] === 'AWAITING_JUKEBOX') clientStates[from] = null;
            } catch (err) {
                await sock.sendMessage(from, { text: "❌ *Extraction Failed.*" }, { quoted: msg });
            }
            return;
        }

        // ─── 🤖 GEMINI CHAT OVERRIDE ───
        if (clientStates[from] === 'IN_GEMINI_CHAT') {
            if (lowerBody === 'exit' || lowerBody === '0') {
                clientStates[from] = null;
                await sock.sendMessage(from, { text: "🤖 *AI Channel Closed.*" });
                return;
            }

            try {
                const chatResult = await aiModel.generateContent(body);
                const aiReply = chatResult.response.text();
                await sock.sendMessage(from, { text: `${aiReply}\n\n_💡 Type *exit* to escape._` }, { quoted: msg });
            } catch (error) {
                await sock.sendMessage(from, { text: "⚠️ _System buffer saturation._" });
            }
            return;
        }

        // ─── 🎛️ MENU ROUTING MATRIX ───
        if (sessionHistory.has(from)) {
            if (body === '1') {
                clientStates[from] = 'IN_GEMINI_CHAT';
                await sock.sendMessage(from, { text: "🤖 *CymorAI Core Engaged!*\n\nAsk me anything about Simion Nashera or CymorTechServices." }, { quoted: msg });
                return;
            }
            if (body === '2') {
                await sock.sendMessage(from, { text: "💼 *CymorTechServices Business Portal*\n\nPlease drop your requirements in one message. Cymor will prioritize it!" }, { quoted: msg });
                return;
            }
            if (body === '3') {
                clientStates[from] = 'AWAITING_JUKEBOX';
                await sock.sendMessage(from, { text: "🎵 *YouTube Jukebox*\n\nType **`!play [Song Name]`** to fetch a track!" }, { quoted: msg });
                return;
            }
            if (body === '4') {
                const businessMenu = `✨ ──────────────── ✨\n     *CYMORTECHSERVICES ECOSYSTEM* \n✨ ──────────────── ✨\n\n📱 *CymorBibleApp*\n🤖 *CymorAI*\n📥 *CymorAllVideoDownloader*\n🎬 *Cymor Movie Hub* (Finalizing)\n\n_Type *6* to request a callback!_`;
                await sock.sendMessage(from, { text: businessMenu }, { quoted: msg });
                return;
            }
            if (body === '5') {
                await sock.sendMessage(from, { text: "🎮 *eFootball Arena*\n\nCymor's **3137 squad** is ready. Drop your squad name for an invite!" }, { quoted: msg });
                return;
            }
            if (body === '6') {
                if (pendingNotifications.has(from)) {
                    await sock.sendMessage(from, { text: "⚠️ Callback already requested." }, { quoted: msg });
                    return;
                }
                pendingNotifications.add(from);
                await sock.sendMessage(config.ownerNumber, { text: `🚨 *Lead Alert:* User *${pushName}* (${from.split('@')[0]}) wants a bot consultation!` });
                await sock.sendMessage(from, { text: "✨ *Notification Locked!* Cymor has been alerted." }, { quoted: msg });
                return;
            }
        }

        // ─── 🌟 INITIAL HOME SCREEN ───
        const greetingKeywords = ["hi", "oee mkuu", "what's up", "whatsapp", "sasa", "niaje", "hey", "hello","rada","niambie"];
        if (greetingKeywords.some(k => lowerBody.includes(k)) && !sessionHistory.has(from)) {
            const currentActivity = config.activities[Math.floor(Math.random() * config.activities.length)];
            const menu = `✨ ──────────────── ✨\n   *CYMOR EXECUTIVE CORE* \n✨ ──────────────── ✨\n\nHi *${pushName}*! 👋\n\n🎯 *Status:* Currently ${currentActivity}.\n\n*💬 [1]* Chat with CymorAI\n*💼 [2]* Business Request\n*🎵 [3]* YouTube Jukebox\n*✨ [4]* Portfolio\n*🎮 [5]* eFootball Challenge\n*🤖 [6]* Want a Bot? (Contact Request)\n\n✨ ──────────────── ✨`;
            await sock.sendMessage(from, { text: menu }, { quoted: msg });
            sessionHistory.add(from);
        }
    });
}

launchCymorCore();
