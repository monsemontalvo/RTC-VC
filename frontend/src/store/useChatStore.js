import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import CryptoJS from "crypto-js"; // 1. Importar crypto-js

// 2. LLAVE DE ENCRIPTACIÓN (Insegura para producción, solo para demo)
// En una app real, esta llave debería generarse y compartirse de forma segura (ej. Diffie-Hellman)
const ENCRYPTION_KEY = "mi-llave-secreta-123";

// 3. Funciones de ayuda para encriptar/desencriptar
const encryptMessage = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decryptMessage = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) {
      // Manejar el caso en que la desencriptación falla (ej. llave incorrecta)
      return "[Mensaje encriptado ilegible]";
    }
    return originalText;
  } catch (error) {
    console.error("Error al desencriptar:", error);
    return "[Error al desencriptar mensaje]";
  }
};

// 4. Función para procesar mensajes (desencriptar si es necesario)
const processMessages = (messages) => {
  return messages.map((msg) => {
    if (msg.isEncrypted && msg.text) {
      return { ...msg, text: decryptMessage(msg.text) };
    }
    return msg;
  });
};


export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isEncryptionEnabled: false, // 5. Añadir estado para el toggle

  // 6. Añadir acción para el toggle
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      // 7. Desencriptar historial al cargar
      set({ messages: processMessages(res.data) });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages, isEncryptionEnabled } = get(); // 8. Obtener estado
    
    // 9. Preparar data a enviar (encriptando si es necesario)
    const dataToSend = { ...messageData };
    let originalText = dataToSend.text; // Guardamos el texto original para mostrarlo inmediatamente

    if (isEncryptionEnabled && dataToSend.text) {
      dataToSend.text = encryptMessage(dataToSend.text);
      dataToSend.isEncrypted = true;
    } else {
      dataToSend.isEncrypted = false;
    }

    try {
      // Optimización: Mostrar el mensaje localmente de inmediato (con texto original)
      // antes de esperar la respuesta del servidor.
      const tempMessage = {
        ...dataToSend,
        _id: Date.now().toString(), // ID temporal
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedUser._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: originalText, // Usamos el texto original
        isEncrypted: isEncryptionEnabled // Marcamos si se envió encriptado
      };
      
      // Añadimos el mensaje temporal al estado
      set({ messages: [...messages, tempMessage] });

      // Enviamos el mensaje (potencialmente encriptado) al backend
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, dataToSend);
      
      // Reemplazamos el mensaje temporal con la respuesta real del servidor
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempMessage._id ? { ...res.data, text: originalText } : msg
        ),
      }));

    } catch (error) {
      toast.error(error.response.data.message);
      // Si falla, eliminamos el mensaje temporal
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempMessage._id),
      }));
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Asegurarse de no suscribirse múltiples veces
    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get(); // Volver a obtener por si cambió
      if (!selectedUser || newMessage.senderId !== selectedUser._id) return;

      // 11. Desencriptar mensaje del socket ANTES de guardarlo en el estado
      if (newMessage.isEncrypted && newMessage.text) {
        newMessage.text = decryptMessage(newMessage.text);
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

  setSelectedUser: (selectedUser) => {
    const oldUser = get().selectedUser;
    
    // Limpiar mensajes y desuscribirse del usuario anterior si había uno
    if (oldUser) {
      get().unsubscribeFromMessages();
    }
    
    set({ selectedUser, messages: [] });

    // Si seleccionamos un nuevo usuario, obtenemos sus mensajes y nos suscribimos
    if (selectedUser) {
      get().getMessages(selectedUser._id);
      get().subscribeToMessages();
    }
  },
}));