const {
    BOT_NAME,
    OWNER_NUMBER,
    SHOE_CATALOG,
    DELIVERY_AREAS,
    FAQ_DATA
} = require('./config');

// ======================================================
// CYMOR PREMIUM UI BUSINESS ENGINE
// ======================================================

const userSessions = new Map();
const cooldowns = new Map();

// ======================================================
// SAFE TEXT EXTRACTOR
// ======================================================

function extractMessageText(msg) {

    const message = msg.message;
    if (!message) return '';

    const type = Object.keys(message)[0];
    const content = message[type];

    try {

        switch (type) {

            case 'conversation':
                return content || '';

            case 'extendedTextMessage':
                return content?.text || '';

            case 'imageMessage':
                return content?.caption || '';

            case 'videoMessage':
                return content?.caption || '';

            case 'buttonsResponseMessage':
                return content?.selectedButtonId || '';

            case 'listResponseMessage':
                return content?.singleSelectReply?.selectedRowId || '';

            case 'templateButtonReplyMessage':
                return content?.selectedId || '';

            default:
                return '';
        }

    } catch (err) {
        console.error('⚠️ Extract error:', err);
        return '';
    }
}

// ======================================================
// MAIN HANDLER
// ======================================================

async function handleIncomingMessage(sock, m) {

    try {

        const msg = m.messages?.[0];
        if (!msg || !msg.message) return;

        const from = msg.key.remoteJid;

        if (msg.key.fromMe) return;
        if (!from.endsWith('@s.whatsapp.net')) return;

        const body = extractMessageText(msg);
        if (!body) return;

        const cleanText = body.toString().trim().toLowerCase();
        const senderName = msg.pushName || 'Customer';

        const now = Date.now();
        if (cooldowns.has(from) && now - cooldowns.get(from) < 700) return;
        cooldowns.set(from, now);

        if (userSessions.has(from)) {
            await handleOrderWorkflow(sock, from, cleanText, senderName);
            return;
        }

        switch (cleanText) {

            case 'hi':
            case 'hello':
            case 'hey':
            case 'hy':
            case 'menu':
            case 'start':
            case 'habari':
            case 'mambo':

                await sendMainMenu(sock, from, senderName);
                break;

            case '1':
            case 'catalog':
            case 'shop':
            case 'products':

                await sendCatalog(sock, from);
                break;

            case '2':
            case 'order':
            case 'buy':

                userSessions.set(from, {
                    stage: 'SELECT_SHOE',
                    data: {},
                    startedAt: Date.now()
                });

                await sendCatalog(sock, from);

                await sendText(sock, from,
`🛍️ *CHECKOUT STARTED*

━━━━━━━━━━━━━━━━━━
📦 Enter product code (e.g. *CS01*)
━━━━━━━━━━━━━━━━━━

❌ Type *cancel* anytime
⚡ Fast secure ordering system

━━━━━━━━━━━━━━━━━━
Powered by CymorTechServices`);

                break;

            case '3':
                await sendDeliveryInfo(sock, from);
                break;

            case '4':
                await sendStoreInfo(sock, from);
                break;

            case '5':
                await sendPaymentInfo(sock, from);
                break;

            case 'help':
                await sendHelpMenu(sock, from);
                break;

            default:

                if (cleanText.includes('shoe') || cleanText.includes('sneaker')) {
                    await sendCatalog(sock, from);

                } else if (cleanText.includes('pay') || cleanText.includes('mpesa')) {
                    await sendPaymentInfo(sock, from);

                } else if (cleanText.includes('deliver')) {
                    await sendDeliveryInfo(sock, from);

                } else {
                    await sendMainMenu(sock, from, senderName);
                }

                break;
        }

    } catch (error) {
        console.error('❌ BOT ERROR:', error);
    }
}

// ======================================================
// SAFE SEND
// ======================================================

async function sendText(sock, to, text) {
    try {
        if (!sock || !to || !text) return;
        await sock.sendMessage(to, { text });
    } catch (err) {
        console.error('❌ SEND ERROR:', err);
    }
}

// ======================================================
// MAIN MENU (PREMIUM UI)
// ======================================================

