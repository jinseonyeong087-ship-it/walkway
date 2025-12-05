import mongoose from "mongoose";

const fitnessSchema = new mongoose.Schema({
  region: { type: String },
  age: { type: Number }, 
  gender: { type: String },
  fitness_grade: { type: String },
  prescription: { type: String }
});

const Fitness = mongoose.model("Fitness", fitnessSchema, "fitness"); 
export default Fitness;