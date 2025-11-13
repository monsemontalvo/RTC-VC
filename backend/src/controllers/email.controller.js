import { transporter } from "../lib/nodemailer.js";

export const sendEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    // El usuario que envía (desde el middleware de autenticación)
    const fromUser = req.user; 

    if (!to || !subject || !body) {
      return res
        .status(400)
        .json({ message: "Faltan campos (to, subject, body)" });
    }

    // Opciones del correo
    const mailOptions = {
      from: `"${fromUser.username}" <${process.env.EMAIL_FROM}>`, // Dirección "From"
      to: to, // Email del destinatario (el selectedUser)
      subject: subject, // Asunto
      text: body, // Cuerpo en texto plano
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Has recibido un mensaje de ${fromUser.username}</h2>
          <p><strong>Email:</strong> ${fromUser.email}</p>
          <hr>
          <h3>Mensaje:</h3>
          <p style="white-space: pre-wrap;">${body}</p>
          <hr>
          <p style="font-size: 0.9em; color: #555;">
            Enviado desde la aplicación RTC-VC.
          </p>
        </div>
      `,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email enviado correctamente" });
  } catch (error) {
    console.error("Error al enviar email:", error);
    res
      .status(500)
      .json({ message: "Error interno al enviar el email", error: error.message });
  }
};