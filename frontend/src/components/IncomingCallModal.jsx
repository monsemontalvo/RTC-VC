import React from "react";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff } from "lucide-react";

const IncomingCallModal = () => {
  const { incomingCall, clearIncomingCall } = useVideoCallStore();
  const navigate = useNavigate();

  const handleAccept = () => {
    navigate(`/videocall/${incomingCall.fromUser._id}`);
  };

  const handleReject = () => {
    clearIncomingCall();
  };

  // DEBUG: Esto imprimirá en la consola si el modal intenta abrirse
  if (incomingCall) {
      console.log("🔔 INTENTANDO MOSTRAR MODAL DE LLAMADA", incomingCall);
  }

 if (!incomingCall) return null;

  return (
    
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
      
      {}
      <div className="modal-box bg-base-100 border border-base-300 shadow-2xl relative z-20 opacity-100">
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="avatar">
            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative">
              <img
                src={incomingCall.fromUser.profilePic || "/avatar.png"}
                alt="Llamada"
              />
              <span className="absolute top-0 right-0 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-success"></span>
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">¡Llamada Entrante!</h3>
            <p className="text-base-content/70 text-lg">
              <span className="font-semibold text-primary">{incomingCall.fromUser.fullName}</span> te está llamando...
            </p>
          </div>

          <div className="flex w-full justify-center gap-8 mt-2">
            {/* Botón Colgar */}
            <button
              onClick={handleReject}
              className="btn btn-error btn-circle btn-lg shadow-lg hover:scale-110 transition-transform"
              title="Rechazar"
            >
              <PhoneOff className="h-8 w-8 text-white" />
            </button>

            {/* Botón Contestar */}
            <button
              onClick={handleAccept}
              className="btn btn-success btn-circle btn-lg shadow-lg hover:scale-110 transition-transform" // btn-success es verde
              title="Contestar"
            >
              <Phone className="h-8 w-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;