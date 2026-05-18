const {
    BOT_NAME,
    OWNER_NUMBER,
    SHOE_CATALOG,
    DELIVERY_AREAS,
    FAQ_DATA
} = require('./config');

// ======================================================
// CYMOR PREMIUM BUSINESS ENGINE
// ======================================================

const userSessions = new Map();
const cooldowns = new Map();

// ======================================================
// MAIN MESSAGE ENTRY
// ======================================================

async function handleIncomingMessage(sock, m) {
    try {
        // Baileys sends an event with an array of messages
        const msg = m.messages[0]; 
        if (!msg || !msg.message) return;

        const from = msg.key.remoteJid;

        // Security: Ignore self and groups
        if (msg.key.fromMe) return;
        if (!from.endsWith('@s.whatsapp.net')) return;

        // ======================================================
        // IMPROVED EXTRACTION LOGIC
        // ======================================================
        const type = Object.keys(msg.message)[0];
        const body = 
            type === 'conversation' ? msg.message.conversation :
            type === 'extendedTextMessage' ? msg.message.extendedTextMessage.text :
            type === 'imageMessage' ? msg.message.imageMessage.caption :
            type === 'videoMessage' ? msg.message.videoMessage.caption :
            type === 'buttonsResponseMessage' ? msg.message.buttonsResponseMessage.selectedButtonId :
            type === 'listResponseMessage' ? msg.message.listResponseMessage.singleSelectReply.selectedRowId :
            type === 'templateButtonReplyMessage' ? msg.message.templateButtonReplyMessage.selectedId : 
            '';

        const cleanText = body.trim().toLowerCase();
        if (!cleanText) return;

        const senderName = msg.pushName || 'Customer';

        // ======================================================
        // ANTISPAM COOLDOWN
        // ======================================================
        const now = Date.now();
        if (cooldowns.has(from)) {
            const lastMessage = cooldowns.get(from);
            if (now - lastMessage < 700) return;
        }
        cooldowns.set(from, now);

        // ======================================================
        // ACTIVE CHECKOUT SESSION
        // ======================================================
        if (userSessions.has(from)) {
            await handleOrderWorkflow(sock, from, cleanText, senderName);
            return;
        }

        // ======================================================
        // MAIN ROUTER (REPLIES TO ANY FIRST MESSAGE)
        // ======================================================
        switch (cleanText) {
            // Greetings & Start
            case 'hi':
            case 'hello':
            case 'hey':
            case 'hy':
            case 'hie':
            case 'start':
            case 'menu':
            case 'bot':
            case 'habari':
            case 'mambo':
                await sendMainMenu(sock, from, senderName);
                break;

            // Catalog
            case '1':
            case 'catalog':
            case 'shop':
            case 'products':
                await sendCatalog(sock, from);
                break;

            // Order Flow
            case '2':
            case 'buy':
            case 'order':
                userSessions.set(from, {
                    stage: 'SELECT_SHOE',
                    data: {},
                    startedAt: Date.now()
                });
                await sendCatalog(sock, from);
                await sendText(
                    sock,
                    from,
                    `🛍️ *PREMIUM CHECKOUT INITIALIZED*\n\n` +
                    `Please type the *Product Code* of the sneaker you want.\n\n` +
                    `📌 Example: *CS01*\n\n` +
                    `❌ Type *cancel* anytime to stop checkout.`
                );
                break;

            // Delivery
            case '3':
            case 'delivery':
            case 'shipping':
                await sendDeliveryInfo(sock, from);
                break;

            // Store Info
            case '4':
            case 'location':
            case 'store':
                await sendStoreInfo(sock, from);
                break;

            // Payment
            case '5':
            case 'payment':
            case 'mpesa':
                await sendPaymentInfo(sock, from);
                break;

            case 'help':
                await sendHelpMenu(sock, from);
                break;

            // ======================================================
            // FALLBACK & KEYWORD MATCHING
            // ======================================================
            default:
                if (cleanText.includes('shoe') || cleanText.includes('sneaker')) {
                    await sendCatalog(sock, from);
                } else if (cleanText.includes('pay') || cleanText.includes('till')) {
                    await sendPaymentInfo(sock, from);
                } else if (cleanText.includes('deliver') || cleanText.includes('shipping')) {
                    await sendDeliveryInfo(sock, from);
                } else if (cleanText.includes('where') || cleanText.includes('located')) {
                    await sendStoreInfo(sock, from);
                } else {
                    // This ensures the bot ALWAYS replies to any first message
                    await sendMainMenu(sock, from, senderName);
                }
                break;
        }

    } catch (error) {
        console.error('\n❌ BOT LOGIC ERROR:', error);
    }
}

