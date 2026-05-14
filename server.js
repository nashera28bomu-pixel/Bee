const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");

const app = express();

/* =========================================
   CORS
========================================= */

app.use(cors());

/* =========================================
   COMPRESSION
   Disable compression for speed routes
========================================= */

app.use(
    compression({
        filter: (req, res) => {

            if (
                req.url.startsWith("/download") ||
                req.url.startsWith("/upload")
            ) {
                return false;
            }

            return compression.filter(req, res);
        }
    })
);

/* =========================================
   STATIC FILES
========================================= */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

/* =========================================
   PING ROUTE
========================================= */

app.get("/ping", (req, res) => {

    res.set({

        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
    });

    res.send("pong");
});

/* =========================================
   STABLE DOWNLOAD TEST ROUTE
========================================= */

app.get("/download", async (req, res) => {

    const chunkSize = 64 * 1024; // 64KB
    const duration = 12000; // 12 seconds
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

        try {
            res.end();
        } catch {}
    });

    async function stream() {

        while (
            !closed &&
            Date.now() < endTime
        ) {

            const ok = res.write(chunk);

            if (!ok) {

                await new Promise(resolve =>
                    res.once("drain", resolve)
                );
            }
        }

        if (!closed) {
            res.end();
        }
    }

    stream();
});

/* =========================================
   UPLOAD TEST ROUTE
========================================= */

app.post(
    "/upload",
    express.raw({
        type: "*/*",
        limit: "50mb"
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

/* =========================================
   START SERVER
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Cymor Speed Test running on port ${PORT}`
    );
});
