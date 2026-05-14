const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());

app.use(compression({
    filter: (req, res) => {
        if (
            req.url.startsWith("/download") ||
            req.url.startsWith("/upload")
        ) {
            return false;
        }

        return compression.filter(req, res);
    }
}));

app.use(express.static(path.join(__dirname, "public")));

/* ======================
   PING
====================== */

app.get("/ping", (req, res) => {

    res.set({
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
    });

    res.send("pong");
});

/* ======================
   DOWNLOAD TEST
====================== */

app.get("/download", (req, res) => {

    const totalSize = 100 * 1024 * 1024;
    const chunkSize = 256 * 1024;

    const chunk = Buffer.alloc(chunkSize, "A");

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": totalSize,
        "Cache-Control": "no-store",
        "Content-Encoding": "identity",
        "Access-Control-Allow-Origin": "*"
    });

    let sent = 0;

    function sendChunk() {

        while (sent < totalSize) {

            const remaining = totalSize - sent;

            const size =
                remaining >= chunkSize
                ? chunkSize
                : remaining;

            const canContinue =
                res.write(chunk.slice(0, size));

            sent += size;

            if (!canContinue) {
                res.once("drain", sendChunk);
                return;
            }
        }

        res.end();
    }

    sendChunk();
});

/* ======================
   UPLOAD TEST
====================== */

app.post(
    "/upload",
    express.raw({
        limit: "20mb",
        type: "*/*"
    }),
    (req, res) => {

        res.set({
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
        });

        res.json({
            success: true
        });
    }
);

/* ======================
   START SERVER
====================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Cymor Speed Test running on ${PORT}`
    );
});
