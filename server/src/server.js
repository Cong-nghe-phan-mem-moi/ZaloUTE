const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");

app.use("/api", apiRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
