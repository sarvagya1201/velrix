import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";

const app = express();


// Middlewares
app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);


// Routes
app.use("/api/auth", authRoutes);


// Test Route
app.get("/", (req, res) => {
  res.send("API Running...");
});

export default app;