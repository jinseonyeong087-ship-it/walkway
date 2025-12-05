import mongoose from "mongoose";

const WalkLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    steps: {
      type: Number,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    kcal: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    memo: {
      type: String,
      default: "",
    },
    photo: {
      type: String,
      default: null,
    },

    /* ⭐⭐ 추가해야 하는 부분 ⭐⭐ */
    park: {
      type: String,
      required: true,
    },

    location: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WalkLog", WalkLogSchema);
