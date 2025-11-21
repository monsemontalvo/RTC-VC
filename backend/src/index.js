import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

// 1. IMPORTA LAS NUEVAS RUTAS
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";      // <--- NUEVO
import taskRoutes from "./routes/task.route.js";        // <--- NUEVO
import achievementRoutes from "./routes/achievement.route.js"; // <--- NUEVO
import emailRoutes from "./routes/email.route.js";      // <--- (Si no lo tenías)

dotenv.config();

const PORT = process.env.PORT || 5003;
const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" })); // Aumentado para imágenes base64
app.use(cookieParser());

// Configuración de CORS (asegúrate de que coincida con tu frontend)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// 2. USA LAS RUTAS
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);            // <--- CRÍTICO: Soluciona el error 404
app.use("/api/tasks", taskRoutes);              // <--- Para el Kanban
app.use("/api/achievements", achievementRoutes);// <--- Para el trofeo
app.use("/api", emailRoutes);             // <--- Para enviar correos

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});