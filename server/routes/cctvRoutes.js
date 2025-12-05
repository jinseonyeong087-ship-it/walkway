import express from "express";
import CCTV from "../models/CCTV.js";

const router = express.Router();

// ✅ 전체 CCTV 조회 (100건 제한)
router.get("/", async (req, res) => {
  try {
    const cctvs = await CCTV.find().limit(100);
    console.log("✅ CCTV 데이터 개수:", cctvs.length);
    res.json(cctvs);
  } catch (err) {
    console.error("❌ CCTV fetch error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
