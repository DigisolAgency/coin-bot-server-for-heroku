import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { CoinInfo, getCoinInfo as _getCoinInfo } from "./handleNewToken";

export const getWalletBalance = async (
  wallet: string,
  balances: Map<string, number>,
  connection: Connection
): Promise<number> => {
  if (balances.has(wallet)) {
    return balances.get(wallet) || 0;
  } else {
    const balance = await connection.getBalance(new PublicKey(wallet));
    balances.set(wallet, balance);
    return balance;
  }
};

export const getTokenAccount = async (
  wallet: string,
  tokenAddress: string,
  accounts: Map<string, PublicKey>
): Promise<PublicKey> => {
  const key = wallet + tokenAddress;
  if (accounts.has(key)) {
    return accounts.get(key) || PublicKey.default;
  } else {
    const tokenAccount = await getAssociatedTokenAddress(
      new PublicKey(tokenAddress),
      new PublicKey(wallet)
    );
    accounts.set(key, tokenAccount);
    return tokenAccount;
  }
};

export const getCoinInfo = async (
  tokenAddress: string,
  coinInfos: Map<string, CoinInfo>
): Promise<CoinInfo> => {
  if (coinInfos.has(tokenAddress)) {
    return coinInfos.get(tokenAddress) || {};
  } else {
    const coinInfo = await _getCoinInfo(tokenAddress);
    coinInfos.set(tokenAddress, coinInfo);
    return coinInfo;
  }
};
