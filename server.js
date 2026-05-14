const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

// Disable compression for speed test endpoints to get raw network performance
// We only want compression on the static frontend files
app.use((req, res, next) => {
    if (req.url === "/download" || req.url === "/upload") {
        return next();
    }
    compression()(req, res, next);
});

app.use(express.static(path.join(__dirname, "public")));

/**
 * 1. PING ENDPOINT
 * Minimal overhead to measure pure latency.
 */
app.get("/ping", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.status(200).send("ok");
});

/**
 * 2. DOWNLOAD ENDPOINT
 * Optimized for high-speed streaming without artificial delays.
 */
app.get("/download", (req, res) => {
    // Increase size to 50MB to ensure high-speed connections don't finish too early
    const totalSize = 50 * 1024 * 1024; 
    const chunkSize = 64 * 1024; // 64KB chunks are efficient for Node.js
    const chunk = Buffer.alloc(chunkSize, "A");

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": totalSize,
        "Cache-Control": "no-store",
        "Content-Disposition": "attachment; filename=test.bin"
    });

    let sent = 0;
    
    // Use a drain-aware stream to prevent memory bloat on the server
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
 * 3. UPLOAD ENDPOINT
 * Efficiently consumes the stream without storing it in memory.
 * This is crucial for preventing "Out of Memory" errors on large tests.
 */
app.post("/upload", (req, res) => {
    // We don't use express.raw() here because it loads the whole thing into RAM.
    // Instead, we just pipe the incoming data to "null" (nowhere).
    req.on("data", (chunk) => {
        // Just consuming the data to keep the socket open and moving
    });

    req.on("end", () => {
        res.set("Cache-Control", "no-store");
        res.json({ success: true });
    });

    req.on("error", (err) => {
        console.error("Upload error:", err);
        res.status(500).send("Upload failed");
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
🚀 Cymor Ultra Speed Test Engine Active
---------------------------------------
URL: http://localhost:${PORT}
Mode: High-Precision Performance
    `);
});