// ======================================================
// UI COMPONENTS (MAIN MENU, CATALOG, ETC)
// ======================================================

async function sendMainMenu(sock, to, name) {
    const text =
`╔══════════════════╗
   👟 *${BOT_NAME.toUpperCase()}*
╚══════════════════╝

👋 Welcome *${name}*

Kenya's premium sneaker marketplace for authentic elite streetwear.

━━━━━━━━━━━━━━━━━━

*1️⃣ VIEW CATALOG*
Browse latest sneaker inventory

*2️⃣ PLACE ORDER*
Launch instant checkout flow

*3️⃣ DELIVERY INFO*
Shipping rates & timelines

*4️⃣ STORE LOCATION*
Physical hub & opening hours

*5️⃣ PAYMENT METHODS*
M-Pesa & COD information

━━━━━━━━━━━━━━━━━━

💬 Reply with a number above.

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

async function sendCatalog(sock, to) {
    let text = `👟 *${BOT_NAME.toUpperCase()} CATALOG*\n\n━━━━━━━━━━━━━━━━━━\n\n`;
    SHOE_CATALOG.forEach((shoe) => {
        text += `📦 *${shoe.name}*\n🆔 Code: *${shoe.id}*\n💰 Price: *KSh ${shoe.price.toLocaleString()}*\n📏 Sizes: ${shoe.sizes.join(', ')}\n${shoe.instock ? '🟢 In Stock' : '🔴 Sold Out'}\n\n━━━━━━━━━━━━━━━━━━\n\n`;
    });
    text += `🛍️ To order instantly:\nReply with *2*\n\n⚡ Powered by CymorTechServices`;
    await sendText(sock, to, text);
}

async function sendDeliveryInfo(sock, to) {
    let deliveryText = `📦 *DELIVERY & SHIPPING*\n\n━━━━━━━━━━━━━━━━━━\n\n`;
    for (const [zone, price] of Object.entries(DELIVERY_AREAS)) {
        deliveryText += `📍 ${zone.toUpperCase()}\n💰 ${price === 0 ? 'FREE' : `KSh ${price}`}\n\n`;
    }
    deliveryText += `━━━━━━━━━━━━━━━━━━\n\n🚚 Nairobi: 2-3 Hours\n🚚 Countrywide: 24 Hours\n\n⚡ Powered by CymorTechServices`;
    await sendText(sock, to, deliveryText);
}

async function sendStoreInfo(sock, to) {
    const text = `📍 *STORE LOCATION*\n\n━━━━━━━━━━━━━━━━━━\n\n🏢 ${FAQ_DATA.location}\n\n⏰ OPENING HOURS\nMon - Sat: 8AM - 8PM\nSun: 11AM - 4PM\n\n━━━━━━━━━━━━━━━━━━\n\n⚡ Powered by CymorTechServices`;
    await sendText(sock, to, text);
}

async function sendPaymentInfo(sock, to) {
    const text = `💳 *PAYMENT METHODS*\n\n━━━━━━━━━━━━━━━━━━\n\n🟩 *M-PESA BUY GOODS*\nTill Number: *${FAQ_DATA.tillNumber}*\nStore Name: *${BOT_NAME}*\n\n━━━━━━━━━━━━━━━━━━\n\n💵 *CASH ON DELIVERY*\nAvailable in Nairobi zones only.\n\n⚡ Powered by CymorTechServices`;
    await sendText(sock, to, text);
}

async function sendHelpMenu(sock, to) {
    const text = `🆘 *HELP CENTER*\n\n━━━━━━━━━━━━━━━━━━\n\nType:\n*menu* → Main dashboard\n*1* → Catalog\n*2* → Order\n*3* → Delivery\n*4* → Store location\n*5* → Payment info\n\n━━━━━━━━━━━━━━━━━━\n\n⚡ Powered by CymorTechServices`;
    await sendText(sock, to, text);
}

// ======================================================
// ORDER WORKFLOW ENGINE
// ======================================================

async function handleOrderWorkflow(sock, to, text, senderName) {
    const session = userSessions.get(to);

    if (text === 'cancel' || text === 'exit') {
        userSessions.delete(to);
        await sendText(sock, to, `❌ *CHECKOUT CANCELLED*\n\nYour session has been cleared.\n\n📌 Type *menu* to restart.`);
        return;
    }

    if (session.stage === 'SELECT_SHOE') {
        const selectedShoe = SHOE_CATALOG.find(s => s.id.toLowerCase() === text.toLowerCase());
        if (!selectedShoe || !selectedShoe.instock) {
            await sendText(sock, to, `❌ Invalid or unavailable product code.\n\nPlease enter a code like *CS01*.`);
            return;
        }
        session.data.shoe = selectedShoe;
        session.stage = 'SELECT_SIZE';
        await sendText(sock, to, `✅ *${selectedShoe.name}* selected.\n\n📏 Available Sizes:\n${selectedShoe.sizes.join(', ')}\n\nReply with your size.`);
        return;
    }

    if (session.stage === 'SELECT_SIZE') {
        const size = parseInt(text);
        if (isNaN(size) || !session.data.shoe.sizes.includes(size)) {
            await sendText(sock, to, `❌ Invalid size. Choose from: ${session.data.shoe.sizes.join(', ')}`);
            return;
        }
        session.data.size = size;
        session.stage = 'ENTER_NAME';
        await sendText(sock, to, `👤 Enter recipient full name.`);
        return;
    }

    if (session.stage === 'ENTER_NAME') {
        if (text.length < 3) {
            await sendText(sock, to, `❌ Please enter a valid name.`);
            return;
        }
        session.data.customerName = text; // Captures actual input
        session.stage = 'ENTER_LOCATION';
        await sendText(sock, to, `📍 Enter delivery location.\n\nExample: Westlands, Nairobi`);
        return;
    }

    if (session.stage === 'ENTER_LOCATION') {
        let shippingCost = 300;
        for (const [zone, price] of Object.entries(DELIVERY_AREAS)) {
            if (text.includes(zone.toLowerCase())) {
                shippingCost = price;
                break;
            }
        }
        session.data.location = text.toUpperCase();
        session.data.shippingCost = shippingCost;
        session.data.total = session.data.shoe.price + shippingCost;
        session.stage = 'CONFIRM_ORDER';

        const invoice = `🧾 *ORDER SUMMARY*\n\n━━━━━━━━━━━━━━━━━━\n\n👟 Product: ${session.data.shoe.name}\n📏 Size: ${session.data.size}\n👤 Customer: ${session.data.customerName}\n📍 Delivery: ${session.data.location}\n\n━━━━━━━━━━━━━━━━━━\n\n💰 Product: KSh ${session.data.shoe.price.toLocaleString()}\n📦 Shipping: KSh ${shippingCost.toLocaleString()}\n\n━━━━━━━━━━━━━━━━━━\n\n💵 TOTAL: *KSh ${session.data.total.toLocaleString()}*\n\n━━━━━━━━━━━━━━━━━━\n\n✅ Reply *YES* to confirm\n❌ Reply *CANCEL* to abort`;
        await sendText(sock, to, invoice);
        return;
    }

    if (session.stage === 'CONFIRM_ORDER') {
        if (text !== 'yes') {
            await sendText(sock, to, `✍️ Reply *YES* to confirm or *CANCEL* to abort.`);
            return;
        }
        
        const data = session.data;
        const customerPhone = to.split('@')[0];
        const ownerJid = `${OWNER_NUMBER.replace(/\D/g, '')}@s.whatsapp.net`;

        const ownerText = `🚨 *NEW ORDER RECEIVED*\n\n👤 Customer: ${data.customerName}\n📞 WhatsApp: wa.me/${customerPhone}\n👟 Product: ${data.shoe.name}\n📏 Size: ${data.size}\n📍 Delivery: ${data.location}\n💰 Total: KSh ${data.total.toLocaleString()}\n\n⚡ Cymor Business Engine`;

        await sendText(sock, ownerJid, ownerText);
        await sendText(sock, to, `🎉 *ORDER CONFIRMED*\n\nOur team will contact you shortly.\n\nThank you for shopping with *${BOT_NAME}*.`);
        userSessions.delete(to);
    }
}

// ======================================================
// SENDER UTILITY
// ======================================================

async function sendText(sock, to, text) {
    try {
        await sock.sendMessage(to, { text });
    } catch (error) {
        console.error('\n❌ SEND ERROR:', error);
    }
}

module.exports = { handleIncomingMessage };
