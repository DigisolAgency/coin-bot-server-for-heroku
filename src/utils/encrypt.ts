// src/utils/encrypt.ts
import crypto from "crypto";
import config from "../config/config";

const algorithm = "aes-256-cbc";
const key = config.encryptionKey;
const ivLength = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(ivLength);

  // Use SHA-256 to hash the original key and get a 32-byte key
  const encryptionKey = crypto
    .createHash("sha256")
    .update(key)
    .digest("hex")
    .slice(0, 32);

  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(encryptionKey, "utf-8"),
    iv
  );

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encryptedDataHex] = encryptedText.split(":");
  if (!ivHex || !encryptedDataHex) {
    throw new Error("Invalid encrypted text format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const encryptedData = Buffer.from(encryptedDataHex, "hex");

  // Use SHA-256 to hash the original key and get a 32-byte key
  const encryptionKey = crypto
    .createHash("sha256")
    .update(key)
    .digest("hex")
    .slice(0, 32);

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(encryptionKey, "utf-8"),
    iv
  );

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return decrypted.toString();
}
