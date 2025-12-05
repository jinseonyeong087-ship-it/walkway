import express from "express";
import Route from "../models/Route.js";
import CCTV from "../models/CCTV.js";
import Light from "../models/Light.js";

const router = express.Router();

/* ============================================================
   1) 전체 공원 목록
============================================================ */
router.get("/", async (req, res) => {
  console.log("📌 [/api/routes] 전체 공원 목록 요청됨");
  try {
    const routes = await Route.find({});
    console.log("📥 전체 공원 개수:", routes.length);
    res.json(routes);
  } catch (err) {
    console.error("❌ 전체 공원 조회 오류:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   2) 근처 공원 조회 (🔥 WalkWay 전용)
============================================================ */
router.get("/near", async (req, res) => {
  console.log("📌 [/api/routes/near] 요청 query:", req.query);

  try {
    const { lat, lng } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.log("⚠ 잘못된 좌표:", lat, lng);
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    console.log("📌 사용자 위치:", latitude, longitude);

    const parks = await Route.find({});
    console.log("📥 총 공원 수:", parks.length);

    const calcDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const result = [];

    for (const p of parks) {
      if (!p.latitude || !p.longitude) continue;

      const dist = calcDistance(latitude, longitude, p.latitude, p.longitude);

      if (dist <= 1.0) {
        const range = 0.002;

        const cctvCount = await CCTV.countDocuments({
          latitude: { $gte: p.latitude - range, $lte: p.latitude + range },
          longitude: { $gte: p.longitude - range, $lte: p.longitude + range },
        });

        const lightCount = await Light.countDocuments({
          latitude: { $gte: p.latitude - range, $lte: p.latitude + range },
          longitude: { $gte: p.longitude - range, $lte: p.longitude + range },
        });

        result.push({
          _id: p._id,
          name: p.name,
          region: p.region,
          district: p.district,
          lat: p.latitude,
          lng: p.longitude,
          distance: Number(dist.toFixed(2)),
          cctv: cctvCount,
          lights: lightCount,
        });
      }
    }

    console.log("📥 반환할 근처 공원 수:", result.length);

    result.sort((a, b) => a.distance - b.distance);
    res.json(result);
  } catch (err) {
    console.error("❌ [/routes/near] 근처 공원 조회 오류:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   3) 추천 API
============================================================ */
router.get("/recommend", async (req, res) => {
  console.log("📌 [/api/routes/recommend] 요청:", req.query);

  try {
    const { lat, lng } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const nearbyRoutes = await Route.find({
      latitude: { $gte: latitude - 0.03, $lte: latitude + 0.03 },
      longitude: { $gte: longitude - 0.03, $lte: longitude + 0.03 },
    });

    const grouped = Object.values(
      nearbyRoutes.reduce((acc, cur) => {
        if (!acc[cur.name]) {
          acc[cur.name] = {
            name: cur.name,
            region: cur.region,
            district: cur.district,
            latitude: cur.latitude,
            longitude: cur.longitude,
            area: cur.area,
            type: cur.type,
            safetyScore: 0,
          };
        }
        return acc;
      }, {})
    );

    for (const park of grouped) {
      const minLat = park.latitude - 0.002;
      const maxLat = park.latitude + 0.002;
      const minLng = park.longitude - 0.002;
      const maxLng = park.longitude + 0.002;

      const cctvCount = await CCTV.countDocuments({
        latitude: { $gte: minLat, $lte: maxLat },
        longitude: { $gte: minLng, $lte: maxLng },
      });

      const lightCount = await Light.countDocuments({
        latitude: { $gte: minLat, $lte: maxLat },
        longitude: { $gte: minLng, $lte: maxLng },
      });

      park.safetyScore = cctvCount * 2 + lightCount;
    }

    grouped.sort((a, b) => b.safetyScore - a.safetyScore);

    res.json({
      criteria: "안전도 기반 추천",
      totalFound: grouped.length,
      routes: grouped.slice(0, 5),
    });
  } catch (err) {
    console.error("❌ 추천 오류:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================================================
   ✅ 반드시 필요!!
============================================================ */
export default router;
