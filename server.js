const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require('cors');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public")); 

function checkAuth(req, res, next) {
    if (req.cookies.username) {
        next();
    } else {
        res.redirect("/index.html");
    }
}

app.get("/login", (req, res) => {
    if (req.cookies.username) {

        return res.redirect("/u");
    }

    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const usersPath = path.join(__dirname, "users.json");
    const usersData = JSON.parse(fs.readFileSync(usersPath));
    const user = usersData.data.find(u => u.name === username);

    if (!user) return res.status(400).json({ error: "Usuário não existe" });
    if (password !== user.password) return res.status(400).json({ error: "Senha incorreta" });

    res.cookie("username", username, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 dia
    res.redirect("/u"); 

});

// Rota protegida para dashboard
app.get("/u", checkAuth, (req, res) => {
    const dashboardPath = path.join(__dirname, "u/index.html");
    res.sendFile(dashboardPath);
});

// Logout
app.get("/logout", (req, res) => {
    res.clearCookie("username");
    res.redirect("/index.html");
});

app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
