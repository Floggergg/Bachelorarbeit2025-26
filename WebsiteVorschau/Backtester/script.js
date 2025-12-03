let uploadedDataAvailable = false;
let strategyJS = null;
let uploadedFunctionAvailable = "";
let actions = [];
let jsonData = null;
let strategy = null;
let memory = null;

let fetchedData = null;
let assetCode = "";
let fetchStartDate = null;
let fetchEndDate = null;

async function fetchApiData(symbol = "BTCUSDT", interval = "1m", start = startTime, end = endTime) {
    let allData = [];

    while (start < end) {
        const da = new Date(start);
        console.log(da.toISOString());
        const url = new URL("https://api.binance.com/api/v3/klines");
        url.searchParams.set("symbol", symbol);
        url.searchParams.set("interval", interval);
        url.searchParams.set("startTime", start);
        url.searchParams.set("endTime", end);
        url.searchParams.set("limit", 1000);

        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            break;
        }

        allData.push(...data);

        // Move fetchStart to last candle closeTime + 1 ms
        start = data[data.length - 1][6] + 1;

        // Respect Binance rate limit (1200 req/minute)
        await new Promise(r => setTimeout(r, 200));
    }

    return allData;
}

function formatApiData(apiData) {
    return apiData.map(k => ({
        time: new Date(k[0]).toISOString(),
        avgPrice: ((parseFloat(k[1]) + parseFloat(k[4])) / 2).toFixed(2)
    }));
}

document.getElementById("fetchJsonBtn").addEventListener("click", async () => {
    const code = document.getElementById("assetCode").value.toUpperCase();
    const startDate = new Date(document.getElementById("startDate").value).getTime();
    const endDate = new Date(document.getElementById("endDate").value).getTime();

    if (!code || isNaN(startDate) || isNaN(endDate)) {
        alert("Please enter valid code and dates");
        return;
    }

    assetCode = code;
    const sDate = new Date(startDate);
    fetchStartDate = sDate.toISOString();
    const eDate = new Date(endDate);
    fetchEndDate = eDate.toISOString();

    const status = document.getElementById("downloadStatus");
    status.textContent = "In Progress...";

    const rawData = await fetchApiData(code, "1m", startDate, endDate);
    fetchedData = formatApiData(rawData);

    console.log("Finished");
    document.getElementById("downloadJsonBtn").disabled = false;
});

