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
    // 1. Manage authentication state (Saves session inside 'auth_info' folder)
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // 2. Initialize WhatsApp Socket connection
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }), // Keeps terminal clean from internal logs
        printQRInTerminal: false,          // Disabling QR code since we are using Pairing Code
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'] // Custom browser info for pairing
    });

    // 3. Handle Pairing Code Generation (Bypasses terminal question for direct cloud deployments)
    if (!sock.authState.creds.registered) {
        console.clear();
        console.log(`==================================================`);
        console.log(`      🚀 WELCOME TO ${BOT_NAME.toUpperCase()} SERVICE`);
        console.log(`==================================================\n`);
        
        // 🔒 HARDCODED BOT TARGET NUMBER (Bypasses read-only console limits)
        const phoneNumber = "254784074568"; 
        const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        console.log(`\n🔄 Requesting cloud pairing code for: +${formattedNumber}...`);
        await delay(3000); // Critical delay loop synchronization window
        
        try {
            const code = await sock.requestPairingCode(formattedNumber);
            console.log(`\n✅ YOUR PAIRING CODE IS: \x1b[32m${code}\x1b[0m`);
            console.log(`\n📌 How to use:`);
            console.log(`1. Open WhatsApp on your phone -> Tap Options/Settings.`);
            console.log(`2. Select 'Linked Devices' -> Tap 'Link a Device'.`);
            console.log(`3. Tap 'Link with phone number instead' at the bottom.`);
            console.log(`4. Enter the code shown above.\n`);
        } catch (error) {
            console.error('❌ Failed to generate pairing code. Please restart the script.', error);
            process.exit(1);
        }
    }

    // 4. Listen for Connection Updates
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`⚠️ Connection closed due to: ${lastDisconnect?.error?.message}. Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                startCymorBot(); // Loop restart
            } else {
                console.log('❌ Session permanently logged out. Delete the "auth_info" folder and re-run.');
            }
        } else if (connection === 'open') {
            console.log(`\n==================================================`);
            console.log(`🎉 SUCCESS: ${BOT_NAME} is officially LIVE on WhatsApp!`);
            console.log(`==================================================\n`);
        }
    });

    // 5. Credentials update listener (Saves updated session key tokens)
    sock.ev.on('creds.update', saveCreds);

    // 6. Message Listener - Hands traffic off to your logic file
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message || msg.key.fromMe) return; // Skip if empty or sent by the bot itself

            // Execute bot logic mapping
            await handleIncomingMessage(sock, msg);
        } catch (err) {
            console.error('Error reading message payload:', err);
        }
    });
}

// Global error handlers to keep node from crashing out
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));

// Ignition
startCymorBot();
