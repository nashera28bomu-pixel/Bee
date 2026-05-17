const { BOT_NAME, OWNER_NUMBER, SHOE_CATALOG, DELIVERY_AREAS, FAQ_DATA } = require('./config');

// In-memory session tracker to handle the order configuration funnel state
const userSessions = new Map();

/**
 * Main incoming message router
 */
async function handleIncomingMessage(sock, msg) {
    const from = msg.key.remoteJid;
    
    // We only process individual chats for this business logic
    if (!from.endsWith('@s.whatsapp.net')) return;

    // Extract incoming text string from various message payload structures
    const body = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.buttonsResponseMessage?.selectedButtonId || 
                 '';
    
    const cleanText = body.trim().toLowerCase();
    const senderName = msg.pushName || 'Valued Customer';

    // If user is inside an active checkout session funnel, bypass the main menu rules
    if (userSessions.has(from)) {
        await handleOrderWorkflow(sock, from, cleanText);
        return;
    }

    // --- MAIN ROUTER SWITCH ---
    switch (cleanText) {
        case 'hi':
        case 'hello':
        case 'habari':
        case 'menu':
        case 'bot':
            await sendMainMenu(sock, from, senderName);
            break;

        case '1': // View Shoe Catalog
            await sendCatalog(sock, from);
            break;

        case '2': // Start Order Funnel
            userSessions.set(from, { stage: 'SELECT_SHOE', data: {} });
            await sendCatalog(sock, from);
            await sock.sendMessage(from, { 
                text: `✨ *𝖢𝖸𝖬𝖮𝖱 𝖢𝖧𝖤𝖢𝖪𝖮𝖴𝖳* ✨\n\n` +
                      `👟 *Let's get your order premium-configured!*\n\n` +
                      `💬 Please type the *𝖨𝗍𝖾𝗆 𝖢𝗈𝖽𝖾* of the shoe you want to purchase (e.g., *CS01*):\n\n` +
                      `_To abort checkout anytime, type *cancel*_\n` +
                      `▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️\n` +
                      `⚡ *Powered by CymorTechServices*`
            });
            break;

        case '3': // Delivery & Timelines Info
            await sendDeliveryInfo(sock, from);
            break;

        case '4': // Store Locations & Timings
            await sendStoreInfo(sock, from);
            break;

        case '5': // Mode of Payment FAQ
            await sendPaymentInfo(sock, from);
            break;

        default:
            // Fallback checking for casual keyword matching
            if (cleanText.includes('location') || cleanText.includes('where')) {
                await sendStoreInfo(sock, from);
            } else if (cleanText.includes('pay') || cleanText.includes('mpesa')) {
                await sendPaymentInfo(sock, from);
            } else if (cleanText.includes('delivery') || cleanText.includes('ship')) {
                await sendDeliveryInfo(sock, from);
            } else {
                // Gentle guiding prompt error response
                await sock.sendMessage(from, { 
                    text: `⚠️ *𝖲𝖸𝖲𝖳𝖤𝖬 𝖭𝖮𝖳𝖨𝖥𝖨𝖢𝖳𝖨𝖮𝖭*\n\n` +
                          `🤔 Sorry, I didn't quite catch that input.\n\n` +
                          `📝 Type *'menu'* at any time to return to our main service navigation dashboard.\n\n` +
                          `▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️\n` +
                          `⚡ *Powered by CymorTechServices*` 
                });
            }
            break;
    }
}

// --- UI / COMPONENT GENERATORS ---

async function sendMainMenu(sock, to, name) {
    const menuText = `✦ ━━━━━━━━━━━━━━━━━ ✦\n` +
                     `⚡ *𝖶𝖤𝖫𝖢𝖮𝖬𝖤 𝖳𝖮 ${BOT_NAME.toUpperCase()}* ⚡\n` +
                     `✦ ━━━━━━━━━━━━━━━━━ ✦\n\n` +
                     `👋 Hello *${name}*,\n\n` +
                     `Welcome to Kenya's premium destination for verified, elite-tier authentic streetwear & sneakers.\n\n` +
                     `▫️ *𝖲𝖤𝖫𝖤𝖢𝖳 𝖠𝖭 𝖮𝖯𝖳𝖨𝖮𝖭:* ▫️\n` +
                     `Reply with the number *(1 - 5)* to navigate:\n\n` +
                     `  *[1]* 👟  𝖵𝗂𝖾𝖿 𝖫𝖺𝗍𝖾𝗌𝗍 𝖲𝗇𝖾𝖺𝗄𝖾𝗋 𝖢𝖺𝗍𝖺𝗅𝗈𝗀\n` +
                     `  *[2]* 🛍️  𝖯𝗅𝖺𝖼𝖾 𝖺 𝖭𝖾𝗐 𝖮𝗋𝖽𝖾𝗋 𝖨𝗇𝗌𝗍𝖺𝗇𝗍𝗅𝗒\n` +
                     `  *[3]* 📦  𝖣𝖾𝗅𝗂𝗏𝖾𝗋𝗒 𝖱𝖺𝗍𝖾𝗌 & 𝖳𝗂𝗆𝖾𝗅𝗂𝖾𝗌\n` +
                     `  *[4]* 📍  𝖯𝖧𝗒𝗌𝗂𝖼𝖺𝗅 𝖲𝗍𝗈𝗋𝖾 𝖧𝗎𝖻 & 𝖧𝗈𝗎𝗋𝗌\n` +
                     `  *[5]* 💳  𝖯𝖺𝗒𝗆𝖾𝗇𝗍 𝖬𝖾𝗍𝗁𝗈𝖽𝗌 & 𝖯𝗈𝗅𝗂𝖼𝗂𝖾𝗌\n\n` +
                     `▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️\n` +
                     `⚡ *Powered by CymorTechServices*`;
    
    await sock.sendMessage(to, { text: menuText });
}

