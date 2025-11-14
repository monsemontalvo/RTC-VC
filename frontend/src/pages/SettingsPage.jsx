import React from 'react';
import { useChatStore } from '../store/useChatStore';
import toast from 'react-hot-toast'; // Asegúrate de importar toast

const SettingsPage = () => {
  // --- ASÍ ESTABA (INCORRECTO) ---
  /*
  const { isEncryptionEnabled, toggleEncryption } = useChatStore(
    (state) => ({
      isEncryptionEnabled: state.isEncryptionEnabled,
      toggleEncryption: state.toggleEncryption,
    })
  );
  */

  // --- ASÍ DEBE SER (CORRECTO) ---
  // Seleccionamos cada "pieza" del estado por separado.
  // Esto evita que se cree un objeto nuevo en cada render.
  const isEncryptionEnabled = useChatStore((state) => state.isEncryptionEnabled);
  const toggleEncryption = useChatStore((state) => state.toggleEncryption);
  // --- FIN DE LA CORRECCIÓN ---


  const handleToggle = () => {
    toggleEncryption();
    // (El toast ya se maneja dentro del store, pero si quieres uno aquí también, puedes dejarlo)
    // toast.success(
    //   !isEncryptionEnabled
    //     ? "Encriptación E2E Habilitada"
    //     : "Encriptación E2E Deshabilitada"
    // );
  };

  return (
    <div className='container mx-auto p-4 max-w-md'>
      <h1 className='text-3xl font-bold mb-6 text-center'>Configuración</h1>

      <div className='p-4 bg-base-200 rounded-lg shadow'>
        <div className='form-control'>
          <label className='label cursor-pointer'>
            <span className='label-text text-lg font-medium'>
              Habilitar Encriptación de Extremo a Extremo (E2E)
            </span>
            <input
              type='checkbox'
              className='toggle toggle-primary'
              checked={isEncryptionEnabled}
              onChange={handleToggle}
            />
          </label>
          <div className='text-xs text-base-content/70 p-2'>
            <p>
              Cuando está habilitada, tus mensajes de texto se encriptan en tu
              dispositivo y solo el receptor puede desencriptarlos. El servidor
              no podrá leer tus mensajes.
            </p>
            <p className='mt-2 font-bold text-warning'>
              Nota: Esto solo afecta a los mensajes nuevos que envíes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;