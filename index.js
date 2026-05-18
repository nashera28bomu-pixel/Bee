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

// Message retry cache - essential for preventing "Waiting for message" errors
const msgRetryCounterCache = new NodeCache();

// Global flags
let pairingCodeRequested = false;

async function startCymorBot() {
    try {
        console.log('\n========================================');
        console.log(`🚀 Starting ${BOT_NAME} Engine`);
        console.log('========================================\n');

        // 1. AUTH SESSION
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

        // 2. FETCH LATEST VERSION
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`📡 Using WA Version: ${version.join('.')} (Latest: ${isLatest})`);

        // 3. SOCKET CONFIG
        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                // Optimized signal key store for faster decryption
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            // Updated browser string for better stability
            browser: Browsers.ubuntu('Chrome'), 
            markOnlineOnConnect: true,
            syncFullHistory: false,
            // Standard timeouts for Railway/Render environments
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 15000,
            msgRetryCounterCache,
            // Ensure bot can generate high-quality previews
            generateHighQualityLinkPreview: true 
        });

        // 4. CONNECTION EVENTS
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log('\n========================================');
                console.log(`✅ ${BOT_NAME} Connected Successfully`);
                console.log('========================================\n');
                pairingCodeRequested = false;
            }

            // PAIRING LOGIC
            if (connection === 'connecting' && !sock.authState.creds.registered && !pairingCodeRequested) {
                const phoneNumber = process.env.PAIRING_NUMBER;
                if (!phoneNumber) {
                    console.error('❌ PAIRING_NUMBER missing in .env file.');
                    return;
                }

                pairingCodeRequested = true;
                const formattedNumber = phoneNumber.replace(/\D/g, '');

                // Delay to ensure socket is ready for request
                setTimeout(async () => {
                    try {
                        console.log(`🔄 Requesting Pairing Code for: +${formattedNumber}`);
                        const code = await sock.requestPairingCode(formattedNumber);
                        
                        console.log('\n========================================');
                        console.log(`🔑 YOUR PAIRING CODE: ${code}`);
                        console.log('========================================\n');
                    } catch (err) {
                        console.error('❌ Failed to get pairing code:', err.message);
                        pairingCodeRequested = false;
                    }
                }, 5000);
            }

            // RECONNECTION LOGIC
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log(`⚠️ Connection Closed. Reconnecting: ${shouldReconnect}`);

                if (shouldReconnect) {
                    startCymorBot();
                } else {
                    console.error('❌ Session Logged Out. Delete auth_info and restart.');
                    process.exit(1);
                }
            }
        });

        // 5. SAVE CREDS
        sock.ev.on('creds.update', saveCreds);

        // 6. UPDATED MESSAGE HANDLER
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                // Pass the ENTIRE chatUpdate object to the handler
                // The handler now manages the messages[0] array internally
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
// KEEP ALIVE SERVER (Railway Health Check)
// ======================================================
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`${BOT_NAME} is active.`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);

// Global Exception Handling
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

startCymorBot();
