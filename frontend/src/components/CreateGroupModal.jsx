import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import toast from "react-hot-toast";
import { Users, X } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
    const { users, isUsersLoading, createGroup } = useChatStore();
    const { authUser } = useAuthStore();
    
    // Filtramos al usuario actual para no seleccionarse a sí mismo
    const availableUsers = users.filter(user => user._id !== authUser._id);

    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    const handleToggleMember = (userId) => {
        setSelectedMembers(prev => 
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim() || selectedMembers.length === 0) {
            toast.error("El grupo debe tener un nombre y al menos un miembro.");
            return;
        }

        setIsCreating(true);
        await createGroup(groupName, selectedMembers);
        setIsCreating(false);
        onClose(); 
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="size-5 text-primary"/> Crear Nuevo Grupo
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="btn btn-sm btn-circle btn-ghost"
                        disabled={isCreating}
                    >
                        <X className="size-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {/* Campo Nombre del Grupo */}
                    <div className="mb-4">
                        <label className="label">
                            <span className="label-text font-medium">Nombre del Grupo</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Equipo alfa buena maravilla onda dinamita escuadrón lobo"
                            className="input input-bordered w-full"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                            disabled={isCreating}
                        />
                    </div>

                    {/* Lista de Usuarios para Seleccionar */}
                    <div className="mb-6 max-h-60 h-auto overflow-y-auto border border-base-content/20 rounded-lg p-3">
                        <p className="font-semibold text-sm mb-2 text-base-content/70">Seleccionar Miembros (Mínimo 1):</p>
                        {isUsersLoading ? (
                            <div className="flex justify-center"><span className="loading loading-spinner"></span></div>
                        ) : availableUsers.length === 0 ? (
                            <p className="text-center text-sm text-warning">No hay otros usuarios disponibles.</p>
                        ) : (
                            availableUsers.map((user) => (
                                <div key={user._id} className="flex items-center justify-between py-2 border-b border-base-content/10 last:border-b-0 cursor-pointer hover:bg-base-200/50 px-2 rounded-md transition-colors" onClick={() => handleToggleMember(user._id)}>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar">
                                            <div className="w-8 h-8 rounded-full">
                                                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                                            </div>
                                        </div>
                                        <span className="truncate">{user.fullName}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                        checked={selectedMembers.includes(user._id)}
                                        readOnly
                                        disabled={isCreating}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex justify-end gap-2">
                        <button 
                            type="button" 
                            className="btn btn-ghost" 
                            onClick={onClose}
                            disabled={isCreating}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className={`btn btn-primary ${isCreating ? 'loading' : ''}`}
                            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
                        >
                            {isCreating ? 'Creando...' : 'Crear Grupo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;