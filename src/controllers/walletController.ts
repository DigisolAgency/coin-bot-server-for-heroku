import { Request, Response } from "express";
import { WalletServiceFactory } from "../services/WalletServiceFactory";
import { asyncHandler, validateRequest } from "./utils";
import { MemePadServiceFactory } from "../services/memepad/MemepadServiceFactory";

// POST /wallets/createGroup
export const createWalletGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { group, privateKeys, chain } = req.body;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  const wallets = await walletService.createGroup(group, privateKeys);

  res.status(201).json({ message: "Wallet group created successfully", wallets });
});

// POST /wallets/addWallet
export const addWallet = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { privateKey, group, chain } = req.body;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  const wallet = await walletService.addWallet(privateKey, group);

  res.status(201).json({ message: "Wallet added successfully", wallet });
});

// DELETE /wallets/:group
export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { group } = req.params;
  const { chain } = req.body;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  const deletedGroup = await walletService.deleteGroup(group);

  if (!deletedGroup) {
    res.status(404).json({ error: "Wallet group not found" });
    return;
  }

  res.status(200).json({ message: `Group ${deletedGroup} deleted successfully` });
});

// DELETE /wallets/:group/:address
export const removeWalletGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { address, group } = req.params;
  const { chain } = req.body;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  const removedWallet = await walletService.removeWallet(address, group);

  if (!removedWallet) {
    res.status(404).json({ error: "Wallet not found in specified group" });
    return;
  }

  res.status(200).json({ message: "Wallet removed from group successfully", wallet: removedWallet });
});

// GET /wallets/group/:group
export const listWalletsGroup = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { group } = req.params;
  const { chain } = req.query;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  const wallets = await walletService.listWallets(group);

  res.status(200).json({ wallets });
});

// GET /wallets/groupBalances/:group
export const getGroupBalances = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { group } = req.params;
  const { chain } = req.query;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  const balances = await walletService.getBalances(group);

  res.status(200).json({ balances });
});

// GET /wallets/groupsNames
export const getGroupsNames = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain } = req.query;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  const groups = await walletService.getGroupsNames();

  res.status(200).json({ groups });
});

// POST /wallets/startTrackingBalances
export const startTrackingBalances = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain, group } = req.body;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  await walletService.startTrackingBalances(group);

  res.status(200).json({ message: "Tracking balances started" });
});

// POST /wallets/stopTrackingBalances
export const stopTrackingBalances = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain, group } = req.body;
  const walletService = WalletServiceFactory.getService(chain as "solana" | "bsc");
  await walletService.stopTrackingBalances(group);

  res.status(200).json({ message: "Tracking balances stopped" });
});
