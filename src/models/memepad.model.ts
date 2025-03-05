import mongoose, { Schema, Document } from "mongoose";

export interface IStatistics extends Document {
  wallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  boughtMarketCapSol: number;
}

export interface ISettings extends Document {
  platform: "Pumpfun" | "4meme";
  walletsListName: string;
  hardNames: boolean[];
  namesToBuy: string[];
  buyingPerWallet: number;
  buyingType: "range" | "percentage";
  buyingRange?: { min: number; max: number };
  buyingPercentage?: number;
  slippage?: number;
  purchaseActive?: boolean;
}

export interface IMemePad extends Document {
  name: string;
  settings: ISettings;
  statistics: IStatistics[];
  chain: "solana" | "bsc";
}

const MemePadSchema: Schema = new Schema({
  name: { type: String, required: true },
  walletsListName: { type: String },
  settings: {
    platform: { type: String, enum: ["Pumpfun", "4meme"] },
    walletsListName: { type: String },
    hardNames: { type: [Boolean] },
    namesToBuy: { type: [String] },
    buyingPerWallet: { type: Number },
    buyingType: { type: String, enum: ["range", "percentage"] },
    buyingRange: { min: { type: Number }, max: { type: Number } },
    buyingPercentage: { type: Number },
    slippage: { type: Number, default: 30 },
    purchaseActive: { type: Boolean, default: false },
  },
  statistics: [
    {
      wallet: { type: String },
      tokenAddress: { type: String },
      tokenSymbol: { type: String },
      boughtMarketCapSol: { type: Number },
    },
  ],
  chain: { type: String, enum: ["solana", "bsc"], required: true },
});

export default mongoose.model<IMemePad>("MemePad", MemePadSchema);
