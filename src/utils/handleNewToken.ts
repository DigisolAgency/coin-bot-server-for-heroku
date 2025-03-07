import {
  Connection,
  Keypair,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";
import { decrypt } from "./encrypt";
import bs58 from "bs58";
import memepadModel, { IMemePad } from "../models/memepad.model";
import walletModel from "../models/wallet.model";
import { sendBuyTransactionWithJito } from "./jitoBundles";
import { broadcastMessage, unsubscribeFromPumpfunData } from "./websocket";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import historyModel from "../models/history.model";
import { getSolanaPrice } from "./statistics";

export interface CoinInfo {
  usd_market_cap?: number;
  total_supply?: number;
  market_cap?: number;
}

const SOLANA = "solana";

export const handleNewToken = async (
  tokenData: any,
  activeMemePads: IMemePad[],
  connection: Connection,
  buyings: Map<string, number>
) => {
  if (!tokenData.name) return;

  for await (const memepad of activeMemePads) {
    const wallets = await walletModel.find({
      group: memepad.settings.walletsListName,
      chain: SOLANA,
    });

    const index = buyings.get(memepad.name) || 0;
    const wallet = wallets[index % wallets.length];

    // if (wallet.purchases >= memepad.settings.buyingPerWallet) {
    //   memepad.settings.purchaseActive = false;
    //   await memepad.save();

    //   const activeMemePads = await memepadModel.find({
    //     "settings.purchaseActive": true,
    //     chain: SOLANA,
    //   });

    //   if (activeMemePads.length === 0) {
    //     unsubscribeFromPumpfunData();
    //   }

    //   continue;
    // }

    const validName = validateTokenName(
      memepad.settings.hardNames,
      memepad.settings.namesToBuy,
      tokenData.name
    );

    if (!validName) continue;
    console.log(
      `Name: ${tokenData.name}, Valid: ${validName}, With: ${memepad.settings.namesToBuy}`
    );

    const priorityFee = await getPriorityFee();
    console.log("Priority Fee: ", priorityFee);

    const tokenMintAddress = tokenData.mint;

    const keypair = getKeypair(wallet.privateKey);

    const amount =
      memepad.settings.buyingType === "range"
        ? getAmountByRange(memepad.settings.buyingRange)
        : getAmountByPercentage(
            await connection.getBalance(keypair.publicKey),
            memepad.settings.buyingPercentage
          );

    console.log("Amount: ", amount);

    const signature = await sendBuyTransactionWithJito(
      keypair,
      tokenMintAddress,
      amount,
      memepad.settings.slippage?.valueOf() || 30,
      priorityFee
    );

    if (!signature) continue;

    // try {
    //   await confirmTransaction(connection, signature);
    // } catch (error) {
    //   console.error(error);
    // }

    // const tx = await connection.getParsedTransactions([signature], {
    //   maxSupportedTransactionVersion: 0,
    // });

    // if (!tx) continue;

    // let buyAmount = 0;
    // for await (const bal of tx[0].meta.postTokenBalances) {        
    //   if (bal.owner == wallet.address) {
    //     buyAmount = bal.uiTokenAmount.uiAmount
    //     break;
    //   }
    // }

    await walletModel
      .findOneAndUpdate(
        { _id: wallet._id },
        { $inc: { purchases: 1 } },
        { new: true }
      )
      .exec();

    buyings.set(memepad.name, index + 1);

    // const tokenAccountAddress = await getAssociatedTokenAddress(
    //   new PublicKey(tokenMintAddress),
    //   keypair.publicKey
    // );

    // const balance = await connection.getTokenAccountBalance(
    //   tokenAccountAddress
    // );

    await memepadModel
      .findOneAndUpdate(
        { name: memepad.name, chain: SOLANA },
        {
          $push: {
            statistics: {
              wallet: wallet.address,
              tokenAddress: tokenMintAddress,
              tokenSymbol: tokenData.symbol,
              boughtMarketCapSol: tokenData.marketCapSol,
            },
          },
        }
      )
      .exec();

    await historyModel.create({
      memePadName: memepad.name,
      wallet: wallet.address,
      tokenAddress: tokenMintAddress,
      tokenSymbol: tokenData.symbol,
      amount: 0,
      type: "buy",
      signature
    })

    // sendBuyToken(
    //   wallet.address,
    //   tokenMintAddress,
    //   tokenData.symbol,
    //   buyAmount,
    //   tokenData.price,
    //   tokenData.marketCap
    // );
  }
};

export const validateTokenName = (
  hard: boolean[],
  namesToBuy: string[],
  newPumpfunToken: string
): boolean => {
  for (let i = 0; i < namesToBuy.length; i++) {
    const requiredName = namesToBuy[i];
    const isHard = hard[i];

    if (isHard) {
      if (newPumpfunToken.toLowerCase() == requiredName.toLowerCase()) {
        return true;
      }
    } else {
      if (newPumpfunToken.toLowerCase().includes(requiredName.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
};

export const getKeypair = (encodedPrivateKey: string) => {
  const privateKey = decrypt(encodedPrivateKey);
  return Keypair.fromSecretKey(bs58.decode(privateKey));
};

export const getAmountByRange = (
  buyingRange: { min: number; max: number } | undefined
) => {
  if (!buyingRange) {
    throw new Error("Buying range not defined");
  }

  return Math.random() * (buyingRange.max - buyingRange.min) + buyingRange.min;
};

export const getAmountByPercentage = (
  balance: number,
  buyingPercentage: number | undefined
) => {
  if (!buyingPercentage) {
    throw new Error("Buying percentage not defined");
  }

  return (balance / 1e9 / 100) * buyingPercentage;
};

export const getPriorityFee = async () => {
  const response = await fetch(
    `https://bundles.jito.wtf/api/v1/bundles/tip_floor`
  );
  const data = await response.json();
  return data[0].landed_tips_95th_percentile;
};

export const getCoinInfo = async (coin: string) => {
  const response = await fetch(
    `https://frontend-api.pump.fun/coins/${coin}?sync=false`
  );
  const data = await response.json();
  return data;
};

export const getAmountToSell = async (
  wallet: PublicKey,
  token: PublicKey,
  percentage: number,
  connection: Connection
) => {
  const walletAta = await getAssociatedTokenAddress(token, wallet);

  const tokenAmount = await connection.getTokenAccountBalance(walletAta);

  if (!tokenAmount.value.uiAmount) {
    throw new Error("Token amount not found");
  }

  return (tokenAmount.value.uiAmount / 100) * percentage;
};

export const confirmTransaction = async (
  connection: Connection,
  signature: TransactionSignature
) => {
  const block = await connection.getLatestBlockhash("confirmed");
  const { value } = await connection.confirmTransaction(
    {
      signature,
      ...block,
    },
    "confirmed"
  );

  if (value.err) {
    throw new Error(`Transaction ${signature} failed: ${value.err}`);
  }
};

// const sendBuyToken = async (
//   wallet: string,
//   tokenAddress: string,
//   tokenSymbol: number,
//   tokenAmount: number,
//   tokenPrice: number,
//   tokenMarketCapSol: number
// ) => {
//   const solPrice = await getSolanaPrice();

//   const message = JSON.stringify({
//     type: "buy_new_token",
//     wallet,
//     tokenAddress,
//     tokenSymbol,
//     tokenAmount,
//     tokenPrice,
//     percentDifference: 0,
//     tokenMarketCap: tokenMarketCapSol * solPrice,
//   });
//   broadcastMessage(message);
// };
