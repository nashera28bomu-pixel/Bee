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
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

// Initialize Gemini Core Configuration
const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite", // Optimized for ultra-fast messaging performance
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
        printQRInTerminal: false, // Turned off to prioritize the Pairing Code system
        logger: pino({ level: 'silent' }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // ─── 🔑 RENDER PAIRING CODE GENERATOR MODULE ───
    if (!sock.authState.creds.registered) {
        // IMPORTANT: Change the placeholder phone number below in your environment or code to your actual bot number
        const botPhoneNumber = process.env.BOT_PHONE_NUMBER || "2547XXXXXXXX"; 
        
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
        }, 6000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            if (shouldReconnect) launchCymorCore();
        } else if (connection === 'open') {
            console.log('🚀 Cymor Executive Core is completely initialized and listening.');
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

        // Drop execution pipeline silently if engine is manually paused via master control
        if (!isBotActive) return;

        // ─── 🎵 RAPIDAPI MUSIC JUKEBOX SYSTEM (GLOBAL BACKDOOR) ───
        if (lowerBody.startsWith('!play ')) {
            const songQuery = body.substring(6).trim();
            if (!songQuery) {
                await sock.sendMessage(from, { text: "⚠️ Please specify a track title. Example: `!play Sauti Sol Suzanna`" }, { quoted: msg });
                return;
            }

            await sock.sendMessage(from, { text: `⚡ _Processing: "${songQuery}" via RapidAPI pipeline..._` }, { quoted: msg });

            try {
                // Phase 1: Native search query extraction
                const searchResponse = await axios.get(`https://youtube-search-api.p.rapidapi.com/search`, {
                    params: { q: songQuery },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-search-api.p.rapidapi.com' }
                });

                const targetTrack = searchResponse.data.videos?.[0];
                if (!targetTrack) throw new Error("No media payload located.");

                // Phase 2: Transcoding audio request payload
                const conversionResponse = await axios.get(`https://youtube-mp310.p.rapidapi.com/download/mp3`, {
                    params: { url: targetTrack.link },
                    headers: { 'x-rapidapi-key': config.rapidApiKey, 'x-rapidapi-host': 'youtube-mp310.p.rapidapi.com' }
                });

                const downloadUrl = conversionResponse.data.downloadUrl || conversionResponse.data.link;
                if (!downloadUrl) throw new Error("Conversion endpoint payload empty.");

                // Phase 3: Deliver structural audio packet over WhatsApp
                await sock.sendMessage(from, { 
                    audio: { url: downloadUrl }, 
                    mimetype: 'audio/mp4', 
                    ptt: false 
                }, { quoted: msg });
                
                // Reset client state context if they came from Option 3 menu loop
                if (clientStates[from] === 'AWAITING_JUKEBOX') clientStates[from] = null;

            } catch (err) {
                console.error("Music Engine Fault:", err);
                await sock.sendMessage(from, { text: "❌ *Transcoding Fault:* Could not download track. Please try a different song title." }, { quoted: msg });
            }
            return;
        }

        // ─── 🤖 GEMINI CHAT OVERRIDE MODE (OPTION 1) ───
        if (clientStates[from] === 'IN_GEMINI_CHAT') {
            if (lowerBody === 'exit' || lowerBody === '0') {
                clientStates[from] = null;
                await sock.sendMessage(from, { text: "🤖 *AI Channel Closed.* Returning to standard system interface." });
                return;
            }

            try {
                const chatResult = await aiModel.generateContent(body);
                const aiReply = chatResult.response.text();
                await sock.sendMessage(from, { text: `${aiReply}\n\n_💡 Type *exit* to escape the chat engine._` }, { quoted: msg });
            } catch (error) {
                await sock.sendMessage(from, { text: "⚠️ _System buffer saturation. Resetting stream loop..._" });
            }
            return;
        }

        // ─── 🎛️ MENU ROUTING MATRIX ───
        if (sessionHistory.has(from)) {
            // Option 1: AI Chat Pipeline Gateway
            if (body === '1') {
                clientStates[from] = 'IN_GEMINI_CHAT';
                await sock.sendMessage(from, { text: "🤖 *CymorAI Core Engaged!*\n\nAsk me anything about Simion Nashera, his current products, or **CymorTechServices** operations. I am completely optimized with his database." }, { quoted: msg });
                return;
            }

            // Option 2: Business Protocol Intake
            if (body === '2') {
                await sock.sendMessage(from, { text: "💼 *CymorTechServices Business Portal*\n\nPlease compile your requirements (e.g., site creation, bot structures, video/photo curation) in one block message. I will ensure Cymor prioritizes it immediately." }, { quoted: msg });
                return;
            }

            // Option 3: Jukebox Instruction Reminder
            if (body === '3') {
                clientStates[from] = 'AWAITING_JUKEBOX';
                await sock.sendMessage(from, { text: "🎵 *YouTube Jukebox Guide*\n\nTo fetch any track natively, simply type **`!play [Song Name and Artist]`** directly into this chat stream right now!" }, { quoted: msg });
                return;
            }

            // Option 4: Corporate Portfolio Readout
            if (body === '4') {
                const businessMenu = `✨ ──────────────── ✨\n` +
                                     `     *CYMORTECHSERVICES ECOSYSTEM* \n` +
                                     `✨ ──────────────── ✨\n\n` +
                                     `Here is a complete readout of Cymor's architectural suite:\n\n` +
                                     `📱 *CymorBibleApp:* A high-utility spiritual assistant tool.\n` +
                                     `🤖 *CymorAI:* Glassmorphic web platform with advanced memory storage.\n` +
                                     `📥 *CymorAllVideoDownloader:* Instant high-speed media processing engine.\n` +
                                     `🎬 *Cymor Movie Hub:* High-performance media tracker _(Finalizing Production)_\n\n` +
                                     `_Want a system built? Type *6* to request a callback or drop your brief here!_`;
                await sock.sendMessage(from, { text: businessMenu }, { quoted: msg });
                return;
            }

            // Option 5: eFootball Friendly Match Request Validation
            if (body === '5') {
                await sock.sendMessage(from, { text: "🎮 *eFootball Arena Open!*\n\nCymor's powerhouse **3137 strength squad** is always ready for competitive matches. **Please drop your exact squad name below**, and he will send a direct friendly invite!" }, { quoted: msg });
                return;
            }

            // Option 6: Owner Callback Notification Trigger
            if (body === '6') {
                if (pendingNotifications.has(from)) {
                    await sock.sendMessage(from, { text: "⚠️ You have already flagged a notification marker. Cymor will contact you directly." }, { quoted: msg });
                    return;
                }
                
                pendingNotifications.add(from);
                // Fire an outbound system transmission straight to your personal number
                await sock.sendMessage(config.ownerNumber, { 
                    text: `🚨 *Lead Alert:* User *${pushName}* (${from.split('@')[0]}) has requested a bot creation consultation callback!` 
                });
                
                await sock.sendMessage(from, { text: "✨ *Notification Locked!* I have flagged your request directly onto Cymor's personal terminal. He will contact you when he initializes connection." }, { quoted: msg });
                return;
            }
        }

        // ─── 🌟 INITIAL INTERACTIVE HOME SCREEN INTERFACE ───
        const greetingKeywords = ["hi", "oee mkuu", "what's up", "whatsapp", "sasa", "niaje", "hey", "hello"];
        const identifiesGreeting = greetingKeywords.some(keyword => lowerBody.includes(keyword));

        if (identifiesGreeting && !sessionHistory.has(from)) {
            const currentActivity = config.activities[Math.floor(Math.random() * config.activities.length)];
            
            const breathtakingMenu = `✨ ──────────────── ✨\n` +
                                     `   *CYMOR EXECUTIVE CORE INFRASTRUCTURE* \n` +
                                     `✨ ──────────────── ✨\n\n` +
                                     `Hi *${pushName}*! 👋\n\n` +
                                     `Thanks for reaching out to the *${config.alias}*.\n\n` +
                                     `📊 *Current Operational State:* Offline\n` +
                                     `🎯 *Current Action Profile:* Currently ${currentActivity}—because that is exactly what he handles best.\n\n` +
                                     `I am his automated digital layer. Would you prefer to wait until he is back, or immediately run our custom features below?\n\n` +
                                     `*💬 [1]* Chat with CymorAI Assistant\n` +
                                     `*💼 [2]* File a Business/Project Request\n` +
                                     `*🎵 [3]* Run YouTube MP3 Jukebox\n` +
                                     `*✨ [4]* Browse CymorTechServices Portfolio\n` +
                                     `*🎮 [5]* Challenge His eFootball Squad\n` +
                                     `*🤖 [6]* Want a Bot Like This? (Request Contact)\n\n` +
                                     `✨ ──────────────── ✨\n` +
                                     `_Simply reply with the option number (1-6) to proceed._`;

            await sock.sendMessage(from, { text: breathtakingMenu }, { quoted: msg });
            sessionHistory.add(from);
        }
    });
}

launchCymorCore();
