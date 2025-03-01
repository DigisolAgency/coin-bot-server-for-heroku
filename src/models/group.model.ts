import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  name: string;
  addressCount: number;
  chain: "solana" | "bsc";
}

const GroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  addressCount: { type: Number, default: 0 },
  chain: { type: String, enum: ["solana", "bsc"], required: true },
});

export default mongoose.model<IGroup>("Group", GroupSchema);
