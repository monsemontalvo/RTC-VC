import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton.jsx";

import { Users, PlusCircle } from "lucide-react";
// Asegúrate de que la ruta a tu modal sea correcta
import CreateGroupModal from "./CreateGroupModal.jsx"; // <-- RUTA CORREGIDA (Asumiendo que está en la misma carpeta o en ./components/)

const Sidebar = () => {
    // 1. Obtener correctamente las variables actualizadas del store
    const { getUsers, users, groups, selectedChat, setSelectedChat, isUsersLoading } = useChatStore(); // <-- AÑADIDO 'groups' y REEMPLAZADO 'selectedChat' por 'selectedChat'

    const { onlineUsers } = useAuthStore();
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    // 2. Unificar y filtrar la lista de chats
    // Combina DMs (users) y Grupos (groups) en una sola lista
    const allChats = [...groups, ...users]; 
    
    // Función para determinar si un chat está seleccionado
    const isSelected = (chat) => selectedChat?._id === chat._id;
    
    // Aplicar el filtro 'showOnlineOnly' solo a los DMs, y luego combinarlos
    const filteredUsers = showOnlineOnly
        ? users.filter((user) => onlineUsers.includes(user._id))
        : users;

    // Crear la lista final de chats para mapear: Grupos + Usuarios filtrados
    const filteredChats = [...groups, ...filteredUsers];


    useEffect(() => {
        getUsers();
    }, [getUsers]);

    // Usamos el esqueleto al inicio para evitar parpadeos
    if (isUsersLoading) return <SidebarSkeleton />;

    return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            
            {/* 3. CABECERA: Título, Botón de Crear Grupo, y Filtro Online */}
            <div className="border-b border-base-300 w-full p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    {/* Título */}
                    <div className="flex items-center gap-2">
                        <Users className="size-6" />
                        <span className="font-medium hidden lg:block">Chats</span>
                    </div>

                    {/* Botón para Crear Grupo */}
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
                    {/* El conteo de online debe excluir al usuario actual */}
                    <span className="text-xs text-zinc-500">({onlineUsers.length} online)</span> 
                </div>
            </div>

            {/* 4. LISTA DE CHATS (Unificada: Grupos + DMs) */}
            <div className="flex-1 overflow-y-auto w-full">
                {isUsersLoading ? (
                    <SidebarSkeleton />
                ) : filteredChats.length === 0 ? (
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
                                    // Usar groupPic si existe (para grupos), si no, profilePic (para DMs), o default
                                    src={chat.groupPic || chat.profilePic || "/avatar.png"} 
                                    alt={chat.name || chat.fullName}
                                    className="size-12 object-cover rounded-full"
                                />
                                {/* Solo mostrar estado Online si NO es un grupo */}
                                {!chat.members && onlineUsers.includes(chat._id) && ( 
                                    <span
                                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                                    rounded-full ring-2 ring-zinc-900"
                                    />
                                )}
                            </div>

                            {/* Info de Chat */}
                            <div className="hidden lg:block text-left min-w-0">
                                {/* Usar 'name' si es un grupo, o 'fullName' si es un DM */}
                                <div className="font-medium truncate">{chat.name || chat.fullName}</div>
                                <div className="text-sm text-zinc-400">
                                    {/* Mostrar info de Grupo o estado Online/Offline de DM */}
                                    {chat.members ? `Grupo (${chat.members.length})` : (onlineUsers.includes(chat._id) ? "Online" : "Offline")}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* 5. Renderizar el Modal de Crear Grupo */}
            {isGroupModalOpen && (
                <CreateGroupModal 
                    onClose={() => setIsGroupModalOpen(false)} 
                />
            )}
        </aside>
    );
};

export default Sidebar;