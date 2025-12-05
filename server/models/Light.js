import mongoose from "mongoose";

const lightSchema = new mongoose.Schema({
  location_name: String,
  latitude: Number,
  longitude: Number,
  year: String,
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

const Light = mongoose.model("Light", lightSchema, "lights");
export default Light;
