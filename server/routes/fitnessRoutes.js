import express from "express";
import Fitness from "../models/Fitness.js";

const router = express.Router();

// 전체 Fitness 데이터 조회 (100건 제한)
router.get("/", async (req, res) => {
  try {
    const fitness = await Fitness.find().limit(100);
    console.log("✅ Fitness 데이터 개수:", fitness.length);
    res.json(fitness);
  } catch (err) {
    console.error("❌ Fitness fetch error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ 반드시 default로 내보내야 함
export default router;
