// src/services/WalletServiceFactory.ts
import { IBaseWalletService } from "./BaseWalletService";
import { BscWalletService } from "./BscWalletService";
import { SolanaWalletService } from "./SolanaWalletService";

export class WalletServiceFactory {
  private static solanaServiceInstance: SolanaWalletService | null = null;
  private static bscServiceInstance: BscWalletService | null = null;

  static getService(chain: "solana" | "bsc"): IBaseWalletService {
    if (chain === "solana") {
      if (!this.solanaServiceInstance) {
        this.solanaServiceInstance = new SolanaWalletService();
      }
      return this.solanaServiceInstance;
    } else if (chain === "bsc") {
      if (!this.bscServiceInstance) {
        this.bscServiceInstance = new BscWalletService();
      }
      return this.bscServiceInstance;
    } else {
      throw new Error("Unsupported chain");
    }
  }
}
