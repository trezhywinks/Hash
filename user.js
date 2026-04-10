const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let online = 0;
const salas = {};

wss.on("connection", (ws, req) => {
  online++;
  console.log("🔥 Entrou:", online);

  ws.send(JSON.stringify({ online }));
  broadcast();

  const url = new URL(req.url, "http://localhost");

  const user = url.searchParams.get("user");
  const to = url.searchParams.get("to");

  if (user && to) {
    const chatId = [user, to].sort().join("_");

    if (!salas[chatId]) {
      salas[chatId] = [];
    }

    if (salas[chatId].length >= 2) {
      ws.send(JSON.stringify({ erro: "Sala cheia (2 usuários)" }));
      ws.close();
      return;
    }

    salas[chatId].push(ws);

    ws.chatId = chatId;
    ws.user = user;

    console.log(`💬 ${user} entrou na sala ${chatId}`);
  }

  ws.on("message", (msg) => {
    if (!ws.chatId) return;

    const sala = salas[ws.chatId];
    if (!sala) return;

    sala.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        user: ws.user,
        nome: ws.user,
        texto: data.mensagem,
        tipo: data.tipo
      }));
    }
  });
});

  ws.on("close", () => {
    online--;
    console.log("Saiu:", online);

    broadcast();

    if (ws.chatId && salas[ws.chatId]) {
      salas[ws.chatId] = salas[ws.chatId].filter(c => c !== ws);

      if (salas[ws.chatId].length === 0) {
        delete salas[ws.chatId];
      }
    }
  });
});

function broadcast() {
  const data = JSON.stringify({ online });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

app.use(express.static("users"));

server.listen(process.env.PORT || 3000, () => {
  console.log("port = 3000 || ok");
});
