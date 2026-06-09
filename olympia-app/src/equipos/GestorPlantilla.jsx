import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, Trash2, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

const GestorPlantilla = () => {
    const { idEquipo } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [newPlayer, setNewPlayer] = useState({
        dni: '',
        nombre: '',
        apellido: ''
    });

    useEffect(() => {
        const storedEquipos = localStorage.getItem('olympia_equipos');
        if (storedEquipos) {
            const list = JSON.parse(storedEquipos);
            const found = list.find(eq => eq.id === idEquipo);
            if (found) {
                setTeam(found);
            }
        }
    }, [idEquipo]);

    if (!team) {
        return (
            <div className="text-center py-12 text-slate-400">
                <p className="text-lg font-bold">Cargando equipo o no encontrado...</p>
                <button 
                    onClick={() => navigate('/capitan')}
                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    const getSportLimits = (deporte) => {
        switch (deporte) {
            case 'Futbol': 
                return { label: 'Fútbol', max: 18, min: 7 };
            case 'Basquet': 
                return { label: 'Básquet', max: 12, min: 5 };
            case 'Voley': 
                return { label: 'Vóley', max: 12, min: 6 };
            case 'Ping-Pong': 
                return { label: 'Ping-Pong', max: 2, min: 1 };
            default: 
                return { label: deporte, max: 18, min: 5 };
        }
    };

    const sportInfo = getSportLimits(team.deporte);
    const currentCount = team.jugadores ? team.jugadores.length : 0;
    const isLimitReached = currentCount >= sportInfo.max;

    const handlePlayerChange = (e) => {
        setNewPlayer({ ...newPlayer, [e.target.name]: e.target.value });
        setError('');
    };

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { dni, nombre, apellido } = newPlayer;

        // Validaciones HU-2.2
        if (!dni || !nombre || !apellido) {
            setError('Todos los campos del jugador son obligatorios');
            return;
        }

        if (dni.length < 7 || dni.length > 9) {
            setError('El DNI ingresado no tiene un formato válido');
            return;
        }

        if (isLimitReached) {
            setError(`La plantilla para ${sportInfo.label} ya está completa (Límite: ${sportInfo.max} jugadores)`);
            return;
        }

        // Validar DNI único dentro de la misma plantilla
        const dniDuplicado = team.jugadores && team.jugadores.some(j => j.dni === dni);
        if (dniDuplicado) {
            setError(`El jugador con DNI ${dni} ya se encuentra registrado en este equipo`);
            return;
        }

        // Actualizar equipo en localStorage
        const storedEquipos = localStorage.getItem('olympia_equipos');
        if (storedEquipos) {
            const list = JSON.parse(storedEquipos);
            const index = list.findIndex(eq => eq.id === idEquipo);
            if (index !== -1) {
                if (!list[index].jugadores) list[index].jugadores = [];
                list[index].jugadores.push({ dni, nombre, apellido });
                
                localStorage.setItem('olympia_equipos', JSON.stringify(list));
                setTeam(list[index]); // Actualizar estado local
                setSuccess('Jugador agregado correctamente a la plantilla');
                setNewPlayer({ dni: '', nombre: '', apellido: '' }); // Limpiar formulario
            }
        }

        // Intento de guardar en backend (opcional, fallback local ya hecho)
        try {
            const response = await fetch("http://localhost/olympia-backend/jugadores/guardar_jugador.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dni_jugador: dni,
                    nombre_jugador: nombre,
                    apellido_jugador: apellido,
                    id_equipo: idEquipo
                })
            });
            const result = await response.json();
            if (result.status !== 'success') {
                console.warn("Backend error guardar_jugador:", result.mensaje);
            }
        } catch (error) {
            console.log("Servidor backend no disponible, cambios guardados localmente");
        }
    };

    const handleRemovePlayer = (dni) => {
        const storedEquipos = localStorage.getItem('olympia_equipos');
        if (storedEquipos) {
            const list = JSON.parse(storedEquipos);
            const index = list.findIndex(eq => eq.id === idEquipo);
            if (index !== -1) {
                list[index].jugadores = list[index].jugadores.filter(j => j.dni !== dni);
                localStorage.setItem('olympia_equipos', JSON.stringify(list));
                setTeam(list[index]);
                setSuccess('Jugador eliminado de la plantilla');
            }
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Cabecera de Navegación */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate('/capitan')}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Dashboard
                </button>
            </div>

            {/* Ficha del Equipo */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-indigo-600/5 p-8 rounded-bl-full text-indigo-500/10 pointer-events-none">
                    <Users className="h-20 w-20" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1 rounded-full border border-indigo-500/20 uppercase">
                            {sportInfo.label}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold bg-slate-850 px-2.5 py-1 rounded-lg">
                            Categoría: {team.categoria}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">{team.nombre}</h1>
                    <p className="text-xs text-slate-400 mt-1">{team.descripcion}</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl min-w-[200px] relative z-10 text-center md:text-left">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estado Plantilla</p>
                    <div className="flex items-baseline justify-center md:justify-start gap-1 mt-1">
                        <span className={`text-2xl font-black ${currentCount >= sportInfo.min ? 'text-green-400' : 'text-yellow-400'}`}>
                            {currentCount}
                        </span>
                        <span className="text-slate-400 text-sm">/ {sportInfo.max} jugadores</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                        {currentCount < sportInfo.min ? (
                            <span className="text-yellow-500 flex items-center justify-center md:justify-start gap-1">
                                <AlertTriangle className="h-3 w-3" /> Faltan {sportInfo.min - currentCount} para el mínimo
                            </span>
                        ) : (
                            <span className="text-green-400 flex items-center justify-center md:justify-start gap-0.5">
                                <ShieldCheck className="h-3.5 w-3.5" /> Equipo Apto para Inscripción
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Dos Paneles: Formulario de Agregar y Tabla de Jugadores */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Formulario Agregar Jugador */}
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-4">
                        <UserPlus className="h-5 w-5 text-blue-400" />
                        <h2 className="text-lg font-bold text-white">Agregar Jugador</h2>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-3 py-2 rounded-xl text-xs mb-4 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-3 py-2 rounded-xl text-xs mb-4 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-green-500"></span>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleAddPlayer} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">DNI *</label>
                            <input
                                type="number"
                                name="dni"
                                value={newPlayer.dni}
                                onChange={handlePlayerChange}
                                disabled={isLimitReached}
                                required
                                placeholder="Ej. 42345678"
                                className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={newPlayer.nombre}
                                onChange={handlePlayerChange}
                                disabled={isLimitReached}
                                required
                                placeholder="Ej. Mateo"
                                className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Apellido *</label>
                            <input
                                type="text"
                                name="apellido"
                                value={newPlayer.apellido}
                                onChange={handlePlayerChange}
                                disabled={isLimitReached}
                                required
                                placeholder="Ej. Rossi"
                                className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLimitReached}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 ${
                                isLimitReached 
                                ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed shadow-none' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-[0.98]'
                            }`}
                        >
                            <UserPlus className="h-4 w-4" />
                            {isLimitReached ? 'LÍMITE ALCANZADO' : 'AGREGAR A PLANTILLA'}
                        </button>
                    </form>

                    <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex gap-2">
                        <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                            <p className="font-bold text-slate-300">Reglas del Deporte:</p>
                            <p>Máximo de jugadores: <strong className="text-white">{sportInfo.max}</strong>.</p>
                            <p>Mínimo para habilitar inscripción: <strong className="text-white">{sportInfo.min}</strong>.</p>
                        </div>
                    </div>
                </div>

                {/* Tabla de Jugadores */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
                    <div className="p-5 border-b border-slate-850">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-400" />
                            Jugadores Inscritos
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/40 text-slate-400 text-xs border-b border-slate-850 font-bold">
                                    <th className="px-6 py-3 tracking-wider">DNI</th>
                                    <th className="px-6 py-3 tracking-wider">Jugador</th>
                                    <th className="px-6 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!team.jugadores || team.jugadores.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-slate-500 text-xs">
                                            Aún no hay jugadores registrados en la plantilla de este equipo.
                                        </td>
                                    </tr>
                                ) : (
                                    team.jugadores.map((j) => (
                                        <tr key={j.dni} className="border-b border-slate-850 hover:bg-slate-950/20 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-300">{j.dni}</td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-100">
                                                {j.nombre} {j.apellido}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRemovePlayer(j.dni)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Eliminar jugador de la plantilla"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GestorPlantilla;
