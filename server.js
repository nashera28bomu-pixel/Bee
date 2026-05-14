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

            return compression.filter(
                req,
                res
            );
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

        "Cache-Control":
        "no-store",

        "Access-Control-Allow-Origin":
        "*"
    });

    res.send("pong");
});

/* =========================================
   DOWNLOAD TEST ROUTE
========================================= */

app.get("/download", (req, res) => {

    // 1GB virtual stream
    const totalSize =
    1024 * 1024 * 1024;

    // 256KB chunks
    const chunkSize =
    256 * 1024;

    const chunk =
    Buffer.alloc(chunkSize, "A");

    res.writeHead(200, {

        "Content-Type":
        "application/octet-stream",

        "Cache-Control":
        "no-store, no-cache, must-revalidate",

        "Pragma":
        "no-cache",

        "Expires":
        "0",

        "Content-Encoding":
        "identity",

        "Access-Control-Allow-Origin":
        "*",

        "Connection":
        "keep-alive"
    });

    let sent = 0;
    let closed = false;

    req.on("close", () => {

        closed = true;

        try{
            res.end();
        } catch {}
    });

    function sendChunk(){

        if(closed) return;

        while(sent < totalSize){

            const ok =
            res.write(chunk);

            sent += chunk.length;

            if(!ok){

                res.once(
                    "drain",
                    sendChunk
                );

                return;
            }
        }

        if(!closed){

            res.end();
        }
    }

    sendChunk();
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

        "Cache-Control":
        "no-store",

        "Access-Control-Allow-Origin":
        "*"
    });

    res.json({
        success: true
    });
});

/* =========================================
   START SERVER
========================================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Cymor Speed Test running on port ${PORT}`
    );
});
