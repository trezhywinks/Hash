const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require('cors');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));


app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const usersData = JSON.parse(fs.readFileSync("users.json"));
    const user = usersData.data.find(u => u.name === username);

    if (!user) return res.status(400).json({ error: "Usuário não existe" });


    if (password !== user.password) {
        return res.status(400).json({ error: "Senha incorreta" });
    }

    
    const dashboard = fs.readFileSync("public/dashboard.html", "utf-8");
    res.send(dashboard);
});

app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));