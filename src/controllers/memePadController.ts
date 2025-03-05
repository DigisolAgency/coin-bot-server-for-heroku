import { Request, Response } from "express";
import { MemePadServiceFactory } from "../services/memepad/MemepadServiceFactory";
import { asyncHandler, validateRequest } from "./utils";

// POST /memepads/create
export const createMemePad = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { name, settings, chain } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const memepad = await memepadService.createMemePad(name, settings);

  res.status(201).json({ message: "MemePad created successfully", memepad });
});

// DELETE /memepads/:name
export const deleteMemePad = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { name } = req.params;
  const { chain } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const deletedMemePad = await memepadService.deleteMemePad(name);

  if (!deletedMemePad) {
    res.status(404).json({ error: "MemePad not found" });
    return;
  }

  res.status(200).json({ message: `MemePad ${deletedMemePad} deleted successfully` });
});

// PUT /memepads/:name
export const updateMemePad = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { name } = req.params;
  const { settings, chain } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const updatedMemePad = await memepadService.updateMemePad(name, settings);

  if (!updatedMemePad) {
    res.status(404).json({ error: "MemePad not found" });
    return;
  }

  res.status(200).json({ message: `MemePad ${name} updated successfully`, memepad: updatedMemePad });
});

// GET /memepads/names
export const listMemePadsNames = asyncHandler(async (req: Request, res: Response) => {
  const { chain } = req.query;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const memePadsNames = await memepadService.listMemePadsNames();

  res.status(200).json({ memePadsNames });
});

// GET /memepads/names/:name
export const getMemePad = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { name } = req.params;
  const { chain } = req.query;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const memePad = await memepadService.getMemePad(name);

  if (!memePad) {
    res.status(404).json({ error: "MemePad not found" });
    return;
  }

  res.status(200).json({ memePad });
});

// GET /memepads/isActive/:name
export const isActiveMemePad = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { name } = req.params;
  const { chain } = req.query;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const isActive = await memepadService.memePadPurchaseActive(name);

  res.status(200).json({ isActive });
});

// POST /memepads/startPurchase
export const startPurchases = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain, settings, memePadName } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  await memepadService.startPurchasingTokens(memePadName, settings);

  res.status(200).json({ message: "Purchasing tokens started" });
});

// POST /memepads/stopPurchase
export const stopPurchases = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain, memePadName } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  await memepadService.stopPurchasingTokens(memePadName);

  res.status(200).json({ message: "Purchasing tokens stopped" });
});

// POST /memepads/trackStatistics
export const trackStatistics = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain, memePadName } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const stats = await memepadService.trackStatistics(memePadName);

  res.status(200).json({ message: "Statistics tracking started", stats });
});

// POST /memepads/unTrackStatistics
export const unTrackStatistics = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain, memePadName } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  await memepadService.unTrackStatistics(memePadName);

  res.status(200).json({ message: "Statistics tracking stopped" });
});

// POST /memepads/sellToken
export const sellToken = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { chain, memePadName, wallet, tokenAddress, percentage, slippage } = req.body;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  await memepadService.sellToken(memePadName, wallet, tokenAddress, percentage, slippage);

  res.status(200).json({ message: "Token sold successfully" });
});

// GET /memepads/history/:memePadName
export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { memePadName } = req.params;
  const { chain } = req.query;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const history = await memepadService.getHistory(memePadName);

  res.status(200).json({ history });
});

// GET /memepads/sellHistory/:memePadName
export const getSellHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { memePadName } = req.params;
  const { chain } = req.query;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const history = await memepadService.getSellHistory(memePadName);

  res.status(200).json({ history });
});

// GET /memepads/buyHistory/:memePadName
export const getBuyHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!validateRequest(req, res)) return;

  const { memePadName } = req.params;
  const { chain } = req.query;
  const memepadService = MemePadServiceFactory.getService(chain as "solana" | "bsc");
  const history = await memepadService.getBuyHistory(memePadName);

  res.status(200).json({ history });
});
