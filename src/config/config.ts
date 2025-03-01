// src/config/config.ts
import "./env";

interface Config {
  solanaRpc: string;
  port: string;
  encryptionKey: string;
  mongodbUri: string;
}

const config: Config = {
  solanaRpc: process.env.SOLANA_RPC || "",
  port: process.env.PORT || "",
  encryptionKey: process.env.ENCRYPTION_KEY || "",
  mongodbUri: process.env.MONGODB_URI || "",
};

export default config;
