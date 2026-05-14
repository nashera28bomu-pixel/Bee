const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");

const app = express();

/* CORS */
app.use(cors());

/* Compression - skip for test routes */
app.use(
    compression({
        filter: (req, res) => {
            if (req.url.startsWith("/download") || req.url.startsWith("/upload")) {
                return false;
            }
            return compression.filter(req, res);
        }
    })
);

/* Static files */
app.use(express.static(path.join(__dirname, "public")));

/* Ping */
app.get("/ping", (req, res) => {
    res.set({
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
    });
    res.send("pong");
});

/* Download - shorter duration, more stable streaming */
app.get("/download", (req, res) => {
    const chunkSize = 64 * 1024; // 64KB
    const duration = 8000;       // 8 seconds
    const endTime = Date.now() + duration;

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Content-Encoding": "identity",
        "Access-Control-Allow-Origin": "*",
        "Connection": "keep-alive"
    });

    const chunk = Buffer.alloc(chunkSize);
    let closed = false;

    req.on("close", () => {
        closed = true;
        try { res.end(); } catch {}
    });

    async function stream() {
        while (!closed && Date.now() < endTime) {
            const ok = res.write(chunk);
            if (!ok) {
                await new Promise(resolve => res.once("drain", resolve));
            }
            // Small delay to prevent overwhelming free tier CPU
            await new Promise(r => setTimeout(r, 5));
        }
        if (!closed) res.end();
    }

    stream();
});

/* Upload - accept up to 10MB */
app.post(
    "/upload",
    express.raw({
        type: "*/*",
        limit: "10mb"
    }),
    (req, res) => {
        res.set({
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
        });
        res.json({ success: true });
    }
);

/* Start server */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Cymor Speed Test running on port ${PORT}`);
});
