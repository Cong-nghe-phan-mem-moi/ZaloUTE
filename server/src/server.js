const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/database");

const app = express();
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  ...String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      process.env.JWT_SECRET ||
      "zaloute-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60 * 1000,
    },
  }),
);

connectDB().then(() => {
  const User = require("./models/user.model");
  User.updateMany({}, { isOnline: false })
    .then(() => console.log("Reset all users online status to offline"))
    .catch((err) => console.error("Failed to reset online statuses:", err));
});

const apiRoutes = require('./routes/api');
const NotificationService = require('./service/notification.service');
const ChatService = require('./service/chat.service');

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

NotificationService.attachWebSocketServer(server);
ChatService.attachWebSocketServer(server);
