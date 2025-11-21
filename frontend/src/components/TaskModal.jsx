import React, { useState } from 'react';
import { X, User } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, onCreate, availableUsers, currentUserId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [assignedTo, setAssignedTo] = useState([]); // Array de IDs de usuario
    const [dueDate, setDueDate] = useState('');

    if (!isOpen) return null;

    const handleToggleAssignee = (userId) => {
        setAssignedTo(prev => 
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("El título es obligatorio.");
            return;
        }

        // Si no se asigna a nadie, por defecto se asigna al creador
        const finalAssignedTo = assignedTo.length > 0 ? assignedTo : [currentUserId];

        onCreate({
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            assignedTo: finalAssignedTo, // Enviar IDs
            dueDate: dueDate || undefined,
        });

        // Limpiar y cerrar
        setTitle('');
        setDescription('');
        setPriority('medium');
        setAssignedTo([]);
        setDueDate('');
        onClose();
    };

    const priorityOptions = ['low', 'medium', 'urgent'];


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-base-100 rounded-lg p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold">Crear Nueva Tarea</h3>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost"><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Título */}
                    <div>
                        <label className="label font-medium">Título</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Comprar carne asada para el clásico"
                            className="input input-bordered w-full"
                            required
                        />
                    </div>
                    {/* Descripción */}
                    <div>
                        <label className="label font-medium">Descripción</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles sobre la tarea..."
                            className="textarea textarea-bordered w-full"
                        />
                    </div>

                    <div className="flex gap-4">
                        {/* Prioridad */}
                        <div className="flex-1">
                            <label className="label font-medium">Prioridad</label>
                            <select 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value)}
                                className="select select-bordered w-full"
                            >
                                {priorityOptions.map(p => (
                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        {/* Fecha Límite */}
                        <div className="flex-1">
                            <label className="label font-medium">Fecha Límite (Opcional)</label>
                            <input 
                                type="date" 
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input input-bordered w-full"
                            />
                        </div>
                    </div>
                    
                    {/* Asignación */}
                    <div>
                        <label className="label font-medium">Asignar a:</label>
                        <div className="max-h-32 overflow-y-auto border border-base-content/20 rounded-lg p-3">
                            {availableUsers.map((user) => (
                                <div key={user._id} className="flex items-center justify-between py-1.5 cursor-pointer" onClick={() => handleToggleAssignee(user._id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            <div className="w-6 h-6 rounded-full">
                                                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                                            </div>
                                        </div>
                                        <span className="text-sm">{user.fullName}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-xs checkbox-primary"
                                        checked={assignedTo.includes(user._id)}
                                        readOnly
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-base-content/60 mt-1">Si no se selecciona a nadie, se asignará a ti.</p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" className="btn btn-primary">Crear Tarea</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;