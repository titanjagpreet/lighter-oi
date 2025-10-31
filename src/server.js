import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getTotalOI } from "./utils.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/open-interest", async (req, res) => {
  try {
    const totalOI = await getTotalOI();
    res.json({ total_open_interest_usd: totalOI });
  } catch (error) {
    console.error("Error fetching OI:", error);
    res.status(500).json({ error: "Failed to fetch open interest" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));