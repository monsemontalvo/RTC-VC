import { Task } from '../models/task.model.js';
import { GroupChat } from '../models/groupChat.model.js';
import User from "../models/user.model.js";
import { unlockAchievement } from "../lib/achievementUtils.js"; // <-- IMPORTAR

export const createTask = async (req, res) => {
    try {
        const createdBy = req.user._id;

        const {
            title,
            description,
            priority,
            assignedTo,
            dueDate,
            groupId // Puede ser null/undefined para tareas personales
        } = req.body;

        // 1. Validación básica: Solo el título es obligatorio
        if (!title) {
            return res.status(400).json({ error: 'El campo Título es obligatorio.' });
        }

        let group = null;

        // 2. Lógica y validación específica para TAREAS GRUPALES
        if (groupId) {
            group = await GroupChat.findById(groupId);

            if (!group) {
                return res.status(404).json({ error: 'Grupo no encontrado.' });
            }

            // Verificar que el usuario sea participante del grupo
            const isParticipant = group.participants.some(id => id.toString() === createdBy.toString());
            if (!isParticipant) {
                return res.status(403).json({ error: 'No tienes permiso para crear tareas en este grupo.' });
            }
        }

        // 3. Creación de la nueva tarea
        const newTask = new Task({
            title,
            description,
            priority,
            // Asignar al creador si el array assignedTo está vacío o es nulo
            assignedTo: assignedTo && assignedTo.length > 0 ? assignedTo : [createdBy],
            dueDate,
            createdBy,
            // Si groupId es null/undefined, Mongoose lo guardará como nulo/no definido (campo opcional)
            group: groupId || undefined
        });

        await newTask.save();

        // 4. Actualizar el modelo GroupChat SOLO si es una tarea grupal
        if (group) {
            // Asumiendo que ya has añadido el array 'tasks' a groupChat.model.js para evitar el error 500
            group.tasks.push(newTask._id);
            await group.save();
        }

        res.status(201).json(newTask);

    } catch (error) {
        console.error('Error al crear la tarea:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al crear la tarea.' });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'El campo status es obligatorio.' });
        }

        const allowedStatuses = ['not started', 'in progress', 'completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${allowedStatuses.join(', ')}` });
        }

        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId },
            { $set: { status: status } },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: 'Tarea no encontrada.' });
        }
        // --- LÓGICA DE LOGRO: "Trabajo en Equipo" ---
        // Si la tarea se marca como 'completed' y pertenece a un grupo
        const newAchievements = [];

        if (status === 'completed') {
            if (updatedTask.group) {
                await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.tasksCompleted": 1 } });
                const ach = await unlockAchievement(req.user._id, "Trabajo en Equipo");
                if (ach) newAchievements.push(ach);
            }
        }

        res.status(200).json({ ...updatedTask._doc, newAchievements });

    } catch (error) {
        console.error('Error al actualizar el estado de la tarea:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar la tarea.' });
    }
};

export const getGroupTasks = async (req, res) => {
    try {
        const { groupId } = req.params;

        const tasks = await Task.find({ group: groupId })
            .populate('assignedTo', 'fullName profilePic')
            .sort({ dueDate: 1, priority: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error al obtener las tareas del grupo:', error.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// ... (imports)

// ... (funciones createTask, updateTaskStatus, getGroupTasks existentes)

export const getUserTasks = async (req, res) => {
    try {
        const { userId } = req.params; // ID del usuario cuyas tareas queremos ver
        const authenticatedUserId = req.user._id;

        // Seguridad: Asegurar que el usuario solo pueda cargar sus propias tareas
        if (userId.toString() !== authenticatedUserId.toString()) {
            return res.status(403).json({ error: 'Acceso denegado. Solo puedes ver tus propias tareas.' });
        }

        // 1. Buscar tareas que estén asignadas a este usuario Y que NO tengan group asociado.
        // Esto filtra las tareas individuales.
        const individualTasks = await Task.find({
            assignedTo: userId,
            group: null // Filtrar solo tareas sin grupo (individuales)
        })
            .populate('assignedTo', 'fullName profilePic')
            .sort({ dueDate: 1, priority: -1 });

        // 2. Buscar tareas grupales del usuario (si la lógica lo requiere).
        // Si quieres que TasksPage muestre TODAS las tareas asignadas al usuario,
        // sin importar si son grupales o individuales:

        // --- ALTERNATIVA: CARGAR TODAS LAS TAREAS ASIGNADAS (DM + GRUPO) ---
        const allAssignedTasks = await Task.find({
            assignedTo: userId
        })
            .populate('assignedTo', 'fullName profilePic')
            .sort({ dueDate: 1, priority: -1 });

        // Usaremos esta alternativa simplificada para la TasksPage individual:
        res.status(200).json(allAssignedTasks);
        // --------------------------------------------------------------------

    } catch (error) {
        console.error('Error al obtener las tareas del usuario:', error.message);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};