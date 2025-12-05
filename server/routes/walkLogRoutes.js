import express from "express";
import WalkLog from "../models/WalkLog.js";

const router = express.Router();

// 전체 조회
router.get("/all", async (req, res) => {
  try {
    const logs = await WalkLog.find().sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json([]);
  }
});

// 저장
router.post("/", async (req, res) => {
  try {
    const newLog = new WalkLog(req.body);
    await newLog.save();
    res.json({ success: true, log: newLog });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 월별 조회
router.get("/month/:ym", async (req, res) => {
  try {
    const ym = req.params.ym;
    const regex = new RegExp(`^${ym}`);
    const logs = await WalkLog.find({ date: { $regex: regex } });
    res.json(logs);
  } catch (err) {
    res.status(500).json([]);
  }
});

/* -----------------------------
   ⭐ ID 기반 조회/수정/삭제
------------------------------*/

// ID로 하나 조회
router.get("/id/:id", async (req, res) => {
  try {
    const log = await WalkLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false });
    res.json(log);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 수정
router.put("/:id", async (req, res) => {
  try {
    const updated = await WalkLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false });
    res.json({ success: true, log: updated });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 삭제
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await WalkLog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* -----------------------------
   ⭐ 이게 맨 마지막이어야 한다
------------------------------*/

// 날짜 조회 (충돌 방지)
router.get("/:date", async (req, res) => {
  try {
    const logs = await WalkLog.find({ date: req.params.date });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

export default router;
