import nodemailer from "nodemailer";
import "dotenv/config";

console.log("📢 INICIANDO CONFIGURACIÓN DE CORREO (Puerto 465)...");

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVICE_USER,
    pass: process.env.EMAIL_SERVICE_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  // --- AGREGA ESTA LÍNEA MÁGICA ---
  family: 4 
  // --------------------------------
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("Error CRÍTICO de conexión SMTP:", error);
  } else {
    console.log("Servidor SMTP listo (Puerto 465)");
  }
});