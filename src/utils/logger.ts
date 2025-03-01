// src/utils/logger.ts
export const logger = {
  info: (message: string, ...optionalParams: any[]) => {
    console.info(`[INFO] ${message}`, ...optionalParams);
  },
  error: (message: string, ...optionalParams: any[]) => {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  },
  warn: (message: string, ...optionalParams: any[]) => {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  },
  debug: (message: string, ...optionalParams: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  },
};
