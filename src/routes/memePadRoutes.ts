import { Router } from "express";
import { checkSchema, Location } from "express-validator";

import {
  createMemePad,
  deleteMemePad,
  listMemePadsNames,
  getMemePad,
  updateMemePad,
  isActiveMemePad,
  startPurchases,
  stopPurchases,
  trackStatistics,
  unTrackStatistics,
  sellToken,
  getHistory,
  getSellHistory,
  getBuyHistory,
} from "../controllers/memePadController";

const router = Router();

const createMemePadSchema = {
  name: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  settings: {
    in: ["body"] as Location[],
    isObject: true,
    notEmpty: true,
  },
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const deleteMemePadSchema = {
  name: {
    in: ["params"] as Location[],
    isString: true,
    notEmpty: true,
  },
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const updateMemePadSchema = {
  name: {
    in: ["params"] as Location[],
    isString: true,
    notEmpty: true,
  },
  settings: {
    in: ["body"] as Location[],
    isObject: true,
    notEmpty: true,
  },
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const getMemePadSchema = {
  name: {
    in: ["params"] as Location[],
    isString: true,
    notEmpty: true,
  },
  chain: {
    in: ["query"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const isActiveMemePadSchema = {
  name: {
    in: ["params"] as Location[],
    isString: true,
    notEmpty: true,
  },
  chain: {
    in: ["query"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const listMemePadsNamesSchema = {
  chain: {
    in: ["query"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const startPurchasesSchema = {
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  memePadName: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  settings: {
    in: ["body"] as Location[],
    isObject: true,
    notEmpty: true,
  },
};

const stopPurchasesSchema = {
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  memePadName: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const trackStatisticsSchema = {
  memePadName: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const unTrackStatisticsSchema = {
  memePadName: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const sellTokenSchema = {
  memePadName: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  wallet: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  tokenAddress: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  percentage: {
    in: ["body"] as Location[],
    isNumeric: true,
    notEmpty: true,
  },
  slippage: {
    in: ["body"] as Location[],
    isNumeric: true,
    notEmpty: true,
  },
};

const historySchema = {
  memePadName: {
    in: ["params"] as Location[],
    isString: true,
    notEmpty: true,
  },
  chain: {
    in: ["query"] as Location[],
    isString: true,
    notEmpty: true,
  },
}

router.post("/create", checkSchema(createMemePadSchema), createMemePad);
router.delete("/:name", checkSchema(deleteMemePadSchema), deleteMemePad);
router.put("/:name", checkSchema(updateMemePadSchema), updateMemePad);
router.get("/names", checkSchema(listMemePadsNamesSchema), listMemePadsNames);
router.get("/names/:name", checkSchema(getMemePadSchema), getMemePad);

router.get(
  "/isActive/:name",
  checkSchema(isActiveMemePadSchema),
  isActiveMemePad
);

router.post(
  "/startPurchases",
  checkSchema(startPurchasesSchema),
  startPurchases
);

router.post("/stopPurchases", checkSchema(stopPurchasesSchema), stopPurchases);

router.post(
  "/trackStatistics",
  checkSchema(trackStatisticsSchema),
  trackStatistics
);

router.post(
  "/unTrackStatistics",
  checkSchema(unTrackStatisticsSchema),
  unTrackStatistics
);

router.post("/sellToken", checkSchema(sellTokenSchema), sellToken);

router.get("/history/:memePadName", checkSchema(historySchema), getHistory);
router.get("/sellHistory/:memePadName", checkSchema(historySchema), getSellHistory);
router.get("/buyHistory/:memePadName", checkSchema(historySchema), getBuyHistory);

export default router;
