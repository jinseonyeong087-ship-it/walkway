import Route from "../models/Route.js";

// 거리 계산 공식 (Haversine)
const calcDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// 근처 공원 찾기
export const getNearRoutes = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Coordinates missing" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const allRoutes = await Route.find({});

    const result = allRoutes
      .map((r) => ({
        _id: r._id,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        cctv: r.cctv,
        lights: r.lights,
        distance: calcDistance(userLat, userLng, r.lat, r.lng).toFixed(2),
      }))
      .filter((r) => r.distance <= 5) // 🔥 5km 이내만 반환
      .sort((a, b) => a.distance - b.distance) // 거리 순 정렬
      .slice(0, 10); // 최대 10개

    res.json(result);
  } catch (err) {
    console.log("❌ getNearRoutes Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