async function sendCatalog(sock, to) {
    let catalogText = `⚡ ━━━━━━━━━━━━━━━━━ ⚡\n` +
                      `👟 *${BOT_NAME.toUpperCase()} 𝖢𝖠𝖳𝖠𝖫𝖮𝖦* 👟\n` +
                      `⚡ ━━━━━━━━━━━━━━━━━ ⚡\n\n` +
                      `Every pair is pristine and shipped in its original box packaging structure:\n\n`;

    SHOE_CATALOG.forEach(shoe => {
        catalogText += `┌─ 📦 *${shoe.name.toUpperCase()}*\n` +
                       `│ 🆔 *Code:* ${shoe.id} \n` + // Removed backticks here to prevent syntax conflicts
                       `│ 💰 *Price:* KSh ${shoe.price.toLocaleString()}\n` +
                       `│ 📏 *Sizes:* [ ${shoe.sizes.join(' - ')} ]\n` +
                       `│ ✨ *Availability:* ${shoe.instock ? '🟢 AVAILABLE' : '🔴 SOLD OUT'}\n` +
                       `└───────────────────\n\n`;
    });

    catalogText += `▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️\n` +
                   `💡 *Ready to lock it in?*\n` +
                   `Reply with *2* right now to launch your quick order checkout wizard.\n\n` +
                   `⚡ *Powered by CymorTechServices*`;

    await sock.sendMessage(to, { text: catalogText });
}

async function sendDeliveryInfo(sock, to) {
    const header = `📦 ━━━━━━━━━━━━━━━━━ 📦\n` +
                   `⚡ *𝖫𝖮𝖦𝖨𝖲𝖳𝖨𝖢𝖲 & 𝖥𝖱𝖤𝖨𝖦𝖧𝖳 𝖱𝖠𝖳𝖤𝖲* ⚡\n` +
                   `📦 ━━━━━━━━━━━━━━━━━ 📦\n\n` +
                   `We provide rapid countrywide distribution networks daily:\n\n`;

    let deliveryList = "```\n"; // Sanitized string for Render
    for (const [zone, rate] of Object.entries(DELIVERY_AREAS)) {
        const paddedZone = zone.toUpperCase().padEnd(15, ' ');
        const formattedRate = rate === 0 ? "FREE" : `KSh ${rate}`;
        deliveryList += `${paddedZone} : ${formattedRate}\n`;
    }
    deliveryList += "```\n";

    const footer = `⏱️ *𝖤𝖷𝖯𝖤𝖣𝖨𝖳𝖤𝖣 𝖳𝖨𝖬𝖤𝖫𝖨𝖭𝖤𝖲:*\n` +
                   `• *Nairobi Environs:* Delivered within 2-3 hours max.\n` +
                   `• *Countrywide:* Dispatched via Wells Fargo / G4S within 24 hours.\n\n` +
                   `↩️ Reply *menu* to return to listings.\n` +
                   `▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️\n` +
                   `⚡ *Powered by CymorTechServices*`;

    await sock.sendMessage(to, { text: header + deliveryList + footer });
}

async function sendStoreInfo(sock, to) {
    const storeText = `📍 ━━━━━━━━━━━━━━━━━ 📍\n` +
                      `⚡ *𝖯𝖧𝖸𝖲𝖨𝖢𝖠𝖫 𝖧𝖴𝖡 & 𝖧𝖮𝖴𝖱𝖲* ⚡\n` +
                      `📍 ━━━━━━━━━━━━━━━━━ 📍\n\n` +
                      `🏢 *📍 LOCATION:* \n` +
                      `_${FAQ_DATA.location}_\n\n` +
                      `⏰ *⌛ OPERATING HOURS:* \n` +
                      `• *Mon - Sat:* 8:00 AM – 8:00 PM\n` +
                      `• *Sundays:* 11:00 AM – 4:00 PM\n\n` +
                      `👟 Come try out your premium configurations live!\n\n` +
                      `↩️ Reply *menu* to return to listings.\n` +
                      `▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️\n` +
                      `⚡ *Powered by CymorTechServices*`;
    
    await sock.sendMessage(to, { text: storeText });
}

