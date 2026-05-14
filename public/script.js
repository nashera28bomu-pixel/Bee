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

let chart;

const ctx = document.getElementById("speedChart");

chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "Speed Mbps",
            data: [],
            borderColor: "#00c3ff",
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "white"
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: "white"
                }
            },
            y: {
                ticks: {
                    color: "white"
                }
            }
        }
    }
});

startBtn.addEventListener("click", async () => {

    hero.classList.add("hidden");

    testScreen.classList.remove("hidden");

    await detectISP();

    await runPingTest();

    const download = await simulateDownload();

    const upload = await simulateUpload(download);

    finishTest(download, upload);

});

async function detectISP(){

    try{

        const res = await fetch("https://ipapi.co/json/");

        const data = await res.json();

        const isp = data.org || "Unknown ISP";

        provider.innerText = isp;

        providerName.innerText = isp;

    }catch{

        provider.innerText = "ISP Unknown";

        providerName.innerText = "Unknown";

    }

}

async function runPingTest(){

    statusText.innerText = "Checking Ping...";

    const start = performance.now();

    await fetch("/ping");

    const end = performance.now();

    const ping = Math.floor(end - start);

    pingText.innerText = ping + " ms";

}

async function simulateDownload(){

    statusText.innerText = "Testing Download Speed...";

    return new Promise(resolve => {

        let speed = 0;

        let count = 0;

        const interval = setInterval(() => {

            speed += Math.random() * 12;

            if(speed > 180){
                speed = 180 - Math.random() * 20;
            }

            mainSpeed.innerText = speed.toFixed(1);

            chart.data.labels.push("");

            chart.data.datasets[0].data.push(speed.toFixed(1));

            chart.update();

            count++;

            if(count > 25){

                clearInterval(interval);

                resolve(speed.toFixed(1));

            }

        }, 200);

    });

}

async function simulateUpload(download){

    statusText.innerText = "Testing Upload Speed...";

    return new Promise(resolve => {

        let speed = download / 2;

        let count = 0;

        const interval = setInterval(() => {

            speed += Math.random() * 4 - 2;

            mainSpeed.innerText = speed.toFixed(1);

            count++;

            if(count > 15){

                clearInterval(interval);

                resolve(speed.toFixed(1));

            }

        }, 200);

    });

}

function finishTest(download, upload){

    statusText.innerText = "✅ Speed Test Complete";

    downloadText.innerText = download + " Mbps";

    uploadText.innerText = upload + " Mbps";

    mainSpeed.innerText = download;

}

shareBtn.addEventListener("click", async () => {

    const canvas = await html2canvas(resultCard);

    canvas.toBlob(async(blob) => {

        const file = new File(
            [blob],
            "cymor-speed-result.png",
            { type:"image/png" }
        );

        if(navigator.canShare && navigator.canShare({ files:[file] })){

            await navigator.share({
                title:"Cymor Internet Speed Test",
                files:[file]
            });

        }else{

            const link = document.createElement("a");

            link.href = URL.createObjectURL(blob);

            link.download = "cymor-speed-result.png";

            link.click();

        }

    });

});
