// frontend/src/pages/VideoCallPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useParams, useNavigate } from "react-router-dom";
import { PhoneOff } from "lucide-react"; // Icono para colgar

const VideoCallPage = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const { socket, authUser } = useAuthStore();
  const { incomingCall, clearIncomingCall } = useVideoCallStore();
  
  const { userId: otherUserId } = useParams(); // ID del otro usuario (de la URL)
  const navigate = useNavigate();
  
  const [remoteStream, setRemoteStream] = useState(null);

  // --- Lógica de WebRTC ---

  const setupPeerConnection = () => {
    // Servidores STUN gratuitos de Google
    const servers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
    
    const pc = new RTCPeerConnection(servers);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc:ice-candidate", {
          toUserId: otherUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current = pc;
  };

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, stream);
      });
    } catch (error) {
      console.error("Error al obtener media:", error);
      toast.error("No se pudo acceder a la cámara o micrófono.");
    }
  };

  // (Usuario A) Inicia la llamada
  const createOffer = async (toUserId) => {
    const pc = peerConnectionRef.current;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // IMPORTANTE: Enviamos nuestro objeto 'authUser' para que el receptor sepa quién llama
    socket.emit("call:offer", { 
      toUserId, 
      offer,
      fromUser: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic
      } 
    });
  };

  // (Usuario B) Responde la llamada
  const createAnswer = async (toUserId, offer) => {
    const pc = peerConnectionRef.current;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("call:answer", { toUserId, answer });
  };
  
  // --- Fin Lógica de WebRTC ---

  const handleHangUp = () => {
    if (socket) {
      socket.emit("call:end", { toUserId: otherUserId });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    // Detener cámara
    if (localVideoRef.current && localVideoRef.current.srcObject) {
       localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    clearIncomingCall();
    navigate("/"); // Regresar al home
  };

  useEffect(() => {
    if (!socket || !authUser) return;
    
    setupPeerConnection();
    startMedia();

    const handleCallAccepted = async ({ answer }) => {
      await peerConnectionRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const handleIceCandidate = (event) => {
      if (event.candidate) {
        const candidate = new RTCIceCandidate(event.candidate);
        peerConnectionRef.current?.addIceCandidate(candidate);
      }
    };
    
    const handleCallEnded = () => {
      handleHangUp(); // Reutilizamos la lógica de colgar
    };

    socket.on("call:accepted", handleCallAccepted);
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    socket.on("call:ended", handleCallEnded);

    // LÓGICA DE DECISIÓN: ¿SOY EL QUE LLAMA O EL QUE RECIBE?
    if (incomingCall && incomingCall.fromUser._id === otherUserId) {
      // Soy el receptor (Usuario B) y acabo de aceptar
      createAnswer(otherUserId, incomingCall.offer);
      clearIncomingCall(); // Limpiamos el store
    } else {
      // Soy el que llama (Usuario A)
      createOffer(otherUserId);
    }

    return () => {
      socket.off("call:accepted", handleCallAccepted);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
      socket.off("call:ended", handleCallEnded);
      
      // Limpieza al salir del componente
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localVideoRef.current && localVideoRef.current.srcObject) {
         localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, authUser, otherUserId, incomingCall]);
  
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-base-200 p-4">
      <div className="relative flex h-full w-full max-w-6xl gap-4">
        {/* Video Remoto (Pantalla completa) */}
        <div className="flex-1 overflow-hidden rounded-lg bg-base-300">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        </div>
        
        {/* Video Local (Pequeño) */}
        <div className="absolute bottom-6 right-6 w-48 overflow-hidden rounded-lg border-2 border-primary shadow-xl md:w-64">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      
      {/* Botón de Colgar */}
      <div className="absolute bottom-6">
        <button onClick={handleHangUp} className="btn btn-error btn-circle btn-lg">
          <PhoneOff className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;