async function sendMainMenu(sock, to, name) {

    const text =
`╔══════════════════════╗
   👟 *${BOT_NAME.toUpperCase()}*
╚══════════════════════╝

✨ Welcome, *${name}*

━━━━━━━━━━━━━━━━━━━━━━
🛒 *1. VIEW CATALOG*
Browse premium sneakers

🛍️ *2. PLACE ORDER*
Instant checkout system

🚚 *3. DELIVERY INFO*
Fast nationwide shipping

📍 *4. STORE LOCATION*
Visit our showroom

💳 *5. PAYMENT METHODS*
M-Pesa & Cash options

━━━━━━━━━━━━━━━━━━━━━━
💬 Reply with a number

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

// ======================================================
// CATALOG (PREMIUM STYLE)
// ======================================================

async function sendCatalog(sock, to) {

    let text =
`╔══════════════════════╗
   👟 *SNEAKER CATALOG*
╚══════════════════════╝

`;

    SHOE_CATALOG.forEach(s => {

        text +=
`━━━━━━━━━━━━━━━━━━━━━━
📦 *${s.name}*
🆔 Code: ${s.id}
💰 Price: KSh ${s.price}
📏 Sizes: ${s.sizes.join(', ')}
${s.instock ? '🟢 Available' : '🔴 Sold Out'}
`;

    });

    text += `
━━━━━━━━━━━━━━━━━━━━━━
🛍️ Reply *2* to order
⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

// ======================================================
// DELIVERY
// ======================================================

async function sendDeliveryInfo(sock, to) {

    let text =
`📦 *DELIVERY INFORMATION*

━━━━━━━━━━━━━━━━━━━━━━`;

    for (const [zone, price] of Object.entries(DELIVERY_AREAS)) {

        text += `
📍 *${zone.toUpperCase()}*
💰 ${price === 0 ? 'FREE' : 'KSh ' + price}
━━━━━━━━━━━━━━━━━━━━━━`;
    }

    text += `
🚚 Nairobi: 2–3 Hours
🚚 Countrywide: 24 Hours

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

// ======================================================
// STORE
// ======================================================

async function sendStoreInfo(sock, to) {

    await sendText(sock, to,
`📍 *OUR STORE*

━━━━━━━━━━━━━━━━━━━━━━
🏢 ${FAQ_DATA.location}

⏰ OPENING HOURS
Mon–Sat: 8AM – 8PM
Sun: 11AM – 4PM

━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by CymorTechServices`);
}

// ======================================================
// PAYMENT
// ======================================================

async function sendPaymentInfo(sock, to) {

    await sendText(sock, to,
`💳 *PAYMENT METHODS*

━━━━━━━━━━━━━━━━━━━━━━
🟢 M-PESA BUY GOODS
Till Number: ${FAQ_DATA.tillNumber}

💵 Cash on Delivery (Nairobi only)

━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by CymorTechServices`);
}

// ======================================================
// HELP
// ======================================================

async function sendHelpMenu(sock, to) {

    await sendText(sock, to,
`🆘 *HELP CENTER*

━━━━━━━━━━━━━━━━━━━━━━
Type:
1 - Catalog
2 - Order
3 - Delivery
4 - Store
5 - Payment

━━━━━━━━━━━━━━━━━━━━━━
⚡ Powered by CymorTechServices`);
}

// ======================================================
// ORDER ENGINE (UNCHANGED LOGIC, CLEAN UI ONLY)
// ======================================================

async function handleOrderWorkflow(sock, to, text, name) {

    const session = userSessions.get(to);

    if (text === 'cancel') {
        userSessions.delete(to);
        await sendText(sock, to,
`❌ *ORDER CANCELLED*

Session cleared.

⚡ Powered by CymorTechServices`);
        return;
    }

    if (session.stage === 'SELECT_SHOE') {

        const shoe = SHOE_CATALOG.find(s => s.id.toLowerCase() === text);

        if (!shoe) {
            await sendText(sock, to, '❌ Invalid product code');
            return;
        }

        session.data.shoe = shoe;
        session.stage = 'SELECT_SIZE';

        await sendText(sock, to,
`👟 *${shoe.name} SELECTED*

Available sizes: ${shoe.sizes.join(', ')}

Reply with size.

⚡ Powered by CymorTechServices`);
        return;
    }

    if (session.stage === 'SELECT_SIZE') {

        const size = parseInt(text);

        if (!session.data.shoe.sizes.includes(size)) {
            await sendText(sock, to, '❌ Invalid size');
            return;
        }

        session.data.size = size;
        session.stage = 'ENTER_NAME';

        await sendText(sock, to,
`👤 Enter full name`);
        return;
    }

    if (session.stage === 'ENTER_NAME') {

        session.data.customerName = text;
        session.stage = 'ENTER_LOCATION';

        await sendText(sock, to,
`📍 Enter delivery location`);
        return;
    }

    if (session.stage === 'ENTER_LOCATION') {

        session.data.location = text;
        session.stage = 'DONE';

        await sendText(sock, to,
`✅ *ORDER RECEIVED*

We will contact you shortly.

⚡ Powered by CymorTechServices`);

        userSessions.delete(to);
    }
}

module.exports = { handleIncomingMessage };
