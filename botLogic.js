const {
    BOT_NAME,
    OWNER_NUMBER,
    SHOE_CATALOG,
    DELIVERY_AREAS,
    FAQ_DATA
} = require('./config');

// ======================================================
// CYMOR PREMIUM BUSINESS ENGINE
// Advanced SaaS WhatsApp Commerce Logic
// ======================================================

// Active checkout sessions
const userSessions = new Map();

// Anti-spam cooldown tracker
const cooldowns = new Map();

// ======================================================
// MAIN MESSAGE ENTRY
// ======================================================

async function handleIncomingMessage(sock, msg) {

    try {

        const from = msg.key.remoteJid;

        // Ignore groups
        if (!from.endsWith('@s.whatsapp.net')) {
            return;
        }

        // ======================================================
        // EXTRACT MESSAGE TEXT
        // ======================================================

        const body =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            msg.message?.buttonsResponseMessage?.selectedButtonId ||
            msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
            '';

        const cleanText = body.trim().toLowerCase();

        // Ignore empty messages
        if (!cleanText) return;

        const senderName = msg.pushName || 'Customer';

        // ======================================================
        // SIMPLE ANTISPAM
        // ======================================================

        const now = Date.now();

        if (cooldowns.has(from)) {

            const lastMessage = cooldowns.get(from);

            if (now - lastMessage < 700) {
                return;
            }
        }

        cooldowns.set(from, now);

        // ======================================================
        // ACTIVE CHECKOUT SESSION
        // ======================================================

        if (userSessions.has(from)) {
            await handleOrderWorkflow(
                sock,
                from,
                cleanText,
                senderName
            );

            return;
        }

        // ======================================================
        // MAIN ROUTER
        // ======================================================

        switch (cleanText) {

            // ======================================================
            // MAIN MENU
            // ======================================================

            case 'hi':
            case 'hello':
            case 'hey':
            case 'start':
            case 'menu':
            case 'bot':
            case 'habari':
            case 'mambo':

                await sendMainMenu(sock, from, senderName);
                break;

            // ======================================================
            // CATALOG
            // ======================================================

            case '1':
            case 'catalog':
            case 'shop':
            case 'products':

                await sendCatalog(sock, from);
                break;

            // ======================================================
            // ORDER FLOW
            // ======================================================

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

            // ======================================================
            // DELIVERY
            // ======================================================

            case '3':
            case 'delivery':
            case 'shipping':

                await sendDeliveryInfo(sock, from);
                break;

            // ======================================================
            // STORE INFO
            // ======================================================

            case '4':
            case 'location':
            case 'store':

                await sendStoreInfo(sock, from);
                break;

            // ======================================================
            // PAYMENT
            // ======================================================

            case '5':
            case 'payment':
            case 'mpesa':

                await sendPaymentInfo(sock, from);
                break;

            // ======================================================
            // HELP
            // ======================================================

            case 'help':

                await sendHelpMenu(sock, from);
                break;

            // ======================================================
            // FALLBACK AI-LIKE MATCHING
            // ======================================================

            default:

                if (
                    cleanText.includes('shoe') ||
                    cleanText.includes('sneaker')
                ) {
                    await sendCatalog(sock, from);
                    return;
                }

                if (
                    cleanText.includes('pay') ||
                    cleanText.includes('till')
                ) {
                    await sendPaymentInfo(sock, from);
                    return;
                }

                if (
                    cleanText.includes('deliver') ||
                    cleanText.includes('shipping')
                ) {
                    await sendDeliveryInfo(sock, from);
                    return;
                }

                if (
                    cleanText.includes('where') ||
                    cleanText.includes('located')
                ) {
                    await sendStoreInfo(sock, from);
                    return;
                }

                await sendText(
                    sock,
                    from,
                    `⚠️ *UNKNOWN COMMAND*\n\n` +
                    `I couldn't understand your request.\n\n` +
                    `📌 Type *menu* to access the control dashboard.`
                );

                break;
        }

    } catch (error) {

        console.error('\n❌ BOT LOGIC ERROR');
        console.error(error);

    }
}

// ======================================================
// MAIN MENU
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

// ======================================================
// CATALOG
// ======================================================

