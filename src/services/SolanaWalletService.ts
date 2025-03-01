// src/services/SolanaWalletService.ts
import {
  broadcastMessage,
  initPumpfunWebSocket,
} from "../utils/websocket";

import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import config from "../config/config";
import { encrypt } from "../utils/encrypt";
import WalletModel, { IWallet } from "../models/wallet.model";
import GroupModel from "../models/group.model";
import bs58 from "bs58";
import { IBaseWalletService } from "./BaseWalletService";

const SOLANA = "solana";

export class SolanaWalletService implements IBaseWalletService {
  private connection: Connection;
  private subscriptions: Map<string, number>;

  constructor() {
    this.connection = new Connection(config.solanaRpc, "confirmed");
    this.subscriptions = new Map();

    GroupModel.updateMany(
      { chain: SOLANA },
      { "settings.purchaseActive": false }
    ).exec();

    initPumpfunWebSocket();
  }

  async createGroup(group: string, privateKeys: string[]): Promise<IWallet[]> {
    const newGroupData = {
      name: group,
      addressCount: privateKeys.length,
      chain: SOLANA,
    };

    await GroupModel.create(newGroupData);

    const wallets = await Promise.all(
      privateKeys.map((privateKey) => this.addWallet(privateKey, group, true))
    );

    return wallets;
  }

  async addWallet(
    privateKey: string,
    group: string,
    isGroupCreation?: boolean
  ): Promise<IWallet> {
    const secretKey = bs58.decode(privateKey);
    if (secretKey.length !== 64) {
      throw new Error("Invalid Solana private key length");
    }
    const keypair = Keypair.fromSecretKey(secretKey);
    const encryptedPrivateKey = encrypt(privateKey);

    const newWalletData = {
      address: keypair.publicKey.toBase58(),
      privateKey: encryptedPrivateKey,
      group,
      chain: SOLANA,
    };

    const newWallet = await WalletModel.create(newWalletData);

    if (!isGroupCreation) {
      const groupData = await GroupModel.findOne({
        name: group,
        chain: SOLANA,
      }).exec();

      if (groupData) {
        groupData.addressCount++;
        await groupData.save();
      }
    }

    return newWallet;
  }

  async deleteGroup(group: string): Promise<string> {
    await WalletModel.deleteMany({ group, chain: SOLANA }).exec();
    await GroupModel.deleteOne({ name: group, chain: SOLANA }).exec();

    return group;
  }

  async removeWallet(address: string, group: string): Promise<IWallet | null> {
    const wallet = await WalletModel.findOneAndDelete({
      address,
      group,
      chain: SOLANA,
    }).exec();

    const groupData = await GroupModel.findOne({
      name: group,
      chain: SOLANA,
    });

    if (groupData) {
      groupData.addressCount--;
      await groupData.save();
    }

    return wallet;
  }

  async listWallets(group: string): Promise<IWallet[]> {
    return await WalletModel.find({ group, chain: SOLANA }).exec();
  }

  async getBalances(group: string): Promise<any[]> {
    const wallets = await this.listWallets(group);
    const balances = await Promise.all(
      wallets.map(async (wallet) => {
        const balance = await this.connection.getBalance(
          new PublicKey(wallet.address)
        );
        return {
          address: wallet.address,
          balance: balance / 1e9,
          group: wallet.group,
        };
      })
    );
    return balances;
  }

  async getGroupsNames(): Promise<string[]> {
    const groups = await WalletModel.distinct("group", { chain: SOLANA });
    return groups;
  }

  async startTrackingBalances(group: string): Promise<void> {
    const wallets = await this.listWallets(group);

    wallets.forEach((wallet) => {
      if (this.subscriptions.has(wallet.address)) return;

      const subscriptionId = this.connection.onAccountChange(
        new PublicKey(wallet.address),
        (account) => {
          const updatedBalance = account.lamports / 1e9;
          this.sendBalanceUpdate(wallet.address, updatedBalance, wallet.group);
        },
        "confirmed"
      );

      this.subscriptions.set(wallet.address, subscriptionId);
    });
  }

  async stopTrackingBalances(group: string): Promise<void> {
    const wallets = await this.listWallets(group);

    wallets.forEach((wallet) => {
      const subscriptionId = this.subscriptions.get(wallet.address);

      if (subscriptionId !== undefined) {
        this.connection.removeAccountChangeListener(subscriptionId);
        this.subscriptions.delete(wallet.address);
      }
    });
  }

  private sendBalanceUpdate(
    address: string,
    balance: number,
    group: string | undefined
  ): void {
    const message = JSON.stringify({
      type: "solana_balance_update",
      address,
      balance,
      group,
    });
    broadcastMessage(message);
  }
}
