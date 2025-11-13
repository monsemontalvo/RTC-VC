import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore"; // --- 1. IMPORTAR
import { axiosInstance as api } from "../lib/axios"; // --- 2. IMPORTAR AXIOS
import { Image, Send, X, MapPin, Mail } from "lucide-react"; // --- 3. IMPORTAR Mail
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false); // --- 4. NUEVO ESTADO
  const fileInputRef = useRef(null);

  // --- 5. OBTENER DATOS DE LOS STORES ---
  const { sendMessage, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  const handleImageChange = (e) => {
    // ... (código existente sin cambios)
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    // ... (código existente sin cambios)
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleShareLocation = () => {
    // ... (código existente sin cambios)
    if (!navigator.geolocation) {
      toast.error("La geolocalización no es soportada por tu navegador.");
      return;
    }

    setIsSendingLocation(true);
    const toastId = toast.loading("Obteniendo ubicación...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

        try {
          await sendMessage({ text: url, image: null });
          toast.success("Ubicación enviada", { id: toastId });
        } catch (error) {
          console.error("Failed to send location:", error);
          toast.error("No se pudo enviar la ubicación", { id: toastId });
        } finally {
          setIsSendingLocation(false);
        }
      },
      (error) => {
        let errorMessage = "No se pudo obtener la ubicación";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Permiso de ubicación denegado.";
        }
        toast.error(errorMessage, { id: toastId });
        setIsSendingLocation(false);
      }
    );
  };

  // --- 6. NUEVA FUNCIÓN PARA ENVIAR EMAIL ---
  const handleSendEmail = async () => {
    if (!text.trim()) {
      toast.error("Escribe un mensaje para enviar por email.");
      return;
    }
    if (!selectedUser) {
      toast.error("No se ha seleccionado un destinatario.");
      return;
    }

    setIsSendingEmail(true);
    const toastId = toast.loading("Enviando email...");

    try {
      await api.post("/email/send", {
        to: selectedUser.email,
        subject: `Mensaje de ${authUser.username} desde RTC-VC`,
        body: text.trim(),
      });

      toast.success("Email enviado correctamente", { id: toastId });
      // Limpiamos el input después de enviar
      setText("");
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("No se pudo enviar el email.", { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imagePreview) || isSendingLocation || isSendingEmail)
      return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const isSending = isSendingLocation || isSendingEmail;

  return (
    <div className="p-4 w-full">
      {/* ... (código de imagePreview sin cambios) ... */}
      {imagePreview && (
         <div className="mb-3 flex items-center gap-2">
           <div className="relative">
             <img
               src={imagePreview}
               alt="Preview"
               className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
             />
             <button
               onClick={removeImage}
               className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
               flex items-center justify-center"
               type="button"
             >
               <X className="size-3" />
             </button>
           </div>
         </div>
       )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Escribe un mensaje... (o un email)" // Modificado
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSending} // --- 7. DESHABILITAR
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
            disabled={isSending} // --- 7. DESHABILITAR
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending} // --- 7. DESHABILITAR
          >
            <Image size={20} />
          </button>

          <button
            type="button"
            className="hidden sm:flex btn btn-circle text-zinc-400"
            onClick={handleShareLocation}
            disabled={isSending} // --- 7. DESHABILITAR
          >
            {isSendingLocation ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <MapPin size={20} />
            )}
          </button>

          {/* --- 8. BOTÓN DE EMAIL AÑADIDO --- */}
          <button
            type="button"
            className="hidden sm:flex btn btn-circle text-zinc-400"
            onClick={handleSendEmail}
            disabled={isSending || !text.trim()} // Deshabilitado si se está enviando o no hay texto
          >
            {isSendingEmail ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Mail size={20} />
            )}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={(!text.trim() && !imagePreview) || isSending} // --- 7. DESHABILITAR
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;