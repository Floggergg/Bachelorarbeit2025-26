let groupedData = [];

// Convert dates to timestamps
const startTime = new Date("2024-01-01T00:00:00Z").getTime();
const endTime = new Date("2024-12-31T23:59:59Z").getTime();

async function fetchKlines(symbol = "BTCUSDT", interval = "1m", start = startTime, end = endTime) {
    let allData = [];
    let fetchStart = start;

    while (fetchStart < end) {
        console.log(fetchStart);
        const url = new URL("https://api.binance.com/api/v3/klines");
        url.searchParams.set("symbol", symbol);
        url.searchParams.set("interval", interval);
        url.searchParams.set("startTime", fetchStart);
        url.searchParams.set("endTime", end);
        url.searchParams.set("limit", 1000);

        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) break;

        allData.push(...data);

        // Move fetchStart to last candle closeTime + 1 ms
        fetchStart = data[data.length - 1][6] + 1;

        // Respect Binance rate limit (1200 req/minute)
        await new Promise(r => setTimeout(r, 200));
    }

    return allData;
}

function formatKlines(klines) {
    return klines.map(k => ({
        time: new Date(k[0]).toISOString(),    // openTime
        avgPrice: ((parseFloat(k[1]) + parseFloat(k[4])) / 2).toFixed(2) // avg(open, close)
    }));
}

function downloadJSON2(data, filename = "btc_024.json") {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    // Append to DOM, click, then remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

async function run() {
    console.log("Fetching BTC/USDT 1m candles for 2023...");
    const raw = await fetchKlines();
    const formatted = formatKlines(raw);
    console.log("Total candles:", formatted.length);
    downloadJSON2(formatted, "btc_023.json");
}

run();


async function fetchKrakenTrades(pair = "XXBTZUSD", since = null) {
    let url = `https://api.kraken.com/0/public/Trades?pair=${pair}`;
    if (since) url += `&since=${since}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.result || data.error.length) {
            console.error("API Error:", data.error);
            return { trades: [], last: since };
        }

        const last = data.result.last;
        const trades = data.result[pair] || [];
        return { trades, last };
    } catch (err) {
        console.error("Fetch error:", err);
        return { trades: [], last: since };
    }
}

async function loadData() {
    const tableBody = document.querySelector("#dataTable tbody");
    const asset = document.getElementById("assetSelect").value;
    const interval = parseInt(document.getElementById("intervalSelect").value);
    const sinceDate = document.getElementById("sinceInput").value;
    const untilDate = document.getElementById("untilInput").value;

    if (!sinceDate || !untilDate) {
        alert("Please select both From and To dates.");
        return;
    }

    const sinceTimestamp = Math.floor(new Date(sinceDate).getTime() / 1000);
    const untilTimestamp = Math.floor(new Date(untilDate).getTime()) * 1_000_000;

    tableBody.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

    let allTrades = [];
    let lastTimestamp = sinceTimestamp;

    while (lastTimestamp < untilTimestamp) {
        console.log('api call');
        const { trades, last } = await fetchKrakenTrades(asset, lastTimestamp);
        if (!trades.length || last === lastTimestamp) break;
        allTrades = allTrades.concat(trades);
        lastTimestamp = last;
        const date = new Date(lastTimestamp / 1e6);
        console.log(date.toISOString());
        await new Promise(r => setTimeout(r, 1000));
    }

    const grouped = new Map();
    allTrades.forEach(([price, volume, time]) => {
        const bucket = Math.floor(time / interval) * interval;
        if (!grouped.has(bucket)) grouped.set(bucket, []);
        grouped.get(bucket).push({ price: parseFloat(price), volume: parseFloat(volume) });
    });

    tableBody.innerHTML = "";
    groupedData = [];
    for (const [ts, group] of grouped) {
        if (ts < sinceTimestamp || ts > untilTimestamp) continue;
        const totalVolume = group.reduce((sum, t) => sum + t.volume, 0);
        const avgPrice = group.reduce((sum, t) => sum + t.price * t.volume, 0) / totalVolume;
        const dataRow = {
            time: new Date(ts * 1000).toISOString(),
            avgPrice: avgPrice.toFixed(2)
        };
        groupedData.push(dataRow);
    }

    document.getElementById("downloadBtn").disabled = groupedData.length === 0;
}

function downloadJSON() {
    const blob = new Blob([JSON.stringify(groupedData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kraken_data.json";
    a.click();
    URL.revokeObjectURL(url);
}
document.getElementById("downloadBtn").addEventListener("click", downloadJSON);
document.getElementById("loadBtn").addEventListener("click", loadData);