import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FormColaborador = () => {
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    fechaNac: '', // Ajustado para ser DATE según DB
    email: '',
    telefono: '',
    rol: '2' // Suponiendo ID de Roles (Ej: 1=Admin, 2=Org Secundario, 3=Asistente)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const resp = await fetch("http://localhost/olympia-backend/usuarios/guardar_colaborador.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const res = await resp.json();

      if(res.status === "success") {
        alert("Colaborador registrado exitosamente");
        setFormData({
          dni: '', nombre: '', apellido: '', fechaNac: '', email: '', telefono: '', rol: '2'
        });
      } else {
        alert("Error: " + res.mensaje);
      }
    } catch (err) {
      alert("Error al conectar con el servidor PHP.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
    <Link to="/" className="self-start mb-6 text-blue-600 flex items-center hover:text-orange-800 transition-colors">
    <button className="flex items-center font-semibold">&larr; <span className="ml-2">Volver al Inicio</span></button>
    </Link>

    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border-t-4 border-orange-500">
    <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Registrar Nuevo Personal</h2>
    <p className="text-gray-600 mb-8 text-center">Ingresa los datos para crear una cuenta de colaborador en Olympia.</p>

    <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" />
    </div>
    <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">Apellido</label>
    <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" />
    </div>
    </div>

    <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">DNI Usuario</label>
    <input type="number" name="dni" value={formData.dni} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Nacimiento</label>
    <input type="date" name="fechaNac" value={formData.fechaNac} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" />
    </div>
    <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
    <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" />
    </div>
    </div>

    <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-200 outline-none" />
    </div>

    <div>
    <label className="block text-sm font-bold text-gray-700 mb-1">Rol de Trabajo</label>
    <select name="rol" value={formData.rol} onChange={handleChange} className="w-full p-2 border rounded bg-white outline-none focus:ring-2 focus:ring-orange-200">
    <option value="2">Organizador Secundario</option>
    <option value="3">Asistente de Campo</option>
    </select>
    </div>

    <div className="pt-4">
    <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 shadow-md">
    Registrar en Olympia
    </button>
    </div>
    </form>
    </div>
    </div>
  );
};

export default FormColaborador;
