const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

async function startCymorBot() {
    // 1. Manage authentication state
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // Get latest Baileys version for better stability
    const { version } = await fetchLatestBaileysVersion();

    // 2. Initialize WhatsApp Socket connection
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.0']
    });

    // 3. Listen for Connection Updates (with improved pairing logic)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection closed: ${lastDisconnect?.error?.message}. Reconnecting: ${shouldReconnect}`);

            if (shouldReconnect) {
                setTimeout(() => startCymorBot(), 5000);
            } else {
                console.log('❌ Session permanently logged out. Delete the "auth_info" folder and re-run.');
            }
        } 
        else if (connection === 'open') {
            console.log(`\n==================================================`);
            console.log(`🎉 SUCCESS: ${BOT_NAME} is officially LIVE on WhatsApp!`);
            console.log(`==================================================\n`);
        }

        // === PAIRING CODE LOGIC ===
        if (!sock.authState.creds.registered && (connection === 'connecting' || qr)) {
            console.clear();
            console.log(`==================================================`);
            console.log(`      🚀 ${BOT_NAME.toUpperCase()}`);
            console.log(`==================================================\n`);

            const phoneNumber = "254784074568"; 
            const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');

            console.log(`🔄 Requesting pairing code for: +${formattedNumber}...`);

            try {
                const code = await sock.requestPairingCode(formattedNumber);
                console.log(`\n✅ YOUR PAIRING CODE: \x1b[32m${code}\x1b[0m`);
                console.log(`\n📌 How to use:`);
                console.log(`1. Open WhatsApp on your phone → Tap Options/Settings.`);
                console.log(`2. Select 'Linked Devices' → Tap 'Link a Device'.`);
                console.log(`3. Tap 'Link with phone number instead' at the bottom.`);
                console.log(`4. Enter the code shown above.\n`);
            } catch (error) {
                console.error('❌ Failed to generate pairing code:', error.message);
            }
        }
    });

    // 4. Credentials update listener
    sock.ev.on('creds.update', saveCreds);

    // 5. Message Listener
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            await handleIncomingMessage(sock, msg);
        } catch (err) {
            console.error('Error reading message payload:', err);
        }
    });
}

// Global error handlers
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));

// Start the bot
startCymorBot();
