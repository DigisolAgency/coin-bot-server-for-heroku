import mongoose, { Schema, Document } from "mongoose";

interface IHistory extends Document {
  memePadName: string;
  wallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: "buy" | "sell";
  amount: number;
  signature: string;
}

const HistorySchema: Schema = new Schema({
  memePadName: { type: String, required: true },
  wallet: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  tokenSymbol: { type: String, required: true },
  type: { type: String, enum: ["buy", "sell"], required: true },
  amount: { type: Number, required: true },
  signature: { type: String, required: true },
});

export default mongoose.model<IHistory>("History", HistorySchema);
