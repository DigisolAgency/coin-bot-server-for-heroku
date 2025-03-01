// src/services/BaseWalletService.ts
import { IWallet } from "../models/wallet.model";

export interface IBaseWalletService {
  createGroup(group: string, privateKeys: string[]): Promise<IWallet[]>;
  addWallet(privateKey: string, group: string): Promise<IWallet>;
  deleteGroup(group: string): Promise<string>;
  removeWallet(address: string, group: string): Promise<IWallet | null>;
  listWallets(group: string): Promise<IWallet[]>;
  getBalances(group: string): Promise<any[]>;
  getGroupsNames(): Promise<string[]>;
  startTrackingBalances(group: string): Promise<void>;
  stopTrackingBalances(group: string): Promise<void>;
}
