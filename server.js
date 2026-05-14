/**
 * Cymor Ultra Speed Test Engine - Backend (Nuclear Stability Version)
 * Powered by Cymor
 */

const express = require("express");
const compression = require("compression");
const path = require("path");
const EventEmitter = require('events');

// Increase limit to 100 to provide a massive overhead buffer for concurrent streams
EventEmitter.defaultMaxListeners = 100; 

const app = express();

/**
 * 1. ANTI-COMPRESSION MIDDLEWARE
 * This interceptor strips 'accept-encoding' headers for test routes.
 * This effectively kills Brotli/Gzip listeners before they can be created.
 */
app.use((req, res, next) => {
    if (req.url.startsWith("/download") || req.url.startsWith("/upload")) {
        req.headers['accept-encoding'] = 'identity'; // Force raw network data
    }
    next();
});

/**
 * 2. STATIC FILE COMPRESSION
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
 * 3. PING ENDPOINT
 */
app.get("/ping", (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(200).send("ok");
});

/**
 * 4. DOWNLOAD ENDPOINT
 * High-speed binary streaming with strict identity encoding.
 */
app.get("/download", (req, res) => {
    const totalSize = 50 * 1024 * 1024; // 50MB
    const chunkSize = 64 * 1024;
    const chunk = Buffer.alloc(chunkSize, "A");

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": totalSize,
        "Cache-Control": "no-store",
        "Content-Encoding": "identity" 
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
 * 5. UPLOAD ENDPOINT
 */
app.post("/upload", (req, res) => {
    req.on("data", () => {
        // Data consumed but not stored to protect server RAM
    });

    req.on("end", () => {
        res.set("Cache-Control", "no-store");
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
🚀 Cymor Engine: Nuclear Stability Active
---------------------------------------
Compression: Restricted on Test Routes
Max Listeners: ${EventEmitter.defaultMaxListeners}
    `);
});
