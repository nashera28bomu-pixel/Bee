const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const NodeCache = require('node-cache');

const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

// ======================================================
// CYMOR WHATSAPP ENGINE
// Stable Railway Production Version
// ======================================================

// Message retry cache
const msgRetryCounterCache = new NodeCache();

// Prevent duplicate pairing requests
let pairingCodeRequested = false;

// Prevent reconnect spam
let reconnecting = false;

// ======================================================
// MAIN BOT STARTER
// ======================================================

async function startCymorBot() {
    try {

        console.log('\n========================================');
        console.log(`🚀 Starting ${BOT_NAME} Engine...`);
        console.log('========================================\n');

        // Railway persistent auth folder
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

        // Latest Baileys version
        const { version } = await fetchLatestBaileysVersion();

        // ======================================================
        // SOCKET CONFIG
        // ======================================================

        const sock = makeWASocket({
            version,

            auth: state,

            logger: pino({
                level: 'silent'
            }),

            printQRInTerminal: false,

            browser: ['CymorBot', 'Chrome', '1.0.0'],

            markOnlineOnConnect: true,

            syncFullHistory: false,

            defaultQueryTimeoutMs: 60000,

            connectTimeoutMs: 60000,

            keepAliveIntervalMs: 10000,

            generateHighQualityLinkPreview: true,

            emitOwnEvents: false,

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

            // ======================================================
            // CONNECTION OPENED
            // ======================================================

            if (connection === 'open') {

                reconnecting = false;

                console.log('\n========================================');
                console.log(`✅ ${BOT_NAME} is ONLINE`);
                console.log('========================================\n');

                // ======================================================
                // REQUEST PAIRING CODE
                // ======================================================

                if (
                    !sock.authState.creds.registered &&
                    !pairingCodeRequested
                ) {
                    try {

                        pairingCodeRequested = true;

                        // Your WhatsApp number
                        const phoneNumber = '254784074568';

                        const formattedNumber = phoneNumber.replace(/\D/g, '');

                        console.log('🔄 Requesting Pairing Code...');
                        console.log(`📱 Number: +${formattedNumber}\n`);

                        const code = await sock.requestPairingCode(
                            formattedNumber
                        );

                        console.log('========================================');
                        console.log(`✅ PAIRING CODE: ${code}`);
                        console.log('========================================\n');

                        console.log('📌 HOW TO LINK');
                        console.log('1. Open WhatsApp');
                        console.log('2. Go to Linked Devices');
                        console.log('3. Tap "Link with phone number instead"');
                        console.log(`4. Enter code: ${code}\n`);

                    } catch (error) {

                        pairingCodeRequested = false;

                        console.error('\n❌ PAIRING FAILED');
                        console.error(error?.message || error);

                    }
                }
            }

            // ======================================================
            // CONNECTION CLOSED
            // ======================================================

            if (connection === 'close') {

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                const shouldReconnect =
                    statusCode !== DisconnectReason.loggedOut;

                console.log('\n⚠️ Connection Closed');
                console.log(`📡 Status Code: ${statusCode}\n`);

                // ======================================================
                // LOGGED OUT
                // ======================================================

                if (!shouldReconnect) {

                    console.log('❌ Device Logged Out');
                    console.log(
                        '🗑️ Delete auth_info folder and reconnect.\n'
                    );

                    return;
                }

                // ======================================================
                // RECONNECT SAFETY
                // ======================================================

                if (reconnecting) {
                    return;
                }

                reconnecting = true;

                pairingCodeRequested = false;

                console.log('🔄 Reconnecting in 5 seconds...\n');

                setTimeout(() => {
                    startCymorBot();
                }, 5000);
            }
        });

        // ======================================================
        // SAVE SESSION
        // ======================================================

        sock.ev.on('creds.update', saveCreds);

        // ======================================================
        // INCOMING MESSAGES
        // ======================================================

        sock.ev.on('messages.upsert', async (chatUpdate) => {

            try {

                const msg = chatUpdate.messages[0];

                if (!msg) return;

                // Ignore empty messages
                if (!msg.message) return;

                // Ignore bot's own messages
                if (msg.key.fromMe) return;

                await handleIncomingMessage(sock, msg);

            } catch (error) {

                console.error('\n❌ MESSAGE HANDLER ERROR');
                console.error(error);

            }
        });

    } catch (error) {

        console.error('\n❌ BOT START ERROR');
        console.error(error);

        console.log('\n🔄 Restarting bot in 10 seconds...\n');

        setTimeout(() => {
            startCymorBot();
        }, 10000);
    }
}

// ======================================================
// GLOBAL ERROR HANDLERS
// ======================================================

process.on('uncaughtException', (error) => {

    console.error('\n❌ UNCAUGHT EXCEPTION');
    console.error(error);

});

process.on('unhandledRejection', (reason) => {

    console.error('\n❌ UNHANDLED PROMISE REJECTION');
    console.error(reason);

});

// ======================================================
// START ENGINE
// ======================================================

startCymorBot();
