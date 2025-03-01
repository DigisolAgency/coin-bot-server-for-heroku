// src/services/BscWalletService.ts
import config from "../config/config";
import { encrypt } from "../utils/encrypt";
import WalletModel, { IWallet } from "../models/wallet.model";
import { IBaseWalletService } from "./BaseWalletService";
// import { Wallet as EthWallet, providers } from "ethers"; // Uncomment and configure for actual BSC operations.

export class BscWalletService implements IBaseWalletService {
  async createGroup(group: string, privateKeys: string[]): Promise<IWallet[]> {
    const wallets = await Promise.all(
      privateKeys.map((privateKey) => this.addWallet(privateKey, group))
    );
    return wallets;
  }

  async addWallet(privateKey: string, group: string): Promise<IWallet> {
    // Use ethers.js to derive wallet info for BSC.
    // const ethWallet = new EthWallet(privateKey);
    // const address = ethWallet.address;
    const address = "BSC_address_placeholder"; // Replace with actual logic.
    const encryptedPrivateKey = encrypt(privateKey);
    const newWalletData = {
      address,
      privateKey: encryptedPrivateKey,
      group,
      chain: "bsc",
    };

    const newWallet = await WalletModel.create(newWalletData);
    return newWallet;
  }

  async deleteGroup(group: string): Promise<string> {
    await WalletModel.deleteMany({ group, chain: "bsc" }).exec();

    return group;
  }

  async removeWallet(address: string, group: string): Promise<IWallet | null> {
    return await WalletModel.findOneAndDelete({
      address,
      group,
      chain: "bsc",
    }).exec();
  }

  async listWallets(group: string): Promise<IWallet[]> {
    return await WalletModel.find({ group, chain: "bsc" }).exec();
  }

  async getBalances(group: string): Promise<any[]> {
    const wallets = await this.listWallets(group);
    // Placeholder: In a real implementation, fetch the balance using a BSC provider.
    const balances = wallets.map((wallet) => ({
      address: wallet.address,
      balance: 0, // Replace with actual balance fetching logic
      group: wallet.group,
    }));
    return balances;
  }

  async getGroupsNames(): Promise<string[]> {
    const groups = await WalletModel.distinct("group", { chain: "bsc" });
    return groups;
  }

  async startTrackingBalances(group: string) {
    // const wallets = await this.listWallets(group);
    // wallets.forEach((wallet) => {
    //   const subscriptionId = this.connection.onAccountChange(
    //     new PublicKey(wallet.address),
    //     (account) => {
    //       console.log(
    //         `Balance change for ${wallet.address}: ${account.lamports}`
    //       );
    //     }
    //   );
    //   this.subscriptions.set(wallet.address, subscriptionId);
    // });
  }

  async stopTrackingBalances(group: string): Promise<void> {
    // const wallets = await this.listWallets(group);
    // wallets.forEach((wallet) => {
    //   const subscriptionId = this.subscriptions.get(wallet.address);
    //   if (subscriptionId) {
    //     this.connection.removeAccountChangeListener(subscriptionId);
    //   }
    // });
  }
}
