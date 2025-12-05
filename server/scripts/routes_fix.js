import mongoose from "mongoose";
import dotenv from "dotenv";
import Route from "../models/Route.js";

dotenv.config();

console.log("🧪 DEBUG MONGO_URI:", process.env.MONGO_URI);   // ← 추가!

const MONGO_URI = process.env.MONGO_URI;

async function fixRoutes() {
  try {
    console.log("📌 MongoDB 연결 중...");
    await mongoose.connect(MONGO_URI);

    console.log("📌 routes 컬렉션 업데이트 시작...");

    const routes = await Route.find({});
    console.log(`총 ${routes.length}개 공원 업데이트 시작`);

    for (const r of routes) {
      if (!r.latitude || !r.longitude) continue;

      r.location = {
        type: "Point",
        coordinates: [r.longitude, r.latitude],
      };

      await r.save();
    }

    console.log("✔ 모든 routes 문서에 location 추가 완료");
    process.exit(0);
  } catch (err) {
    console.error("❌ 오류:", err);
    process.exit(1);
  }
}

fixRoutes();
