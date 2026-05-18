require('dotenv').config();

const fs = require('fs');
const http = require('http');
const pino = require('pino');
const NodeCache = require('node-cache');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

// ======================================================
// CYMOR ENGINE CONFIG
// ======================================================

const PORT = process.env.PORT || 8080;
const AUTH_FOLDER = '/app/auth_info';

const logger = pino({ level: 'silent' });
const msgRetryCounterCache = new NodeCache();

// ======================================================
// GLOBAL SOCKET LOCK (CRITICAL FIX)
// ======================================================

let GLOBAL_SOCKET = null;
let reconnecting = false;
let heartbeatInterval = null;
let aliveInterval = null;

// ======================================================
// ENSURE AUTH FOLDER
// ======================================================

if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });

    console.log('\n========================================');
    console.log('📁 AUTH FOLDER READY');
    console.log(`📂 ${AUTH_FOLDER}`);
    console.log('========================================\n');
}

// ======================================================
// HEALTH SERVER (REQUIRED FOR RAILWAY)
// ======================================================

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${BOT_NAME} Engine Running`);
});

server.listen(PORT, '0.0.0.0', () => {

    console.log('\n========================================');
    console.log(`🚀 CYMOR ENGINE STARTED`);
    console.log(`🌐 PORT: ${PORT}`);
    console.log(`📂 AUTH: ${AUTH_FOLDER}`);
    console.log('========================================\n');

    startHeartbeat();
    startAliveLoop();
    startCymorBot();
});

// ======================================================
// HEARTBEAT (LOGGING ONLY)
// ======================================================

function startHeartbeat() {

    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(() => {

        const mem = process.memoryUsage();

        console.log(
            `💓 HEARTBEAT | RAM: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`
        );

    }, 30000);
}

// ======================================================
// CRITICAL ALIVE LOOP (PREVENTS CONTAINER SLEEP)
// ======================================================

function startAliveLoop() {

    if (aliveInterval) clearInterval(aliveInterval);

    aliveInterval = setInterval(() => {

        // KEEP EVENT LOOP ACTIVE
        if (GLOBAL_SOCKET?.ws?.readyState === 1) {
            try {
                GLOBAL_SOCKET.sendPresenceUpdate('available');
            } catch {}
        }

    }, 25000);
}

// ======================================================
// MAIN BOT ENGINE
// ======================================================

async function startCymorBot() {

    try {

        if (reconnecting) return;
        reconnecting = true;

        console.log('\n========================================');
        console.log(`🚀 STARTING ${BOT_NAME}`);
        console.log('========================================\n');

        const { state, saveCreds } =
            await useMultiFileAuthState(AUTH_FOLDER);

        const { version } =
            await fetchLatestBaileysVersion();

        console.log(`📦 BAILEYS: ${version.join('.')}`);

        // ======================================================
        // CREATE SOCKET (LOCKED GLOBAL)
        // ======================================================

        GLOBAL_SOCKET = makeWASocket({

            version,

            logger,

            printQRInTerminal: false,

            browser: Browsers.ubuntu('Chrome'),

            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    logger
                )
            },

            markOnlineOnConnect: true,
            syncFullHistory: false,
            keepAliveIntervalMs: 15000,
            msgRetryCounterCache
        });

        const sock = GLOBAL_SOCKET;

        // ======================================================
        // CONNECTION EVENTS
        // ======================================================

        sock.ev.on('connection.update', (update) => {

            const { connection, lastDisconnect } = update;

            if (connection === 'connecting') {
                console.log('🔄 CONNECTING...');
            }

            if (connection === 'open') {

                reconnecting = false;

                console.log('\n========================================');
                console.log(`✅ ${BOT_NAME} CONNECTED`);
                console.log('🟢 ACTIVE');
                console.log('========================================\n');
            }

            if (connection === 'close') {

                reconnecting = false;

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                const shouldReconnect =
                    statusCode !== DisconnectReason.loggedOut;

                console.log('\n========================================');
                console.log('❌ CONNECTION CLOSED');
                console.log(`📡 CODE: ${statusCode}`);
                console.log(`🔁 RECONNECT: ${shouldReconnect}`);
                console.log('========================================\n');

                try {
                    GLOBAL_SOCKET?.ws?.close();
                } catch {}

                if (shouldReconnect) {

                    setTimeout(() => {
                        startCymorBot();
                    }, 4000);

                } else {
                    console.log('❌ LOGGED OUT - REPAIR REQUIRED');
                }
            }
        });

        // ======================================================
        // SAVE CREDS
        // ======================================================

        sock.ev.on('creds.update', saveCreds);

        // ======================================================
        // MESSAGE HANDLER
        // ======================================================

        sock.ev.on('messages.upsert', async (chatUpdate) => {

            try {
                await handleIncomingMessage(sock, chatUpdate);
            } catch (err) {
                console.error('❌ MESSAGE ERROR:', err);
            }
        });

    } catch (err) {

        reconnecting = false;

        console.error('\n========================================');
        console.error('❌ ENGINE CRASH');
        console.error(err);
        console.error('========================================\n');

        setTimeout(() => startCymorBot(), 8000);
    }
}

// ======================================================
// GLOBAL SAFETY NETS
// ======================================================

process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ REJECTION:', err);
});

// ======================================================
// HARD PROCESS LOCK (CRITICAL FOR RAILWAY)
// ======================================================

process.stdin.resume();

setInterval(() => {}, 1000 * 60 * 60);
