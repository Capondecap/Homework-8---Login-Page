const express = require("express")
const session = require("express-session")
const cookieParser = require("cookie-parser")
const path = require("path")

const app = express()

// =====================
// Predefined users (loaded from users.json)
// =====================

const users = require("./users.json")

// =====================
// Middleware
// =====================

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

app.use(cookieParser("super_secret_cookie_key"))

app.use(session({
    secret: "super_secret_session_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true
    }
}))

// =====================
// View Engine
// =====================

app.set("view engine", "hbs")
app.set("views", path.join(__dirname, "views"))

// =====================
// Theme Middleware
// =====================

app.use((req, res, next) => {

    const theme = req.signedCookies.theme || "light"
    res.locals.theme = theme

    next()

})

// =====================
// Authentication Middleware
// =====================

function authMiddleware(req, res, next) {

    if (!req.session.user) {
        return res.redirect("/login")
    }

    next()
}
// =====================
// Routes
// =====================

// Login Page
app.get("/login", (req, res) => {

    const error = req.query.error

    res.render("login", {
        layout: "layouts/main",
        error: error
    })

})

// Login Logic
app.post("/login", (req, res) => {

    const { username, password } = req.body
    const user = users[username]

    if (!user || user.password !== password) {
        return res.redirect("/login?error=Invalid%20credentials")
    }

    req.session.user = user

    res.redirect("/profile")

})

// Logout
app.get("/logout", (req, res) => {

    req.session.destroy(() => {
        res.clearCookie("connect.sid")
        res.redirect("/login")

    })

})

// Profile Page
app.get("/profile", authMiddleware, (req, res) => {

    res.render("profile", {
        layout: "layouts/main",
        user: req.session.user
    })

})

// Toggle Theme
app.get("/toggle-theme", (req, res) => {

    const currentTheme = req.signedCookies.theme || "light"

    const newTheme = currentTheme === "light" ? "dark" : "light"

    res.cookie("theme", newTheme, {
        signed: true,
        httpOnly: true
    })

    res.redirect(req.get("Referrer") || "/login")

})
// =====================
// Server
// =====================

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})