// frontend/src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import CryptoJS from "crypto-js"; 

const ENCRYPTION_KEY = "mi-llave-secreta-123";

// --- Funciones de Encriptación ---
const encryptMessage = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decryptMessage = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) {
      return "[Mensaje encriptado ilegible]";
    }
    return originalText;
  } catch (error) {
    console.error("Error al desencriptar:", error);
    return "[Error al desencriptar mensaje]";
  }
};

const processMessages = (messages) => {
  return messages.map((msg) => {
    if (msg.isEncrypted && msg.text) {
      return { ...msg, text: decryptMessage(msg.text) };
    }
    return msg;
  });
};

// --- Store Principal ---
export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [], // Estado para los grupos
  selectedChat: null, 
  isUsersLoading: false,
  isMessagesLoading: false,
  isEncryptionEnabled: false, 

  toggleEncryption: () => 
    set((state) => {
      const newState = !state.isEncryptionEnabled;
      toast.success(
        newState
          ? "Encriptación E2E Habilitada"
          : "Encriptación E2E Deshabilitada"
      );
      return { isEncryptionEnabled: newState };
    }),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error cargando usuarios");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // --- Obtener Grupos ---
  getGroups: async () => {
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: processMessages(res.data) });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error cargando mensajes");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedChat, messages, isEncryptionEnabled } = get();

    const dataToSend = { ...messageData };
    let originalText = dataToSend.text; 

    // Lógica de encriptación antes de enviar
    if (isEncryptionEnabled && dataToSend.text) {
      dataToSend.text = encryptMessage(dataToSend.text);
      dataToSend.isEncrypted = true;
    } else {
      dataToSend.isEncrypted = false;
    }

    // Variable para manejo optimista
    let tempMessageId = Date.now().toString();

    try {
      // 1. Actualización Optimista (Mostrar mensaje inmediatamente)
      const tempMessage = {
        ...dataToSend,
        _id: tempMessageId, 
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedChat._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: originalText, // Mostramos el texto original al usuario que envía
        isEncrypted: isEncryptionEnabled 
      };

      set({ messages: [...messages, tempMessage] });

      // 2. Petición al Servidor
      const res = await axiosInstance.post(`/messages/send/${selectedChat._id}`, dataToSend);

      // 3. Reemplazar mensaje temporal con el real del servidor
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempMessageId ? { ...res.data, text: originalText } : msg
        ),
      }));

      // --- LÓGICA DE LOGROS (Notificación) ---
      if (res.data.newAchievements && res.data.newAchievements.length > 0) {
        res.data.newAchievements.forEach((ach) => {
          toast.success(`🏆 ¡Logro Desbloqueado: ${ach}!`, {
             duration: 5000,
             style: {
               border: '1px solid #FFD700',
               padding: '16px',
               color: '#713200',
             },
          });
        });
      }
      // ---------------------------------------

    } catch (error) {
      toast.error(error.response?.data?.message || "Error al enviar mensaje");
      // Revertir optimista en caso de error
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempMessageId),
      }));
    }
  },

  createGroup: async (groupName, memberIds) => {
    try {
        const groupData = {
            name: groupName,
            members: memberIds,
        };

        toast.loading("Creando grupo...");

        const res = await axiosInstance.post("/groups/create", groupData);
        const newGroup = res.data; 

        toast.dismiss();
        toast.success(`Grupo "${newGroup.name}" creado con éxito.`);

        // Actualizar la lista de grupos
        set((state) => ({ 
            groups: [newGroup, ...state.groups] 
        }));

        // Seleccionar el nuevo grupo automáticamente
        get().setSelectedChat(newGroup); 

        // --- LÓGICA DE LOGROS ---
        if (newGroup.newAchievements && newGroup.newAchievements.length > 0) {
           newGroup.newAchievements.forEach((ach) => {
             toast.success(`🏆 ¡Logro Desbloqueado: ${ach}!`, {
                duration: 5000,
                style: { border: '1px solid #FFD700', padding: '16px', color: '#713200' },
             });
           });
        }
        // -----------------------

    } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error al crear el grupo.");
    }
  },

subscribeToMessages: () => {
    const { selectedChat } = get();
    if (!selectedChat) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedChat } = get();
      if (!selectedChat) return;

      // --- CORRECCIÓN CRÍTICA AQUÍ ---
      // Verificamos si el mensaje es para el chat que tengo abierto.
      const isMessageForCurrentChat = 
        // Caso 1: Es un grupo y el ID del grupo coincide
        (newMessage.chatId === selectedChat._id) ||
        // Caso 2: Es un DM y el remitente es la persona con la que hablo
        (newMessage.senderId === selectedChat._id);

      if (!isMessageForCurrentChat) return;
      // -------------------------------

      // Desencriptar mensaje (si aplica)
      if (newMessage.isEncrypted && newMessage.text) {
        try {
            // Asegúrate de tener CryptoJS importado arriba
            const bytes = CryptoJS.AES.decrypt(newMessage.text, ENCRYPTION_KEY);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if(originalText) newMessage.text = originalText;
        } catch (e) {
            console.error("Error desencriptando en vivo:", e);
        }
      }

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  setSelectedChat: (chat) => { 
    const oldChat = get().selectedChat;

    if (oldChat) {
      get().unsubscribeFromMessages();
    }

    set({ selectedChat: chat, messages: [] });

    if (chat) {
      const chatId = chat._id;
      get().getMessages(chatId);
      get().subscribeToMessages();
    }
  },
}));