import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenAccount } from "./statistics";
import { broadcastMessage } from "./websocket";

export const handleTokenTrade = async (
  wallet: string,
  boughtMarketCapSol: number,
  solPrice: number,
  totalSupplyDecimals: number,
  connection: Connection,
  tokenData: any,
  accounts: Map<string, PublicKey>
) => {
  const tokenAccount = await getTokenAccount(wallet, tokenData.mint, accounts);
  const tokenAccountBalance = await connection.getTokenAccountBalance(
    tokenAccount
  );
  let tokenAmount = tokenAccountBalance.value.uiAmount;

  if (tokenData.traderPublicKey === wallet && tokenData.txType === "sell") {
    tokenAmount -= tokenData.tokenAmount;
  }

  const tokenPriceSol = tokenData.marketCapSol / totalSupplyDecimals;
  const tokenAmountsPrice = tokenPriceSol * tokenAmount;

  const boughtTokenPriceSol = boughtMarketCapSol / totalSupplyDecimals;  
  const boughtTokenAmountsPrice = boughtTokenPriceSol * tokenAmount;

  const percentDifference = ((tokenAmountsPrice - boughtTokenAmountsPrice) / boughtTokenAmountsPrice) * 100;

  sendTokenActivityMessage(
    wallet,
    tokenData.mint,
    tokenAmount,
    tokenAmountsPrice,
    percentDifference,
    tokenData.marketCapSol * solPrice
  );
};

const sendTokenActivityMessage = (
  wallet: string,
  tokenAddress: string,
  tokenBalance: number,
  tokenPrice: number,
  percentDifference: number,
  marketCap: number
) => {
  const message = JSON.stringify({
    type: "token_activity",
    wallet,
    tokenAddress,
    tokenBalance,
    tokenPrice,
    percentDifference,
    marketCap,
  });
  broadcastMessage(message);
};
