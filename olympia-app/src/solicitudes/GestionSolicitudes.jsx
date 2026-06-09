import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Search, AlertCircle, Trophy, Clock } from 'lucide-react';

const GestionSolicitudes = () => {
    const navigate = useNavigate();
    const [solicitudes, setSolicitudes] = useState([]);
    const [torneos, setTorneos] = useState([]);
    
    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Pendiente');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const cargarDatos = async () => {
        try {
            const userDni = localStorage.getItem('olympia_user_dni');
            const urlSol = userDni 
                ? `http://localhost/olympia-backend/solicitudes/obtener_solicitudes.php?dni_usuario=${userDni}`
                : "http://localhost/olympia-backend/solicitudes/obtener_solicitudes.php";

            // 1. Cargar solicitudes de la DB
            const respSol = await fetch(urlSol);
            const dataSol = await respSol.json();
            if (dataSol && dataSol.status === 'error') {
                throw new Error(dataSol.mensaje);
            }
            if (Array.isArray(dataSol)) {
                setSolicitudes(dataSol);
            }

            // 2. Cargar torneos de la DB
            const respTorneos = await fetch("http://localhost/olympia-backend/torneos/obtener_torneos.php");
            const dataTorneos = await respTorneos.json();
            if (dataTorneos && dataTorneos.status === 'error') {
                throw new Error(dataTorneos.mensaje);
            }
            if (Array.isArray(dataTorneos)) {
                setTorneos(dataTorneos);
            }
        } catch (error) {
            console.error("Error al cargar datos del backend:", error);
            // Fallback a localStorage
            const storedSolicitudes = localStorage.getItem('olympia_solicitudes');
            if (storedSolicitudes) setSolicitudes(JSON.parse(storedSolicitudes));
            const storedTorneos = localStorage.getItem('olympia_torneos_local');
            if (storedTorneos) setTorneos(JSON.parse(storedTorneos));
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleAprobar = async (idSolicitud) => {
        setError('');
        setSuccess('');

        const solicitud = solicitudes.find(s => s.id === idSolicitud);
        if (!solicitud) return;

        // Obtener torneo y verificar cupos
        const torneo = torneos.find(t => t.id_torneo === solicitud.idTorneo);
        if (torneo && torneo.cupos_libres <= 0) {
            setError('No hay cupos disponibles en el torneo para aprobar esta solicitud.');
            return;
        }

        try {
            const resp = await fetch("http://localhost/olympia-backend/solicitudes/procesar_solicitud.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_solicitud: idSolicitud,
                    accion: 'aprobar'
                })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                setSuccess(data.mensaje || `Solicitud aprobada para el torneo "${torneo?.nombre_torneo}".`);
                await cargarDatos();
            } else {
                setError(data.mensaje || 'Error al aprobar la solicitud.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        }
    };

    const handleRechazar = async (idSolicitud) => {
        setError('');
        setSuccess('');

        try {
            const resp = await fetch("http://localhost/olympia-backend/solicitudes/procesar_solicitud.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_solicitud: idSolicitud,
                    accion: 'rechazar'
                })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                setSuccess(data.mensaje || 'Solicitud rechazada con éxito.');
                await cargarDatos();
            } else {
                setError(data.mensaje || 'Error al rechazar la solicitud.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        }
    };

    const solicitudesFiltradas = solicitudes.filter(sol => {
        const matchesEstado = filtroEstado === 'Todos' || sol.estado === filtroEstado;
        const matchesSearch = sol.nombreEquipo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             sol.nombreTorneo.toLowerCase().includes(busqueda.toLowerCase());
        return matchesEstado && matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Cabecera */}
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase tracking-tight">
                    Gestión de Solicitudes
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Revisa las solicitudes de inscripción enviadas por los capitanes de equipo. Aprueba o rechaza participantes.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 border border-slate-850 p-4 rounded-2xl">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por equipo o torneo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 text-xs transition-colors"
                    />
                </div>

                <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
                    {['Todos', 'Pendiente', 'Aprobado', 'Rechazado'].map((est) => (
                        <button
                            key={est}
                            onClick={() => setFiltroEstado(est)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                filtroEstado === est
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            {est}
                        </button>
                    ))}
                </div>
            </div>

            {/* Listado de Solicitudes */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/40 text-slate-400 text-xs border-b border-slate-850 font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Equipo</th>
                                <th className="px-6 py-4">Torneo</th>
                                <th className="px-6 py-4">Deporte</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-xs">
                            {solicitudesFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No se encontraron solicitudes que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                solicitudesFiltradas.map((sol) => {
                                    const torneo = torneos.find(t => t.id_torneo === sol.idTorneo);
                                    const cupos = torneo ? torneo.cupos_libres : 0;
                                    
                                    return (
                                        <tr key={sol.id} className="hover:bg-slate-950/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-extrabold text-white">{sol.nombreEquipo}</div>
                                                <div className="text-[10px] text-slate-500">ID: {sol.idEquipo}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-200">{sol.nombreTorneo}</div>
                                                {torneo && (
                                                    <div className="text-[10px] text-slate-400">
                                                        Cupos disponibles: <strong className={cupos > 0 ? 'text-green-400' : 'text-red-400'}>{cupos}</strong>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] bg-slate-850 text-slate-300 font-bold px-2 py-0.5 rounded uppercase border border-slate-800">
                                                    {sol.deporte === 'Futbol' ? 'Fútbol' : sol.deporte}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-medium">{sol.fechaSolicitud}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide border ${
                                                    sol.estado === 'Aprobado'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : sol.estado === 'Rechazado'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                }`}>
                                                    {sol.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {sol.estado === 'Pendiente' ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleAprobar(sol.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-sm shadow-green-600/10 transition-colors"
                                                            title="Aprobar Inscripción"
                                                        >
                                                            <CheckCircle className="h-3.5 w-3.5" />
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() => handleRechazar(sol.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-sm shadow-red-600/10 transition-colors"
                                                            title="Rechazar Inscripción"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-slate-500 italic">
                                                        Procesado
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GestionSolicitudes;
