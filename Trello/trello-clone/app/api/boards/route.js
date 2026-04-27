import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

// Safe model creation (prevents overwrite error)
const Board =
  mongoose.models.Board ||
  mongoose.model(
    "Board",
    new mongoose.Schema(
      {
        title: { type: String, required: true },
      },
      { timestamps: true }
    )
  );

export async function GET() {
  try {
    console.log("👉 API HIT");

    await connectDB();

    console.log("👉 DB CONNECTED");

    const boards = await Board.find();

    return Response.json({
      success: true,
      data: boards,
    });
  } catch (error) {
    console.error("❌ REAL ERROR:", error); // FULL error

    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack, // 👈 IMPORTANT
      },
      { status: 500 }
    );
  }
}