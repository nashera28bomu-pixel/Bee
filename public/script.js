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

const resultCard = document.getElementById("resultCard");

const bg = document.getElementById("bgElements");

const ctx = document.getElementById("speedChart");

const chart = new Chart(ctx, {

    type:"line",

    data:{
        labels:[],
        datasets:[{
            label:"Mbps",
            data:[],
            borderColor:"#00c3ff",
            tension:0.4
        }]
    },

    options:{
        responsive:true,

        plugins:{
            legend:{
                labels:{
                    color:"white"
                }
            }
        },

        scales:{
            x:{
                ticks:{
                    color:"white"
                }
            },

            y:{
                ticks:{
                    color:"white"
                }
            }
        }
    }

});

const chars = [
"10",
"50",
"100",
"Mbps",
"5G",
"⚡",
"PING",
"NET"
];

for(let i=0;i<40;i++){

    const span = document.createElement("span");

    span.className = "floating-char";

    span.innerText =
    chars[Math.floor(Math.random()*chars.length)];

    span.style.left =
    Math.random()*100 + "vw";

    span.style.fontSize =
    (Math.random()*35 + 15) + "px";

    span.style.animationDuration =
    (Math.random()*15 + 10) + "s";

    span.style.animationDelay =
    Math.random()*5 + "s";

    bg.appendChild(span);

}

startBtn.addEventListener("click", async ()=>{

    hero.classList.add("hidden");

    testScreen.classList.remove("hidden");

    await detectISP();

    await runPingTest();

    const download =
    await realDownloadTest();

    const upload =
    await realUploadTest();

    finishTest(download,upload);

});

async function detectISP(){

    try{

        const res =
        await fetch("https://ipapi.co/json/");

        const data =
        await res.json();

        const isp =
        data.org || "Unknown ISP";

        provider.innerText = isp;

        providerName.innerText = isp;

    }catch{

        provider.innerText =
        "Unknown ISP";

        providerName.innerText =
        "Unknown";

    }

}

async function runPingTest(){

    statusText.innerText =
    "Checking Ping...";

    const start =
    performance.now();

    await fetch("/ping");

    const end =
    performance.now();

    const ping =
    Math.floor(end - start);

    pingText.innerText =
    ping + " ms";

}

async function realDownloadTest(){

    statusText.innerText =
    "Testing Download Speed...";

    chart.data.labels = [];

    chart.data.datasets[0].data = [];

    chart.update();

    const startTime =
    performance.now();

    const response =
    await fetch("/download?cache=" + Date.now());

    const reader =
    response.body.getReader();

    let receivedLength = 0;

    let speeds = [];

    let lastUpdate =
    performance.now();

    while(true){

        const {done,value} =
        await reader.read();

        if(done) break;

        receivedLength += value.length;

        const now =
        performance.now();

        const duration =
        (now - startTime)/1000;

        const speedMbps =
        ((receivedLength*8)/
        duration/
        1024/
        1024);

        speeds.push(speedMbps);

        mainSpeed.innerText =
        speedMbps.toFixed(1);

        if(now - lastUpdate > 300){

            chart.data.labels.push("");

            chart.data.datasets[0].data.push(
                speedMbps.toFixed(1)
            );

            chart.update();

            lastUpdate = now;

        }

    }

    const average =
    speeds.reduce((a,b)=>a+b,0)
    / speeds.length;

    return average.toFixed(1);

}

async function realUploadTest(){

    statusText.innerText =
    "Testing Upload Speed...";

    const size =
    5 * 1024 * 1024;

    const data =
    new Uint8Array(size);

    crypto.getRandomValues(data);

    const start =
    performance.now();

    await fetch("/upload",{
        method:"POST",
        body:data
    });

    const end =
    performance.now();

    const duration =
    (end - start)/1000;

    const speed =
    ((size*8)/
    duration/
    1024/
    1024);

    return speed.toFixed(1);

}

function finishTest(download,upload){

    statusText.innerText =
    "✅ Speed Test Complete";

    downloadText.innerText =
    download + " Mbps";

    uploadText.innerText =
    upload + " Mbps";

    mainSpeed.innerText =
    download;

}

shareBtn.addEventListener("click",async()=>{

    const canvas =
    await html2canvas(resultCard);

    canvas.toBlob(async(blob)=>{

        const file =
        new File(
        [blob],
        "cymor-speed-result.png",
        {type:"image/png"}
        );

        if(
        navigator.canShare &&
        navigator.canShare({
            files:[file]
        })
        ){

            await navigator.share({
                title:
                "Cymor Online Speed Test",
                files:[file]
            });

        }else{

            const link =
            document.createElement("a");

            link.href =
            URL.createObjectURL(blob);

            link.download =
            "cymor-speed-result.png";

            link.click();

        }

    });

});
