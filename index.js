require('dotenv').config();

const helper = require('./helper');
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

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", 
    systemInstruction: config.systemPrompt 
});

let isBotActive = true;
const clientStates = {};

async function launchCymorCore() {

    const { state, saveCreds } = await useMultiFileAuthState('cymor_auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,

        // ✅ Connection Stability Upgrades
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        defaultQueryTimeoutMs: 60000,

        auth: {
            creds: state.creds,

            // 🛡️ Enhanced Signal Key Store
            keys: makeCacheableSignalKeyStore(
                state.keys,
                pino({ level: 'silent' })
            ),
        },

        logger: pino({ level: 'silent' }),

        // ✅ Stable Browser Signature
        browser: Browsers.ubuntu('Chrome'),

        syncFullHistory: false,
        markOnlineOnConnect: false,

        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    // ─────────────────────────────────────
    // 🔑 STABLE PAIRING SYSTEM
    // ─────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {

        const { connection, lastDisconnect } = update;

        // ✅ Request Pairing Code
        if (
            connection === 'connecting' &&
            !sock.authState.creds.registered
        ) {

            // ✅ Give WhatsApp time to initialize handshake
            setTimeout(async () => {

                try {

                    const phoneNumber = process.env.BOT_PHONE_NUMBER;

                    console.log('📲 Requesting Pairing Code...');

                    let code = await sock.requestPairingCode(phoneNumber);

                    code = code?.match(/.{1,4}/g)?.join("-") || code;

                    console.log('\n');
                    console.log('╔══════════════════════════════════╗');
                    console.log('║      CYMOR PAIRING CODE         ║');
                    console.log('╠══════════════════════════════════╣');
                    console.log(`║       ${code}       ║`);
                    console.log('╚══════════════════════════════════╝');
                    console.log('\n');

                } catch (err) {

                    console.error('❌ Pairing Error:', err);

                }

            }, 5000);
        }

        // ✅ Connected
        if (connection === 'open') {

            console.log('🚀 CYMOR IS ONLINE!');

        }

        // ✅ Reconnect Logic
        if (connection === 'close') {

            const reconnect =
                lastDisconnect?.error instanceof Boom
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

            console.log('⚠️ Connection Closed.');

            if (reconnect) {

                console.log('🔄 Reconnecting...');
                launchCymorCore();

            }
        }
    });

    // ─── 💬 CORE MESSAGE HANDLER ───
    sock.ev.on('messages.upsert', async (m) => {

        const msg = m.messages[0];

        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const pushName = msg.pushName || "User";

        const body = (
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""
        ).trim();

        const lowerBody = body.toLowerCase();

        if (from === config.ownerNumber) {

            if (lowerBody === '!bot off') {

                isBotActive = false;

                return await sock.sendMessage(from, {
                    text: "🔒 Assistant Paused."
                });
            }

            if (lowerBody === '!bot on') {

                isBotActive = true;

                return await sock.sendMessage(from, {
                    text: "🔓 Assistant Resumed."
                });
            }
        }

        if (!isBotActive) return;

        // Jukebox logic
        if (lowerBody.startsWith('!play ')) {

            const query = body.substring(6).trim();

            await sock.sendMessage(from, {
                text: `⚡ _Fetching: "${query}"..._`
            }, { quoted: msg });

            try {

                const search = await axios.get(
                    `https://youtube-search-api.p.rapidapi.com/search`,
                    {
                        params: { q: query },
                        headers: {
                            'x-rapidapi-key': config.rapidApiKey,
                            'x-rapidapi-host': 'youtube-search-api.p.rapidapi.com'
                        }
                    }
                );

                const dl = await axios.get(
                    `https://youtube-mp310.p.rapidapi.com/download/mp3`,
                    {
                        params: { url: search.data.videos[0].link },
                        headers: {
                            'x-rapidapi-key': config.rapidApiKey,
                            'x-rapidapi-host': 'youtube-mp310.p.rapidapi.com'
                        }
                    }
                );

                return await sock.sendMessage(from, {
                    audio: {
                        url: dl.data.downloadUrl || dl.data.link
                    },
                    mimetype: 'audio/mp4'
                }, { quoted: msg });

            } catch (e) {

                return await sock.sendMessage(from, {
                    text: "❌ Jukebox Error."
                });

            }
        }

        // AI Chat logic
        if (clientStates[from] === 'IN_GEMINI_CHAT') {

            if (lowerBody === 'exit') {

                clientStates[from] = null;

                return await sock.sendMessage(from, {
                    text: "🤖 Session Ended. Have a lovely day!"
                });
            }

            const res = await aiModel.generateContent(body);

            return await sock.sendMessage(from, {
                text: `${res.response.text()}\n\n*Type exit to return to Menu.*`
            }, { quoted: msg });
        }

        // Menu selections
        const options = {
            '1': 'IN_GEMINI_CHAT',
            '2': 'Business',
            '3': 'Music',
            '4': 'Portfolio',
            '5': 'eFootball',
            '6': 'Bot'
        };

        if (options[body]) {

            if (body === '1') {

                clientStates[from] = 'IN_GEMINI_CHAT';

                return await sock.sendMessage(from, {
                    text: "🤖 AI Activated. How can I help?"
                });
            }

            return await sock.sendMessage(from, {
                text: `✨ Option ${body} selected. Have a lovely day!`
            });
        }

        // Greeting & Menu
        const greets = ["hi", "hello", "sasa", "niaje"];

        if (greets.some(g => lowerBody.includes(g))) {

            const currentActivity =
                config.activities[
                    Math.floor(Math.random() * config.activities.length)
                ];

            const menu = `
╔═══════════════════════════╗
         *CYMOR EXECUTIVE CORE*
╚═══════════════════════════╝

Hi *${pushName}*! 👋 

Thanks for contacting Cymor! He is currently *offline* ${currentActivity}.
Browse the options below or come back later
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

            return await sock.sendMessage(from, {
                text: menu.trim()
            }, { quoted: msg });
        }
    });
}

launchCymorCore();