async function sendCatalog(sock, to) {

    let text =
`👟 *${BOT_NAME.toUpperCase()} CATALOG*

━━━━━━━━━━━━━━━━━━

`;

    SHOE_CATALOG.forEach((shoe) => {

        text +=
`📦 *${shoe.name}*

🆔 Code: *${shoe.id}*
💰 Price: *KSh ${shoe.price.toLocaleString()}*
📏 Sizes: ${shoe.sizes.join(', ')}
${shoe.instock ? '🟢 In Stock' : '🔴 Sold Out'}

━━━━━━━━━━━━━━━━━━

`;
    });

    text +=
`🛍️ To order instantly:
Reply with *2*

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

// ======================================================
// DELIVERY INFO
// ======================================================

async function sendDeliveryInfo(sock, to) {

    let deliveryText =
`📦 *DELIVERY & SHIPPING*

━━━━━━━━━━━━━━━━━━

`;

    for (const [zone, price] of Object.entries(DELIVERY_AREAS)) {

        deliveryText +=
`📍 ${zone.toUpperCase()}
💰 ${price === 0 ? 'FREE' : `KSh ${price}`}

`;
    }

    deliveryText +=
`━━━━━━━━━━━━━━━━━━

🚚 Nairobi:
2 - 3 Hours

🚚 Countrywide:
24 Hours Dispatch

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, deliveryText);
}

// ======================================================
// STORE INFO
// ======================================================

