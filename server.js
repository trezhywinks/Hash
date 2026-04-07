const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");
//const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require("http");
//const { Server } = require("socket.io");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const app = express();
//app.use(cors());
//app.use(express.static("public")); 
const server = http.createServer(app);
//const io = new Server(server, {
//  cors: { origin: "*" }
//});


const wss = new WebSocket.Server({ server });

let online = 0;

wss.on("connection", (ws) => {
    online++;

    console.log("🔥 Entrou:", online);

    ws.send(JSON.stringify({ online }));

    broadcast();

    ws.on("close", () => {
        online--;
        console.log("❌ Saiu:", online);
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


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public")); 

app.use((req, res, next) => {
  const ua = (req.headers['user-agent'] || "").toLowerCase();

  const isIphoneSafari =
    ua.includes("iphone") &&
    ua.includes("safari") &&
    !ua.includes("crios") &&
    !ua.includes("fxios");

  const isChrome =
    ua.includes("chrome") || ua.includes("crios");

  const isFirefox =
    ua.includes("firefox");

  if (isIphoneSafari || isChrome || isFirefox) {
    next();
  } else {
    return res.status(403).send("<h1>erro no servidor</h1>");
  }
});

//app.use(express.static("public")); 

function checkAuth(req, res, next) {
    if (req.cookies.username) {
        next();
    } else {
        res.redirect("/index.html");
    }
}

const GITHUB_JSON = "https://raw.githubusercontent.com/trezhywinks/Hash/refs/heads/main/users.json";

app.use(express.json());

app.post("/check-user", async (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ status: "erro", message: "Nome não fornecido" });
  }

  try {
    const response = await fetch(GITHUB_JSON);

    if (!response.ok) {
      throw new Error("Erro ao buscar JSON");
    }

    const json = await response.json();

    
    const lista = Array.isArray(json) ? json : json.data;

    const existe = lista.find(u =>
      u.name?.toLowerCase() === nome?.toLowerCase()
    );

    if (existe) {
      return res.json({ status: "existe" });
    }

    return res.json({ status: "ok" });

  } catch (err) {
    console.error("ERRO BACKEND:", err);
    res.status(500).json({ status: "erro" });
  }
});


app.get("/login", (req, res) => {
    if (req.cookies.username) {

        return res.redirect("/u");
    }

    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/api/ip", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();

    res.json({
      country: data.country,
      city: data.city,
      ip: ip
    });

  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});


//https://raw.githubusercontent.com/trezhywinks/Hash/refs/heads/main/IMG_5731.jpeg

// Login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const usersPath = path.join(__dirname, "users.json");
    const usersData = JSON.parse(fs.readFileSync(usersPath));
    const user = usersData.data.find(u => u.name === username);

    if (!user) return res.status(400).json({ error: "Usuário não existe" });
    if (password !== user.password) return res.status(400).json({ error: "Senha incorreta" });

    res.cookie("username", username, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: "lax" }); // 1 dia
    res.redirect("/u"); 

});

// Rota protegida para dashboard
app.get("/u", checkAuth, (req, res) => {
    const dashboardPath = path.join(__dirname, "u/index.html");
    res.sendFile(dashboardPath);
});

app.get("/salvas", checkAuth, (req, res) => {
    const dashboardPath = path.join(__dirname, "u/chat.html");
    res.sendFile(dashboardPath);
});

app.get("/css", checkAuth, (req, res) => {
    const dashboardPath = path.join(__dirname, "u/chat.css");
    res.sendFile(dashboardPath);
});


app.get("/preview", async (req, res) => {
  const url = req.query.url;

  if (!url) return res.json({ error: "URL missing" });

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(data);

    const getMeta = (name) =>
      $(`meta[property="${name}"]`).attr("content") ||
      $(`meta[name="${name}"]`).attr("content");

    const preview = {
      title: getMeta("og:title") || $("title").text(),
      description: getMeta("og:description"),
      image: getMeta("og:image"),
      site: getMeta("og:site_name"),
      url
    };

    res.json(preview);

  } catch (err) {
    res.json({ error: "Failed to fetch" });
  }
});


app.get("/graffity", checkAuth, (req, res) => {
    const dashboardPath = path.join(__dirname, "u/graffity.ttf");
    res.sendFile(dashboardPath);
});


//graffity.ttf

// Logout
app.get("/logout", (req, res) => {
    res.clearCookie("username");
    res.redirect("/index.html");
});

server.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});

//app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
