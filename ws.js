import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(msg.toString());
      }
    });
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log("Rodando na porta", PORT);
});
