/**
 * ============================================================
 * 🚀 CYMOR BUSINESS ENGINE — MASTER CONFIGURATION HUB
 * ============================================================
 * Project:
 * Enterprise WhatsApp Commerce Automation SaaS
 *
 * Architecture:
 * Modular scalable commerce configuration layer
 *
 * Maintainer:
 * CymorTechServices
 * ============================================================
 */

// ============================================================
// SYSTEM CORE
// ============================================================

const SYSTEM_CONFIG = {

    // Bot Identity
    BOT_NAME: 'Cymor Shoe Store',

    SYSTEM_SIGNATURE: 'Powered by CymorTechServices',

    VERSION: '2.0.0',

    ENVIRONMENT: 'production',

    // Session settings
    SESSION_TIMEOUT: 1000 * 60 * 15, // 15 minutes

    // Default shipping if area not found
    DEFAULT_DELIVERY_FEE: 300,

    // Currency
    CURRENCY: 'KSh',

    // Business owner routing number
    OWNER_NUMBER: '254113821327'
};

// ============================================================
// STORE INFORMATION
// ============================================================

const STORE_INFO = {

    storeName: 'Cymor Luxury Hub',

    slogan: 'Premium Streetwear & Sneaker Marketplace',

    location:
        '4th Floor, Elegant Plaza, Kimathi Street, Nairobi CBD',

    businessHours: {
        mondayToSaturday: '8:00 AM - 8:00 PM',
        sunday: '11:00 AM - 4:00 PM'
    },

    supportContact: '+254113821327',

    instagram: '@cymorshoes',

    deliveryPartners: [
        'Wells Fargo',
        'G4S',
        'Easy Coach Courier'
    ]
};

// ============================================================
// PAYMENT SETTINGS
// ============================================================

const PAYMENT_CONFIG = {

    mpesa: {
        enabled: true,
        tillNumber: '5544332',
        businessName: 'Cymor Shoe Store'
    },

    cashOnDelivery: {
        enabled: true,
        supportedAreas: [
            'nairobi cbd',
            'westlands',
            'kilimani'
        ]
    },

    refundPolicy:
        'Returns accepted within 48 hours for size exchange only. Product must remain in original condition with complete packaging.'
};

// ============================================================
// DELIVERY MATRIX
// ============================================================

const DELIVERY_AREAS = {

    'nairobi cbd': {
        fee: 0,
        eta: '1 - 2 Hours'
    },

    'westlands': {
        fee: 200,
        eta: '2 - 3 Hours'
    },

    'kilimani': {
        fee: 200,
        eta: '2 - 3 Hours'
    },

    'ngong road': {
        fee: 250,
        eta: '2 - 4 Hours'
    },

    'thika road': {
        fee: 300,
        eta: '3 - 5 Hours'
    },

    'kasarani': {
        fee: 300,
        eta: '3 - 5 Hours'
    },

    'mombasa': {
        fee: 450,
        eta: '24 Hours'
    },

    'kisumu': {
        fee: 450,
        eta: '24 Hours'
    },

    'nakuru': {
        fee: 400,
        eta: '24 Hours'
    },

    'eldoret': {
        fee: 400,
        eta: '24 Hours'
    }
};

// ============================================================
// PRODUCT INVENTORY
// ============================================================

const SHOE_CATALOG = [

    {
        id: 'CS01',

        brand: 'Nike',

        category: 'Sneakers',

        name: "Air Jordan 1 Retro High OG 'Chicago Lost & Found'",

        price: 14500,

        currency: 'KSh',

        sizes: [40, 41, 42, 43, 44, 45],

        color: 'Varsity Red / White / Black',

        instock: true,

        featured: true,

        tags: [
            'jordan',
            'retro',
            'streetwear',
            'premium'
        ],

        description:
            'Vintage-inspired Air Jordan 1 featuring premium cracked leather and iconic Chicago color blocking.',

        image:
            'https://i.imgur.com/0Z8FQYw.png'
    },

    {
        id: 'CS02',

        brand: 'Nike',

        category: 'Sneakers',

        name: "Nike Air Max 95 OG 'Neon' Vintage",

        price: 11000,

        currency: 'KSh',

        sizes: [39, 40, 41, 42, 43, 44],

        color: 'Neon Volt / Grey',

        instock: true,

        featured: false,

        tags: [
            'airmax',
            'retro',
            'nike'
        ],

        description:
            'Classic layered suede Air Max silhouette with neon volt highlights and visible air cushioning.',

        image:
            'https://i.imgur.com/YOURIMAGE.png'
    },

    {
        id: 'CS03',

        brand: 'Adidas',

        category: 'Sneakers',

        name: "Adidas Yeezy Boost 350 V2 'Onyx'",

        price: 12500,

        currency: 'KSh',

        sizes: [40, 41, 42, 43, 44, 45],

        color: 'Onyx Black',

        instock: true,

        featured: true,

        tags: [
            'yeezy',
            'boost',
            'luxury'
        ],

        description:
            'Primeknit Yeezy silhouette with responsive BOOST cushioning and stealth monochrome styling.',

        image:
            'https://i.imgur.com/YOURIMAGE.png'
    },

    {
        id: 'CS04',

        brand: 'New Balance',

        category: 'Sneakers',

        name: "New Balance 2002R 'Protection Pack - Rain Cloud'",

        price: 13000,

        currency: 'KSh',

        sizes: [41, 42, 43, 44],

        color: 'Rain Cloud Grey',

        instock: true,

        featured: false,

        tags: [
            'newbalance',
            '2002r',
            'fashion'
        ],

        description:
            'Deconstructed premium sneaker featuring rough-cut overlays and ABZORB cushioning.',

        image:
            'https://i.imgur.com/YOURIMAGE.png'
    },

    {
        id: 'CS05',

        brand: 'Jordan',

        category: 'Sneakers',

        name: "Travis Scott x Air Jordan 1 Low 'Reverse Mocha'",

        price: 16500,

        currency: 'KSh',

        sizes: [42, 43, 44],

        color: 'Mocha / Sail',

        instock: false,

        featured: true,

        tags: [
            'travis',
            'collector',
            'exclusive'
        ],

        description:
            'Highly sought-after Travis Scott collaboration featuring reverse swoosh branding.',

        image:
            'https://i.imgur.com/YOURIMAGE.png'
    }
];

// ============================================================
// FAQ RESPONSES
// ============================================================

const FAQ_DATA = {

    welcome:
        'Welcome to Cymor Shoe Store — Kenya’s elite sneaker destination.',

    authenticity:
        'All sneakers are quality-verified and shipped securely.',

    delivery:
        'Countrywide delivery available via trusted courier partners.',

    payment:
        'We support M-Pesa and Cash on Delivery for selected Nairobi zones.',

    support:
        'Our support team responds daily during business hours.'
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    // System
    ...SYSTEM_CONFIG,

    // Store
    STORE_INFO,

    // Payment
    PAYMENT_CONFIG,

    // Inventory
    SHOE_CATALOG,

    // Logistics
    DELIVERY_AREAS,

    // FAQ
    FAQ_DATA
};
