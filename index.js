const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { handleIncomingMessage } = require('./botLogic');
const { BOT_NAME } = require('./config');

// Prevent multiple requests in the same session
let pairingCodeRequested = false;

async function startCymorBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        // Using a standard Chrome browser string helps prevent connection drops
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        syncFullHistory: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // --- FIXED PAIRING LOGIC ---
        if (!sock.authState.creds.registered && !pairingCodeRequested) {
            pairingCodeRequested = true; // Lock the gate
            
            console.log(`\n==================================================`);
            console.log(`      🚀 WELCOME TO ${BOT_NAME.toUpperCase()} SERVICE`);
            console.log(`==================================================\n`);

            // Wait for network stabilization on Render
            await delay(10000); 

            const phoneNumber = "254784074568";
            const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');

            try {
                console.log(`🔄 Requesting Pairing Code for +${formattedNumber}...`);
                const code = await sock.requestPairingCode(formattedNumber);
                console.log(`\n✅ YOUR PAIRING CODE IS: \x1b[32m${code}\x1b[0m`);
                console.log(`\n📌 LINKING INSTRUCTIONS:`);
                console.log(`1. WhatsApp Settings > Linked Devices > Link a Device.`);
                console.log(`2. Select 'Link with phone number instead'.`);
                console.log(`3. Enter the code shown above.\n`);
            } catch (error) {
                console.error('❌ Pairing Error:', error.message);
                pairingCodeRequested = false; // Reset if it actually failed
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                // If connection closes while requesting, reset the flag so it can try again on reboot
                pairingCodeRequested = false;
                console.log('⚠️ Connection lost. Rebooting engine...');
                startCymorBot();
            } else {
                console.log('❌ Session Logged Out. Please clear "auth_info" and restart.');
            }
        } else if (connection === 'open') {
            console.log(`\n✅ ${BOT_NAME} is officially LIVE and Connected!`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

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

process.on('uncaughtException', (err) => console.error('System Error:', err));
process.on('unhandledRejection', (err) => console.error('System Promise Error:', err));

startCymorBot();
