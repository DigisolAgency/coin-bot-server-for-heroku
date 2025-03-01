// src/services/WalletServiceFactory.ts

import { IBaseMemePadService } from "./BaseMemepadService";
import { BscMemePadService } from "./BscMemepadService";
import { SolanaMemePadService } from "./SolanaMemepadService";

export class MemePadServiceFactory {
  private static solanaMemePadInstance: SolanaMemePadService | null = null;
  private static bscMemePadInstance: BscMemePadService | null = null;

  static getService(chain: "solana" | "bsc"): IBaseMemePadService {
    if (chain === "solana") {
      if (!this.solanaMemePadInstance) {
        this.solanaMemePadInstance = new SolanaMemePadService();
      }
      return this.solanaMemePadInstance;
    } else if (chain === "bsc") {
      if (!this.bscMemePadInstance) {
        this.bscMemePadInstance = new BscMemePadService();
      }
      return this.bscMemePadInstance;
    } else {
      throw new Error("Unsupported chain");
    }
  }
}
