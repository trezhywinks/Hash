const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { getLinkPreview } = require("link-preview-js");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let online = 0;
const salas = {};
const usuarios = {};

wss.on("connection", (ws, req) => {
  online++;
  console.log("🔥 Entrou:", online);

  ws.send(JSON.stringify({ online }));
  broadcast();

  const url = new URL(req.url, "http://localhost");

  const user = url.searchParams.get("user");
  const to = url.searchParams.get("to");


  if (user) {
    if (!usuarios[user]) {
      usuarios[user] = [];
    }
    usuarios[user].push(ws);
    ws.user = user;
  }


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

    console.log(`💬 ${user} entrou na sala ${chatId}`);
  }

  ws.on("message", (msg) => {
    let data;

    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (!ws.chatId) return;

    const sala = salas[ws.chatId];
    if (!sala) return;


    data.user = ws.user;
    data.to = data.to; 
    data.nome = data.nome || ws.user;
    data.id = data.id || Date.now() + "_" + Math.random().toString(36).slice(2);
    data.hora = data.hora || Date.now();


    sala.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });

    if (usuarios[data.to]) {
      usuarios[data.to].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }


    if (usuarios[data.user]) {
      usuarios[data.user].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
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


    if (ws.user && usuarios[ws.user]) {
      usuarios[ws.user] = usuarios[ws.user].filter(c => c !== ws);

      if (usuarios[ws.user].length === 0) {
        delete usuarios[ws.user];
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

app.get("/preview", async (req, res) => {
  const url = req.query.url;

  if (!url) return res.json({ erro: "sem url" });

  try {
    const data = await getLinkPreview(url);

    res.json({
      titulo: data.title,
      descricao: data.description,
      imagem: data.images?.[0] || null,
      site: data.siteName
    });
  } catch (e) {
    res.json({ erro: "falha preview" });
  }
});

app.use(express.static("users"));

server.listen(process.env.PORT || 3000, () => {
  console.log("port = 3000 || ok");
});