async function sendPaymentInfo(sock, to) {
    const paymentText = `💳 ━━━━━━━━━━━━━━━━━ 💳\n` +
                        `⚡ *𝖲𝖤𝖢𝖴𝖱𝖤 𝖢𝖧𝖤𝖢𝖪𝖮𝖴𝖳 𝖦𝖠𝖳𝖤𝖶𝖠𝖸𝖲* ⚡\n` +
                        `💳 ━━━━━━━━━━━━━━━━━ 💳\n\n` +
                        `To guarantee ultimate transaction safety, we support:\n\n` +
                        `🟩 *1. LIPA NA M-PESA (BUY GOODS)*\n` +
                        `• Till Number:  *${FAQ_DATA.tillNumber}*\n` +
                        `• Store Registry:  *${BOT_NAME}*\n\n` +
                        `💵 *2. CASH ON DELIVERY (COD)*\n` +
                        `• Restricted exclusively to Nairobi CBD and designated perimeter nodes.\n\n` +
                        `⚠️ *Important:* Countrywide parcel dispatches require upfront delivery collateral settlement via our verified Business Till.\n\n` +
                        `↩️ Reply *menu* to return to listings.\n` +
                        `▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️\n` +
                        `⚡ *Powered by CymorTechServices*`;

    await sock.sendMessage(to, { text: paymentText });
}

