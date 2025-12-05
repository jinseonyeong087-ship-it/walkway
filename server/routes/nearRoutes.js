import express from "express";
import Route from "../models/Route.js";
import CCTV from "../models/CCTV.js";
import Light from "../models/Light.js";

const router = express.Router();

/* ================================================
   📌 Haversine 거리 계산 함수
=================================================== */
function getDistance(lat1, lng1, lat2, lng2) {
  function toRad(value) {
    return (value * Math.PI) / 180;
  }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))); // km
}

/* ================================================
   📌 근처 공원 조회 API
   GET /api/routes/near?lat=xxx&lng=xxx
=================================================== */
router.get("/near", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    // 1) 공원 전체 가져오기
    const parks = await Route.find({});

    // 2) CCTV 전체
    const cctvs = await CCTV.find({});
    // 3) Light 전체
    const lights = await Light.find({});

    const result = parks.map((park) => {
      // 거리 계산
      const distanceKm = getDistance(
        userLat,
        userLng,
        park.latitude,
        park.longitude
      );

      // 공원 주변 CCTV 개수
      const parkCCTVs = cctvs.filter(
        (c) =>
          getDistance(park.latitude, park.longitude, c.lat, c.lng) < 0.2
      ).length;

      // 공원 주변 가로등 개수
      const parkLights = lights.filter(
        (l) =>
          getDistance(park.latitude, park.longitude, l.lat, l.lng) < 0.2
      ).length;

      return {
        _id: park._id,
        name: park.name,
        lat: park.latitude,
        lng: park.longitude,
        distance: Number(distanceKm.toFixed(2)),
        cctv: parkCCTVs,
        lights: parkLights,
      };
    });

    // 3km 이내 필터링
    const filtered = result.filter((p) => p.distance <= 3);

    // 가까운 순 정렬
    filtered.sort((a, b) => a.distance - b.distance);

    res.json(filtered);
  } catch (err) {
    console.error("❌ 근처 공원 오류:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
