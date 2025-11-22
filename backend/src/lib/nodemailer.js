import nodemailer from "nodemailer";
import "dotenv/config";

console.log("INICIANDO CONFIGURACIÓN DE CORREO (MODO RENDER COMPATIBLE)...");

export const transporter = nodemailer.createTransport({
  service: 'gmail', // Usar el servicio predefinido a veces ayuda más que poner host/port manual
  auth: {
    user: process.env.EMAIL_SERVICE_USER,
    pass: process.env.EMAIL_SERVICE_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  // --- AJUSTES CRÍTICOS PARA RENDER ---
  family: 4, // Forzar IPv4 (Gmail bloquea mucho IPv6 desde servidores)
  pool: true, // Usar conexiones reutilizables para ser más eficiente
  maxConnections: 1, // Limitar conexiones para no parecer spammer
  rateLimit: 5 // Máximo 5 correos por segundo
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("🚨 ERROR SMTP EN RENDER:", error);
  } else {
    console.log("✅ CONEXIÓN CON GMAIL EXITOSA");
  }
});