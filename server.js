const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

app.use(compression());

app.use(express.static(path.join(__dirname, "public")));

app.get("/ping", (req, res) => {
    res.send("pong");
});

app.get("/download", (req, res) => {

    const size = 25 * 1024 * 1024;

    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": size,
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    });

    const chunk = Buffer.alloc(1024 * 256, "X");

    let sent = 0;

    const interval = setInterval(() => {

        if(sent >= size){

            clearInterval(interval);

            return res.end();

        }

        res.write(chunk);

        sent += chunk.length;

    }, 1);

});

app.post("/upload",
express.raw({
    limit:"50mb",
    type:"*/*"
}),
(req,res)=>{

    res.json({
        success:true
    });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Cymor Speed Test running on ${PORT}`);
});
