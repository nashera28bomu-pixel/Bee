/** 
 * Cymor Ultra Speed Test Engine - Backend 
 * Compatibility Patch v2 + Nuclear Stability
 * Powered by Cymor
 */
const express = require("express");
const compression = require("compression");
const cors = require("cors"); 
const path = require("path");
const EventEmitter = require('events');

// Provide a massive overhead buffer for concurrent streams
EventEmitter.defaultMaxListeners = 100; 

const app = express();

/**
 * 1. CORS & PRE-FLIGHT
 * Ensures the browser doesn't block the high-volume binary stream.
 */
app.use(cors());

/**
 * 2. ANTI-COMPRESSION MIDDLEWARE
 * Intercepts and strips 'accept-encoding' headers for test routes.
 * This prevents Brotli/Gzip listeners from leaking on the server.
 */
app.use((req, res, next) => {
    if (req.url.startsWith("/download") || req.url.startsWith("/upload")) {
        req.headers['accept-encoding'] = 'identity'; // Force raw network data
    }
    next();
});

/**
 * 3. STATIC FILE COMPRESSION
 * Standard compression is only applied to frontend assets (HTML/CSS/JS).
 */
app.use(compression({
    filter: (req, res) => {
        if (req.url.startsWith("/download") || req.url.startsWith("/upload")) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use(express.static(path.join(__dirname, "public")));

/**
 * 4. PING ENDPOINT
 */
app.get("/ping", (req, res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*"
    });
    res.status(200).send("ok");
});

/**
 * 5. DOWNLOAD ENDPOINT
 * High-speed binary streaming with strict identity encoding and 'nosniff' 
 * to prevent browser buffering/guessing.
 */
app.get("/download", (req, res) => {
    const totalSize = 50 * 1024 * 1024; // 50MB
    const chunkSize = 64 * 1024;
    const chunk = Buffer.alloc(chunkSize, "A");

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": totalSize,
        "Cache-Control": "no-store",
        "Content-Encoding": "identity",
        "X-Content-Type-Options": "nosniff", 
        "Access-Control-Allow-Origin": "*"
    });

    let sent = 0;
    function write() {
        let ok = true;
        while (sent < totalSize && ok) {
            sent += chunkSize;
            if (sent >= totalSize) {
                res.end(chunk);
            } else {
                ok = res.write(chunk);
            }
        }
        if (sent < totalSize) {
            res.once('drain', write);
        }
    }
    write();
});

/**
 * 6. UPLOAD ENDPOINT
 */
app.post("/upload", (req, res) => {
    req.on("data", () => {
        // Data consumed but not stored to protect server RAM
    });

    req.on("end", () => {
        res.set({
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
        });
        res.status(200).json({ success: true });
    });

    req.on("error", (err) => {
        console.error("Upload stream error:", err);
        if (!res.headersSent) {
            res.status(500).send("Upload failed");
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
🚀 Cymor Engine: Nuclear Compatibility Active
---------------------------------------
URL: http://localhost:${PORT}
Compression: Restricted on Test Routes
Max Listeners: ${EventEmitter.defaultMaxListeners}
    `);
});
