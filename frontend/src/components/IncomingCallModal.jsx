// frontend/src/components/IncomingCallModal.jsx
import React from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff } from "lucide-react";

const IncomingCallModal = () => {
  const { incomingCall, clearIncomingCall } = useVideoCallStore();
  const navigate = useNavigate();

  const handleAccept = () => {
    // Navegamos a la página de videollamada con el ID de quien llama
    // No limpiamos el 'incomingCall' aquí, VideoCallPage lo necesita
    // para saber que es el "receptor" de la llamada.
    navigate(`/videocall/${incomingCall.fromUser._id}`);
  };

  const handleReject = () => {
    // (Opcional) Aquí podrías emitir un evento 'call:reject' al servidor
    // Por ahora, solo limpiamos el estado
    clearIncomingCall();
  };

  // Si no hay llamada entrante, no renderizar nada
  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="modal-box">
        <div className="flex flex-col items-center gap-4">
          <div className="avatar">
            <div className="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
              <img
                src={incomingCall.fromUser.profilePic || "/avatar.png"}
                alt={incomingCall.fromUser.fullName}
              />
            </div>
          </div>
          <h3 className="text-lg font-bold">Llamada entrante de...</h3>
          <p className="text-xl">{incomingCall.fromUser.fullName}</p>
          <div className="modal-action flex w-full justify-around">
            <button
              onClick={handleReject}
              className="btn btn-error btn-circle btn-lg"
              title="Rechazar"
            >
              <PhoneOff className="h-8 w-8" />
            </button>
            <button
              onClick={handleAccept}
              className="btn btn-success btn-circle btn-lg"
              title="Aceptar"
            >
              <Phone className="h-8 w-8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;