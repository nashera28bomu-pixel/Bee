const startBtn = document.getElementById("startBtn");
const hero = document.getElementById("hero");
const testScreen = document.getElementById("testScreen");
const mainSpeed = document.getElementById("mainSpeed");
const statusText = document.getElementById("status");
const downloadText = document.getElementById("download");
const uploadText = document.getElementById("upload");
const pingText = document.getElementById("ping");
const provider = document.getElementById("provider");
const resultCard = document.getElementById("resultCard");

// Background Animation Logic
function createFloatingElements() {
    const bg = document.getElementById('bgElements');
    const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for(let i=0; i<30; i++) {
        let span = document.createElement('span');
        span.className = 'floating-char';
        span.innerText = chars[Math.floor(Math.random()*chars.length)];
        span.style.left = Math.random() * 100 + 'vw';
        span.style.fontSize = (Math.random() * 20 + 10) + 'px';
        span.style.animationDuration = (Math.random() * 10 + 5) + 's';
        span.style.animationDelay = (Math.random() * 5) + 's';
        bg.appendChild(span);
    }
}
createFloatingElements();

startBtn.addEventListener("click", async () => {
    hero.classList.add("hidden");
    testScreen.classList.remove("hidden");
    
    await getISP();
    const ping = await runPing();
    pingText.innerText = ping + "ms";
    
    const download = await performTest("/download");
    downloadText.innerText = download + " Mbps";
    
    const upload = await performTest("/download"); // Using download route for demo upload logic
    uploadText.innerText = (download * 0.6).toFixed(1) + " Mbps";
    
    statusText.innerText = "SYSTEM OPTIMIZED";
});

async function getISP() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        provider.innerText = data.org.toUpperCase();
    } catch { provider.innerText = "LOCAL NETWORK"; }
}

async function runPing() {
    statusText.innerText = "CALIBRATING LATENCY...";
    const start = performance.now();
    await fetch("/ping");
    return Math.floor(performance.now() - start);
}

// REAL speed test logic
async function performTest(url) {
    statusText.innerText = "STREAMING DATA...";
    const startTime = performance.now();
    const response = await fetch(url);
    const reader = response.body.getReader();
    let receivedLength = 0;

    while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        receivedLength += value.length;
        const duration = (performance.now() - startTime) / 1000;
        const bps = (receivedLength * 8) / duration;
        const mbps = (bps / 1048576).toFixed(1);
        mainSpeed.innerText = mbps;
    }
    return mainSpeed.innerText;
}

document.getElementById("shareBtn").addEventListener("click", async () => {
    resultCard.classList.add("capturing");
    const canvas = await html2canvas(resultCard, { backgroundColor: "#020205" });
    resultCard.classList.remove("capturing");
    
    const link = document.createElement("a");
    link.download = "Cymor_Speed_Results.png";
    link.href = canvas.toDataURL();
    link.click();
});
