// frontend/src/pages/VideoCallPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useParams, useNavigate } from "react-router-dom";
import { PhoneOff } from "lucide-react";
import { axiosInstance } from "../lib/axios"; 
import toast from "react-hot-toast"; 

const VideoCallPage = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  const { socket, authUser } = useAuthStore();
  const { incomingCall, clearIncomingCall } = useVideoCallStore();
  
  const { userId: otherUserId } = useParams(); 
  const navigate = useNavigate();
  
  const [remoteStream, setRemoteStream] = useState(null);
  const [achievementChecked, setAchievementChecked] = useState(false); 

  // --- Lógica de WebRTC ---

  const setupPeerConnection = () => {
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
      console.log("Stream remoto recibido:", event.streams[0]);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
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
      
      if (peerConnectionRef.current) {
          stream.getTracks().forEach((track) => {
             // Evitamos duplicar tracks
             const senders = peerConnectionRef.current.getSenders();
             const alreadyAdded = senders.find(s => s.track === track);
             if (!alreadyAdded) {
                 peerConnectionRef.current.addTrack(track, stream);
             }
          });
      }
    } catch (error) {
      console.error("Error al obtener media:", error);
      toast.error("No se pudo acceder a la cámara. Revisa permisos.");
    }
  };

  // (Usuario A) Inicia la llamada
  const createOffer = async (toUserId) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit("call:offer", { 
          toUserId, 
          offer,
          fromUser: {
            _id: authUser._id,
            fullName: authUser.fullName,
            profilePic: authUser.profilePic
          } 
        });
    } catch (err) {
        console.error("Error creando oferta:", err);
    }
  };

  // (Usuario B) Responde la llamada
  const createAnswer = async (toUserId) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("call:answer", { toUserId, answer });
    } catch (err) {
        console.error("Error creando respuesta:", err);
    }
  };
  
  // --- Fin Lógica de WebRTC ---

  const handleHangUp = () => {
    if (socket) {
      socket.emit("call:end", { toUserId: otherUserId });
    }
    
    if (localVideoRef.current && localVideoRef.current.srcObject) {
       localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    clearIncomingCall();
    navigate("/"); 
  };

  // --- EFFECT PRINCIPAL: Manejo de Señalización y Cola (CORREGIDO) ---
  useEffect(() => {
    if (!socket || !authUser) return;
    
    // 1. Cola para guardar candidatos ICE que lleguen antes de tiempo
    const candidateQueue = [];
    let isRemoteDescriptionSet = false;

    const pc = setupPeerConnection();
    startMedia();

    // Función para procesar la cola
    const processCandidateQueue = async () => {
        if (!pc) return;
        while (candidateQueue.length > 0) {
            const candidate = candidateQueue.shift();
            try {
                await pc.addIceCandidate(candidate);
            } catch (e) {
                console.error("Error procesando candidato de cola:", e);
            }
        }
    };

    // Manejadores de eventos del Socket
    const handleCallAccepted = async ({ answer }) => {
      if (!pc) return;
      try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          isRemoteDescriptionSet = true;
          await processCandidateQueue(); // ¡Procesamos los pendientes!
      } catch (err) {
          console.error("Error setting remote description (answer):", err);
      }
    };

    const handleIceCandidate = async (event) => {
      const pc = peerConnectionRef.current;
      if (!pc || !event.candidate) return;
      
      const candidate = new RTCIceCandidate(event.candidate);

      if (isRemoteDescriptionSet && pc.remoteDescription) {
        try {
             await pc.addIceCandidate(candidate);
        } catch (e) { console.error("Error adding ice candidate", e); }
      } else {
        // Si no está listo, A LA COLA
        candidateQueue.push(candidate);
      }
    };
    
    const handleCallEnded = () => {
      handleHangUp(); 
    };

    socket.on("call:accepted", handleCallAccepted);
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    socket.on("call:ended", handleCallEnded);

    // LÓGICA DE INICIO:
    const initializeCall = async () => {
        if (incomingCall && incomingCall.fromUser._id === otherUserId) {
          // SOY EL RECEPTOR
          try {
              await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
              isRemoteDescriptionSet = true;
              await processCandidateQueue(); 
              await createAnswer(otherUserId);
              clearIncomingCall(); 
          } catch (err) {
              console.error("Error inicializando recepción:", err);
          }
        } else {
          // SOY EL LLAMANTE
          createOffer(otherUserId);
        }
    };

    initializeCall();

    return () => {
      socket.off("call:accepted", handleCallAccepted);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
      socket.off("call:ended", handleCallEnded);
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localVideoRef.current && localVideoRef.current.srcObject) {
         localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, authUser, otherUserId]); 
  
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // LÓGICA DE LOGROS (Sin cambios)
  useEffect(() => {
    const checkVideoCallAchievement = async () => {
        if (achievementChecked) return; 
        try {
            const res = await axiosInstance.post("/achievements/record-video-call");
            if (res.data.newAchievements?.length > 0) {
                res.data.newAchievements.forEach(ach => {
                    toast.success(`🏆 ¡Logro Desbloqueado: ${ach}!`);
                });
            }
            setAchievementChecked(true); 
        } catch (error) {
            console.error("Error verificando logro", error);
        }
    };
    if (remoteStream) {
        checkVideoCallAchievement();
    }
  }, [remoteStream, achievementChecked]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-base-200 p-4">
      <div className="relative flex h-full w-full max-w-6xl gap-4">
        {/* Video Remoto */}
        <div className="flex-1 overflow-hidden rounded-lg bg-base-300 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
          {!remoteStream && (
             <div className="absolute inset-0 flex items-center justify-center text-base-content/50">
               <span className="loading loading-spinner loading-lg"></span>
               <p className="ml-2">Conectando...</p>
             </div>
          )}
        </div>
        
        {/* Video Local */}
        <div className="absolute bottom-24 right-6 w-48 overflow-hidden rounded-lg border-2 border-primary shadow-xl md:bottom-6 md:w-64">
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 transform">
        <button onClick={handleHangUp} className="btn btn-error btn-circle btn-lg shadow-lg">
          <PhoneOff className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;