import { Video, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom"; // 2. Importar useNavigate

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const navigate = useNavigate(); // 2. Inicializar useNavigate

  const handleStartCall = () => {
    if (!selectedUser) return; // <-- CAMBIO AQUÍ
    // Navegamos a la página de videollamada, pasando el ID del otro usuario
    navigate(`/videocall/${selectedUser._id}`);
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close and Video Call buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleStartCall}
            className='btn btn-ghost btn-circle'
            title='Iniciar videollamada'
          >
            <Video className='w-6 h-6' />
          </button>

          <button
            onClick={() => setSelectedUser(null)}
            className='btn btn-ghost btn-circle'
            title='Cerrar chat'
          >
            <X className='w-6 h-6' />
          </button>

        </div>
      </div>
    </div>
  );
};
export default ChatHeader;