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
const fs = require('fs');
const NodeCache = require('node-cache');

const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

const msgRetryCounterCache = new NodeCache();

const PORT = process.env.PORT || 8080;

let sock = null;
let reconnecting = false;

// ======================================================
// ENSURE AUTH FOLDER EXISTS
// ======================================================
if (!fs.existsSync('./auth_info')) {
    fs.mkdirSync('./auth_info', { recursive: true });
}

// ======================================================
// RAILWAY HEALTH SERVER
// ======================================================
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`${BOT_NAME} is running`);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log('========================================\n');

    startCymorBot();
});

// ======================================================
// MAIN BOT STARTER
// ======================================================
async function startCymorBot() {

    // Prevent multiple reconnect loops
    if (reconnecting) return;

    reconnecting = true;

    try {

        const { state, saveCreds } =
            await useMultiFileAuthState('./auth_info');

        const { version } =
            await fetchLatestBaileysVersion();

        console.log(`🚀 Starting ${BOT_NAME}...`);

        sock = makeWASocket({
            version,

            logger: pino({
                level: 'silent'
            }),

            browser: Browsers.ubuntu('Chrome'),

            printQRInTerminal: false,

            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    pino({ level: 'silent' })
                )
            },

            markOnlineOnConnect: true,

            syncFullHistory: false,

            defaultQueryTimeoutMs: 60000,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 15000,

            msgRetryCounterCache
        });

        // ======================================================
        // CONNECTION EVENTS
        // ======================================================
        sock.ev.on('connection.update', async (update) => {

            const {
                connection,
                lastDisconnect
            } = update;

            if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...');
            }

            if (connection === 'open') {

                reconnecting = false;

                console.log('\n========================================');
                console.log(`✅ ${BOT_NAME} CONNECTED`);
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
                console.log('Status Code:', statusCode);
                console.log('Reconnect:', shouldReconnect);
                console.log('========================================\n');

                // Clean old socket
                if (sock) {
                    try {
                        sock.ws.close();
                    } catch {}
                }

                if (shouldReconnect) {

                    console.log('🔄 Restarting bot in 5 seconds...');

                    setTimeout(() => {
                        startCymorBot();
                    }, 5000);

                } else {

                    console.log('❌ Device Logged Out');
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
        console.error('❌ BOT START FAILURE');
        console.error(err);
        console.error('========================================\n');

        setTimeout(() => {
            startCymorBot();
        }, 10000);
    }
}

// ======================================================
// GLOBAL ERROR HANDLERS
// ======================================================
process.on('uncaughtException', (err) => {

    console.error('❌ UNCAUGHT EXCEPTION');
    console.error(err);
});

process.on('unhandledRejection', (reason) => {

    console.error('❌ UNHANDLED REJECTION');
    console.error(reason);
});

// ======================================================
// KEEP PROCESS ALIVE
// ======================================================
process.stdin.resume();
