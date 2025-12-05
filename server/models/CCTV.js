import mongoose from "mongoose";

const cctvSchema = new mongoose.Schema({
  location_name: String,
  purpose: String,
  year: String,
  latitude: Number,
  longitude: Number,
  organization: String,

  // ⭐ GeoJSON 위치 (안전 경로·근처 조회에 필수)
  location: {
    type: { type: String, default: "Point" },
    coordinates: {
      type: [Number], // [lng, lat]
      index: "2dsphere",
    },
  },
});

const CCTV = mongoose.model("CCTV", cctvSchema, "cctvs");
export default CCTV;
