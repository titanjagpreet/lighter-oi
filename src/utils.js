import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

const hasUpstashEnv = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Initialize Upstash client if env vars are present; otherwise use in-memory fallback
export const redis = hasUpstashEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

let inMemoryTotalOI = 0; // fallback store when Upstash is not configured

// Save total OI (overwrite old value)
export async function saveTotalOI(totalOI) {
  try {
    if (redis) {
      await redis.set("total_open_interest_usd", totalOI);
    } else {
      inMemoryTotalOI = totalOI;
    }
  } catch (error) {
    console.error("❌ Error saving total OI:", error);
  }
}

// Fetch total OI
export async function getTotalOI() {
  try {
    if (redis) {
      const totalOI = await redis.get("total_open_interest_usd");
      return totalOI || 0;
    }
    return inMemoryTotalOI || 0;
  } catch (error) {
    console.error("❌ Error getting total OI:", error);
    return 0;
  }
}