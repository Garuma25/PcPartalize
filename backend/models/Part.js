import mongoose from 'mongoose';

const PartSchema = new mongoose.Schema({
  name: String,
  aliases: [String],
  type: String,
  performance_score: Number,
  last_known_price: Number,
}, { timestamps: true });

export default mongoose.models.Part || mongoose.model("Part", PartSchema);
