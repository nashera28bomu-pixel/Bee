require('dotenv').config();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const NodeCache = require('node-cache');
const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

// Message retry cache
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
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            // Optimized browser for pairing stability
            browser: ["Ubuntu", "Chrome", "20.0.0"], 
            markOnlineOnConnect: true,
            syncFullHistory: false,
            // Increased timeouts for Railway/Mobile stability
            defaultQueryTimeoutMs: 90000,
            connectTimeoutMs: 90000,
            keepAliveIntervalMs: 30000,
            msgRetryCounterCache
        });

        // 4. CONNECTION EVENTS
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (connection === 'open') {
                console.log('\n========================================');
                console.log(`✅ ${BOT_NAME} Connected Successfully`);
                console.log('========================================\n');
                pairingCodeRequested = false;
                return;
            }

            // PAIRING LOGIC
            if (connection === 'connecting' && !sock.authState.creds.registered && !pairingCodeRequested) {
                const phoneNumber = process.env.PAIRING_NUMBER;
                if (!phoneNumber) {
                    console.error('❌ PAIRING_NUMBER missing in environment variables.');
                    return;
                }

                pairingCodeRequested = true;
                const formattedNumber = phoneNumber.replace(/\D/g, '');

                // Delay pairing request slightly to ensure socket is ready
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

            // DISCONNECTION LOGIC
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const reason = lastDisconnect?.error?.message;
                
                console.log(`⚠️ Connection Closed. Status: ${statusCode} (${reason})`);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.error('❌ Session Logged Out. Please delete auth_info and pair again.');
                    process.exit(1); 
                } else {
                    console.log('🔄 Attempting to reconnect...');
                    setTimeout(() => startCymorBot(), 5000);
                }
            }
        });

        // 5. SAVE CREDS
        sock.ev.on('creds.update', saveCreds);

        // 6. MESSAGE HANDLER
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const msg = chatUpdate.messages?.[0];
                if (!msg || !msg.message || msg.key.fromMe) return;
                if (msg.key.remoteJid === 'status@broadcast') return;

                await handleIncomingMessage(sock, msg);
            } catch (error) {
                console.error('❌ Message Error:', error.message);
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

startCymorBot();
