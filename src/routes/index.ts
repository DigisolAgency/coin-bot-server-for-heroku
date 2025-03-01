import { Router } from "express";

import walletRoutes from "./walletRoutes";
import memePadRoutes from "./memePadRoutes";

const router = Router();

router.use("/wallets", walletRoutes);
router.use("/memepads", memePadRoutes);

export default router;
