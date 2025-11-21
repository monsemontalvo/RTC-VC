import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import CryptoJS from "crypto-js"; 
const ENCRYPTION_KEY = "mi-llave-secreta-123";

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


export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
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
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: processMessages(res.data) });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedChat, messages, isEncryptionEnabled } = get();

    const dataToSend = { ...messageData };
    let originalText = dataToSend.text; 

    if (isEncryptionEnabled && dataToSend.text) {
      dataToSend.text = encryptMessage(dataToSend.text);
      dataToSend.isEncrypted = true;
    } else {
      dataToSend.isEncrypted = false;
    }

    try {
      
      const tempMessage = {
        ...dataToSend,
        _id: Date.now().toString(), 
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedChat._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: originalText,
        isEncrypted: isEncryptionEnabled 
      };

      set({ messages: [...messages, tempMessage] });

      const res = await axiosInstance.post(`/messages/send/${selectedChat._id}`, dataToSend);

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempMessage._id ? { ...res.data, text: originalText } : msg
        ),
      }));

    } catch (error) {
      toast.error(error.response.data.message);

      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempMessage._id),
      }));
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
      if (!selectedChat || newMessage.senderId !== selectedChat._id) return;

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

 // useChatStore.js (Añadir en el objeto de acciones del store)

  createGroup: async (groupName, memberIds) => {
    try {
        const currentUserId = useAuthStore.getState().authUser._id;
        // El creador siempre es miembro
        const members = [...new Set([...memberIds, currentUserId])]; 

        const groupData = {
            name: groupName,
            members: members,
        };

        toast.loading("Creando grupo...");

        const res = await axiosInstance.post("/groups", groupData);
        const newGroup = res.data; 

        toast.dismiss();
        toast.success(`Grupo "${newGroup.name}" creado con éxito.`);

        set((state) => ({ 
            groups: [newGroup, ...state.groups] 
        }))

        get().setSelectedChat(newGroup); 

    } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error al crear el grupo.");
    }
},

setSelectedChat: (chat) => { // 'chat' puede ser un User o un Group
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