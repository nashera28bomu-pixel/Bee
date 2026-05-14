const startBtn = document.getElementById("startBtn");

const shareBtn = document.getElementById("shareBtn");

const mainSpeed = document.getElementById("mainSpeed");

const downloadText = document.getElementById("download");

const uploadText = document.getElementById("upload");

const pingText = document.getElementById("ping");

const statusText = document.getElementById("status");

shareBtn.style.display = "none";

startBtn.addEventListener("click", async () => {

    startBtn.disabled = true;

    startBtn.innerText = "TESTING...";

    shareBtn.style.display = "none";

    await runPingTest();

    const downloadSpeed = await runDownloadTest();

    const uploadSpeed = await runUploadTest();

    downloadText.innerText = `${downloadSpeed} Mbps`;

    uploadText.innerText = `${uploadSpeed} Mbps`;

    mainSpeed.innerText = downloadSpeed;

    statusText.innerText = "✅ Speed Test Complete";

    shareBtn.style.display = "inline-block";

    startBtn.disabled = false;

    startBtn.innerText = "RUN AGAIN";

});

async function runPingTest(){

    statusText.innerText = "Checking Ping...";

    const start = performance.now();

    await fetch("/ping");

    const end = performance.now();

    const ping = Math.round(end - start);

    pingText.innerText = `${ping} ms`;

}

async function runDownloadTest(){

    statusText.innerText = "Testing Download Speed...";

    const startTime = performance.now();

    const response = await fetch("/download");

    const data = await response.blob();

    const endTime = performance.now();

    const duration = (endTime - startTime) / 1000;

    const bitsLoaded = data.size * 8;

    let speedMbps = ((bitsLoaded / duration) / 1024 / 1024).toFixed(2);

    animateSpeed(speedMbps);

    return speedMbps;

}

async function runUploadTest(){

    statusText.innerText = "Testing Upload Speed...";

    const data = new Uint8Array(5 * 1024 * 1024);

    const startTime = performance.now();

    await fetch("/upload", {
        method: "POST",
        body: data
    });

    const endTime = performance.now();

    const duration = (endTime - startTime) / 1000;

    const bitsUploaded = data.length * 8;

    let speedMbps = ((bitsUploaded / duration) / 1024 / 1024).toFixed(2);

    return speedMbps;

}

function animateSpeed(finalSpeed){

    let current = 0;

    const interval = setInterval(() => {

        current += Math.random() * 8;

        if(current >= finalSpeed){

            current = finalSpeed;

            clearInterval(interval);

        }

        mainSpeed.innerText = Number(current).toFixed(0);

    }, 100);

}

shareBtn.addEventListener("click", async () => {

    const text = `
🚀 Cymor Internet Speed Test Results

⬇ Download: ${downloadText.innerText}
⬆ Upload: ${uploadText.innerText}
📶 Ping: ${pingText.innerText}

Test your internet now!
`;

    if(navigator.share){

        navigator.share({
            title:"Cymor Internet Speed Test",
            text:text
        });

    }else{

        navigator.clipboard.writeText(text);

        alert("Results copied to clipboard!");

    }

});
