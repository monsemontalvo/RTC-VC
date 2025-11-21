import User from "../models/user.model.js";

export const unlockAchievement = async (userId, achievementTitle) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    // Verificamos si YA tiene el logro
    if (!user.achievements.includes(achievementTitle)) {
      user.achievements.push(achievementTitle);
      await user.save();
      console.log(`¡Logro desbloqueado!: ${achievementTitle}`);
      
      return achievementTitle; // <--- IMPORTANTE: Retornamos el nombre
    }
    return null; // <--- Retornamos null si ya lo tenía
  } catch (error) {
    console.error("Error al desbloquear logro:", error);
    return null;
  }
};