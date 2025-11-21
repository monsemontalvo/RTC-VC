import { GroupChat } from '../models/groupChat.model.js';
import User from '../models/user.model.js';
import { unlockAchievement } from "../lib/achievementUtils.js";

// Función para crear grupos (Ya la tenías, la dejamos igual con los logros)
export const createGroup = async (req, res) => {
    try {
        const { name, members } = req.body;
        const adminId = req.user._id;

        if (!name || members.length < 1) {
            return res.status(400).json({ message: "El grupo debe tener un nombre y al menos un miembro." });
        }

        // Aseguramos que el admin también esté en la lista de participantes
        const participants = [...new Set([...members.map(String), adminId.toString()])];

        const newGroup = new GroupChat({
            name,
            participants,
            admin: adminId,
        });

        await newGroup.save();

        // --- LÓGICA DE LOGRO ---
        const newAchievements = [];
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.groupsCreated': 1 } });
        const ach = await unlockAchievement(req.user._id, "Capitán Fundador");
        if (ach) newAchievements.push(ach);
        // -----------------------

        res.status(201).json({
            _id: newGroup._id,
            name: newGroup.name,
            participants: newGroup.participants,
            admin: newGroup.admin,
            isGroup: true,
            fullName: newGroup.name,
            profilePic: newGroup.groupPic || "./../../../frontend/public/grupo.png",
            newAchievements
        });

    } catch (error) {
        console.error("Error al crear el grupo:", error.message);
        res.status(500).json({ message: "Error interno del servidor al crear el grupo." });
    }
};

// --- NUEVA FUNCIÓN: OBTENER GRUPOS ---
export const getGroups = async (req, res) => {
    try {
        const myId = req.user._id;

        // Buscamos todos los grupos donde el usuario actual esté incluido en 'participants'
        const groups = await GroupChat.find({ participants: myId })
            .populate("participants", "fullName profilePic email") // Traemos info básica de los miembros
            .populate("admin", "fullName"); // Traemos info del admin

        // Formateamos la respuesta para que el frontend la entienda igual que los usuarios normales
        const formattedGroups = groups.map(group => ({
            _id: group._id,
            name: group.name,
            fullName: group.name, // Para compatibilidad si tu chat usa 'fullName' para mostrar el título
            participants: group.participants,
            admin: group.admin,
            isGroup: true,
            profilePic: group.groupPic || "/grupo.png", // Asegúrate que esta imagen exista en public
            updatedAt: group.updatedAt
        }));

        res.status(200).json(formattedGroups);
    } catch (error) {
        console.error("Error en getGroups:", error.message);
        res.status(500).json({ message: "Error interno al obtener los grupos." });
    }
};