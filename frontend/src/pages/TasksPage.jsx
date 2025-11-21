import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, BarChart2, CheckCircle, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore'; // Para obtener users
import { axiosInstance } from '../lib/axios'; // Asumiendo que tienes esta configuración
import toast from 'react-hot-toast';

// --- NUEVOS IMPORTS ---
import TaskModal from '../components/TaskModal.jsx'; // Nuevo componente

// --- CONSTANTES ---
const TASK_API_BASE = '/tasks';

const structureTasks = (tasks) => {
  return tasks.reduce((acc, task) => {
    const statusKey = task.status === 'not started'
      ? 'notStarted'
      : task.status === 'in progress'
        ? 'inProgress'
        : 'completed';

    acc[statusKey].push(task);
    return acc;
  }, { notStarted: [], inProgress: [], completed: [] });
};


// --- Componente de Columna de Tareas ---
// Necesita recibir la función de actualización
const TaskColumn = ({ title, tasks, status, onUpdateTask, icon: Icon }) => {
  const taskCount = tasks ? tasks.length : 0;

  // Lógica para el color del borde de la columna (similar a la lógica anterior)
  let borderColor = 'border-gray-300';
  if (status === 'inProgress') borderColor = 'border-warning';
  else if (status === 'completed') borderColor = 'border-success';
  else if (status === 'notStarted') borderColor = 'border-error';

  return (
    // Usamos flex-shrink-0 y w-80 para mantener el layout Kanban
    <div className={`flex-shrink-0 w-80 bg-base-200 rounded-lg p-4 shadow-inner flex flex-col overflow-hidden`}>
      <div className={`p-4 border-t-4 ${borderColor} bg-base-100/80 sticky top-0 z-10 shadow-sm flex items-center justify-between`}>
        <h2 className="text-xl font-semibold flex items-center">
          <Icon className="w-6 h-6 mr-2 text-primary" />
          {title}
        </h2>
        <span className="badge badge-lg font-mono">{taskCount}</span>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {taskCount === 0 ? (
          <p className="text-center text-sm text-gray-500 italic">No hay tareas aquí.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdateTask={onUpdateTask}
            // Aquí se pasa la lógica de completado
            />
          ))
        )}
      </div>
    </div>
  );
};

