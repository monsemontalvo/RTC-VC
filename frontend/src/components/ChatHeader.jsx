import { Video, X, Download } from "lucide-react"; // 1. Importamos el icono Download
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // Opcional: para notificar al usuario

const ChatHeader = () => {
  // 2. Necesitamos 'messages' para poder guardarlos
  const { selectedChat, setSelectedChat, messages } = useChatStore();
  // 3. Necesitamos 'authUser' para identificar 'Yo' vs 'El otro usuario' en el txt
  const { onlineUsers, authUser } = useAuthStore();

  const navigate = useNavigate();

  const handleStartCall = () => {
    if (!selectedChat) return;
    navigate(`/videocall/${selectedChat._id}`);
  };

  // 4. Nueva función para descargar el chat
  const handleDownloadChat = () => {
    if (!messages || messages.length === 0) {
      toast.error("No hay mensajes para guardar");
      return;
    }

    try {
      // Construimos el contenido del archivo de texto
      let conversationText = `Conversación con ${selectedChat.fullName}\n`;
      conversationText += `Fecha de exportación: ${new Date().toLocaleString()}\n`;
      conversationText += "--------------------------------------------------\n\n";

      messages.forEach((msg) => {
        const senderName = msg.senderId === authUser._id ? "Yo" : selectedChat.fullName;
        const time = new Date(msg.createdAt).toLocaleString();
        
        // Si es mensaje de texto
        if (msg.text) {
          conversationText += `[${time}] ${senderName}: ${msg.text}\n`;
        }
        // Si es imagen (opcional, indicamos que se envió una imagen)
        if (msg.image) {
          conversationText += `[${time}] ${senderName}: [Imagen enviada]\n`;
        }
      });

      // Crear un Blob con el texto
      const blob = new Blob([conversationText], { type: "text/plain;charset=utf-8" });
      
      // Crear enlace temporal para descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat_${selectedChat.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Conversación descargada");
    } catch (error) {
      console.error("Error al descargar:", error);
      toast.error("Error al generar el archivo");
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedChat.profilePic || "/avatar.png"} alt={selectedChat.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedChat.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedChat._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex gap-2">
          {/* 5. Botón para guardar conversación */}
          <button
            onClick={handleDownloadChat}
            className='btn btn-ghost btn-circle'
            title='Guardar conversación en TXT'
          >
            <Download className='w-6 h-6' />
          </button>

          <button
            onClick={handleStartCall}
            className='btn btn-ghost btn-circle'
            title='Iniciar videollamada'
          >
            <Video className='w-6 h-6' />
          </button>

          <button
            onClick={() => setSelectedChat(null)}
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