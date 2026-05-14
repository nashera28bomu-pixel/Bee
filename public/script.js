/* =========================================
   CYMOR SPEED TEST — ULTRA REAL SYSTEM
   FULLY OPTIMIZED VERSION
========================================= */

const startBtn =
document.getElementById("startBtn");

const hero =
document.getElementById("hero");

const testScreen =
document.getElementById("testScreen");

const mainSpeed =
document.getElementById("mainSpeed");

const statusText =
document.getElementById("status");

const downloadText =
document.getElementById("download");

const uploadText =
document.getElementById("upload");

const pingText =
document.getElementById("ping");

const provider =
document.getElementById("provider");

const providerName =
document.getElementById("providerName");

const shareBtn =
document.getElementById("shareBtn");

/* =========================================
   GAUGE CANVAS
========================================= */

const ctx =
document
.getElementById("gauge")
.getContext("2d");

/* =========================================
   LIVE SPEED GRAPH
========================================= */

const speedChart =
new Chart(
document.getElementById("speedChart"),
{
    type: "line",

    data: {
        labels: [],

        datasets: [{
            label: "Mbps",

            data: [],

            borderColor: "#00c3ff",

            backgroundColor:
            "rgba(0,195,255,0.12)",

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

        plugins: {
            legend: {
                display: false
            }
        },

        scales: {

            x: {
                display: false
            },

            y: {

                beginAtZero: true,

                ticks: {
                    color: "#777"
                },

                grid: {
                    color:
                    "rgba(255,255,255,0.05)"
                }
            }
        }
    }
}
);

/* =========================================
   DRAW GAUGE
========================================= */

function drawGauge(value){

    const canvas =
    ctx.canvas;

    const centerX =
    canvas.width / 2;

    const centerY =
    canvas.height / 2;

    const radius = 100;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // background ring
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

    // active ring
    const endAngle =
    (Math.min(value, 100) / 100)
    * (Math.PI * 2);

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        -Math.PI / 2,
        endAngle - Math.PI / 2
    );

    const color =
    value < 30
    ? "#ff3b3b"
    : value < 70
    ? "#ffcc00"
    : "#00c3ff";

    ctx.strokeStyle = color;

    ctx.lineWidth = 15;

    ctx.lineCap = "round";

    ctx.shadowBlur = 20;

    ctx.shadowColor = color;

    ctx.stroke();

    ctx.shadowBlur = 0;
}

/* =========================================
   SPEED ANIMATION
========================================= */

let animationFrame;

function updateSpeed(target){

    cancelAnimationFrame(
        animationFrame
    );

    let current =
    parseFloat(mainSpeed.innerText)
    || 0;

    function animate(){

        current +=
        (target - current)
        * 0.12;

        mainSpeed.innerText =
        current.toFixed(1);

        drawGauge(current);

        if(
            Math.abs(target - current)
            > 0.1
        ){

            animationFrame =
            requestAnimationFrame(
                animate
            );
        }
    }

    animate();
}

/* =========================================
   ISP DETECTION
========================================= */

async function detectISP(){

    try{

        const res =
        await fetch(
            "https://ipapi.co/json/"
        );

        const data =
        await res.json();

        const isp =
        data.org ||
        "Unknown ISP";

        provider.innerText = isp;

        providerName.innerText = isp;

    } catch {

        provider.innerText =
        "Unknown ISP";

        providerName.innerText =
        "Unknown ISP";
    }
}

/* =========================================
   PING TEST
========================================= */

async function runPingTest(){

    statusText.innerText =
    "Testing Ping...";

    const samples = [];

    for(let i = 0; i < 6; i++){

        const start =
        performance.now();

        await fetch(
            "/ping?cache=" + Date.now()
        );

        const end =
        performance.now();

        samples.push(end - start);
    }

    const avg =
    samples.reduce(
        (a,b)=>a+b,
        0
    ) / samples.length;

    pingText.innerText =
    avg.toFixed(0) + " ms";
}

/* =========================================
   REAL DOWNLOAD TEST
========================================= */

async function realDownloadTest(){

    statusText.innerText =
    "Testing Download...";

    const TEST_DURATION =
    12000;

    const startTime =
    performance.now();

    let loaded = 0;

    let speedSamples = [];

    // reset graph
    speedChart.data.labels = [];

    speedChart.data.datasets[0]
    .data = [];

    speedChart.update();

    try{

        const response =
        await fetch(
            "/download?cache="
            + Date.now()
        );

        const reader =
        response.body.getReader();

        while(true){

            const {
                done,
                value
            } =
            await reader.read();

            if(done) break;

            loaded += value.length;

            const elapsed =
            (
                performance.now()
                - startTime
            ) / 1000;

            const mbps =
            (
                loaded * 8
            )
            / elapsed
            / 1024
            / 1024;

            if(
                mbps > 0 &&
                mbps < 1000
            ){

                speedSamples.push(
                    mbps
                );

                updateSpeed(
                    mbps
                );

                // update graph
                speedChart.data.labels
                .push("");

                speedChart.data.datasets[0]
                .data.push(
                    mbps.toFixed(1)
                );

                if(
                    speedChart.data.labels
                    .length > 60
                ){

                    speedChart.data.labels
                    .shift();

                    speedChart.data.datasets[0]
                    .data.shift();
                }

                speedChart.update(
                    "none"
                );
            }

            if(
                performance.now()
                - startTime
                >= TEST_DURATION
            ){
                break;
            }
        }

        reader.cancel();

    } catch(err){

        console.error(err);

        statusText.innerText =
        "Download Test Failed";

        return 0;
    }

    if(
        speedSamples.length === 0
    ){
        return 0;
    }

    // stable average
    const recent =
    speedSamples.slice(-20);

    const avg =
    recent.reduce(
        (a,b)=>a+b,
        0
    ) / recent.length;

    return avg;
}

/* =========================================
   REAL UPLOAD TEST
========================================= */

async function realUploadTest(){

    statusText.innerText =
    "Testing Upload...";

    const size =
    10 * 1024 * 1024;

    const data =
    new Uint8Array(size);

    crypto.getRandomValues(data);

    const start =
    performance.now();

    await fetch(
        "/upload",
        {
            method: "POST",

            headers: {
                "Content-Type":
                "application/octet-stream"
            },

            body: data
        }
    );

    const end =
    performance.now();

    const duration =
    (end - start) / 1000;

    const mbps =
    (
        size * 8
    )
    / duration
    / 1024
    / 1024;

    updateSpeed(mbps);

    return mbps;
}

/* =========================================
   FINISH TEST
========================================= */

function finishTest(
    download,
    upload
){

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

    // notifications
    if(
        "Notification"
        in window
    ){

        Notification
        .requestPermission()
        .then(permission=>{

            if(
                permission
                === "granted"
            ){

                new Notification(
                    "⚡ Cymor Speed Test",
                    {
                        body:
                        `Download ${download.toFixed(1)} Mbps | Upload ${upload.toFixed(1)} Mbps`
                    }
                );
            }
        });
    }
}

/* =========================================
   START TEST
========================================= */

startBtn.addEventListener(
"click",

async ()=>{

    try{

        startBtn.disabled = true;

        hero.classList.add(
            "hidden"
        );

        testScreen.classList.remove(
            "hidden"
        );

        statusText.innerText =
        "Initializing...";

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

    } catch(err){

        console.error(err);

        statusText.innerText =
        "❌ Test Failed";

    } finally {

        startBtn.disabled = false;
    }
}
);

/* =========================================
   SHARE RESULT IMAGE
========================================= */

shareBtn.addEventListener(
"click",

async ()=>{

    const card =
    document.getElementById(
        "resultCard"
    );

    shareBtn.classList.add(
        "hidden"
    );

    const canvas =
    await html2canvas(
        card,
        {
            backgroundColor:
            "#020617",

            scale: 2
        }
    );

    shareBtn.classList.remove(
        "hidden"
    );

    canvas.toBlob(blob=>{

        const link =
        document.createElement("a");

        link.download =
        "Cymor-Speed-Test.png";

        link.href =
        URL.createObjectURL(blob);

        link.click();
    });
});
