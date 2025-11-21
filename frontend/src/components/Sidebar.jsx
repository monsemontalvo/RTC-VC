import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton.jsx";
import { Users, PlusCircle } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal.jsx";

const Sidebar = () => {
    // 1. AÑADIDO: 'getGroups' para cargar la lista al iniciar
    const { getUsers, getGroups, users, groups, selectedChat, setSelectedChat, isUsersLoading } = useChatStore();

    const { onlineUsers } = useAuthStore();
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    // 2. CAMBIO: Cargar tanto usuarios como grupos al montar el componente
    useEffect(() => {
        getUsers();
        getGroups();
    }, [getUsers, getGroups]);

    // Función para determinar si un chat está seleccionado
    const isSelected = (chat) => selectedChat?._id === chat._id;
    
    // Aplicar el filtro 'showOnlineOnly' solo a los usuarios (DMs)
    const filteredUsers = showOnlineOnly
        ? users.filter((user) => onlineUsers.includes(user._id))
        : users;

    // Combinar Grupos + Usuarios filtrados
    const filteredChats = [...groups, ...filteredUsers];

    if (isUsersLoading) return <SidebarSkeleton />;

    return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            
            {/* CABECERA */}
            <div className="border-b border-base-300 w-full p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Users className="size-6" />
                        <span className="font-medium hidden lg:block">Chats</span>
                    </div>

                    <button
                        className="btn btn-sm btn-circle btn-ghost text-primary hover:bg-base-200"
                        onClick={() => setIsGroupModalOpen(true)}
                        title="Crear Nuevo Grupo"
                    >
                        <PlusCircle className="size-6" />
                    </button>
                </div>

                {/* Filtro Online */}
                <div className="mt-3 hidden lg:flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">Mostrar solo conectados</span>
                    </label>
                    <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span> 
                </div>
            </div>

            {/* LISTA DE CHATS */}
            <div className="flex-1 overflow-y-auto w-full">
                {filteredChats.length === 0 ? (
                    <div className="text-center text-zinc-500 py-4">No se encontraron chats.</div>
                ) : (
                    filteredChats.map((chat) => (
                        <button
                            key={chat._id}
                            onClick={() => setSelectedChat(chat)}
                            className={`
                            w-full p-3 flex items-center gap-3
                            hover:bg-base-300 transition-colors
                            ${isSelected(chat) ? "bg-base-300 ring-1 ring-base-300" : ""}
                            `}
                        >
                            <div className="relative mx-auto lg:mx-0">
                                <img
                                    // Usar la imagen adecuada según si es grupo o usuario
                                    src={chat.isGroup ? (chat.groupPic || "/grupo.png") : (chat.profilePic || "/avatar.png")} 
                                    alt={chat.name || chat.fullName}
                                    className="size-12 object-cover rounded-full border border-base-content/10"
                                />
                                
                                {/* Indicador Online (Solo si NO es grupo) */}
                                {!chat.isGroup && onlineUsers.includes(chat._id) && ( 
                                    <span
                                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                                        rounded-full ring-2 ring-zinc-900"
                                    />
                                )}
                            </div>

                            {/* Info de Chat */}
                            <div className="hidden lg:block text-left min-w-0">
                                <div className="font-medium truncate">{chat.name || chat.fullName}</div>
                                <div className="text-sm text-zinc-400">
                                    {/* 3. CAMBIO: Usar 'chat.isGroup' y 'participants' en lugar de 'members' */}
                                    {chat.isGroup 
                                        ? `Grupo (${chat.participants ? chat.participants.length : 0})` 
                                        : (onlineUsers.includes(chat._id) ? "Online" : "Offline")
                                    }
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Modal */}
            {isGroupModalOpen && (
                <CreateGroupModal 
                    onClose={() => setIsGroupModalOpen(false)} 
                />
            )}
        </aside>
    );
};

export default Sidebar;