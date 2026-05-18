require('dotenv').config();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const http = require('http');
const NodeCache = require('node-cache');
const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

const msgRetryCounterCache = new NodeCache();
let pairingCodeRequested = false;

async function startCymorBot() {
    try {
        console.log('\n========================================');
        console.log(`🚀 Starting ${BOT_NAME} Engine`);
        console.log('========================================\n');

        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'), 
            markOnlineOnConnect: true,
            syncFullHistory: false,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 15000,
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true 
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log('\n========================================');
                console.log(`✅ ${BOT_NAME} Connected Successfully`);
                console.log('========================================\n');
                pairingCodeRequested = false;
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    startCymorBot();
                } else {
                    process.exit(1);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                await handleIncomingMessage(sock, chatUpdate);
            } catch (error) {
                console.error('❌ Handler Error:', error.message);
            }
        });

    } catch (err) {
        console.error('❌ Critical Engine Error:', err);
        setTimeout(() => startCymorBot(), 10000);
    }
}

// ======================================================
// THE RAILWAY FIX: SERVER BINDING
// ======================================================

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running');
});

// 1. Check process.env.PORT first (Railway standard)
// 2. Default to 8080 if not found (matching your log)
const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log(`📡 SERVER LIVE ON PORT: ${PORT}`);
    console.log('========================================');
});

// Error handling for the server itself
server.on('error', (e) => {
    console.error('Server error:', e);
});

startCymorBot();
