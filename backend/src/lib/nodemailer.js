import nodemailer from "nodemailer";
import "dotenv/config";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // false para puerto 587
  auth: {
    user: process.env.EMAIL_SERVICE_USER,
    pass: process.env.EMAIL_SERVICE_PASS,
  },
  // --- AÑADE ESTAS LÍNEAS ---
  tls: {
    rejectUnauthorized: false
  }
  // --- FIN DE LÍNEAS A AÑADIR ---
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("Error al conectar con Gmail:", error);
  } else {
    console.log("Servicio de Gmail conectado y listo para enviar correos.");
  }
});