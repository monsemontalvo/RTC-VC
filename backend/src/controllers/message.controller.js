import { unlockAchievement } from "../lib/achievementUtils.js";
import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from "../lib/socket.js";
import { GroupChat } from '../models/groupChat.model.js';

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: chatId } = req.params; // ID del chat (puede ser UserID o GroupID)
        const myId = req.user._id;

        // 1. Intentar encontrar el chat como un GRUPO
        const group = await GroupChat.findById(chatId);

        let messages;

        if (group) {
            // Lógica para CHAT GRUPAL
            // 1.a. Verificar si el usuario es un participante
            if (!group.participants.map(p => p.toString()).includes(myId.toString())) {
                return res.status(403).json({ message: "No eres participante de este grupo." });
            }
            // 1.b. Buscar mensajes donde el receiverId sea el ID del grupo
            messages = await Message.find({ receiverId: chatId });

        } else {
            // Lógica para CHAT INDIVIDUAL (DM)
            // 2. Buscar mensajes entre mi ID y el ID del chat (que asumimos es el otro usuario)
            messages = await Message.find({
                $or: [
                    { senderId: myId, receiverId: chatId },
                    { senderId: chatId, receiverId: myId }
                ]
            });
        }
        
        // El frontend espera solo el array de mensajes
        res.status(200).json(messages); 
    } catch (error) {
        console.log("Error in getMessages:", error.message);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, isEncrypted } = req.body; 
        const { id: chatId } = req.params; // <-- Ahora es chatId (ReceiverID o GroupID)
        const senderId = req.user._id; 

        // ... Lógica de Cloudinary para subir imagen ...
        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId: chatId, // <-- El receiverId ahora es el ID del chat
            text,
            image: imageUrl,
            isEncrypted: !!isEncrypted 
        });

        await newMessage.save();

        // --- LÓGICA DE LOGROS CON NOTIFICACIÓN ---
        const newAchievements = []; // Array para guardar logros de esta petición

        // 1. Actualizar contador de mensajes
        const user = await User.findByIdAndUpdate(
            senderId,
            { $inc: { "stats.messagesSent": 1 } },
            { new: true }
        );

        // 2. Logro "Agente Secreto": Primer mensaje
        if (user.stats.messagesSent >= 1) {
            const ach = await unlockAchievement(senderId, "Agente Secreto");
            if (ach) newAchievements.push(ach);
        }

        // 3. Logro "Hiperconectado": 10 mensajes
        if (user.stats.messagesSent >= 10) {
            const ach = await unlockAchievement(senderId, "Hiperconectado");
            if (ach) newAchievements.push(ach);
        }

        // 4. Logro "Corresponsal de Campo": Compartir ubicación
        if (text && text.includes("google.com/maps")) {
            const ach = await unlockAchievement(senderId, "Corresponsal de Campo");
            if (ach) newAchievements.push(ach);
        }
        // -----------------------------------------

        // 1. Lógica de Socket.io
        // Intentamos encontrar el chat como GRUPO
        const group = await GroupChat.findById(chatId);
        
        if (group) {
            // Si es un grupo, emitir a TODOS los participantes (excepto al que envía)
            group.participants.forEach(participantId => {
                if (participantId.toString() !== senderId.toString()) {
                    const participantSocketId = getReceiverSocketId(participantId);
                    if (participantSocketId) {
                        io.to(participantSocketId).emit("newMessage", {...newMessage._doc, chatId: chatId}); 
                    }
                }
            });
        } else {
            // Si NO es un grupo, asumir que es un DM. receiverId = chatId.
            const receiverSocketId = getReceiverSocketId(chatId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", {...newMessage._doc, chatId: chatId}); 
            }
        }
        
        // Enviamos el mensaje guardado Y el array de logros nuevos
        res.status(201).json({ 
            ...newMessage._doc, 
            chatId: chatId, 
            newAchievements // <--- IMPORTANTE: Enviado al frontend
        }); 

    } catch (error) {
        console.log("Error in sendMessage:", error.message);
        res.status(500).json({ message: "Internal Server Error." });
    }
};
