import { Router } from "express";
import { checkSchema, Location } from "express-validator";

import {
  addWallet,
  deleteGroup,
  removeWalletGroup,
  listWalletsGroup,
  getGroupBalances,
  createWalletGroup,
  getGroupsNames,
  startTrackingBalances,
  stopTrackingBalances,
} from "../controllers/walletController";

const router = Router();

const createGroupSchema = {
  group: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  privateKeys: {
    in: ["body"] as Location[],
    isArray: true,
    notEmpty: true,
  },
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const addWalletSchema = {
  privateKey: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  group: {
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

const deleteGroupSchema = {
  group: {
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

const removeWalletGroupSchema = {
  address: {
    in: ["params"] as Location[],
    isString: true,
    notEmpty: true,
  },
  group: {
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

const listWalletsGroupSchema = {
  group: {
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

const getGroupBalancesSchema = {
  group: {
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

const getGroupsNamesSchema = {
  chain: {
    in: ["query"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const startTrackingBalancesSchema = {
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  group: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

const stopTrackingBalancesSchema = {
  chain: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
  group: {
    in: ["body"] as Location[],
    isString: true,
    notEmpty: true,
  },
};

router.post("/createGroup", checkSchema(createGroupSchema), createWalletGroup);
router.post("/addWallet", checkSchema(addWalletSchema), addWallet);
router.delete("/:group", checkSchema(deleteGroupSchema), deleteGroup);
router.delete("/:group/:address", checkSchema(removeWalletGroupSchema), removeWalletGroup);
router.get("/group/:group", checkSchema(listWalletsGroupSchema), listWalletsGroup);
router.get("/groupBalances/:group", checkSchema(getGroupBalancesSchema), getGroupBalances);
router.get("/groupsNames", checkSchema(getGroupsNamesSchema), getGroupsNames);
router.post("/startTrackingBalances", checkSchema(startTrackingBalancesSchema), startTrackingBalances);
router.post("/stopTrackingBalances", checkSchema(stopTrackingBalancesSchema), stopTrackingBalances);

export default router;
