import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  address: string;
  privateKey: string; // Encrypted private key
  group?: string;
  chain: "solana" | "bsc";
  purchases: number;
}

const WalletSchema: Schema = new Schema({
  address: { type: String, required: true },
  privateKey: { type: String, required: true },
  group: { type: String },
  chain: { type: String, enum: ["solana", "bsc"], required: true },
  purchases: { type: Number, default: 0 },
});

WalletSchema.path('address').validate(async function (value: string) {
  const addressCount = await mongoose.models.Wallet.countDocuments({ address: value, group: this.group });
  return !addressCount;
}, 'Address already exists in this group');

export default mongoose.model<IWallet>("Wallet", WalletSchema);
