import { VersionedTransaction, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const sendBuyTransactionWithJito = async (
  signerKeyPair: Keypair,
  mint: string,
  amount: number,
  slippage: number,
  priorityFee: number
) => {
  return await sendTransactionWithJito(
    signerKeyPair,
    mint,
    amount,
    slippage,
    priorityFee,
    "buy",
    "true"
  );
};

export const sendSellTransactionWithJito = async (
  signerKeyPair: Keypair,
  mint: string,
  amount: number,
  slippage: number,
  priorityFee: number
) => {
  return await sendTransactionWithJito(
    signerKeyPair,
    mint,
    amount,
    slippage,
    priorityFee,
    "sell",
    "false"
  );
};

const sendTransactionWithJito = async (
  signerKeyPair: Keypair,
  mint: string,
  amount: number,
  slippage: number,
  priorityFee: number,
  action: "buy" | "sell",
  denominatedInSol: "true" | "false"
) => {
  const bundledTxArgs = [
    {
      publicKey: signerKeyPair.publicKey.toBase58(),
      action: action,
      mint: mint,
      denominatedInSol: denominatedInSol,
      amount: amount,
      slippage: slippage,
      priorityFee: priorityFee,
      pool: "pump",
    },
  ];
  const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bundledTxArgs),
  });
  if (response.status === 200) {
    const transactions = await response.json();
    let encodedSignedTransactions = [];
    let signatures = [];
    for (let i = 0; i < bundledTxArgs.length; i++) {
      const tx = VersionedTransaction.deserialize(
        new Uint8Array(bs58.decode(transactions[i]))
      );
      tx.sign([signerKeyPair]);
      encodedSignedTransactions.push(bs58.encode(tx.serialize()));
      signatures.push(bs58.encode(tx.signatures[0]));
    }

    try {
      const jitoResponse = await fetch(
        `https://mainnet.block-engine.jito.wtf/api/v1/bundles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "sendBundle",
            params: [encodedSignedTransactions],
          }),
        }
      );
      console.log("JitoResponse", jitoResponse);
    } catch (e: any) {
      console.error("JitoError", e.message);
      return false;
    }
    for (let i = 0; i < signatures.length; i++) {
      console.log(`Transaction: https://solscan.io/tx/${signatures[i]}`);
    }
  } else {
    console.log("Pumpfun error:", response.statusText);
    return false;
  }

  return true;
};
