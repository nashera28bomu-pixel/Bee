const startBtn = document.getElementById("startBtn");
const hero = document.getElementById("hero");
const testScreen = document.getElementById("testScreen");

const mainSpeed = document.getElementById("mainSpeed");
const statusText = document.getElementById("status");

const downloadText = document.getElementById("download");
const uploadText = document.getElementById("upload");
const pingText = document.getElementById("ping");

const provider = document.getElementById("provider");
const providerName = document.getElementById("providerName");

const shareBtn = document.getElementById("shareBtn");

const ctx = document.getElementById("gauge").getContext("2d");

/* ======================
   SPEED TEST SETTINGS
====================== */

let TEST_DURATION = 90000; // 90 seconds (Ookla-like duration)
let STREAMS = 4;
let speedSamples = [];

/* ======================
   SPEED GAUGE
====================== */

function drawGauge(value) {

    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 15;
    ctx.stroke();

    // progress arc
    const endAngle = (value / 100) * (Math.PI * 2);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle - Math.PI / 2);

    ctx.strokeStyle =
        value < 30 ? "#ff3b3b" :
        value < 70 ? "#ffcc00" :
        "#00c3ff";

    ctx.lineWidth = 15;
    ctx.stroke();
}

/* ======================
   SMOOTH SPEED ANIMATION
====================== */

function updateSpeed(target) {

    let current = parseFloat(mainSpeed.innerText) || 0;

    function step() {
        current += (target - current) * 0.12;

        mainSpeed.innerText = current.toFixed(1);

        drawGauge(Math.min(current, 100));

        if (Math.abs(target - current) > 0.2) {
            requestAnimationFrame(step);
        }
    }

    step();
}

/* ======================
   NOTIFICATION (FIXED)
====================== */

async function notifyDone(download, upload) {

    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
        new Notification("⚡ Cymor Online Speed Test Complete", {
            body: `Download: ${download.toFixed(1)} Mbps | Upload: ${upload.toFixed(1)} Mbps`
        });
    }
}

/* ======================
   ISP DETECTION
====================== */

async function detectISP() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        const isp = data.org || "Unknown ISP";

        provider.innerText = isp;
        providerName.innerText = isp;

    } catch {
        provider.innerText = "Unknown ISP";
        providerName.innerText = "Unknown";
    }
}

/* ======================
   PING TEST
====================== */

async function runPingTest() {

    statusText.innerText = "Testing Ping...";

    const samples = [];

    for (let i = 0; i < 5; i++) {

        const start = performance.now();
        await fetch("/ping");
        const end = performance.now();

        samples.push(end - start);
    }

    const avg = samples.reduce((a, b) => a + b) / samples.length;

    pingText.innerText = avg.toFixed(0) + " ms";
}

/* ======================
   REAL DOWNLOAD TEST (OOKLA STYLE)
====================== */

async function realDownloadTest() {

    statusText.innerText = "Warming up connection...";

    await new Promise(r => setTimeout(r, 3000));

    statusText.innerText = "Testing Download (Stable Mode)...";

    const startTime = Date.now();
    speedSamples = [];

    async function runStream() {

        let loaded = 0;
        const start = performance.now();

        const res = await fetch("/download?cache=" + Math.random());
        const reader = res.body.getReader();

        while (Date.now() - startTime < TEST_DURATION) {

            const { done, value } = await reader.read();
            if (done) break;

            loaded += value.length;

            const duration = (performance.now() - start) / 1000;

            const mbps = (loaded * 8) / duration / 1024 / 1024;

            speedSamples.push(mbps);

            updateSpeed(mbps);
        }
    }

    await Promise.all(
        Array.from({ length: STREAMS }, runStream)
    );

    const avg =
        speedSamples.reduce((a, b) => a + b, 0) /
        speedSamples.length;

    return avg;
}

/* ======================
   UPLOAD TEST
====================== */

async function realUploadTest() {

    statusText.innerText = "Testing Upload Stability...";

    await new Promise(r => setTimeout(r, 2000));

    const size = 8 * 1024 * 1024;
    const data = new Uint8Array(size);
    crypto.getRandomValues(data);

    const start = performance.now();

    await fetch("/upload", {
        method: "POST",
        body: data
    });

    const end = performance.now();

    const duration = (end - start) / 1000;

    return (size * 8) / duration / 1024 / 1024;
}

/* ======================
   FINISH TEST (FINAL UX)
====================== */

function finishTest(download, upload) {

    const ping = parseFloat(pingText.innerText);

    statusText.innerText = "✔ Test Complete - Results Ready";

    downloadText.innerText = download.toFixed(1) + " Mbps";
    uploadText.innerText = upload.toFixed(1) + " Mbps";

    updateSpeed(download);

    // show share button ONLY now
    shareBtn.classList.remove("hidden");

    // notification
    notifyDone(download, upload);
}

/* ======================
   START TEST FLOW
====================== */

startBtn.addEventListener("click", async () => {

    hero.classList.add("hidden");
    testScreen.classList.remove("hidden");

    speedSamples = [];

    await detectISP();

    statusText.innerText = "Initializing test...";

    await runPingTest();

    statusText.innerText = "Preparing high-precision test...";

    const download = await realDownloadTest();

    statusText.innerText = "Switching to upload test...";

    const upload = await realUploadTest();

    finishTest(download, upload);
});
