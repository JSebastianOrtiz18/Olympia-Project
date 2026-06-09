import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, ShieldAlert, Sparkles } from 'lucide-react';

const FormEquipo = () => {
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('olympia_user_email') || 'capitan@olympia.com';
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        nombreEquipo: '',
        descripcionEquipo: '',
        categoriaEquipo: 'Libre',
        deporteEquipo: 'Futbol'
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.nombreEquipo.trim() || !formData.descripcionEquipo.trim()) {
            setError('Todos los campos obligatorios deben ser completados');
            return;
        }

        const newId = 'eq_' + Date.now();
        const datosEnvio = {
            id: newId,
            nombre_equipo: formData.nombreEquipo,
            descripcion_equipo: formData.descripcionEquipo,
            categoria_equipo: formData.categoriaEquipo,
            deporte_equipo: formData.deporteEquipo
        };

        let savedLocally = false;
        try {
            // Guardar localmente siempre para garantizar la persistencia del prototipo
            const storedEquipos = localStorage.getItem('olympia_equipos');
            const listaEquipos = storedEquipos ? JSON.parse(storedEquipos) : [];
            
            const nuevoEquipoLocal = {
                id: newId,
                nombre: formData.nombreEquipo,
                descripcion: formData.descripcionEquipo,
                categoria: formData.categoriaEquipo,
                deporte: formData.deporteEquipo,
                capitanEmail: userEmail,
                jugadores: []
            };

            listaEquipos.push(nuevoEquipoLocal);
            localStorage.setItem('olympia_equipos', JSON.stringify(listaEquipos));
            savedLocally = true;

            // Llamar al backend
            const response = await fetch("http://localhost/olympia-backend/equipos/guardar_equipo.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosEnvio),
            });

            const resultado = await response.json();
            if (resultado.status !== "success") {
                console.warn("El backend devolvió un error, pero guardamos en localstorage para prototipo:", resultado.mensaje);
            }
        } catch (err) {
            console.error("No se pudo conectar con el backend. Guardado en modo prototipo local.", err);
        }

        if (savedLocally) {
            setSuccess('¡Equipo registrado con éxito! Redirigiendo a gestión de plantilla...');
            setTimeout(() => {
                navigate(`/capitan/plantilla/${newId}`);
            }, 1200);
        } else {
            setError('Error al registrar el equipo.');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto w-full">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider mb-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>

            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600/10 p-6 rounded-bl-full text-blue-500/20">
                    <Users className="h-16 w-16" />
                </div>

                <div className="mb-6 relative z-10">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Registrar Nuevo Equipo</h2>
                    <p className="text-xs text-slate-400 mt-1">Completa los datos básicos para inscribir tus jugadores luego.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl text-xs mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Equipo</label>
                        <input 
                            type="text" 
                            name="nombreEquipo" 
                            value={formData.nombreEquipo} 
                            onChange={handleChange} 
                            required 
                            placeholder="Ej. Los Halcones FC" 
                            className="block w-full px-4 py-3 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción corta / Ciudad</label>
                        <input 
                            type="text" 
                            name="descripcionEquipo" 
                            value={formData.descripcionEquipo} 
                            onChange={handleChange} 
                            required 
                            placeholder="Ej. Buenos Aires - Lema del equipo" 
                            className="block w-full px-4 py-3 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
                            <select 
                                name="categoriaEquipo" 
                                value={formData.categoriaEquipo} 
                                onChange={handleChange} 
                                required 
                                className="block w-full px-4 py-3 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 text-sm transition-colors cursor-pointer"
                            >
                                <option value="Sub-18">Sub-18</option>
                                <option value="Libre">Libre</option>
                                <option value="Veteranos">Veteranos</option>
                                <option value="Junior">Junior</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deporte</label>
                            <select 
                                name="deporteEquipo" 
                                value={formData.deporteEquipo} 
                                onChange={handleChange} 
                                required 
                                className="block w-full px-4 py-3 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 text-sm transition-colors cursor-pointer"
                            >
                                <option value="Futbol">Fútbol</option>
                                <option value="Basquet">Básquet</option>
                                <option value="Voley">Vóley</option>
                                <option value="Ping-Pong">Ping-Pong</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full py-3.5 px-4 rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-blue-600/20 active:scale-[0.98] mt-4"
                    >
                        CREAR EQUIPO Y ABRIR PLANTILLA
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FormEquipo;
