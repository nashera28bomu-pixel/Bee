const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, "public")));

/**
 * REALISTIC PING ENDPOINT
 */
app.get("/ping", (req, res) => {
    const start = Date.now();
    res.json({ ok: true, serverTime: start });
});

/**
 * MULTI STREAM DOWNLOAD ENDPOINT
 * stream=1..4 used for parallel testing
 */
app.get("/download", (req, res) => {

    const size = 10 * 1024 * 1024; // 10MB per stream (realistic)
    const chunkSize = 64 * 1024;

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": size,
        "Cache-Control": "no-store",
        "Connection": "keep-alive"
    });

    const chunk = Buffer.alloc(chunkSize, "A");

    let sent = 0;

    function send() {
        if (sent >= size) return res.end();

        res.write(chunk);
        sent += chunkSize;

        // REMOVE artificial speed bias (critical fix)
        setImmediate(send);
    }

    send();
});

/**
 * UPLOAD TEST
 */
app.post("/upload", express.raw({ limit: "50mb", type: "*/*" }), (req, res) => {
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Cymor Ultra Speed Test running on", PORT);
});
