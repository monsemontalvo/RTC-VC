import nodemailer from "nodemailer";
import "dotenv/config";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Lo ponemos directo por seguridad
  port: 587,              // <--- CAMBIO IMPORTANTE: Puerto SSL
  secure: false,           // <--- CAMBIO IMPORTANTE: true para 465
  auth: {
    user: process.env.EMAIL_SERVICE_USER,
    pass: process.env.EMAIL_SERVICE_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("🚨 Error de conexión SMTP:", error);
  } else {
    console.log("✅ Servidor SMTP listo (Puerto 465)");
  }
});