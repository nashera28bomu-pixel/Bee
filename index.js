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

// IMPORTANT:
// This MUST match your mounted persistent disk path
const AUTH_FOLDER = '/app/auth_info';

const logger = pino({
    level: 'silent'
});

const msgRetryCounterCache = new NodeCache();

let sock = null;
let reconnecting = false;
let heartbeatInterval = null;

// ======================================================
// CREATE AUTH FOLDER
// ======================================================

if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });

    console.log('\n========================================');
    console.log('📁 AUTH FOLDER CREATED');
    console.log(`📂 PATH: ${AUTH_FOLDER}`);
    console.log('========================================\n');
}

// ======================================================
// HEALTH CHECK SERVER
// ======================================================

const server = http.createServer((req, res) => {

    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });

    res.end(`${BOT_NAME} Engine Online`);
});

server.listen(PORT, '0.0.0.0', () => {

    console.log('\n========================================');
    console.log(`🚀 CYMOR ENGINE ONLINE`);
    console.log(`🌐 PORT: ${PORT}`);
    console.log(`📂 AUTH PATH: ${AUTH_FOLDER}`);
    console.log('========================================\n');

    // Start heartbeat
    startHeartbeat();

    // Start WhatsApp Engine
    startCymorBot();
});

// ======================================================
// HEARTBEAT SYSTEM
// Prevents Railway/Render sleeping
// ======================================================

function startHeartbeat() {

    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    heartbeatInterval = setInterval(() => {

        const memory = process.memoryUsage();

        console.log(
            `💓 HEARTBEAT | RAM: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`
        );

    }, 30000);
}

// ======================================================
// MAIN BOT ENGINE
// ======================================================

async function startCymorBot() {

    try {

        // Prevent multiple reconnect loops
        if (reconnecting) return;

        reconnecting = true;

        console.log('\n========================================');
        console.log(`🚀 STARTING ${BOT_NAME}`);
        console.log('========================================\n');

        // ======================================================
        // AUTH STATE
        // ======================================================

        const { state, saveCreds } =
            await useMultiFileAuthState(AUTH_FOLDER);

        // ======================================================
        // BAILEYS VERSION
        // ======================================================

        const { version } =
            await fetchLatestBaileysVersion();

        console.log(`📦 BAILEYS VERSION: ${version.join('.')}`);

        // ======================================================
        // CREATE SOCKET
        // ======================================================

        sock = makeWASocket({

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

            defaultQueryTimeoutMs: 60000,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 15000,

            emitOwnEvents: false,

            fireInitQueries: true,

            generateHighQualityLinkPreview: false,

            msgRetryCounterCache
        });

        // ======================================================
        // CONNECTION EVENTS
        // ======================================================

        sock.ev.on('connection.update', async (update) => {

            try {

                const {
                    connection,
                    lastDisconnect
                } = update;

                // ==================================================
                // CONNECTING
                // ==================================================

                if (connection === 'connecting') {

                    console.log('🔄 CONNECTING TO WHATSAPP...');
                }

                // ==================================================
                // CONNECTED
                // ==================================================

                if (connection === 'open') {

                    reconnecting = false;

                    console.log('\n========================================');
                    console.log(`✅ ${BOT_NAME} CONNECTED`);
                    console.log('🟢 WHATSAPP SESSION ACTIVE');
                    console.log('========================================\n');
                }

                // ==================================================
                // DISCONNECTED
                // ==================================================

                if (connection === 'close') {

                    reconnecting = false;

                    const statusCode =
                        lastDisconnect?.error?.output?.statusCode;

                    const shouldReconnect =
                        statusCode !== DisconnectReason.loggedOut;

                    console.log('\n========================================');
                    console.log('❌ CONNECTION CLOSED');
                    console.log(`📡 STATUS CODE: ${statusCode}`);
                    console.log(`🔁 RECONNECT: ${shouldReconnect}`);
                    console.log('========================================\n');

                    // Cleanup old socket
                    if (sock?.ws) {

                        try {
                            sock.ws.close();
                        } catch (e) {}
                    }

                    // Reconnect if not logged out
                    if (shouldReconnect) {

                        console.log('🔄 RESTARTING ENGINE IN 5 SECONDS...\n');

                        setTimeout(() => {
                            startCymorBot();
                        }, 5000);

                    } else {

                        console.log('\n========================================');
                        console.log('❌ DEVICE LOGGED OUT');
                        console.log('📱 RE-LINK YOUR WHATSAPP');
                        console.log('========================================\n');
                    }
                }

            } catch (err) {

                console.error(
                    '❌ CONNECTION EVENT ERROR:',
                    err
                );
            }
        });

        // ======================================================
        // SAVE CREDS
        // ======================================================

        sock.ev.on('creds.update', async () => {

            try {

                await saveCreds();

                console.log('💾 SESSION SAVED');

            } catch (err) {

                console.error(
                    '❌ FAILED TO SAVE CREDS:',
                    err
                );
            }
        });

        // ======================================================
        // MESSAGE EVENTS
        // ======================================================

        sock.ev.on('messages.upsert', async (chatUpdate) => {

            try {

                await handleIncomingMessage(
                    sock,
                    chatUpdate
                );

            } catch (err) {

                console.error(
                    '❌ MESSAGE HANDLER ERROR:',
                    err
                );
            }
        });

    } catch (err) {

        reconnecting = false;

        console.error('\n========================================');
        console.error('❌ CRITICAL ENGINE FAILURE');
        console.error(err);
        console.error('========================================\n');

        setTimeout(() => {

            console.log('🔄 RETRYING BOT START...\n');

            startCymorBot();

        }, 10000);
    }
}

// ======================================================
// GLOBAL ERROR HANDLING
// ======================================================

process.on('uncaughtException', (err) => {

    console.error('\n========================================');
    console.error('❌ UNCAUGHT EXCEPTION');
    console.error(err);
    console.error('========================================\n');
});

process.on('unhandledRejection', (reason) => {

    console.error('\n========================================');
    console.error('❌ UNHANDLED REJECTION');
    console.error(reason);
    console.error('========================================\n');
});

// ======================================================
// KEEP NODE PROCESS ALIVE
// ======================================================

process.stdin.resume();

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

process.on('SIGINT', async () => {

    console.log('\n🛑 SHUTTING DOWN ENGINE...\n');

    try {

        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }

        if (sock?.ws) {
            sock.ws.close();
        }

        process.exit(0);

    } catch (err) {

        console.error(err);

        process.exit(1);
    }
});
