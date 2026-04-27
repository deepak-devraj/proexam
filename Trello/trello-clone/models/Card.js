import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List",
    required: true,
  },
});

export default mongoose.models.Card || mongoose.model("Card", cardSchema);