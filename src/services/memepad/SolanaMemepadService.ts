import { Connection, PublicKey } from "@solana/web3.js";
import groupModel from "../../models/group.model";
import memepadModel, { IMemePad, ISettings } from "../../models/memepad.model";
import walletModel from "../../models/wallet.model";
import { CoinInfo, getAmountToSell, getKeypair, getPriorityFee, handleNewToken } from "../../utils/handleNewToken";
import {
  initPumpfunWebSocket,
  subscribeToPumpfunData,
  unsubscribeFromPumpfunData,
} from "../../utils/websocket";
import { IBaseMemePadService } from "./BaseMemepadService";
import config from "../../config/config";
import { getCoinInfo, getTokenAccount, getWalletBalance } from "../../utils/statistics";
import { sendSellTransactionWithJito } from "../../utils/jitoBundles";

const SOLANA = "solana";

export class SolanaMemePadService implements IBaseMemePadService {
  private connection: Connection;
  private buyings: Map<string, number> = new Map();

  constructor() {
    this.connection = new Connection(config.solanaRpc, "confirmed");
    this.buyings = new Map();

    memepadModel
      .updateMany({ chain: SOLANA }, { "settings.purchaseActive": false })
      .exec();

    initPumpfunWebSocket();
  }

  async createMemePad(name: string, settings: ISettings): Promise<IMemePad> {
    const walletsListExist = await groupModel.exists({ name: settings.walletsListName });

    if (!walletsListExist) {
      throw new Error(`Wallets list ${settings.walletsListName} does not exist`);
    }

    const newMemePadData = {
      name,
      settings,
      chain: SOLANA,
    };

    const newMemePad = await memepadModel.create(newMemePadData);

    return newMemePad;
  }

  async deleteMemePad(name: string): Promise<string> {
    const deletedMemePad = await memepadModel
      .findOneAndDelete({ name, chain: SOLANA })
      .exec();

    if (!deletedMemePad) {
      throw new Error(`MemePad ${name} does not exist`);
    }

    return name;
  }

  async updateMemePad(name: string, settings: ISettings): Promise<IMemePad> {
    const updatedMemePad = await memepadModel
      .findOneAndUpdate({ name, chain: SOLANA }, { settings }, { new: true })
      .exec();

    if (!updatedMemePad) {
      throw new Error(`MemePad ${name} does not exist`);
    }

    return updatedMemePad;
  }

  async listMemePadsNames(): Promise<string[]> {
    const memePads = await memepadModel.find({ chain: SOLANA }).exec();
    return memePads.map((memePad) => memePad.name);
  }

  async getMemePad(name: string): Promise<IMemePad | null> {
    return await memepadModel.findOne({ name, chain: SOLANA }).exec();
  }

  async memePadPurchaseActive(name: string): Promise<boolean> {
    const memePad = await memepadModel.findOne({ name, chain: SOLANA }).exec();

    if (!memePad) {
      throw new Error(`MemePad ${name} does not exist`);
    }

    return memePad.settings.purchaseActive || false;
  }

  async startPurchasingTokens(
    memePadName: string,
    settings: ISettings
  ): Promise<void> {
    let memePadDoc = await memepadModel.findOne({ name: memePadName, chain: SOLANA });
    if (!memePadDoc) {
        const newMemePadData = {
          name: memePadName,
          chain: SOLANA,
        };
      
        memePadDoc = await memepadModel.create(newMemePadData);
    }

    if (memePadDoc.settings.purchaseActive) {
      throw new Error("Purchases are already active for this memePad");
    }

    if (settings.namesToBuy.length !== settings.hardNames.length) {
      throw new Error("Names to buy and hard names must have the same length");
    }

    memePadDoc.settings = settings;
    memePadDoc.settings.purchaseActive = true;
    await memePadDoc.save();

    const activeMemePads = await memepadModel.find({
      "settings.purchaseActive": true,
      chain: SOLANA,
    });

    await walletModel
      .updateMany(
        { group: settings.walletsListName, chain: SOLANA },
        { purchases: 0 }
      )
      .exec();

    if (activeMemePads.length === 1) {
        console.log(activeMemePads.length);
        
      subscribeToPumpfunData(async (tokenData) => {
        await handleNewToken(
          tokenData,
          activeMemePads,
          this.connection,
          this.buyings
        );
      });
    }
  }

