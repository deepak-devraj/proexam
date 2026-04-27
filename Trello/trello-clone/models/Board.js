import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
  title: String,
});

export default mongoose.models.Board || mongoose.model("Board", boardSchema);