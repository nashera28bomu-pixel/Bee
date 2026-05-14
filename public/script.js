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

const ctx =
document.getElementById("gauge").getContext("2d");

/* ======================
   GAUGE
====================== */

function drawGauge(value) {

    const canvas = ctx.canvas;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const radius = 100;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
    "rgba(255,255,255,0.08)";

    ctx.lineWidth = 15;

    ctx.stroke();

    const endAngle =
    (value / 100) * (Math.PI * 2);

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2,
        endAngle - Math.PI / 2
    );

    ctx.strokeStyle =
        value < 30
        ? "#ff3b3b"
        : value < 70
        ? "#ffcc00"
        : "#00c3ff";

    ctx.lineWidth = 15;

    ctx.stroke();
}

/* ======================
   SPEED UPDATE
====================== */

function updateSpeed(target) {

    let current =
    parseFloat(mainSpeed.innerText) || 0;

    function animate() {

        current +=
        (target - current) * 0.1;

        mainSpeed.innerText =
        current.toFixed(1);

        drawGauge(
            Math.min(current, 100)
        );

        if (
            Math.abs(target - current)
            > 0.2
        ) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

/* ======================
   ISP
====================== */

async function detectISP() {

    try {

        const res =
        await fetch("https://ipapi.co/json/");

        const data =
        await res.json();

        const isp =
        data.org || "Unknown ISP";

        provider.innerText = isp;
        providerName.innerText = isp;

    } catch {

        provider.innerText =
        "Unknown ISP";

        providerName.innerText =
        "Unknown";
    }
}

/* ======================
   PING
====================== */

async function runPingTest() {

    statusText.innerText =
    "Testing Ping...";

    const samples = [];

    for (let i = 0; i < 5; i++) {

        const start =
        performance.now();

        await fetch("/ping");

        const end =
        performance.now();

        samples.push(end - start);
    }

    const avg =
    samples.reduce((a,b)=>a+b)
    / samples.length;

    pingText.innerText =
    avg.toFixed(0) + " ms";
}

/* ======================
   DOWNLOAD
====================== */

async function realDownloadTest() {

    statusText.innerText =
    "Testing Download...";

    const start =
    performance.now();

    let loaded = 0;

    const response =
    await fetch(
        "/download?cache=" + Date.now()
    );

    const reader =
    response.body.getReader();

    let speeds = [];

    while (true) {

        const { done, value } =
        await reader.read();

        if (done) break;

        loaded += value.length;

        const duration =
        (performance.now() - start)
        / 1000;

        const mbps =
        (loaded * 8)
        / duration
        / 1024
        / 1024;

        if (
            mbps > 0 &&
            mbps < 1000
        ) {

            speeds.push(mbps);

            updateSpeed(mbps);
        }
    }

    if (!speeds.length) return 0;

    const avg =
    speeds.reduce((a,b)=>a+b)
    / speeds.length;

    return avg;
}

/* ======================
   UPLOAD
====================== */

async function realUploadTest() {

    statusText.innerText =
    "Testing Upload...";

    const size =
    3 * 1024 * 1024;

    const data =
    new Uint8Array(size);

    crypto.getRandomValues(data);

    const start =
    performance.now();

    await fetch("/upload", {
        method: "POST",
        body: data
    });

    const end =
    performance.now();

    const duration =
    (end - start) / 1000;

    return (
        (size * 8)
        / duration
        / 1024
        / 1024
    );
}

/* ======================
   FINISH
====================== */

function finishTest(
    download,
    upload
) {

    statusText.innerText =
    "✔ Test Complete";

    downloadText.innerText =
    download.toFixed(1)
    + " Mbps";

    uploadText.innerText =
    upload.toFixed(1)
    + " Mbps";

    updateSpeed(download);

    shareBtn.classList.remove(
        "hidden"
    );

    if ("Notification" in window) {

        Notification.requestPermission()
        .then(permission => {

            if (
                permission === "granted"
            ) {

                new Notification(
                    "⚡ Cymor Test Complete",
                    {
                        body:
                        `Download ${download.toFixed(1)} Mbps`
                    }
                );
            }
        });
    }
}

/* ======================
   START TEST
====================== */

startBtn.addEventListener(
    "click",
    async () => {

        try {

            startBtn.disabled = true;

            hero.classList.add("hidden");

            testScreen.classList.remove(
                "hidden"
            );

            await detectISP();

            await runPingTest();

            const download =
            await realDownloadTest();

            const upload =
            await realUploadTest();

            finishTest(
                download,
                upload
            );

        } catch (err) {

            console.error(err);

            statusText.innerText =
            "❌ Test Failed";

        } finally {

            startBtn.disabled = false;
        }
    }
);

/* ======================
   SHARE IMAGE
====================== */

shareBtn.addEventListener(
    "click",
    async () => {

        const card =
        document.getElementById(
            "resultCard"
        );

        shareBtn.classList.add(
            "hidden"
        );

        const canvas =
        await html2canvas(card, {
            backgroundColor:"#020617",
            scale:2
        });

        shareBtn.classList.remove(
            "hidden"
        );

        const link =
        document.createElement("a");

        link.download =
        "Cymor-Speed-Test.png";

        link.href =
        canvas.toDataURL();

        link.click();
    }
);
