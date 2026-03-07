const express = require("express");
const helmet = require("helmet");

const app = express();

// import routes
const authRoutes = require("./modules/auth/auth.routes");

// middlewares
app.use(helmet());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

module.exports = app;