document.getElementById("downloadJsonBtn").addEventListener("click", () => {
    const status = document.getElementById("downloadStatus");
    status.textContent = "";
    if (!fetchedData) {
        return;
    }

    const blob = new Blob([JSON.stringify(fetchedData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${assetCode}_${fetchStartDate}_${fetchEndDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    document.getElementById("downloadJsonBtn").disabled = true;
});

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function drawBlankChart(minTime, maxTime, ctx, padding, height, width) {
    const minDate = new Date(minTime).toISOString().slice(0, 10);
    const maxDate = new Date(maxTime).toISOString().slice(0, 10);

    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    ctx.fillText(minDate, padding, height - padding + 20);
    ctx.fillText(maxDate, width - padding - ctx.measureText(maxDate).width, height - padding + 20);
    ctx.fillText("Time", width / 2 - 15, height - 10);

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Value", 0, 0);
    ctx.restore();
}

const priceCanvas = document.getElementById('priceChart');
const portfolioCanvas = document.getElementById('portfolioChart');
function resizeCanvas() {
    priceCanvas.width = window.innerWidth * 0.975;
    portfolioCanvas.width = window.innerWidth * 0.975;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('DOMContentLoaded', resizeCanvas);

document.getElementById('fileInput').addEventListener('change', async (e) => {
    const status = document.getElementById("fileInputStatus");
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    try {
        jsonData = JSON.parse(text);
        uploadedDataAvailable = true;
        status.textContent = "✅";
    } catch (err) {
        status.textContent = "❌";
        uploadedDataAvailable = false;
        return;
    }

    drawChart(jsonData);
});

function drawChart(data, actions = []) {
    const canvas = document.getElementById('priceChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;

    const stepSize = Math.max(Math.round(data.length / 800), 1);
    const sampled = data.filter((_, i) => i % stepSize === 0);
    const prices = sampled.map(d => parseFloat(d.avgPrice));
    const times = sampled.map(d => new Date(d.time).getTime());

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const maxPrice = Math.max(...prices);

    ctx.clearRect(0, 0, width, height);
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    ctx.strokeStyle = '#ccc';
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    const ySegments = 5;
    for (let i = 0; i <= ySegments; i++) {
        const y = padding + (plotHeight / ySegments) * i;
        const priceVal = maxPrice * (1 - i / ySegments);

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.fillText(priceVal.toFixed(2), 10, y + 4);
    }

    drawBlankChart(minTime, maxTime, ctx, padding, height, width);

    ctx.beginPath();
    const points = [];
    sampled.forEach((d, index) => {
        const time = new Date(d.time).getTime();
        const price = parseFloat(d.avgPrice);
        const x = padding + ((time - minTime) / (maxTime - minTime)) * plotWidth;
        const y = padding + plotHeight - ((price / maxPrice) * plotHeight * 0.9);

        points.push({ x, y, price, time: d.time });
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    actions.forEach(act => {
        const actTime = new Date(act.time).getTime();
        const x = padding + ((actTime - minTime) / (maxTime - minTime)) * plotWidth;

        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.strokeStyle = act.signal === 'buy' ? 'green' : 'red';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    document.getElementById('priceChart').addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('tooltip');
        const rect = e.target.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const radius = 5;

        const match = points.find(p => Math.hypot(p.x - mx, p.y - my) < radius);

        if (match) {
            tooltip.style.left = `${e.pageX + 10}px`;
            tooltip.style.top = `${e.pageY + 10}px`;
            tooltip.innerText = `Time: ${match.time}\nPrice: ${match.price.toFixed(2)}`;
            tooltip.style.display = 'block';
        } else {
            tooltip.style.display = 'none';
        }
    });

    return { minTime, maxTime };
}

function drawPortfolioChart(portfolioValues, minTime, maxTime, maxValue) {
    const canvas = document.getElementById('portfolioChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;

    ctx.clearRect(0, 0, width, height);

    if (!portfolioValues.length || minTime === maxTime) {
        return;
    }

    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    ctx.strokeStyle = '#ccc';
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    const ySegments = 5;
    for (let i = 0; i <= ySegments; i++) {
        const y = padding + (plotHeight / ySegments) * i;
        const priceVal = maxValue * (1 - i / ySegments);

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.fillText(priceVal.toFixed(2), 10, y + 4);
    }

    drawBlankChart(minTime, maxTime, ctx, padding, height, width);

    ctx.beginPath();
    const stepSize = Math.max(Math.round(portfolioValues.length / 800),1);
    for (let i = 0; i < portfolioValues.length; i += stepSize) {
        const p = portfolioValues[i];
        const x = padding + ((new Date(p.time).getTime() - minTime) / (maxTime - minTime)) * plotWidth;
        const y = padding + plotHeight - ((p.value / maxValue) * plotHeight);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = 'purple';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

document.getElementById('strategyFile').addEventListener('change', async (e) => {
    const status = document.getElementById("strategyFileStatus");
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.js')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const scriptContent = e.target.result;
            strategyJS = new Function('return ' + scriptContent)();

            if (typeof strategyJS === 'function') {
                uploadedFunctionAvailable = "js";
                status.textContent = "✅";
            } else {
                strategyJS = null;
                uploadedFunctionAvailable = "";
                status.textContent = "❌";
            }
        };

        reader.readAsText(file);
    } else if (fileName.endsWith('.wasm')) {
        const wasmArrayBuffer = await file.arrayBuffer();
        ({ strategy, memory } = await WebAssembly.instantiate(wasmArrayBuffer, {
            env: {
                abort: () => console.error('Abort called')
            }
        }).then(result => result.instance.exports));

        if (strategy && memory) {
            uploadedFunctionAvailable = "wasm";
            status.textContent = "✅";
        } else {
            console.error('functions not found in the WASM module');
            uploadedFunctionAvailable = "";
            status.textContent = "❌";
        }
    }
});

document.getElementById('backtestButton').addEventListener('click', () => {
    let textMessage = document.getElementById('textMessage');
    textMessage.classList.remove("hidden");
    const startingMoney = document.getElementById('startingMoney').value;
    if (uploadedFunctionAvailable && uploadedDataAvailable && startingMoney !== '') {
        textMessage.textContent = '';
        const waitingMessage = 'Calculating...';
        document.getElementById('resEndMoney').textContent = waitingMessage;
        document.getElementById('resAbsProfit').textContent = waitingMessage;
        document.getElementById('resPercentProfit').textContent = waitingMessage;
        document.getElementById('sharpeRatio').textContent = waitingMessage;
        document.getElementById('executionSpeed').textContent = waitingMessage;

        const interval = document.getElementById('interval').value;
        const intervalsBack = document.getElementById('intervalsBack').value;

        document.getElementById('resStartingMoney').textContent = startingMoney;
        document.getElementById('resInterval').textContent = interval;

        setTimeout(() => {
            executeCalculations(startingMoney, interval, intervalsBack);
        }, 0);
    } else {
        textMessage.textContent = 'Strategy or Data or Money missing';
    }
});

function calculateSharpeRatio(portfolioValues, riskFreeRate = 0.02) {
    if (portfolioValues.length < 2) return 0;

    const returns = [];
    const oneYearMs = 365.25 * 24 * 60 * 60 * 1000; // milliseconds in a year

    for (let i = 1; i < portfolioValues.length; i++) {
        const prev = portfolioValues[i - 1];
        const curr = portfolioValues[i];

        const prevTime = new Date(prev.time).getTime();
        const currTime = new Date(curr.time).getTime();
        const deltaTime = currTime - prevTime; // ms between values

        const periodYears = deltaTime / oneYearMs; // fraction of year

        // Time-adjusted return
        const periodReturn = (curr.value - prev.value) / prev.value;
        const annualizedReturn = periodReturn / periodYears; // scale to 1 year
        returns.push(annualizedReturn);
    }

    // Average return
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
        return 0;
    }

    // Subtract annual risk-free rate
    return ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(returns.length);
}

function appendTradeRow(time, action, rowNumber, date, price, tbody) {
    actions.push({time, signal: action.signal});

    const tr = document.createElement('tr');
    const tdIndex = document.createElement('td');
    const tdTime = document.createElement('td');
    const tdType = document.createElement('td');
    const tdPrice = document.createElement('td');

    tdIndex.textContent = (rowNumber++).toString();
    tdTime.textContent = formatDateTime(date);
    tdType.textContent = action.signal;
    tdPrice.textContent = price.toFixed(2);

    tr.appendChild(tdIndex);
    tr.appendChild(tdTime);
    tr.appendChild(tdType);
    tr.appendChild(tdPrice);
    tbody.appendChild(tr);
    return rowNumber;
}

function executeCalculations(startingMoney, interval, intervalsBack) {
    const portfolioValues  = [];
    let rowNumber = 1;
    const tbody = document.querySelector('#actionTable tbody');
    tbody.innerHTML = '';
    interval = parseInt(interval);
    let money = parseFloat(startingMoney);
    let stock = 0;
    let holding = false;
    let maxPortfolioValue = 0;
    actions = [];
    let array = null;
    if (uploadedFunctionAvailable === "wasm") {
        array = new Float64Array(memory.buffer, 0, intervalsBack)
    }

    const t0 = performance.now();

    for (let i = 0; i < jsonData.length; i += interval) {
        const startIdx = Math.max(0, i - intervalsBack * interval);
        const windowData = jsonData.slice(startIdx, i).filter((_, idx) => idx % interval === 0);
        const prices = windowData.map(d => parseFloat(d.avgPrice));
        let resCode = 0;

        if (uploadedFunctionAvailable === "js") {
            resCode = strategyJS(prices, intervalsBack);
        } else if (uploadedFunctionAvailable === "wasm" && array) {
            array.set(prices);
            if (strategy) {
                resCode = strategy(array.byteOffset, prices.length, intervalsBack);
            }
        } else {
            return;
        }

        let action = null;
        if (resCode === 1) {
            action = {signal: 'buy'};
        } else if (resCode === -1) {
            action = {signal: 'sell'};
        } else {
            action = null;
        }

        const { time, avgPrice } = jsonData[i];
        const date = new Date(time);
        const price = parseFloat(avgPrice);

        if (action && (action.signal === 'sell' || action.signal === 'buy')) {
            if (action.signal === 'buy' && money > 0) {
                rowNumber = appendTradeRow(time, action, rowNumber, date, price, tbody);

                stock = money / price;
                money = 0;
                holding = true;
            } else if (action.signal === 'sell' && stock > 0) {
                rowNumber = appendTradeRow(time, action, rowNumber, date, price, tbody);

                money = stock * price;
                stock = 0;
                holding = false;
            }
        }

        const value = holding ? stock * price : money;
        const lastVal = portfolioValues[portfolioValues.length - 1]?.value;
        if (lastVal !== value) {
            portfolioValues.push({ time, value });
        }
        if (value > maxPortfolioValue) {
            maxPortfolioValue = value;
        }
    }

    const { minTime, maxTime } = drawChart(jsonData, actions);
    drawPortfolioChart(portfolioValues, minTime, maxTime, maxPortfolioValue, actions);

    const t1 = performance.now();
    const lastPortfolio = portfolioValues[portfolioValues.length - 1];
    const endPortValue = lastPortfolio ? lastPortfolio.value : parseFloat(startingMoney);
    const absProfit = endPortValue - parseFloat(startingMoney);
    document.getElementById('resEndMoney').textContent = endPortValue.toFixed(2);
    document.getElementById('resAbsProfit').textContent = absProfit.toFixed(2).toString();
    document.getElementById('resPercentProfit').textContent = ((absProfit / startingMoney) * 100).toFixed(2) + '%';
    document.getElementById('sharpeRatio').textContent = calculateSharpeRatio(portfolioValues).toFixed(2).toString();
    document.getElementById('executionSpeed').textContent = (t1 - t0).toFixed(2) + " ms";
}