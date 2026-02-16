const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Rota de login
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const usersData = JSON.parse(fs.readFileSync("users.json"));
    const user = usersData.data.find(u => u.name === username);

    if (!user) return res.status(400).json({ error: "Usuário não existe" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Senha incorreta" });

    // Login válido → envia conteúdo do dashboard
    const dashboard = fs.readFileSync("public/dashboard.html", "utf-8");
    res.send(dashboard);
});

app.listen(3000, () => console.log("Rodando em http://localhost:3000"));