  async stopPurchasingTokens(name: string): Promise<void> {
    const memePadDoc = await memepadModel.findOne({ name, chain: SOLANA });
    if (!memePadDoc) throw new Error("MemePad does not exist");

    if (!memePadDoc.settings.purchaseActive) {
      throw new Error("Purchases are not active for this memePad");
    }

    memePadDoc.settings.purchaseActive = false;
    await memePadDoc.save();

    const activeMemePads = await memepadModel.find({
      "settings.purchaseActive": true,
      chain: SOLANA,
    });

    if (activeMemePads.length === 0) {
      unsubscribeFromPumpfunData();
    }
  }

  async trackStatistics(memePadName: string): Promise<any[]> {
    const memePadStatistics = await memepadModel.findOne({
      name: memePadName,
      chain: SOLANA,
    })
      .populate("statistics")
      .exec();

    if (!memePadStatistics) return [];

    const returnStatistics: any[] = [];
    const balances: Map<string, number> = new Map();
    const accounts: Map<string, PublicKey> = new Map();
    const coinInfos: Map<string, CoinInfo> = new Map();

    for await (const stat of memePadStatistics.statistics) {
      const walletBalance = await getWalletBalance(stat.wallet, balances, this.connection);
      const tokenAccount = await getTokenAccount(stat.wallet, stat.tokenAddress, accounts);
      const tokenAmount = await this.connection.getTokenAccountBalance(tokenAccount);
      const coinInfo = await getCoinInfo(stat.tokenAddress, coinInfos);

      const tokenPrice =
        coinInfo.usd_market_cap && coinInfo.total_supply
          ? coinInfo.usd_market_cap / (coinInfo.total_supply / 1000000)
          : undefined;

      returnStatistics.push({
        wallet: stat.wallet,
        walletBalance: walletBalance / 1e9,
        tokenAddress: stat.tokenAddress,
        tokenAmount: tokenAmount.value.uiAmount,
        tokenSymbol: stat.tokenSymbol,
        tokenPrice,
        tokenMarketCap: coinInfo.usd_market_cap,
      });
    }

    return returnStatistics;
  }

  async sellToken(
    memePadName: string,
    wallet: string,
    tokenAddress: string,
    percentage: number,
    slippage: number
  ): Promise<void> {
    const memePadDoc = await memepadModel.findOne({ name: memePadName, chain: SOLANA });
    if (!memePadDoc) throw new Error("MemePad does not exist");

    const walletDoc = await walletModel.findOne({
        group: memePadDoc.settings.walletsListName, address: wallet, chain: SOLANA
    });

    if (!walletDoc) throw new Error("Wallet does not exist");

    const keypair = getKeypair(walletDoc.privateKey);
    const priorityFee = await getPriorityFee();

    const amount = await getAmountToSell(
        new PublicKey(wallet),
        new PublicKey(tokenAddress),
        percentage,
        this.connection
    )

    const success = await sendSellTransactionWithJito(
        keypair,
        tokenAddress,
        amount,
        slippage,
        priorityFee
    )

    if (!success) {
        throw new Error("Sell transaction failed");
    }

    const statistics = await memePadDoc.statistics;
    const statIndex = statistics.findIndex((stat) => stat.wallet === wallet && stat.tokenAddress === tokenAddress);
    if (statIndex === -1) {
        throw new Error("Statistics not found");
    }

    if (percentage === 100) {
        statistics.splice(statIndex, 1);
    }

    await memePadDoc.save();
  }
}
