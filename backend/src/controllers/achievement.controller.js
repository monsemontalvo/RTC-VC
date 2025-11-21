import User from '../models/user.model.js';
import { unlockAchievement } from "../lib/achievementUtils.js"; // <-- IMPORTAR

export const awardPredictionBadge = async (req, res) => {
    try {
        const userId = req.user._id; 
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { hasWonPredictionBadge: true },
            { new: true, select: "-password" } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("Error al otorgar la insignia de predicción:", error.message);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// --- NUEVA FUNCIÓN: Cara a Cara ---
export const recordVideoCall = async (req, res) => {
    try {
        const newAchievements = [];
        const ach = await unlockAchievement(req.user._id, "Cara a Cara");
        if (ach) newAchievements.push(ach);

        res.status(200).json({ message: "Llamada registrada", newAchievements });
    } catch (error) {
        console.error("Error registrando videollamada:", error);
        res.status(500).json({ message: "Error interno." });
    }
};