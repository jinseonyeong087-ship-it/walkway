import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import routeRoutes from "./routes/routeRoutes.js";
import lightRoutes from "./routes/lightRoutes.js";
import cctvRoutes from "./routes/cctvRoutes.js";
import fitnessRoutes from "./routes/fitnessRoutes.js";
import walkLogRoutes from "./routes/walkLogRoutes.js";
import nearRoutes from "./routes/nearRoutes.js";
import safeRouteRoutes from "./routes/safeRouteRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/api/routes", routeRoutes);
app.use("/api/lights", lightRoutes);
app.use("/api/cctvs", cctvRoutes);
app.use("/api/fitness", fitnessRoutes);
app.use("/api/walklog", walkLogRoutes);
app.use("/api/routes", nearRoutes);
app.use("/api/routes", safeRouteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
