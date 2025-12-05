import express from "express";
import Light from "../models/Light.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const lights = await Light.find();
    res.json(lights);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
