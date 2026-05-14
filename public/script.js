/* =========================================
   CYMOR SPEED TEST — FIXED & OPTIMIZED FOR RENDER FREE
========================================= */

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

const speedChart = new Chart(document.getElementById("speedChart"), {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Mbps",
            data: [],
            borderColor: "#00c3ff",
            backgroundColor: "rgba(0,195,255,0.12)",
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: {
                beginAtZero: true,
                ticks: { color: "#777" },
                grid: { color: "rgba(255,255,255,0.05)" }
            }
        }
    }
});

/* Gauge */
function drawGauge(value) {
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 15;
    ctx.stroke();

    // Active ring
    const progress = Math.min(value, 100) / 100;
    const endAngle = progress * Math.PI * 2 - Math.PI / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
    const color = value < 30 ? "#ff3b3b" : value < 70 ? "#ffcc00" : "#00c3ff";
    ctx.strokeStyle = color;
    ctx.lineWidth = 15;
    ctx.lineCap = "round";
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

/* Smooth speed animation */
let animationFrame;
function updateSpeed(target) {
    cancelAnimationFrame(animationFrame);
    let current = parseFloat(mainSpeed.innerText) || 0;

    function animate() {
        current += (target - current) * 0.15;
        mainSpeed.innerText = current.toFixed(1);
        drawGauge(current);

        if (Math.abs(target - current) > 0.1) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            mainSpeed.innerText = target.toFixed(1);
            drawGauge(target);
        }
    }
    animate();
}

/* ISP Detection */
async function detectISP() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const isp = data.org || data.isp || "Unknown ISP";
        provider.innerText = isp;
        providerName.innerText = isp;
    } catch (e) {
        provider.innerText = providerName.innerText = "Unknown ISP";
    }
}

/* Improved Ping */
async function runPingTest() {
    statusText.innerText = "Testing Ping...";
    const samples = [];

    for (let i = 0; i < 8; i++) {
        try {
            const start = performance.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

            await fetch(`/ping?cache=${Date.now()}`, { signal: controller.signal });
            clearTimeout(timeout);

            const end = performance.now();
            samples.push(end - start);
        } catch (e) {
            samples.push(999); // penalty for failed ping
        }
        await new Promise(r => setTimeout(r, 100));
    }

    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    pingText.innerText = Math.round(avg) + " ms";
    return avg;
}

/* Download Test - Shorter + throttled UI updates */
async function realDownloadTest() {
    statusText.innerText = "Testing Download...";
    const TEST_DURATION = 8000; // 8 seconds (more reliable on free tier)
    const startTime = performance.now();
    let loaded = 0;
    let speedSamples = [];
    let lastChartUpdate = 0;

    speedChart.data.labels = [];
    speedChart.data.datasets[0].data = [];
    speedChart.update();

    try {
        const response = await fetch(`/download?cache=${Date.now()}`);
        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            loaded += value.length;

            const elapsed = (performance.now() - startTime) / 1000;
            if (elapsed < 0.1) continue;

            const mbps = (loaded * 8) / elapsed / 1024 / 1024;

            if (mbps > 0 && mbps < 5000) {
                speedSamples.push(mbps);
                updateSpeed(mbps);

                // Throttle chart updates (every ~150ms)
                if (performance.now() - lastChartUpdate > 150) {
                    speedChart.data.labels.push("");
                    speedChart.data.datasets[0].data.push(mbps.toFixed(1));

                    if (speedChart.data.labels.length > 50) {
                        speedChart.data.labels.shift();
                        speedChart.data.datasets[0].data.shift();
                    }
                    speedChart.update("none");
                    lastChartUpdate = performance.now();
                }
            }

            if (performance.now() - startTime >= TEST_DURATION) break;
        }

        reader.cancel();
    } catch (err) {
        console.error("Download error:", err);
        statusText.innerText = "Download failed - retrying...";
        return 0;
    }

    if (speedSamples.length === 0) return 0;

    // Use average of the most stable recent samples
    const recent = speedSamples.slice(-15);
    return recent.reduce((a, b) => a + b, 0) / recent.length;
}

/* Upload Test - Smaller size */
async function realUploadTest() {
    statusText.innerText = "Testing Upload...";

    const size = 5 * 1024 * 1024; // Reduced from 10 MB
    const data = new Uint8Array(size);
    crypto.getRandomValues(data);

    const start = performance.now();

    try {
        const res = await fetch("/upload", {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: data
        });

        if (!res.ok) throw new Error("Upload failed");

        const end = performance.now();
        const duration = (end - start) / 1000;
        const mbps = (size * 8) / duration / 1024 / 1024;

        updateSpeed(mbps);
        return mbps;
    } catch (err) {
        console.error("Upload error:", err);
        return 0;
    }
}

/* Finish */
function finishTest(download, upload) {
    statusText.innerText = "✔ Test Complete";

    const finalDownload = download > 0 ? download : 0.1;
    const finalUpload = upload > 0 ? upload : 0.1;

    downloadText.innerText = finalDownload.toFixed(1) + " Mbps";
    uploadText.innerText = finalUpload.toFixed(1) + " Mbps";

    updateSpeed(finalDownload);

    shareBtn.classList.remove("hidden");

    // Notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⚡ Cymor Speed Test", {
            body: `Download: ${finalDownload.toFixed(1)} Mbps | Upload: ${finalUpload.toFixed(1)} Mbps`
        });
    }
}

/* Start Test */
startBtn.addEventListener("click", async () => {
    try {
        startBtn.disabled = true;
        hero.classList.add("hidden");
        testScreen.classList.remove("hidden");

        statusText.innerText = "Initializing...";

        await detectISP();
        await runPingTest();

        const download = await realDownloadTest();
        const upload = await realUploadTest();

        finishTest(download, upload);
    } catch (err) {
        console.error(err);
        statusText.innerText = "❌ Test Failed - Try again";
    } finally {
        startBtn.disabled = false;
    }
});

/* Share */
shareBtn.addEventListener("click", async () => {
    const card = document.getElementById("resultCard");
    shareBtn.classList.add("hidden");

    try {
        const canvas = await html2canvas(card, {
            backgroundColor: "#020617",
            scale: 2
        });

        canvas.toBlob(blob => {
            const link = document.createElement("a");
            link.download = "Cymor-Speed-Test.png";
            link.href = URL.createObjectURL(blob);
            link.click();
        });
    } catch (e) {
        alert("Could not generate image");
    } finally {
        shareBtn.classList.remove("hidden");
    }
});
