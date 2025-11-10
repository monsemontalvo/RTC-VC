import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import TasksPage from "./pages/TasksPage";
import SimulationPage from "./pages/SimulationPage";
import VideoCallPage from "./pages/VideoCallPage";

import {Routes, Route, Navigate} from "react-router-dom";
import {useAuthStore} from "./store/useAuthStore";
import { useVideoCallStore } from "./store/useVideoCallStore";
import {useEffect} from "react";

import { Toaster } from "react-hot-toast";
import IncomingCallModal from "./components/IncomingCallModal";

const App = () => {
  const {authUser, checkAuth, isCheckingAuth, onlineUsers, socket} = useAuthStore(); // <-- 3. Obtener 'socket'
  const { setIncomingCall } = useVideoCallStore(); // <-- 4. Obtener setter
  console.log({onlineUsers});
 
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // --- 5. AÑADIR ESTE useEffect ---
  // Listener global para llamadas entrantes
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ fromUser, offer }) => {
      setIncomingCall({ fromUser, offer });
    };

    socket.on("call:incoming", handleIncomingCall);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
    };
  }, [socket, setIncomingCall]);
  // --- FIN DEL NUEVO useEffect ---

  console.log({ authUser });

if(isCheckingAuth && !authUser) return(
  <div className="flex gap-2 items-center justify-center min-h-screen">
    <span className="loading loading-dots loading-xs"></span>
    <span className="loading loading-dots loading-sm"></span>
    <span className="loading loading-dots loading-md"></span>
    <span className="loading loading-dots loading-lg"></span>
    <span className="loading loading-dots loading-xl"></span>
  </div>
);

  return (
    <div data-theme="dark" className="min-h-screen bg-base-100">
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/tasks" element={authUser ? <TasksPage /> : <Navigate to="/login" />} />
        <Route path="/simulation" element={authUser ? <SimulationPage /> : <Navigate to="/login" />} />
        <Route path='/videocall/:userId' element={authUser ? <VideoCallPage /> : <Navigate to='/login' />} />
      </Routes>
      <Toaster />
      <IncomingCallModal /> 
    </div>
  );
};

export default App;