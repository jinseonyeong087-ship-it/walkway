// server/scripts/convert_cctv_light_geojson.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import CCTV from "../models/CCTV.js";
import Light from "../models/Light.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

async function convertCollection(Model, name) {
  console.log(`\n🔄 Converting ${name} collection...`);

  const docs = await Model.find({});

  console.log(`📌 Found ${docs.length} ${name} documents`);

  for (const doc of docs) {
    if (!doc.latitude || !doc.longitude) {
      console.log(`⚠️ Skip: Missing coordinates for _id ${doc._id}`);
      continue;
    }

    doc.location = {
      type: "Point",
      coordinates: [doc.longitude, doc.latitude], // GeoJSON = [lng, lat]
    };

    await doc.save();
  }

  console.log(`✅ ${name} collection converted successfully.`);
}

async function start() {
  try {
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    console.log("✔ MongoDB Connected");

    await convertCollection(CCTV, "CCTV");
    await convertCollection(Light, "Light");

    console.log("\n🎉 ALL CONVERSIONS DONE!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Conversion Error:", err);
    process.exit(1);
  }
}

start();
