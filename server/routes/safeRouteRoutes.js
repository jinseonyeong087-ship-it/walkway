import express from "express";
import axios from "axios";
import polyline from "@mapbox/polyline";
import CCTV from "../models/CCTV.js";
import Light from "../models/Light.js";

const router = express.Router();

/* ===========================================
   🔥 GET /api/routes/safe-route
   안전 경로 추천 API
=========================================== */
router.get("/safe-route", async (req, res) => {
  try {
    const { lat, lng, destLat, destLng } = req.query;

    if (!lat || !lng || !destLat || !destLng) {
      return res.status(400).json({ message: "좌표가 부족합니다." });
    }

    const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

    // 📌 Google Directions 3개 경로 요청
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lng}&destination=${destLat},${destLng}&alternatives=true&mode=walking&key=${GOOGLE_KEY}`;

    const gRes = await axios.get(url);
    const routes = gRes.data.routes;

    if (!routes || routes.length === 0) {
      return res.status(404).json({ message: "경로를 찾지 못했습니다." });
    }

    let bestRoute = null;
    let bestScore = -999999;

    // 📌 각 경로마다 CCTV/Light 기반 점수 계산
    for (let r of routes) {
      const points = polyline.decode(r.overview_polyline.points);

      let cctvCount = 0;
      let lightCount = 0;

      for (const p of points) {
        const lat = p[0];
        const lng = p[1];

        // CCTV 반경 30m
        const nearCCTV = await CCTV.find({
          lat: { $gt: lat - 0.0003, $lt: lat + 0.0003 },
          lng: { $gt: lng - 0.0003, $lt: lng + 0.0003 },
        });

        // Light 반경 30m
        const nearLight = await Light.find({
          lat: { $gt: lat - 0.0003, $lt: lat + 0.0003 },
          lng: { $gt: lng - 0.0003, $lt: lng + 0.0003 },
        });

        cctvCount += nearCCTV.length;
        lightCount += nearLight.length;
      }

      // 점수 계산식
      const score = cctvCount * 2 + lightCount * 1;

      if (score > bestScore) {
        bestScore = score;
        bestRoute = {
          score,
          cctv: cctvCount,
          lights: lightCount,
          polyline: r.overview_polyline.points,
        };
      }
    }

    res.json({
      success: true,
      route: bestRoute,
    });
  } catch (err) {
    console.error("❌ 안전 경로 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
