const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

async function startCymorBot() {
    // 1. Manage authentication state
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // 2. Initialize WhatsApp Socket
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        syncFullHistory: false // Speed up connection on cloud
    });

    // 3. Connection & Pairing Logic
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // --- PAIRING CODE HANDLER ---
        // We trigger this only if we aren't registered AND the connection is "connecting" or "open"
        if (!sock.authState.creds.registered && !qr) {
            console.log(`==================================================`);
            console.log(`      🚀 WELCOME TO ${BOT_NAME.toUpperCase()} SERVICE`);
            console.log(`==================================================\n`);

            const phoneNumber = "254784074568";
            const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');

            // We add a small retry loop to ensure the socket is active before requesting
            await delay(5000); 
            
            try {
                console.log(`🔄 Requesting Pairing Code for +${formattedNumber}...`);
                const code = await sock.requestPairingCode(formattedNumber);
                console.log(`\n✅ YOUR PAIRING CODE IS: \x1b[32m${code}\x1b[0m`);
                console.log(`\n📌 LINKING INSTRUCTIONS:`);
                console.log(`1. WhatsApp Settings > Linked Devices > Link a Device.`);
                console.log(`2. Select 'Link with phone number instead'.`);
                console.log(`3. Enter the code shown above.\n`);
            } catch (error) {
                console.error('❌ Pairing Error (Retrying in 10s...):', error.message);
                setTimeout(() => startCymorBot(), 10000);
            }
        }

        // --- RECONNECTION LOGIC ---
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('⚠️ Connection lost. Rebooting engine...');
                startCymorBot();
            } else {
                console.log('❌ Session Logged Out. Please clear "auth_info" and restart.');
            }
        } else if (connection === 'open') {
            console.log(`\n✅ ${BOT_NAME} is officially LIVE and Connected!`);
        }
    });

    // 4. Save Credentials
    sock.ev.on('creds.update', saveCreds);

    // 5. Message Listener
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            await handleIncomingMessage(sock, msg);
        } catch (err) {
            console.error('Message Error:', err);
        }
    });
}

// Global Safety Nets
process.on('uncaughtException', (err) => console.error('System Error:', err));
process.on('unhandledRejection', (err) => console.error('System Promise Error:', err));

startCymorBot();
