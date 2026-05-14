/**
 * Cymor Ultra Speed Test Engine - Backend
 * Powered by Cymor
 */

const express = require("express");
const compression = require("compression");
const path = require("path");
const EventEmitter = require('events');

// 1. FIX: Increase listener limit globally to handle multiple concurrent test streams.
// This prevents the 'MaxListenersExceededWarning' for Brotli/Gzip.
EventEmitter.defaultMaxListeners = 50; 

const app = express();

/**
 * 2. OPTIMIZED COMPRESSION
 * We only compress static assets (HTML/CSS/JS). 
 * Speed test endpoints MUST be raw to measure actual network performance.
 */
const shouldCompress = (req, res) => {
    // Disable compression for download and upload paths
    if (req.url === "/download" || req.url === "/upload") {
        return false;
    }
    // Fallback to standard compression filter
    return compression.filter(req, res);
};

app.use(compression({ filter: shouldCompress }));
app.use(express.static(path.join(__dirname, "public")));

/**
 * 3. PING ENDPOINT
 * Minimal overhead to measure pure latency.
 */
app.get("/ping", (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.status(200).send("ok");
});

/**
 * 4. DOWNLOAD ENDPOINT
 * Optimized for high-speed streaming with drain-awareness.
 */
app.get("/download", (req, res) => {
    const totalSize = 50 * 1024 * 1024; // 50MB
    const chunkSize = 64 * 1024; // 64KB chunks
    const chunk = Buffer.alloc(chunkSize, "A");

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": totalSize,
        "Cache-Control": "no-store",
        "Content-Disposition": "attachment; filename=test.bin",
        // Force no-compression header just in case
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
        // If the buffer is full, wait for the 'drain' event to continue
        if (sent < totalSize) {
            res.once('drain', write);
        }
    }

    write();
});

/**
 * 5. UPLOAD ENDPOINT
 * Consumes the stream without memory bloat.
 */
app.post("/upload", (req, res) => {
    // Simply consume the data stream to allow the client to upload at max speed
    req.on("data", () => {
        // Data is intentionally ignored to prevent RAM usage
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
🚀 Cymor Ultra Speed Test Engine Active
---------------------------------------
URL: http://localhost:${PORT}
Mode: High-Precision Performance
Max Listeners: ${EventEmitter.defaultMaxListeners}
    `);
});
