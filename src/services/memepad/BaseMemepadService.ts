// src/services/BaseWalletService.ts

import { IMemePad, ISettings } from "../../models/memepad.model";

export interface IBaseMemePadService {
  createMemePad(name: string, settings: ISettings): Promise<IMemePad>;
  deleteMemePad(name: string): Promise<string>;
  updateMemePad(name: string, settings: ISettings): Promise<IMemePad>;
  listMemePadsNames(): Promise<string[]>;
  getMemePad(name: string): Promise<IMemePad | null>;
  memePadPurchaseActive(name: string): Promise<boolean>;

  startPurchasingTokens(
    memePadName: string,
    settings: ISettings
  ): Promise<void>;

  stopPurchasingTokens(memePadName: string): Promise<void>;
  trackStatistics(memePadName: string): Promise<any[]>;

  sellToken(
    memePadName: string,
    wallet: string,
    tokenAddress: string,
    percentage: number,
    slippage: number
  ): Promise<void>;
}