async function handleOrderWorkflow(sock, to, text) {
    const session = userSessions.get(to);

    if (text === 'cancel' || text === 'exit') {
        userSessions.delete(to);
        await sock.sendMessage(to, { 
            text: `❌ *𝖢𝖧𝖤𝖢𝖪𝖮𝖴𝖳 𝖳𝖤𝖱𝖬𝖨𝖭𝖠𝖳𝖤𝖣*\n\n` +
                  `Your configuration session has been purged successfully.\n\n` +
                  `📝 Reply *menu* to access the main interface dashboard.\n\n` +
                  `▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️\n` +
                  `⚡ *Powered by CymorTechServices*` 
        });
        return;
    }

    switch (session.stage) {
        case 'SELECT_SHOE':
            const selectedShoe = SHOE_CATALOG.find(s => s.id.toLowerCase() === text);
            if (!selectedShoe || !selectedShoe.instock) {
                await sock.sendMessage(to, { 
                    text: `❌ *𝖨𝖭𝖵𝖠𝖫𝖨𝖣 𝖨𝖳𝖤𝖬 𝖢𝖮𝖣𝖤*\n\n` +
                          `We couldn't track that active code or the item is sold out.\n` +
                          `Please look at the catalog and re-enter a valid ID code:\n\n` +
                          `_Or type *cancel* to return to main dashboard_` 
                });
                return;
            }
            session.data.shoe = selectedShoe;
            session.stage = 'SELECT_SIZE';
            await sock.sendMessage(to, { 
                text: `✨ *𝖬𝖮𝖣𝖤𝖫 𝖫𝖮𝖢𝖪𝖤𝖣:* _${selectedShoe.name}_\n\n` +
                      `📐 What *𝖲𝗂𝗓𝖾* do you require?\n\n` +
                      `👉 Available sizing run: *[ ${selectedShoe.sizes.join(' - ')} ]*\n\n` +
                      `▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️▫️\n` +
                      `⚡ *Powered by CymorTechServices*` 
            });
            break;

        case 'SELECT_SIZE':
            const enteredSize = parseInt(text);
            const validSizes = session.data.shoe.sizes;
            if (isNaN(enteredSize) || !validSizes.includes(enteredSize)) {
                await sock.sendMessage(to, { 
                    text: `❌ *𝖴𝖭𝖠𝖵𝖠𝖨𝖫𝖠𝖡𝖫𝖤 𝖲𝖨𝖹𝖤*\n\n` +
                          `Please pick a sizing value directly from: *[ ${validSizes.join(' - ')} ]*:` 
                });
                return;
            }
            session.data.size = enteredSize;
            session.stage = 'ENTER_NAME';
            await sock.sendMessage(to, { 
                text: `👤 *𝖲𝖨𝖹𝖤 𝖱𝖤𝖦𝖨𝖲𝖳𝖤𝖱𝖤𝖣:* _Size ${enteredSize}_\n\n` +
                      `📝 Please provide the full *𝖭𝖺𝗆𝖾* of the recipient:` 
            });
            break;

        case 'ENTER_NAME':
            if (text.length < 3) {
                await sock.sendMessage(to, { text: `❌ Please enter a real name for shipping manifests:` });
                return;
            }
            session.data.customerName = text.toUpperCase();
            session.stage = 'ENTER_LOCATION';
            await sock.sendMessage(to, { 
                text: `📍 *𝖱𝖤𝖢𝖨𝖯𝖨𝖤𝖭𝖳 𝖲𝖤𝖳:* _${session.data.customerName}_\n\n` +
                      `🚛 State your exact *𝖣𝖾𝗅𝗂𝗏𝖾𝗋𝗒 𝖫𝗈𝖼𝖺𝗍𝗂𝗈𝗇* (e.g., CBD, Westlands, Mombasa):` 
            });
            break;

        case 'ENTER_LOCATION':
            if (text.length < 3) {
                await sock.sendMessage(to, { text: `❌ Please detail a robust delivery address:` });
                return;
            }
            session.data.location = text.toUpperCase();
            
            let shippingCost = 300; 
            for (const [zone, rate] of Object.entries(DELIVERY_AREAS)) {
                if (text.includes(zone.toLowerCase())) {
                    shippingCost = rate;
                    break;
                }
            }
            session.data.shippingCost = shippingCost;
            session.data.totalBill = session.data.shoe.price + shippingCost;

            const clientInvoice = `🧾 ━━━━━━━━━━━━━━━━━ 🧾\n` +
                                  `⚡ *𝖯𝖱𝖤𝖬𝖨𝖴𝖬 𝖨𝖭𝖵𝖮𝖨𝖢𝖤 𝖬𝖠𝖭𝖨𝖥𝖤𝖲𝖳* ⚡\n` +
                                  `🧾 ━━━━━━━━━━━━━━━━━ 🧾\n\n` +
                                  `👟 *MODEL:* _${session.data.shoe.name}_\n` +
                                  `📏 *SIZE:* \`${session.data.size}\` \n` +
                                  `👤 *CLIENT:* _${session.data.customerName}_\n` +
                                  `📍 *HUB:* _${session.data.location}_\n` +
                                  `────────────────────\n` +
                                  `💰 Base Price : KSh ${session.data.shoe.price.toLocaleString()}\n` +
                                  `📦 Freight Fee : KSh ${session.data.shippingCost.toLocaleString()}\n` +
                                  `────────────────────\n` +
                                  `💵 *TOTAL DUE:* *KSh ${session.data.totalBill.toLocaleString()}*\n\n` +
                                  `🔥 To confirm order, reply *YES*.\n` +
                                  `❌ To abort, reply *CANCEL*.\n\n` +
                                  `▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️\n` +
                                  `⚡ *Powered by CymorTechServices*`;
            
            session.stage = 'CONFIRM_ORDER';
            await sock.sendMessage(to, { text: clientInvoice });
            break;

        case 'CONFIRM_ORDER':
            if (text === 'yes') {
                const finalData = session.data;
                const clientPhoneFormatted = to.split('@')[0];
                const ownerManifest = `🚨 ━━━━━━━━━━━━━━━━━ 🚨\n` +
                                      `⚡ *𝖡𝖮𝖳 𝖮𝖱𝖣𝖤𝖱 𝖱𝖮𝖴𝖳𝖨𝖭𝖦 𝖲𝖧𝖤𝖤𝖳* ⚡\n\n` +
                                      `👤 *CLIENT:* ${finalData.customerName}\n` +
                                      `📞 *CHATLINK:* wa.me/${clientPhoneFormatted}\n` +
                                      `👟 *PRODUCT:* ${finalData.shoe.name}\n` +
                                      `📏 *SIZE:* ${finalData.size}\n` +
                                      `📍 *SHIPPING:* ${finalData.location}\n` +
                                      `💰 *NET BILL:* *KSh ${finalData.totalBill.toLocaleString()}*\n\n` +
                                      `👉 Click the link above to lock payment.`;

                const cleanOwnerJid = `${OWNER_NUMBER.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
                await sock.sendMessage(cleanOwnerJid, { text: ownerManifest });

                await sock.sendMessage(to, { 
                    text: `🎉 *𝖮𝖱𝖣𝖤𝖱 𝖲𝖤𝖢𝖴𝖱𝖤𝖫𝖸 𝖫𝖮𝖢𝖪𝖤𝖣!* 🎉\n\n` +
                          `Our sales controller is opening your chat right now to finalize delivery details.\n\n` +
                          `Thank you for shopping with *${BOT_NAME}*! 🙌\n\n` +
                          `▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️▪️\n` +
                          `⚡ *Powered by CymorTechServices*` 
                });
                userSessions.delete(to);
            } else {
                await sock.sendMessage(to, { text: `✍️ Please type *YES* to submit or *CANCEL* to clear.` });
            }
            break;
    }
}

module.exports = { handleIncomingMessage };
