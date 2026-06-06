import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FormJugador = () => {
    // 2. Inicializá el hook justo al empezar tu componente
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        dniJugador: '',
        nombre: '',
        apellido: '',
        fechaNacimiento: '',
        correoElectronico: '',
        telefono: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost/olympia-backend/jugadores/guardar_jugador.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const resultado = await response.json();

            if (resultado.status === "success") {
                alert("¡Jugador registrado! Ya forma parte de la base de datos de Olympia.");
                setFormData({
                    dniJugador: '',
                    nombre: '',
                    apellido: '',
                    fechaNacimiento: '',
                    correoElectronico: '',
                    telefono: '',
                });
            } else {
                alert("Hubo un problema: " + resultado.mensaje);
            }
        } catch (error) {
            alert("Error de red. Asegúrate de que el backend esté accesible.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
        <button
        onClick={() => navigate(-1)}
        className="self-start mb-6 text-blue-600 flex items-center hover:text-blue-800 transition-colors"
        >
        &larr; <span className="ml-2 font-semibold">Volver</span>
        </button>

        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl border-t-4 border-green-500">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Registrar Nuevo Jugador</h2>
        <p className="text-gray-600 mb-8 text-center">Ingresa los datos personales para registrarse como Usuario/Jugador.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre(s)</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej. Juan Carlos" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
        </div>
        <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido(s)</label>
        <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required placeholder="Pérez" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">DNI / Identificación</label>
        <input type="number" name="dniJugador" value={formData.dniJugador} onChange={handleChange} required placeholder="Sin puntos ni espacios" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
        </div>
        <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Nacimiento</label>
        <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
        <input type="email" name="correoElectronico" value={formData.correoElectronico} onChange={handleChange} required placeholder="ejemplo@correo.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
        </div>
        <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono de Contacto</label>
        <input type="number" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej. 3794123456" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-200 outline-none" />
        </div>
        </div>

        <div className="flex justify-center pt-4">
        <button type="submit" className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-green-700 shadow-md">
        Registrar Jugador
        </button>
        </div>
        </form>
        </div>
        </div>
    );
};

export default FormJugador;
