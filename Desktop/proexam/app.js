const express = require("express");
const app = express();
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

app.set("trust proxy", 1);

// Import Routes - Corrected path based on your src structure
const authRoutes = require("./src/modules/auth/authRoutes");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too Many Requests from this IP",
});

app.use(limiter);
app.use(helmet());

// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://filmydock-frontend.onrender.com"
// ];

app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
}));

app.use(express.json());

// Root API path
app.use("/api/auth", authRoutes);

module.exports = app;