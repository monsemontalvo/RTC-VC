import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Trophy, MessageSquare, MapPin, Users, Video, CheckSquare, Send } from "lucide-react"; 

// Configuración de iconos y colores para cada logro
const ACHIEVEMENTS_CONFIG = {
  "Capitán Fundador": { icon: Users, color: "text-blue-500", desc: "Crear tu primer grupo" },
  "Cara a Cara": { icon: Video, color: "text-purple-500", desc: "Realizar tu primera videollamada" },
  "Trabajo en Equipo": { icon: CheckSquare, color: "text-green-500", desc: "Completar 1 tarea asignada" },
  "Agente Secreto": { icon: MessageSquare, color: "text-gray-400", desc: "Enviar tu primer mensaje" },
  "Corresponsal de Campo": { icon: MapPin, color: "text-red-500", desc: "Compartir tu ubicación" },
  "Hiperconectado": { icon: Send, color: "text-yellow-500", desc: "Enviar 10 mensajes" },
  "Cartero": { icon: Mail, color: "text-orange-500", desc: "Enviar tu primer correo" },
};

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  // Combinamos los logros nuevos (array) con el antiguo (booleano) si lo sigues usando
  const achievementsList = authUser.achievements || [];

  return (
    <div className="h-screen pt-20 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Perfil</h1>
            <p className="mt-2">Tu información de perfil y logros.</p>
          </div>

          {/* Sección de Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-base-content hover:scale-105 p-2 rounded-full cursor-pointer transition-all duration-200 ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}`}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Cargando..." : "Da clic al icono de la cámara para cambiar tu foto de perfil"}
            </p>
          </div>

          {/* LOGRO ANTIGUO DE PREDICCIÓN (SI EXISTE) */}
          {authUser.hasWonPredictionBadge && (
            <div className="text-center">
              <div className="badge badge-lg badge-warning gap-2 p-3 font-bold text-lg shadow-md">
                <Trophy className="w-5 h-5" />
                Predicción Perfecta
              </div>
              <p className="text-sm text-zinc-400 mt-2">
                ¡Acertaste el ganador del simulador de la Copa!
              </p>
            </div>
          )}

          {/* --- NUEVA SECCIÓN DE LOGROS --- */}
          <div className="mt-6 bg-base-200 rounded-xl p-4">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Logros Desbloqueados
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievementsList.length > 0 ? (
                achievementsList.map((achName) => {
                  const config = ACHIEVEMENTS_CONFIG[achName];
                  if (!config) return null;
                  const Icon = config.icon;
                  
                  return (
                    <div key={achName} className="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-content/10 shadow-sm">
                      <div className={`p-2 rounded-full bg-base-200 ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{achName}</p>
                        <p className="text-xs text-zinc-400">{config.desc}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-zinc-500 text-sm italic col-span-2 text-center">
                  Aún no has desbloqueado logros nuevos. ¡Interactúa con la app!
                </p>
              )}
            </div>
          </div>
          {/* ------------------------------ */}

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre Completo
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Correo Electrónico
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Información de la Cuenta</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Miembro desde</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Estado de cuenta</span>
                <span className="text-green-500">Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;