// --- Componente TaskCard (Refactorizado para usar la API) ---
const TaskCard = ({ task, onUpdateTask }) => {
  // ... (Lógica de getPriorityBadge, es similar a lo que ya tenías)
  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': case 'high': return 'badge-error';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  const isCompleted = task.status === 'completed';
  const priorityStyle = getPriorityBadge(task.priority);

  const handleComplete = () => {
    if (isCompleted) return;
    // Llama a la función de actualización de la página con el nuevo estado
    onUpdateTask(task._id, 'completed');
  };

  return (
    <div className={`card bg-base-100 shadow-lg mb-4 ${isCompleted ? 'border-l-4 border-success opacity-70' : ''}`}>
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <h2 className={`card-title text-base ${isCompleted ? 'line-through' : ''}`}>{task.title}</h2>
          <div className={`badge text-xs font-bold ${priorityStyle}`}>{task.priority}</div>
        </div>
        <p className={`text-sm text-gray-500 ${isCompleted ? 'line-through' : ''}`}>{task.description}</p>

        <div className="flex justify-between items-center mt-3">
          {task.assignedTo && task.assignedTo.length > 0 && ( // <-- Usar assignedTo de la API
            <div className="flex -space-x-2">
              {task.assignedTo.map((assignee, index) => (
                <div key={assignee._id} className="avatar" title={`Asignado a: ${assignee.fullName}`}>
                  <div className="w-6 h-6 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                    {/* assignedTo tiene fullName y profilePic debido al .populate() del backend */}
                    <img src={assignee.profilePic || '/avatar.png'} alt={assignee.fullName} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCompleted ? (
            <span className="text-success text-sm font-semibold flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Terminada
            </span>
          ) : (
            <button
              className="btn btn-xs btn-success"
              onClick={handleComplete}
            >
              Marcar como Terminada
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Página Principal de Tareas ---
const TasksPage = ({ groupId }) => {
  // Usamos el ID pasado por props o el ID por defecto

  const { authUser, awardTaskBadge } = useAuthStore();

  const [tasks, setTasks] = useState({ notStarted: [], inProgress: [], completed: [] });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal

  // Calcular el total de tareas para el mensaje "vacío"
  const totalTasks = tasks.notStarted.length + tasks.inProgress.length + tasks.completed.length;
  const isBoardEmpty = totalTasks === 0;
  const currentGroupId = groupId || null;

  const fetchTasks = useCallback(async () => {
    if (!authUser?._id) return;

    setLoading(true);
    try {
      let res;

      if (currentGroupId) {
        // 🔥 Modo grupo
        res = await axiosInstance.get(`/tasks/group/${currentGroupId}`);
      } else {
        // 🔥 Modo personal
        res = await axiosInstance.get(`/tasks/user/${authUser._id}`);
      }

      setTasks(structureTasks(res.data));

    } catch (error) {
      console.error("Error al cargar tareas:", error);
      toast.error("Error al cargar las tareas.");
    } finally {
      setLoading(false);
    }
  }, [currentGroupId, authUser?._id]);


  // 2. FUNCIÓN PARA ACTUALIZAR ESTADO DE TAREA (Completar)
  const handleTaskUpdate = async (taskId, newStatus) => {
    try {
      const res = await axiosInstance.put(`${TASK_API_BASE}/${taskId}/status`, { status: newStatus });

      // Recargar todas las tareas (la forma más simple y segura)
      await fetchTasks();
      toast.success(`Tarea marcada como ${newStatus}.`);

      // *Aquí puedes reintroducir la lógica de checkAndAwardBadge si es necesario*

    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar tarea.');
    }
  };


  const handleCreateTask = async (taskData) => {
    try {
      const payload = {
        ...taskData,
        createdBy: authUser._id,
        groupId: currentGroupId || null,   // 🔥 agregado
      };

      await axiosInstance.post(`/tasks`, payload);
      toast.success("Tarea creada con éxito.");
      await fetchTasks();

    } catch (error) {
      console.error("Error al crear tarea:", error);
      toast.error(error.response?.data?.error || "Error al crear tarea.");
    }
  };




  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) {
    return <div className="pt-24 min-h-screen flex justify-center items-center text-xl">Cargando tareas...</div>;
  }

  return (
    <div className="pt-24 min-h-screen">

      {/* Encabezado: Botón de Crear Tarea */}
      {!isBoardEmpty && (
        <header className="flex justify-between items-center mb-6 px-6 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold">Tareas del Grupo: {currentGroupId}</h1>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </header>
      )}

      {/* RENDERIZADO CONDICIONAL */}
      {isBoardEmpty ? (
        // --- Estado de Tablero Vacío ---
        <div className="flex flex-col items-center justify-center p-16 h-[calc(100vh-120px)]">
          <div className="max-w-md text-center space-y-6">
            <div className="flex justify-center">
              <MessageSquare className="w-16 h-16 text-primary/70" />
            </div>
            <h2 className="text-2xl font-bold">¡Tablero de Tareas Vacío!</h2>
            <p className="text-base-content/60">
              Crea la primera tarea para empezar a organizar el trabajo en este grupo.
            </p>
            <button className="btn btn-primary btn-lg mt-4" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-6 h-6" />
              Crear Primera Tarea
            </button>
          </div>
        </div>
      ) : (
        // --- Estado de Tablero con Tareas ---
        <div className="flex justify-center gap-6 overflow-x-auto pb-4 px-6">
          <TaskColumn title="No Iniciada" status="notStarted" tasks={tasks.notStarted} onUpdateTask={handleTaskUpdate} icon={Clock} />
          <TaskColumn title="En Progreso" status="inProgress" tasks={tasks.inProgress} onUpdateTask={handleTaskUpdate} icon={BarChart2} />
          <TaskColumn title="Terminada" status="completed" tasks={tasks.completed} onUpdateTask={handleTaskUpdate} icon={CheckCircle} />
        </div>
      )}

      {/* RENDERIZADO DEL MODAL */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateTask}
        // Pasamos la lista de usuarios disponibles para la asignación
        availableUsers={useChatStore.getState().users}
        currentUserId={authUser?._id}
      />
    </div>
  );
};

export default TasksPage;