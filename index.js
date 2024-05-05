import os from "os";
import pkg from "ip";
const { address } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import express from "express";
import { getSocketServer, initSocketServer } from "./socket.js";

const __dirname = fileURLToPath(import.meta.url);

const app = express();
app.use("/", express.static(path.join(__dirname, "static")));

const httpServer = createServer(app);
const port = process.env.PORT || 3500;

initSocketServer(httpServer);

httpServer
  .listen(port, () => {
    const ipAddress = address();
    console.log(`Server started on http://${ipAddress}:${port}`);
  })
  .on("error", (error) => {
    console.error(`Failed to start server: ${error}`);
  });
getSocketServer();
