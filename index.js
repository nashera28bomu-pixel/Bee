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
const axios = require('axios');
const http = require('http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

// ─────────────────────────────────────
// 🌐 RENDER PORT BINDING
// ─────────────────────────────────────
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Cymor Executive Core: Active\n');
}).listen(port);

// 🤖 GEMINI INITIALIZATION
const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const aiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: config.systemPrompt
});

// 🧠 GLOBAL STATES
let isBotActive = true;
const clientStates = {};

async function launchCymorCore() {
    const { state, saveCreds } = await useMultiFileAuthState('cymor_auth_session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        logger: pino({ level: 'silent' }),
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: false,
        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    // 🔑 STABLE PAIRING SYSTEM
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'connecting' && !sock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    const phoneNumber = process.env.BOT_PHONE_NUMBER;
                    console.log('📲 Requesting Pairing Code...');
                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log(`\n╔══════════════════════════════════╗\n║      CYMOR PAIRING CODE         ║\n╠══════════════════════════════════╣\n║       ${code}       ║\n╚══════════════════════════════════╝\n`);
                } catch (err) { console.error('❌ Pairing Error:', err); }
            }, 5000);
        }
        if (connection === 'open') console.log('🚀 CYMOR IS ONLINE!');
        if (connection === 'close') {
            const reconnect = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (reconnect) launchCymorCore();
        }
    });

    // 💬 MESSAGE HANDLER
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        if (from === 'status@broadcast') return;

        const pushName = msg.pushName || "User";
        const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const lowerBody = body.toLowerCase();

        // 🔒 OWNER COMMANDS
        if (from === config.ownerNumber) {
            if (lowerBody === '!bot off') { isBotActive = false; return await sock.sendMessage(from, { text: "🔒 Assistant Paused." }); }
            if (lowerBody === '!bot on') { isBotActive = true; return await sock.sendMessage(from, { text: "🔓 Assistant Resumed." }); }
        }

        if (!isBotActive) return;

        // 🎵 MUSIC DOWNLOADER
        if (lowerBody.startsWith('!play ')) {
            const query = body.substring(6).trim();
            if (!query) return await sock.sendMessage(from, { text: "❌ Please provide a song name." });
            await sock.sendMessage(from, { text: `🎵 *Cymor Digital Jukebox*\n\nSearching for: ${query}\nPlease wait...` }, { quoted: msg });
            try {
                const search = await axios.get('https://youtube-search-api.p.rapidapi.com/search', {
                    params: { q: query },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-search-api.p.rapidapi.com' }
                });
                const firstVideo = search?.data?.videos?.[0];
                if (!firstVideo) return await sock.sendMessage(from, { text: "❌ No song found." });
                const download = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
                    params: { id: firstVideo.id },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com' }
                });
                const audioUrl = download?.data?.link;
                if (!audioUrl) return await sock.sendMessage(from, { text: "❌ Failed to link audio." });
                return await sock.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg' }, { quoted: msg });
            } catch (err) { return await sock.sendMessage(from, { text: "❌ Music retrieval failed. Try again shortly." }); }
        }

        // 🤖 AI CHAT MODE
        if (clientStates[from] === 'IN_GEMINI_CHAT') {
            if (lowerBody === 'exit') { clientStates[from] = null; return await sock.sendMessage(from, { text: "🤖 CymorAI session terminated.\n\nReturned to Executive Menu." }); }
            try {
                const res = await aiModel.generateContent(body);
                return await sock.sendMessage(from, { text: `${res.response.text()}\n\n*Type "exit" to return to the Executive Menu.*` }, { quoted: msg });
            } catch { return await sock.sendMessage(from, { text: "❌ AI overloaded. Try again later." }); }
        }

        // 🛡️ OPTION 6 NUMBER DROP
        if (clientStates[from] === 'WAITING_FOR_BOT_ORDER') {
            await sock.sendMessage(config.ownerNumber, { text: `💰 BOT ORDER LEAD\n\n👤 Client: ${pushName}\n📞 Contact: ${body}` });
            clientStates[from] = null;
            return await sock.sendMessage(from, { text: "Merci Beaucoup. 🙏\n\nSimion has received your contact details and will reach out soon.\n\nHave a lovely day!" });
        }

        // 🎛️ EXECUTIVE MENU OPTIONS
        const menuOptions = {
            '1': {
                state: 'IN_GEMINI_CHAT',
                text: `🤖 *CymorAI Intelligence Layer Activated*\n\nYou are now connected to my advanced neural core. I can assist with coding, creative writing, or general inquiries while Simion is away.\n\nI also know his favorite food and movie too 😛\n\n*How can I assist your brilliance today?*\n\n_(Type 'exit' at any time to return to the main menu)_`
            },
            '2': {
                text: `💼 *CymorTechServices: Business & Development Portal*\n\nWelcome to our professional service hub.\n\n🚀 *Custom WhatsApp Automation* - Get a whatsapp bot to run your business 24/7 and handle all orders.\n🌐 *Full-Stack Web Development* - Get your own website for personal use or business project.\n🤖 *AI Integration* - Get your own Ai Assistant to help you in all your tasks.\n📊 *Technical Consulting* - Open to receive and give any tech-related advice.\n🎬 *Professional Video & Photo Editing* - In partnership with my friend Alega, we offer breathtaking edits that will captivate you. @yourbestedits09\n\n*Please describe your project in detail below. Have a lovely day!*`
            },
            '3': {
                text: `🎵 *Cymor Digital Jukebox: Active*\n\nTo download music:\n\nType:\n*!play song-name*\n\nExample:\n*!play Baruch Hashem Adonai*\n\nSend your command now. Have a lovely day!`
            },
            '4': {
                text: `✨ *Legendary Smiley Cymor Portfolio*\n\n✅ *CymorAI* - An Ai assistant that performs all tasks like answering questions or writing code.\n✅ *Cymor AllVideo Downloader* - Downloads videos from FB, IG, Tiktok, and YT via link.\n✅ *Cymor Bible App* - A Bible App with trivia, audio bible, and daily verses.\n✅ *Cymor Football Hub* - All football analytics in one place.\n\n🛠️ *Current Project:* EssDee Enterprise - In partnership with David the Developer 🤝\n🎬 *Cymor Movie Hub* coming soon 😁\n\nHave a lovely day!`
            },
            '5': {
                text: `🎮 *eFootball Tactical Challenge*\n\nIt seems you are into eFootball like my owner. Well he loves challenges!\n\n⚽ *Squad Strength:* 3137\n🏃‍♂️ *Formation:* 4-2-3-1\n🌟 *Best player:* Francesco Totti (105)\n\nDrop your Username and Collective Strength below to challenge Simion. He will check it up once he is online. Have a lovely day!`
            },
            '6': {
                state: 'WAITING_FOR_BOT_ORDER',
                text: `🤖 *Acquire Your Own Digital Assistant*\n\nInterested in a premium WhatsApp automation system like me?\n\nWell, I am expensive 😎 but not that much. If you are ready to order one, just leave your number below and my owner will contact you for negotiation. Have a lovely day!`
            }
        };

        if (menuOptions[body]) {
            if (menuOptions[body].state) clientStates[from] = menuOptions[body].state;
            return await sock.sendMessage(from, { text: menuOptions[body].text }, { quoted: msg });
        }

        // 📜 AUTO MENU ON FIRST MESSAGE OR INVALID INPUT
        const currentActivity = config.activities[Math.floor(Math.random() * config.activities.length)];
        const menu = `
╔═══════════════════════════╗
     *CYMOR EXECUTIVE ASSISTANT*
╚═══════════════════════════╝

Hi *${pushName}*! 👋

Thanks for contacting Cymor. He is currently *offline* ${currentActivity}.Feel free to browse the menu or come back later when he is online.

✨ ══════════════════════════ ✨
💬 *[1]* Chat with CymorAI
💼 *[2]* Business Request
🎵 *[3]* Music Jukebox
✨ *[4]* Brand Portfolio
🎮 *[5]* eFootball Challenge
🤖 *[6]* Request a Bot Like Me
✨ ══════════════════════════ ✨

_Select an option (1-6) to proceed._

_Have a lovely day!_`;

        return await sock.sendMessage(from, { text: menu.trim() }, { quoted: msg });
    });
}

launchCymorCore();
