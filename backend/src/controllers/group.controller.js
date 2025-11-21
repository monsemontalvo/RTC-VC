import { GroupChat } from '../models/groupChat.model.js';
import User from '../models/user.model.js';

export const createGroup = async (req, res) => {
    try {
        const { name, members } = req.body; 
        const adminId = req.user._id; 

        if (!name || members.length < 1) {
            return res.status(400).json({ message: "El grupo debe tener un nombre y al menos un miembro." });
        }
      
        const participants = [...new Set([...members.map(String), adminId.toString()])];

        const newGroup = new GroupChat({
            name,
            participants, 
            admin: adminId,
        });

        await newGroup.save();

        res.status(201).json({
            _id: newGroup._id,
            name: newGroup.name,
            participants: newGroup.participants,
            admin: newGroup.admin,
            isGroup: true,
            fullName: newGroup.name,
            profilePic: newGroup.groupPic || "./../../../frontend/public/grupo.png",
        });

    } catch (error) {
        console.error("Error al crear el grupo:", error.message);
        res.status(500).json({ message: "Error interno del servidor al crear el grupo." });
    }
};