async function sendStoreInfo(sock, to) {

    const text =
`📍 *STORE LOCATION*

━━━━━━━━━━━━━━━━━━

🏢 ${FAQ_DATA.location}

⏰ OPENING HOURS

Mon - Sat:
8:00 AM - 8:00 PM

Sunday:
11:00 AM - 4:00 PM

━━━━━━━━━━━━━━━━━━

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

// ======================================================
// PAYMENT INFO
// ======================================================

async function sendPaymentInfo(sock, to) {

    const text =
`💳 *PAYMENT METHODS*

━━━━━━━━━━━━━━━━━━

🟩 *M-PESA BUY GOODS*

Till Number:
*${FAQ_DATA.tillNumber}*

Store Name:
*${BOT_NAME}*

━━━━━━━━━━━━━━━━━━

💵 *CASH ON DELIVERY*

Available within Nairobi selected zones only.

━━━━━━━━━━━━━━━━━━

⚠️ Countrywide deliveries require partial payment confirmation.

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

// ======================================================
// HELP MENU
// ======================================================

async function sendHelpMenu(sock, to) {

    const text =
`🆘 *HELP CENTER*

━━━━━━━━━━━━━━━━━━

Type:

*menu* → Main dashboard
*1* → Catalog
*2* → Order
*3* → Delivery
*4* → Store location
*5* → Payment info

━━━━━━━━━━━━━━━━━━

⚡ Powered by CymorTechServices`;

    await sendText(sock, to, text);
}

// ======================================================
// ORDER WORKFLOW
// ======================================================

async function handleOrderWorkflow(
    sock,
    to,
    text,
    senderName
) {

    const session = userSessions.get(to);

    // ======================================================
    // CANCEL CHECKOUT
    // ======================================================

    if (
        text === 'cancel' ||
        text === 'exit'
    ) {

        userSessions.delete(to);

        await sendText(
            sock,
            to,
            `❌ *CHECKOUT CANCELLED*\n\n` +
            `Your active order session has been cleared.\n\n` +
            `📌 Type *menu* to restart.`
        );

        return;
    }

    // ======================================================
    // SELECT SHOE
    // ======================================================

    if (session.stage === 'SELECT_SHOE') {

        const selectedShoe = SHOE_CATALOG.find(
            shoe =>
                shoe.id.toLowerCase() ===
                text.trim().toLowerCase()
        );

        if (!selectedShoe || !selectedShoe.instock) {

            await sendText(
                sock,
                to,
                `❌ Invalid or unavailable product code.\n\n` +
                `Please enter a valid code like *CS01*.`
            );

            return;
        }

        session.data.shoe = selectedShoe;
        session.stage = 'SELECT_SIZE';

        await sendText(
            sock,
            to,
            `✅ *${selectedShoe.name}* selected.\n\n` +
            `📏 Available Sizes:\n` +
            `${selectedShoe.sizes.join(', ')}\n\n` +
            `Reply with your preferred size.`
        );

        return;
    }

    // ======================================================
    // SELECT SIZE
    // ======================================================

    if (session.stage === 'SELECT_SIZE') {

        const size = parseInt(text);

        if (
            isNaN(size) ||
            !session.data.shoe.sizes.includes(size)
        ) {

            await sendText(
                sock,
                to,
                `❌ Invalid size.\n\n` +
                `Choose from:\n${session.data.shoe.sizes.join(', ')}`
            );

            return;
        }

        session.data.size = size;
        session.stage = 'ENTER_NAME';

        await sendText(
            sock,
            to,
            `👤 Enter recipient full name.`
        );

        return;
    }

    // ======================================================
    // ENTER NAME
    // ======================================================

    if (session.stage === 'ENTER_NAME') {

        if (text.length < 3) {

            await sendText(
                sock,
                to,
                `❌ Please enter a valid name.`
            );

            return;
        }

        session.data.customerName = senderName;
        session.stage = 'ENTER_LOCATION';

        await sendText(
            sock,
            to,
            `📍 Enter delivery location.\n\n` +
            `Example:\nWestlands, Nairobi`
        );

        return;
    }

    // ======================================================
    // ENTER LOCATION
    // ======================================================

    if (session.stage === 'ENTER_LOCATION') {

        if (text.length < 3) {

            await sendText(
                sock,
                to,
                `❌ Invalid delivery location.`
            );

            return;
        }

        let shippingCost = 300;

        for (const [zone, price] of Object.entries(DELIVERY_AREAS)) {

            if (text.includes(zone.toLowerCase())) {
                shippingCost = price;
                break;
            }
        }

        session.data.location = text.toUpperCase();
        session.data.shippingCost = shippingCost;
        session.data.total =
            session.data.shoe.price + shippingCost;

        session.stage = 'CONFIRM_ORDER';

        const invoice =
`🧾 *ORDER SUMMARY*

━━━━━━━━━━━━━━━━━━

👟 Product:
${session.data.shoe.name}

📏 Size:
${session.data.size}

👤 Customer:
${session.data.customerName}

📍 Delivery:
${session.data.location}

━━━━━━━━━━━━━━━━━━

💰 Product:
KSh ${session.data.shoe.price.toLocaleString()}

📦 Shipping:
KSh ${shippingCost.toLocaleString()}

━━━━━━━━━━━━━━━━━━

💵 TOTAL:
*KSh ${session.data.total.toLocaleString()}*

━━━━━━━━━━━━━━━━━━

✅ Reply *YES* to confirm
❌ Reply *CANCEL* to abort`;

        await sendText(sock, to, invoice);

        return;
    }

    // ======================================================
    // CONFIRM ORDER
    // ======================================================

    if (session.stage === 'CONFIRM_ORDER') {

        if (text !== 'yes') {

            await sendText(
                sock,
                to,
                `✍️ Reply *YES* to confirm or *CANCEL* to abort.`
            );

            return;
        }

        const data = session.data;

        const customerPhone =
            to.split('@')[0];

        // ======================================================
        // OWNER ALERT
        // ======================================================

        const ownerText =
`🚨 *NEW ORDER RECEIVED*

━━━━━━━━━━━━━━━━━━

👤 Customer:
${data.customerName}

📞 WhatsApp:
wa.me/${customerPhone}

👟 Product:
${data.shoe.name}

📏 Size:
${data.size}

📍 Delivery:
${data.location}

💰 Total:
KSh ${data.total.toLocaleString()}

━━━━━━━━━━━━━━━━━━

⚡ Cymor Business Engine`;

        const ownerJid =
`${OWNER_NUMBER.replace(/\D/g, '')}@s.whatsapp.net`;

        await sendText(
            sock,
            ownerJid,
            ownerText
        );

        // ======================================================
        // CUSTOMER CONFIRMATION
        // ======================================================

        await sendText(
            sock,
            to,
            `🎉 *ORDER CONFIRMED*\n\n` +
            `Our sales team will contact you shortly.\n\n` +
            `Thank you for shopping with *${BOT_NAME}*.`
        );

        userSessions.delete(to);
    }
}

// ======================================================
// SAFE MESSAGE SENDER
// ======================================================

async function sendText(sock, to, text) {

    try {

        await sock.sendMessage(to, {
            text
        });

    } catch (error) {

        console.error('\n❌ SEND MESSAGE ERROR');
        console.error(error);

    }
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    handleIncomingMessage
};
