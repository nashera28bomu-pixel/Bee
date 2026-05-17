/**
 * ============================================================================
 *               🪐 CYMOR TECH SERVICES — PREMIUM ENGINE CORE 🪐
 * ============================================================================
 * Project: WhatsApp Micro-SaaS Business Automation Engine
 * Module: Configuration Hub & Product Schema Matrix
 * Target Client: CYMOR SHOE STORE (Premium Streetwear Realignment)
 * Architecture: Production-grade Modular JSON Data Clusters
 * 
 * NOTICE: All pricing parameters are formatted precisely for localized Kenyan 
 * logistics gateways (M-Pesa / Cash on Delivery frameworks).
 * ============================================================================
 */

module.exports = {
    // --- BRAND CORE IDENTITIES ---
    BOT_NAME: "Cymor Shoe Store",
    SYSTEM_SIGNATURE: "Powered by Cymor",
    
    // --- ROUTING TELEMETRY DIRECTIVES ---
    // The designated administrative phone number where all completed order invoices are instantly routed.
    // Format: Include your country code without the '+' symbol (e.g., 2547XXXXXXXX)
    OWNER_NUMBER: "254113821327", 

    // --- EXQUISITE HIGH-END PRODUCT INVENTORY MATRIX ---
    // Curated high-demand streetwear catalog with dynamic sizing arrays and availability tags
    SHOE_CATALOG: [
        {
            id: "CS01",
            name: "Air Jordan 1 Retro High OG 'Chicago Lost & Found'",
            price: 14500,
            sizes: [40, 41, 42, 43, 44, 45],
            instock: true,
            description: "The timeless holy grail of sneaker culture. Features vintage accents, premium cracked leather detailing, and the iconic varsity red colorblocking."
        },
        {
            id: "CS02",
            name: "Nike Air Max 95 OG 'Neon' Vintage",
            price: 11000,
            sizes: [39, 40, 41, 42, 43, 44],
            instock: true,
            description: "An absolute retro masterpiece. Layered suede construction blending gunsmoke shades highlighted by striking neon volt eyelets and visible pressurized air units."
        },
        {
            id: "CS03",
            name: "Adidas Yeezy Boost 350 V2 'Onyx'",
            price: 12500,
            sizes: [40, 41, 42, 43, 44, 45],
            instock: true,
            description: "Monolithic stealth aesthetic. Engineered Primeknit upper paired with full-length innovative BOOST responsive cushioning technology for maximum street luxury."
        },
        {
            id: "CS04",
            name: "New Balance 2002R 'Protection Pack - Rain Cloud'",
            price: 13000,
            sizes: [41, 42, 43, 44],
            instock: true,
            description: "Deconstructed raw elegance. Rough-cut wearable art panels layered over breathable mesh grids featuring signature ABZORB premium shock absorption."
        },
        {
            id: "CS05",
            name: "Travis Scott x Air Jordan 1 Low 'Reverse Mocha'",
            price: 16500,
            sizes: [42, 43, 44],
            instock: false, // Automatically filtered by the bot's check engine
            description: "Ultra-premium collector's Holy Grail. Earthy mocha tones offset by crisp sail overlays and the revolutionary signature backwards oversized leather Swoosh."
        }
    ],

    // --- LOGISTICS COST DEFINITIONS ---
    // Automated regional delivery mapping matrix for instantaneous freight calculation
    DELIVERY_AREAS: {
        "nairobi cbd": 0,         // Free central hub delivery matching strategy
        "westlands": 200,
        "kilimani": 200,
        "ngong road": 250,
        "thika road": 300,
        "kasarani": 300,
        "mombasa": 450,           // Dispatched via dedicated long-distance logistics bus links
        "kisumu": 450,
        "nakuru": 400,
        "eldoret": 400
    },

    // --- OPERATIONAL FAQs & SECURE PAYMENT GATEWAYS ---
    FAQ_DATA: {
        // Physical footprint for trust conversion
        location: "Cymor Luxury Hub, 4th Floor, Elegant Plaza, Kimathi Street, Nairobi CBD",
        
        // Secure customer transaction endpoint parameters
        tillNumber: "5544332", // Mock business Till for live visual demonstration
        
        // Safety protocol notice
        refundPolicy: "Returns accepted within 48 hours strictly for size exchanges, provided sneakers remain pristine in original condition and box packaging."
    }
};
