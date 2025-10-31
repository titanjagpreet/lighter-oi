import WebSocket from "ws";
import dotenv from "dotenv";
import { saveTotalOI } from "./utils.js";

dotenv.config();

const WS_URL = process.env.WS_URL || "wss://mainnet.zklighter.elliot.ai/ws";
const WS_CHANNEL = process.env.WS_CHANNEL || "market_stats/all";

async function connectAndCalculateOI() {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    const openInterests = {};
    let savedOnce = false;

    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "subscribe", channel: WS_CHANNEL }));
    });

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data);
        if ((msg.type === "subscribed/market_stats" || msg.type === "update/market_stats") && msg.market_stats) {
          // market_stats can be a single object or a map of id -> object
          const stats = msg.market_stats;

          if (typeof stats === "object" && !Array.isArray(stats)) {
            // Map case: iterate over values
            for (const key of Object.keys(stats)) {
              const s = stats[key];
              if (!s) continue;
              const marketId = s.market_id ?? Number(key);
              const oi = parseFloat(s.open_interest || "0");
              if (!Number.isNaN(oi)) {
                openInterests[marketId] = oi;
              }
            }
          } else {
            // Single object case
            const marketId = stats.market_id;
            const oi = parseFloat(stats.open_interest || "0");
            if (marketId != null && !Number.isNaN(oi)) {
              openInterests[marketId] = oi;
            }
          }

          // On initial snapshot, persist once then close
          if (!savedOnce && msg.type === "subscribed/market_stats") {
            const totalOI = Object.values(openInterests).reduce((a, b) => a + b, 0);
            const doubled = (totalOI * 2).toFixed(2);
            await saveTotalOI(doubled);
            console.log(`🟢 Total Open Interest (x2): ${doubled}`);
            savedOnce = true;
            try { ws.close(); } catch {}
          }
        }
      } catch (err) {
        console.error("❌ WS message parse error:", err);
      }
    });

    ws.on("close", () => {
      resolve();
    });

    ws.on("error", (err) => {
      console.error("❌ WS error:", err);
      resolve();
    });

    // Safety timeout: close after 60s if not enough data
    setTimeout(() => {
      try { ws.close(); } catch {}
      resolve();
    }, 60 * 1000);
  });
}

// Schedule: every 15 minutes
async function runWorker() {
  await connectAndCalculateOI();
  setInterval(async () => {
    await connectAndCalculateOI();
  }, 15 * 60 * 1000);
}

runWorker();