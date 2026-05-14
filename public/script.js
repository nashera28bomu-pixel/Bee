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

const resultCard = document.getElementById("resultCard");

/**
 * CHART
 */
const chart = new Chart(document.getElementById("speedChart"), {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Mbps",
            data: [],
            borderColor: "#00c3ff",
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { labels: { color: "white" } } },
        scales: {
            x: { ticks: { color: "white" } },
            y: { ticks: { color: "white" } }
        }
    }
});

/**
 * ISP DETECTION
 */
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

/**
 * PING + JITTER (FIXED)
 */
async function runPingTest() {
    statusText.innerText = "Testing Ping + Jitter...";

    let samples = [];

    for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await fetch("/ping");
        const end = performance.now();

        samples.push(end - start);
    }

    const avg = samples.reduce((a, b) => a + b) / samples.length;

    const jitter =
        samples.reduce((a, b) => a + Math.abs(b - avg), 0) / samples.length;

    pingText.innerText = `${avg.toFixed(0)} ms`;
    window.jitterValue = jitter.toFixed(1);
}

/**
 * MULTI STREAM DOWNLOAD TEST (REAL FIX)
 */
async function realDownloadTest() {

    statusText.innerText = "Testing Download Speed...";

    const streams = 4;
    let speeds = [];

    async function downloadStream() {
        const start = performance.now();
        let loaded = 0;

        const res = await fetch("/download?cache=" + Math.random());
        const reader = res.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            loaded += value.length;

            const duration = (performance.now() - start) / 1000;

            const mbps = (loaded * 8) / duration / 1024 / 1024;

            speeds.push(mbps);

            animateSpeed(mbps);
        }
    }

    await Promise.all([
        downloadStream(),
        downloadStream(),
        downloadStream(),
        downloadStream()
    ]);

    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    return avg;
}

/**
 * UPLOAD TEST
 */
async function realUploadTest() {

    statusText.innerText = "Testing Upload Speed...";

    const size = 5 * 1024 * 1024;
    const data = new Uint8Array(size);
    crypto.getRandomValues(data);

    const start = performance.now();

    await fetch("/upload", {
        method: "POST",
        body: data
    });

    const end = performance.now();

    const duration = (end - start) / 1000;

    const speed = (size * 8) / duration / 1024 / 1024;

    return speed;
}

/**
 * SMOOTH SPEED ANIMATION (PHYSICS)
 */
function animateSpeed(target) {

    let current = parseFloat(mainSpeed.innerText) || 0;

    function step() {
        current += (target - current) * 0.15;

        mainSpeed.innerText = current.toFixed(1);

        if (Math.abs(target - current) > 0.5) {
            requestAnimationFrame(step);
        }
    }

    step();
}

/**
 * INTERNET QUALITY RATING
 */
function getRating(download, ping) {

    if (download > 50 && ping < 30) return "🔥 Excellent for Gaming";
    if (download > 25) return "🎬 Great for Streaming";
    if (download > 10) return "📺 Good for Video Calls";
    return "🐢 Basic Browsing Only";
}

/**
 * START TEST
 */
startBtn.addEventListener("click", async () => {

    hero.classList.add("hidden");
    testScreen.classList.remove("hidden");

    await detectISP();
    await runPingTest();

    const download = await realDownloadTest();
    const upload = await realUploadTest();

    finishTest(download, upload);
});

/**
 * FINISH
 */
function finishTest(download, upload) {

    const ping = parseFloat(pingText.innerText);

    statusText.innerText = getRating(download, ping);

    downloadText.innerText = download.toFixed(1) + " Mbps";
    uploadText.innerText = upload.toFixed(1) + " Mbps";

    mainSpeed.innerText = download.toFixed(1);

    // Save history
    const history = JSON.parse(localStorage.getItem("history") || "[]");

    history.push({
        date: new Date().toLocaleDateString(),
        download: download.toFixed(1)
    });

    localStorage.setItem("history", JSON.stringify(history));
}
