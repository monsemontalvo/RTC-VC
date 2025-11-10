import React, { useState } from 'react';
import { Plus } from 'lucide-react';

// --- DATOS DE EJEMPLO ---
const initialTasks = {
  notStarted: [
    {
      id: 'task-1',
      title: 'Agregar autenticación',
      description: 'Implementar JWT y cookies para la autenticación de usuarios.',
      priority: 'High',
      assignees: ['/avatar.png', '/avatar.png'],
    },
    {
      id: 'task-2',
      title: 'Diseñar la página de perfil',
      description: 'Crear mockups en Figma para la vista de perfil de usuario.',
      priority: 'Medium',
      assignees: ['/avatar.png'],
    },
  ],
  inProgress: [
    {
      id: 'task-3',
      title: 'Configurar la base de datos',
      description: 'Definir los esquemas de Mongoose para Usuarios y Mensajes.',
      priority: 'High',
      assignees: ['/avatar.png'],
    },
  ],
  completed: [
    {
      id: 'task-4',
      title: 'Inicializar el proyecto',
      description: 'Configurar Vite + React con Tailwind y daisyUI.',
      priority: 'Low',
      assignees: ['/avatar.png'],
    },
  ],
};

// --- Componente de Tarjeta de Tarea ---
const TaskCard = ({ task }) => {
  const getPriorityBadge = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'badge-error';
      case 'medium':
        return 'badge-warning';
      case 'low':
        return 'badge-success';
      default:
        return 'badge-ghost';
    }
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-4 space-y-3 transition-transform hover:-translate-y-1 cursor-grab">
      {/* Título de la Tarea */}
      <h3 className="font-semibold text-lg">{task.title}</h3>

      {/* Descripción */}
      <p className="text-sm text-base-content/80">{task.description}</p>

      {/* Prioridad */}
      <div>
        <span className={`badge ${getPriorityBadge(task.priority)} text-xs font-semibold`}>
          {task.priority}
        </span>
      </div>

      {/* Asignados */}
      <div className="flex -space-x-3">
        {task.assignees.map((avatar, index) => (
          <div key={index} className="avatar">
            <div className="w-8 rounded-full ring ring-base-200">
              <img src={avatar} alt={`Assignee ${index + 1}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Componente de Columna de Tareas ---
const TaskColumn = ({ title, tasks }) => {
  return (
    // Definimos un ancho fijo para que las columnas no se colapsen
    <div className="flex-shrink-0 w-80 bg-base-200 rounded-lg p-4 shadow-inner">
      {/* Título de la Columna */}
      <h2 className="text-xl font-bold mb-4 text-primary">{title}</h2>

      {/* Contenedor de Tarjetas */}
      <div className="space-y-4 h-full overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

// --- Página Principal de Tareas ---
const TasksPage = () => {
  const [tasks, setTasks] = useState(initialTasks);

  // NOTA: Aquí iría la lógica para "Drag and Drop" (arrastrar y soltar)
  // y para manejar el estado de las tareas (setTasks).

  return (
    // Usamos pt-24 para dejar espacio para la Navbar fija
    // Quitamos p-6 para que el contenedor de scroll funcione a ancho completo
    <div className="pt-24 min-h-screen">
      
      {/* Encabezado de la Página */}
      {/* Añadimos max-w-7xl y mx-auto para centrar el encabezado */}
      <header className="flex justify-between items-center mb-6 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold">Tasks</h1>
        <button className="btn btn-primary">
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </header>

      {/* Contenedor del Tablero Kanban */}
      {/* Añadimos justify-center para centrar las columnas.
        Añadimos px-6 para que haya padding en los bordes al hacer scroll.
      */}
      <div className="flex justify-center gap-6 overflow-x-auto pb-4 px-6">
        <TaskColumn title="Not started" tasks={tasks.notStarted} />
        <TaskColumn title="In progress" tasks={tasks.inProgress} />
        <TaskColumn title="Completed" tasks={tasks.completed} />
      </div>
    </div>
  );
};

export default TasksPage;