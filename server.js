const express = require("express");
const compression = require("compression");
const path = require("path");

const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, "public")));

app.get("/ping", (req, res) => {
  res.send("pong");
});

// Download test route
app.get("/download", (req, res) => {
  const size = 20 * 1024 * 1024; // 20MB

  const buffer = Buffer.alloc(size, "C");

  res.set({
    "Content-Type": "application/octet-stream",
    "Content-Length": size,
    "Cache-Control": "no-cache"
  });

  res.send(buffer);
});

// Upload test route
app.post("/upload", express.raw({ limit: "50mb", type: "*/*" }), (req, res) => {
  res.json({
    success: true,
    received: req.body.length
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Cymor Speed Test running on port ${PORT}`);
});
