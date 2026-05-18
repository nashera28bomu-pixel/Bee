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
// CONFIG
// ======================================================

const PORT = process.env.PORT || 8080;
const AUTH_FOLDER = '/app/auth_info';

const logger = pino({ level: 'silent' });
const msgRetryCounterCache = new NodeCache();

let sock = null;
let reconnecting = false;

// ======================================================
// KEEP ALIVE SERVER
// ======================================================

http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`${BOT_NAME} alive`);
}).listen(PORT);

// ======================================================
// AUTH FOLDER SAFE
// ======================================================

if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

// ======================================================
// GLOBAL CRASH PROTECTION
// ======================================================

process.on('uncaughtException', (err) => {
    console.log('❌ CRASH (uncaught):', err);
});

process.on('unhandledRejection', (err) => {
    console.log('❌ CRASH (promise):', err);
});

// ======================================================
// BOT ENGINE
// ======================================================

async function startBot() {

    if (reconnecting) return;
    reconnecting = true;

    try {

        const { state, saveCreds } =
            await useMultiFileAuthState(AUTH_FOLDER);

        const { version } =
            await fetchLatestBaileysVersion();

        sock = makeWASocket({

            version,
            logger,
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),

            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },

            markOnlineOnConnect: true,
            syncFullHistory: false,
            keepAliveIntervalMs: 15000,
            msgRetryCounterCache
        });

        // ==================================================
        // CONNECTION HANDLER (SAFE)
        // ==================================================

        sock.ev.on('connection.update', (u) => {

            const { connection, lastDisconnect } = u;

            if (connection === 'open') {
                reconnecting = false;
                console.log('🟢 CONNECTED');
            }

            if (connection === 'close') {

                reconnecting = false;

                const code =
                    lastDisconnect?.error?.output?.statusCode;

                const restart =
                    code !== DisconnectReason.loggedOut;

                console.log('❌ DISCONNECTED:', code);

                if (sock?.ws) sock.ws.close();

                if (restart) {
                    setTimeout(startBot, 4000);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // ==================================================
        // MESSAGE HANDLER (FULL PROTECTION)
        // ==================================================

        sock.ev.on('messages.upsert', async (m) => {

            try {

                if (!m?.messages?.[0]) return;

                await handleIncomingMessage(sock, m);

            } catch (err) {
                console.log('🔥 MESSAGE CRASH CAUGHT:', err);
            }
        });

    } catch (err) {

        reconnecting = false;

        console.log('❌ ENGINE CRASH:', err);

        setTimeout(startBot, 5000);
    }
}

// ======================================================
// START WITH PM2 SAFETY
// ======================================================

startBot();
