import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    region: { type: String },
    type: { type: String },
    area: { type: Number },
    district: { type: String },

    // 기존 좌표
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },

    // 🔥 CCTV/가로등 정보 추가 (필수)
    cctv: { type: Number, default: 0 },
    lights: { type: Number, default: 0 },

    // 🔥 geoNear용 GeoJSON 필드
    location: {
      type: { type: String, default: "Point" },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
  },
  { timestamps: true }
);

const Route = mongoose.model("Route", routeSchema, "routes");
export default Route;
