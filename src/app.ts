// src/app.ts
import express from "express";
import routes from "./routes";
import cors from "cors";
import config from "./config/config";
import http from "http";
import mongoose from "mongoose";
import { initWebSocket } from "./utils/websocket";

if (!config.port || !config.solanaRpc || !config.encryptionKey || !config.mongodbUri) {
  throw new Error(
    "Missing required environment variables. Ensure .env is set correctly."
  );
}

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({ message: "CoinBot backend is running" });
});

app.use("/api", routes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log("Successfully connected to MongoDB!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = parseInt(config.port, 10);
const server = http.createServer(app);

initWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

export default app;
