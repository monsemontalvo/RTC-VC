import { transporter } from "../lib/nodemailer.js";
import User from "../models/user.model.js"; // <--- IMPORTAR MODELO USER
import { unlockAchievement } from "../lib/achievementUtils.js"; // <--- IMPORTAR UTILIDAD

export const sendEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    const fromUser = req.user; 

    if (!to || !subject || !body) {
      return res
        .status(400)
        .json({ message: "Faltan campos (to, subject, body)" });
    }

    const mailOptions = {
      from: `"${fromUser.username}" <${process.env.EMAIL_FROM}>`, 
      to: to, 
      subject: subject, 
      text: body, 
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

    await transporter.sendMail(mailOptions);

    // --- LÓGICA DE LOGRO: CARTERO ---
const newAchievements = [];
    await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.emailsSent": 1 } });
    const ach = await unlockAchievement(req.user._id, "Cartero");
    if (ach) newAchievements.push(ach);

    res.status(200).json({ message: "Correo enviado", newAchievements });
    //---------------------------------------------------------------------------------
    
  } catch (error) {
    console.error("Error al enviar email:", error);
    res
      .status(500)
      .json({ message: "Error interno al enviar el email", error: error.message });
  }
};