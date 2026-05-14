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
   SETTINGS (FIXED)
====================== */

let STREAMS = 4;
let speedSamples = [];

/* ======================
   GAUGE
====================== */

function drawGauge(value) {

    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 15;
    ctx.stroke();

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
   SPEED ANIMATION
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
   NOTIFICATION
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
   FIXED DOWNLOAD TEST (NO FREEZE)
====================== */

async function realDownloadTest() {

    statusText.innerText = "Warming up connection...";

    await new Promise(r => setTimeout(r, 2000));

    statusText.innerText = "Testing Download...";

    speedSamples = [];

    const controllers = [];

    function runStream() {

        return new Promise(async (resolve) => {

            const controller = new AbortController();
            controllers.push(controller);

            let loaded = 0;
            const start = performance.now();

            try {

                const res = await fetch("/download?cache=" + Math.random(), {
                    signal: controller.signal
                });

                const reader = res.body.getReader();

                while (true) {

                    const { done, value } = await reader.read();
                    if (done) break;

                    loaded += value.length;

                    const duration = (performance.now() - start) / 1000;

                    const mbps = (loaded * 8) / duration / 1024 / 1024;

                    speedSamples.push(mbps);

                    updateSpeed(mbps);
                }

            } catch (e) {
                // stream stopped safely
            }

            resolve();
        });
    }

    // auto stop after 20 seconds (SAFE FIX)
    const timeout = setTimeout(() => {
        controllers.forEach(c => c.abort());
    }, 20000);

    await Promise.all(
        Array.from({ length: STREAMS }, runStream)
    );

    clearTimeout(timeout);

    if (speedSamples.length === 0) return 0;

    const avg =
        speedSamples.reduce((a, b) => a + b, 0) /
        speedSamples.length;

    return avg;
}

/* ======================
   UPLOAD TEST
====================== */

async function realUploadTest() {

    statusText.innerText = "Testing Upload...";

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
   FINISH TEST
====================== */

function finishTest(download, upload) {

    statusText.innerText = "✔ Test Complete - Results Ready";

    downloadText.innerText = download.toFixed(1) + " Mbps";
    uploadText.innerText = upload.toFixed(1) + " Mbps";

    updateSpeed(download);

    shareBtn.classList.remove("hidden");

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
