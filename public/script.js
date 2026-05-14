/**
 * Cymor Online Speed Test - Core Script
 * Powered by Cymor
 */

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
   SETTINGS & STATE
====================== */
// Reduced from 4 to 2 for stability on Render Free tier to prevent Brotli memory leaks
let STREAMS = 2; 
let speedSamples = [];

/* ======================
   CHART INITIALIZATION
====================== */
const speedChartCtx = document.getElementById('speedChart').getContext('2d');
let speedChart = new Chart(speedChartCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Live Speed (Mbps)',
            data: [],
            borderColor: '#00c3ff',
            backgroundColor: 'rgba(0, 195, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { display: false },
            y: { 
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#aaa' }
            }
        },
        plugins: { legend: { display: false } }
    }
});

/* ======================
   GAUGE DRAWING
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
   SPEED ANIMATION & GRAPH UPDATE
====================== */
function updateSpeed(target) {
    let current = parseFloat(mainSpeed.innerText) || 0;

    function step() {
        current += (target - current) * 0.12;
        mainSpeed.innerText = current.toFixed(1);
        drawGauge(Math.min(current, 100));

        // PUSH TO GRAPH
        if (speedChart.data.labels.length > 50) {
            speedChart.data.labels.shift();
            speedChart.data.datasets[0].data.shift();
        }
        speedChart.data.labels.push("");
        speedChart.data.datasets[0].data.push(current);
        speedChart.update('none'); 

        if (Math.abs(target - current) > 0.2) {
            requestAnimationFrame(step);
        }
    }
    step();
}

/* ======================
   UTILITIES
====================== */
async function notifyDone(download, upload) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
        new Notification("⚡ Cymor Test Complete", {
            body: `Download: ${download.toFixed(1)} Mbps | Upload: ${upload.toFixed(1)} Mbps`
        });
    }
}

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
   TEST MODULES
====================== */
async function runPingTest() {
    statusText.innerText = "Testing Ping...";
    const samples = [];
    for (let i = 0; i < 5; i++) {
        const start = performance.now();
        try {
            await fetch("/ping", { cache: 'no-store' });
            const end = performance.now();
            samples.push(end - start);
        } catch (e) {
            samples.push(0);
        }
    }
    const avg = samples.reduce((a, b) => a + b) / samples.length;
    pingText.innerText = avg.toFixed(0) + " ms";
}

async function realDownloadTest() {
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
            } catch (e) {}
            resolve();
        });
    }

    const timeout = setTimeout(() => controllers.forEach(c => c.abort()), 10000);
    await Promise.all(Array.from({ length: STREAMS }, runStream));
    clearTimeout(timeout);

    if (speedSamples.length === 0) return 0;
    const stableSamples = speedSamples.slice(Math.floor(speedSamples.length * 0.5));
    return stableSamples.reduce((a, b) => a + b, 0) / stableSamples.length;
}

async function realUploadTest() {
    statusText.innerText = "Testing Upload...";
    const chunkSize = 1024 * 1024 * 1.5; 
    const data = new Uint8Array(chunkSize);
    crypto.getRandomValues(data);

    let uploadSamples = [];
    const testDuration = 8000; 
    const endTime = performance.now() + testDuration;

    while (performance.now() < endTime) {
        const start = performance.now();
        try {
            await fetch("/upload", {
                method: "POST",
                body: data,
                cache: 'no-store'
            });
            const end = performance.now();
            const duration = (end - start) / 1000;
            const mbps = (chunkSize * 8) / duration / 1024 / 1024;
            
            if (mbps < 5000) { 
                uploadSamples.push(mbps);
                updateSpeed(mbps);
            }
        } catch (e) {
            console.error("Upload chunk failed");
            break; 
        }
    }

    if (uploadSamples.length === 0) return 0;
    return uploadSamples.reduce((a, b) => a + b) / uploadSamples.length;
}

/* ======================
   FLOW CONTROL
====================== */
function finishTest(download, upload) {
    statusText.innerText = "✔ Test Complete";
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
    try {
        startBtn.disabled = true;
        hero.classList.add("hidden");
        testScreen.classList.remove("hidden");

        // Reset Chart for new test
        speedChart.data.labels = [];
        speedChart.data.datasets[0].data = [];
        speedChart.update();

        await detectISP();
        await runPingTest();

        // 1. Download Phase
        const download = await realDownloadTest();
        
        // 2. Cooldown Phase
        // IMPORTANT: Increase delay to 1.5s to let the server clear Brotli streams
        updateSpeed(0); 
        await new Promise(r => setTimeout(r, 1500));

        // 3. Upload Phase
        const upload = await realUploadTest();

        finishTest(download, upload);
    } catch (err) {
        statusText.innerText = "❌ Error: Could not complete test.";
        console.error(err);
    } finally {
        startBtn.disabled = false;
    }
});

/* ======================
   SHARE LOGIC
====================== */
shareBtn.addEventListener("click", () => {
    const card = document.getElementById("resultCard");
    shareBtn.classList.add("hidden");
    
    html2canvas(card, { backgroundColor: "#0b0e14", scale: 2 }).then(canvas => {
        const link = document.createElement("a");
        link.download = "Cymor-Speedtest.png";
        link.href = canvas.toDataURL();
        link.click();
        shareBtn.classList.remove("hidden");
    });
});
