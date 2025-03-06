import { Connection, PublicKey } from "@solana/web3.js";
import groupModel from "../../models/group.model";
import memepadModel, { IMemePad, ISettings } from "../../models/memepad.model";
import walletModel from "../../models/wallet.model";
import { CoinInfo, getAmountToSell, getKeypair, getPriorityFee, handleNewToken } from "../../utils/handleNewToken";
import {
  initPumpfunWebSocket,
  subscribeToPumpfunData,
  subscribeToPumpfunTokenTrade,
  unsubscribeFromPumpfunData,
  unsubscribeFromPumpfunTokenTrade,
} from "../../utils/websocket";
import { IBaseMemePadService } from "./BaseMemepadService";
import config from "../../config/config";
import { getCoinInfo, getSolanaPrice, getTokenAccount, getWalletBalance, removeStatistic } from "../../utils/statistics";
import { sendSellTransactionWithJito } from "../../utils/jitoBundles";
import { handleTokenTrade } from "../../utils/handleTokenTrade";
import historyModel from "../../models/history.model";

const SOLANA = "solana";

export class SolanaMemePadService implements IBaseMemePadService {
  private connection: Connection;
  private buyings: Map<string, number> = new Map();
  private tracks: Map<string, string[]> = new Map();

  constructor() {
    this.connection = new Connection(config.solanaRpc, "confirmed");
    this.buyings = new Map();
    this.tracks = new Map();

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

    unsubscribeFromPumpfunTokenTrade(this.tracks.get(memePadName) || []);

    const returnStatistics: any[] = [];
    const balances: Map<string, number> = new Map();
    const accounts: Map<string, PublicKey> = new Map();
    const coinInfos: Map<string, CoinInfo> = new Map();
    this.tracks.set(memePadName, []);

    const solPrice = await getSolanaPrice();
    let totalSupplyDecimals = 0;

    for await (const stat of memePadStatistics.statistics) {
      const tokenAccount = await getTokenAccount(stat.wallet, stat.tokenAddress, accounts);

      let tokenAmount = 0 as any;
      try {
        const tokenAmountResp = await this.connection.getTokenAccountBalance(tokenAccount);
        tokenAmount = tokenAmountResp.value.uiAmount;
      } catch (e) {
        await removeStatistic(stat._id as string);
        continue;
      }
    
      const walletBalance = await getWalletBalance(stat.wallet, balances, this.connection);
      const coinInfo = await getCoinInfo(stat.tokenAddress, coinInfos);
      totalSupplyDecimals = coinInfo.total_supply / 1e6;

      const tokenPriceSol = coinInfo.market_cap / totalSupplyDecimals;
      const tokenAmountsPrice = tokenPriceSol * tokenAmount;

      const boughtTokenPriceSol = stat.boughtMarketCapSol / totalSupplyDecimals;
      const boughtTokenAmountsPrice = boughtTokenPriceSol * tokenAmount;

      if (!this.tracks.get(memePadName).includes(stat.tokenAddress)) {
        this.tracks.get(memePadName).push(stat.tokenAddress);
      }

      returnStatistics.push({
        wallet: stat.wallet,
        walletBalance: walletBalance / 1e9,
        tokenAddress: stat.tokenAddress,
        tokenAmount,
        tokenSymbol: stat.tokenSymbol,
        tokenPrice: tokenAmountsPrice,
        percentDifference: ((tokenAmountsPrice - boughtTokenAmountsPrice) / boughtTokenAmountsPrice) * 100,
        tokenMarketCap: coinInfo.usd_market_cap,
      });
    }

    const tokensToTrack = this.tracks.get(memePadName);
    console.log("Tokens to track:", tokensToTrack);

    if (returnStatistics.length > 0) {
      subscribeToPumpfunTokenTrade(tokensToTrack, async (tokenData) => {
        const statisticsWithToken = memePadStatistics.statistics.filter((stat) => stat.tokenAddress === tokenData.mint);
        if (statisticsWithToken.length === 0) return;
        for await (const stat of statisticsWithToken) {          
          await handleTokenTrade(
            stat.wallet,
            stat.boughtMarketCapSol,
            solPrice,
            totalSupplyDecimals,
            this.connection,
            tokenData,
            accounts
          )
        }
      });
    }

    return returnStatistics;
  }

  async unTrackStatistics(memePadName: string): Promise<void> {
    unsubscribeFromPumpfunTokenTrade(this.tracks.get(memePadName) || []);
    this.tracks.set(memePadName, []);
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
        address: wallet, chain: SOLANA
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

    const signature = await sendSellTransactionWithJito(
        keypair,
        tokenAddress,
        amount,
        slippage,
        priorityFee
    )

    if (!signature) {
        throw new Error("Sell transaction failed");
    }

    const statistics = memePadDoc.statistics;
    const statIndex = statistics.findIndex((stat) => stat.wallet === wallet && stat.tokenAddress === tokenAddress);
    if (statIndex === -1) {
        throw new Error("Statistics not found");
    }

    if (percentage === 100) {
        statistics.splice(statIndex, 1);
    }

    await memePadDoc.save();

    const buyHistory = await historyModel.findOne({ memePadName, wallet, tokenAddress, type: "buy" }).exec();

    let tokenSymbol = "";
    if (buyHistory) {
      tokenSymbol = buyHistory.tokenSymbol;
    } else {
      tokenSymbol = "Unknown";
    }

    await historyModel.create({
      memePadName,
      wallet,
      tokenAddress,
      tokenSymbol,
      amount,
      type: "sell",
      signature
    })
  }

  async getHistory(memePadName: string): Promise<any[]> {
    let history = await historyModel
      .find({ memePadName })
      .sort({ timestamp: -1 })
      .exec();

    let isChanged = false;
    for await (const hist of history) {
      if (hist.amount !== 0) continue;

      const tx = await this.connection.getParsedTransactions([hist.signature], {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        await historyModel.deleteOne({ _id: hist._id }).exec();
        continue;
      }

      for await (const bal of tx[0].meta.postTokenBalances) {        
        if (bal.owner == hist.wallet) {
           await historyModel
            .findOneAndUpdate(
              { _id: hist._id },
              { amount: bal.uiTokenAmount.uiAmount }
            )
            .exec();
          break;
        }
      }

      isChanged = true;
    }

    if (isChanged) {
      history = await historyModel
        .find({ memePadName })
        .sort({ timestamp: -1 })
        .exec();
    }

    return history;
  }

  async getSellHistory(memePadName: string): Promise<any[]> {
    const history = await historyModel
      .find({ memePadName, type: "sell" })
      .sort({ timestamp: -1 })
      .exec();

    return history;
  }

  async getBuyHistory(memePadName: string): Promise<any[]> {
    let history = await historyModel
      .find({ memePadName, type: "buy" })
      .sort({ timestamp: -1 })
      .exec();

    let isChanged = false;
    for await (const hist of history) {
      if (hist.amount !== 0) continue;

      const tx = await this.connection.getParsedTransactions([hist.signature], {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        await historyModel.deleteOne({ _id: hist._id }).exec();
        continue;
      }

      for await (const bal of tx[0].meta.postTokenBalances) {        
        if (bal.owner == hist.wallet) {
          await historyModel
            .findOneAndUpdate(
              { _id: hist._id },
              { amount: bal.uiTokenAmount.uiAmount }
            )
            .exec();
          break;
        }
      }

      isChanged = true;
    }

    if (isChanged) {
      history = await historyModel
        .find({ memePadName, type: "buy" })
        .sort({ timestamp: -1 })
        .exec();
    }

    return history;
  }
}
