import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import TasksPage from "./pages/TasksPage";
import SimulationPage from "./pages/SimulationPage";
import VideoCallPage from "./pages/VideoCallPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useVideoCallStore } from "./store/useVideoCallStore";
import { useEffect } from "react";

import { Toaster, toast } from "react-hot-toast"; // Agregué toast aquí
import IncomingCallModal from "./components/IncomingCallModal";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers, socket } = useAuthStore();
  const { setIncomingCall, incomingCall } = useVideoCallStore(); // Traemos incomingCall para ver estado

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // --- LÓGICA DE LLAMADA ENTRANTE (CON LOGS) ---
  useEffect(() => {
    if (!socket) return;

    // Handler definido fuera para poder limpiarlo
    const handleIncomingCall = ({ fromUser, offer }) => {
      console.log("🔔 EVENTO RECIBIDO: call:incoming", fromUser);
      toast.success(`Llamada entrante de ${fromUser.fullName}`); // Notificación visual extra
      setIncomingCall({ fromUser, offer });
    };

    socket.on("call:incoming", handleIncomingCall);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
    };
  }, [socket, setIncomingCall]);
  // ---------------------------------------------

  // --- DEBUG: VERIFICAR ESTADO DEL SOCKET ---
  useEffect(() => {
    if (socket) {
      console.log("🔌 Socket conectado en App.jsx. ID:", socket.id);
      console.log("👥 Usuarios Online:", onlineUsers);
    }
  }, [socket, onlineUsers]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex gap-2 items-center justify-center min-h-screen">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );

  return (
    <div data-theme="dark" className="min-h-screen bg-base-100 relative">
      <Navbar />
      
      {/* --- BOTÓN DE PRUEBA (BORRAR DESPUÉS) --- */}
      {authUser && (
        <button 
            onClick={() => {
                console.log("🧪 Simulando llamada...");
                setIncomingCall({
                    fromUser: { 
                        _id: "123", 
                        fullName: "Prueba de Modal", 
                        profilePic: "/avatar.png" 
                    },
                    offer: {}
                });
            }}
            className="fixed bottom-4 left-4 btn btn-xs btn-warning z-[9999]"
        >
            🧪 Test Modal
        </button>
      )}
      {/* ---------------------------------------- */}

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/tasks" element={authUser ? <TasksPage /> : <Navigate to="/login" />} />
        <Route path="/simulation" element={authUser ? <SimulationPage /> : <Navigate to="/login" />} />
        <Route path="/videocall/:userId" element={authUser ? <VideoCallPage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
      
      {/* MODAL: Asegúrate que esté aquí al final */}
      <IncomingCallModal />
      
    </div>
  );
};

export default App;