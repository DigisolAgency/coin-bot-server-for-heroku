import groupModel from "../../models/group.model";
import memepadModel, { IMemePad, ISettings } from "../../models/memepad.model";
import { IBaseMemePadService } from "./BaseMemepadService";

const BSC = "bsc";

export class BscMemePadService implements IBaseMemePadService {
  async createMemePad(name: string, settings: ISettings): Promise<IMemePad> {
    const walletsListExist = await groupModel.exists({
      name: settings.walletsListName,
    });

    if (!walletsListExist) {
      throw new Error(
        `Wallets list ${settings.walletsListName} does not exist`
      );
    }

    const newMemePadData = {
      name,
      settings,
      chain: BSC,
    };

    const newMemePad = await memepadModel.create(newMemePadData);

    return newMemePad;
  }

  async deleteMemePad(name: string): Promise<string> {
    const deletedMemePad = await memepadModel
      .findOneAndDelete({ name, chain: BSC })
      .exec();

    if (!deletedMemePad) {
      throw new Error(`MemePad ${name} does not exist`);
    }

    return name;
  }

  async updateMemePad(name: string, settings: ISettings): Promise<IMemePad> {
    const updatedMemePad = await memepadModel
      .findOneAndUpdate({ name, chain: BSC }, { settings }, { new: true })
      .exec();

    if (!updatedMemePad) {
      throw new Error(`MemePad ${name} does not exist`);
    }

    return updatedMemePad;
  }

  async listMemePadsNames(): Promise<string[]> {
    const memePads = await memepadModel.find({ chain: BSC }).exec();
    return memePads.map((memePad) => memePad.name);
  }

  async getMemePad(name: string): Promise<IMemePad | null> {
    return await memepadModel.findOne({ name, chain: BSC }).exec();
  }

  async memePadPurchaseActive(name: string): Promise<boolean> {
    const memePad = await memepadModel.findOne({ name, chain: BSC }).exec();

    if (!memePad) {
      throw new Error(`MemePad ${name} does not exist`);
    }

    return memePad.settings ? memePad.settings.purchaseActive || false : false;
  }

  async startPurchasingTokens(
    memePadName: string,
    settings: ISettings
  ): Promise<void> {}

  async stopPurchasingTokens(memePadName: string): Promise<void> {}
  async trackStatistics(memePadName: string): Promise<any[]> {
    return [];
  }

  async unTrackStatistics(memePadName: string): Promise<void> {}

  async sellToken(
    memePadName: string,
    wallet: string,
    tokenAddress: string,
    percentage: number,
    slippage: number
  ): Promise<void> {}

  async getHistory(memePadName: string): Promise<any[]> {
    return [];
  }
  async getSellHistory(memePadName: string): Promise<any[]> {
    return [];
  }
  async getBuyHistory(memePadName: string): Promise<any[]> {
    return [];
  }
}
