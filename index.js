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

// ======================================================
// 1. START THE WEB SERVER FIRST (CRITICAL FOR RAILWAY)
// ======================================================
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Cymor Shoe Store Engine is Online');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log(`📡 RAILWAY HEALTH CHECK LIVE: PORT ${PORT}`);
    console.log('========================================\n');
    
    // Only start the bot AFTER the server is live
    startCymorBot();
});

// ======================================================
// 2. MAIN BOT ENGINE
// ======================================================
async function startCymorBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        const { version } = await fetchLatestBaileysVersion();

        console.log(`🚀 Starting ${BOT_NAME} Engine...`);

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
            msgRetryCounterCache
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
                console.log(`⚠️ Connection Closed. Reconnecting: ${shouldReconnect}`);
                if (shouldReconnect) startCymorBot();
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

// Global Exception Handling
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (res) => console.error('Unhandled Rejection:', res));
