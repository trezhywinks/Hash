const express = require("express");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();

// Configurações
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "segredo-super-seguro",
    resave: false,
    saveUninitialized: false
}));

// Rota de login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const usersData = JSON.parse(fs.readFileSync("users.json"));
    const user = usersData.data.find(u => u.name === username);

    if (!user) {
        return res.send("Usuário não existe!");
    }

    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
        return res.send("Senha incorreta!");
    }

    req.session.user = user.name;
    res.redirect("/dashboard.html");
});

// Proteção da dashboard
app.get("/dashboard.html", (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }
    next();
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});
