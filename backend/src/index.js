import express from 'express'; //Sintaxis con type: module
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import {connectDB} from './lib/db.js';

import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import emailRoutes from "./routes/email.route.js"; // <-- 1. IMPORTAR RUTAS DE EMAIL
import {app, server} from './lib/socket.js';

dotenv.config();

const PORT = process.env.PORT

// Aumentar el tamaño máximo del body para permitir imágenes en base64
// Ajusta este valor según tus necesidades (ej. '2mb', '5mb', '10mb')
app.use(express.json({ limit: '10mb' })); //Middleware para parsear JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // parse application/x-www-form-urlencoded
app.use(cookieParser()); //Middleware para parsear cookies
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true, // Permite enviar cookies
}));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", emailRoutes); // <-- 2. AÑADIR RUTAS DE EMAIL

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});
