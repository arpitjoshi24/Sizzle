const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));

app.use(express.json());

app.use("/api/v1", require("./routes"));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Restaurant API is running"
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

module.exports = app;