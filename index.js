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

// ─────────────────────────────────────
// 🌐 RENDER PORT BINDING
// ─────────────────────────────────────
const port = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Cymor Executive Core: Active\n');
}).listen(port);

// ─────────────────────────────────────
// 🤖 GEMINI INITIALIZATION
// ─────────────────────────────────────
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const aiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: config.systemPrompt
});

// ─────────────────────────────────────
// 🧠 GLOBAL STATES
// ─────────────────────────────────────
let isBotActive = true;

const clientStates = {};
const greetedUsers = new Set();

// ─────────────────────────────────────
// 🚀 MAIN LAUNCHER
// ─────────────────────────────────────
async function launchCymorCore() {

    const { state, saveCreds } =
        await useMultiFileAuthState('cymor_auth_session');

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({

        version,

        // ✅ Connection Stability
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        defaultQueryTimeoutMs: 60000,

        auth: {
            creds: state.creds,

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

        if (
            connection === 'connecting' &&
            !sock.authState.creds.registered
        ) {

            setTimeout(async () => {

                try {

                    const phoneNumber =
                        process.env.BOT_PHONE_NUMBER;

                    console.log('📲 Requesting Pairing Code...');

                    let code =
                        await sock.requestPairingCode(phoneNumber);

                    code =
                        code?.match(/.{1,4}/g)?.join("-") || code;

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

        if (connection === 'open') {

            console.log('🚀 CYMOR IS ONLINE!');

        }

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

    // ─────────────────────────────────────
    // 💬 MESSAGE HANDLER
    // ─────────────────────────────────────
    sock.ev.on('messages.upsert', async (m) => {

        const msg = m.messages[0];

        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;

        // Ignore status broadcasts
        if (from === 'status@broadcast') return;

        const pushName = msg.pushName || "User";

        const body = (
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""
        ).trim();

        const lowerBody = body.toLowerCase();

        // ─────────────────────────────────────
        // 🔒 OWNER COMMANDS
        // ─────────────────────────────────────
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

        // ─────────────────────────────────────
        // 🎵 MUSIC DOWNLOADER
        // ─────────────────────────────────────
        if (lowerBody.startsWith('!play ')) {

            const query = body.substring(6).trim();

            if (!query) {

                return await sock.sendMessage(from, {
                    text: "❌ Please provide a song name."
                });
            }

            await sock.sendMessage(from, {
                text:
`🎵 *Cymor Digital Jukebox*

Searching for:
➡️ ${query}

Please wait while I fetch high-quality audio...`
            }, { quoted: msg });

            try {

                // ✅ Better Search Endpoint
                const search =
                    await axios.get(
                        'https://youtube-search-api.p.rapidapi.com/search',
                        {
                            params: {
                                q: query
                            },

                            headers: {
                                'x-rapidapi-key': config.rapidApiKey,
                                'x-rapidapi-host': 'youtube-search-api.p.rapidapi.com'
                            }
                        }
                    );

                const firstVideo =
                    search?.data?.videos?.[0];

                if (!firstVideo) {

                    return await sock.sendMessage(from, {
                        text: "❌ No matching song found."
                    });
                }

                // ✅ Better Downloader Endpoint
                const download =
                    await axios.get(
                        'https://youtube-mp36.p.rapidapi.com/dl',
                        {
                            params: {
                                id: firstVideo.id
                            },

                            headers: {
                                'x-rapidapi-key': config.rapidApiKey,
                                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
                            }
                        }
                    );

                const audioUrl = download?.data?.link;

                if (!audioUrl) {

                    return await sock.sendMessage(from, {
                        text: "❌ Failed to generate audio link."
                    });
                }

                await sock.sendMessage(from, {
                    audio: {
                        url: audioUrl
                    },
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });

            } catch (err) {

                console.log(err);

                return await sock.sendMessage(from, {
                    text:
"❌ Music retrieval failed.\n\nPossible causes:\n• RapidAPI limit reached\n• Song unavailable\n• Temporary network issue"
                });
            }
        }

        // ─────────────────────────────────────
        // 🤖 AI CHAT MODE
        // ─────────────────────────────────────
        if (clientStates[from] === 'IN_GEMINI_CHAT') {

            if (lowerBody === 'exit') {

                clientStates[from] = null;

                return await sock.sendMessage(from, {
                    text:
"🤖 CymorAI session terminated.\n\nReturned to Executive Menu."
                });
            }

            try {

                const res =
                    await aiModel.generateContent(body);

                return await sock.sendMessage(from, {
                    text:
`${res.response.text()}

*Type "exit" to return to the Executive Menu.*`
                }, { quoted: msg });

            } catch {

                return await sock.sendMessage(from, {
                    text:
"❌ AI core temporarily overloaded. Please try again shortly."
                });
            }
        }

        // ─────────────────────────────────────
        // 🛡️ OPTION 6 NUMBER DROP
        // ─────────────────────────────────────
        if (clientStates[from] === 'WAITING_FOR_BOT_ORDER') {

            await sock.sendMessage(
                config.ownerNumber,
                {
                    text:
`💰 BOT ORDER LEAD

👤 Client: ${pushName}
📞 Contact: ${body}`
                }
            );

            clientStates[from] = null;

            return await sock.sendMessage(from, {
                text:
"Merci Beaucoup. 🙏\n\nSimion has received your contact details and will reach out soon.\n\nHave a lovely day!"
            });
        }

        // ─────────────────────────────────────
        // 🎛️ EXECUTIVE MENU OPTIONS
        // ─────────────────────────────────────
        const menuOptions = {

            '1': {
                state: 'IN_GEMINI_CHAT',
                text:
`🤖 *CymorAI Intelligence Layer Activated*

You are now connected to my advanced neural core. I can assist with coding, creative writing, or general inquiries while Simion is away.

I have access to his project frameworks and can brainstorm with you in real-time. I also know his favorite food and movie too 😛

*How can I assist your brilliance today?*

_(Type 'exit' at any time to return to the main menu)_`
            },

            '2': {
                text:
`💼 *CymorTechServices: Business & Development Portal*

Welcome to our professional service hub.

🚀 *Custom WhatsApp Automation*-Get a whatsapp bot to run your business 24/7 and handle all orders.`
🌐 *Full-Stack Web Development*-Get your own website for personal use or business project.`
🤖 *AI Integration*-Get your own Ai Assistant to help you in all your tasks.`
📊 *Technical Consulting*-Open to receive and give any tech-related advice.`
🎬 *Professional Video&Photo Editing*-In patnership with my friend Alega,we offer breathtaking edits that will captivate you.'@yourbestedits09.

Please describe your project in detail below.`
            },

            '3': {
                text:
`🎵 *Cymor Digital Jukebox: Active*

To download music:

Type:
*!play song-name*

Example:
*!play Baruch Hashem Adonai*

Send your command now.`
            },

            '4': {
                text:
`✨ *Legendary Smiley Cymor Portfolio*

✅ CymorAI-An Ai assistant that perfoms all tasks like answering questions or even writing code.`
✅ Cymor AllVideo Downloader-Downloads videos from Facebook,Instagram,Tiktok and Youtube once you paste the link.`
✅ Cymor Bible App-A Bible App with trivia,audio bible and daily verses to draw you close to God.`
✅ Cymor Football Hub-All football analytics in one place.`

🛠️ Current Project:
*EssDee Enteprise*-In patnership with David the Developer🤝`

🎬 Cymor Movie Hub coming soon 😁`
            },

            '5': {
                text:
                    
`🎮 *eFootball Tactical Challenge*

⚽ Squad Strength: 3137
Current formation:4-2-3-1
Best player:Fransenco Totti(105)
Drop your Username and Collective Strength below to challenge Simion.He will check it up and contact you once he is online.`
            },

            '6': {
                text:
`🤖 *Acquire Your Own Digital Assistant*

Interested in a premium WhatsApp automation system like me?

Leave your WhatsApp number below and Simion will contact you personally.`
            }
        };

        if (menuOptions[body]) {

            if (menuOptions[body].state) {
                clientStates[from] =
                    menuOptions[body].state;
            }

            if (body === '6') {
                clientStates[from] =
                    'WAITING_FOR_BOT_ORDER';
            }

            return await sock.sendMessage(from, {
                text: menuOptions[body].text
            }, { quoted: msg });
        }

        // ─────────────────────────────────────
        // 📜 AUTO MENU ON FIRST MESSAGE
        // ─────────────────────────────────────
        if (!greetedUsers.has(from)) {

            greetedUsers.add(from);

            const currentActivity =
                config.activities[
                    Math.floor(
                        Math.random() *
                        config.activities.length
                    )
                ];

            const menu = `
╔═══════════════════════════╗
     *CYMOR EXECUTIVE CORE*
╚═══════════════════════════╝

Hi *${pushName}*! 👋

Thanks for contacting Cymor.

He is currently *offline*
${currentActivity}

✨ ══════════════════════════ ✨
💬 *[1]* Chat with CymorAI
💼 *[2]* Business Request
🎵 *[3]* Music Jukebox
✨ *[4]* Brand Portfolio
🎮 *[5]* eFootball Challenge
🤖 *[6]* Request a Bot Like Me
✨ ══════════════════════════ ✨

_Select an option (1-6)_

_Have a lovely day!_`;

            return await sock.sendMessage(from, {
                text: menu.trim()
            }, { quoted: msg });
        }
    });
}

launchCymorCore();
