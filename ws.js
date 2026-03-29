const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });

let online = 0;

wss.on("connection", (ws) => {
  online++;

  // envia pra todos
  broadcast();

  ws.on("close", () => {
    online--;
    broadcast();
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

console.log("Servidor rodando na porta 3000");
