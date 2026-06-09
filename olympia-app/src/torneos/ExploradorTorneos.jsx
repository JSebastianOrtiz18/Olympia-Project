import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Filter, ShieldCheck, AlertTriangle, Users, Search, Clock, Info } from 'lucide-react';

const ExploradorTorneos = () => {
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('olympia_user_email') || 'capitan@olympia.com';
    const [torneos, setTorneos] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    
    // Filtros
    const [filtroDeporte, setFiltroDeporte] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [equipoSeleccionadoId, setEquipoSeleccionadoId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Cargar Torneos (backend fallback a local storage)
        const cargarTorneos = async () => {
            let torneosLista = [];
            let backendExito = false;
            try {
                const resp = await fetch("http://localhost/olympia-backend/torneos/obtener_torneos.php");
                const data = await resp.json();
                if (Array.isArray(data)) {
                    torneosLista = data;
                    backendExito = true;
                }
            } catch (error) {
                console.log("No se pudo conectar con el backend para torneos, cargando locales...");
            }

            if (!backendExito) {
                // Fallback a localStorage para mantener sincronía
                const localTorneos = localStorage.getItem('olympia_torneos_local');
                if (localTorneos) {
                    torneosLista = JSON.parse(localTorneos);
                } else {
                    // Datos iniciales de torneos para la demo
                    torneosLista = [
                        { id_torneo: 'torneo_1', nombre_torneo: 'Superliga de Fútbol Amateur', deporte_torneo: 'Futbol', categoria_torneo: 'Libre', cupos_max: 8, cupos_libres: 4, estado: 'Programado', fecha_inicio: '2026-06-01' },
                        { id_torneo: 'torneo_2', nombre_torneo: 'Torneo de Básquet 3x3', deporte_torneo: 'Basquet', categoria_torneo: 'Libre', cupos_max: 6, cupos_libres: 0, estado: 'Programado', fecha_inicio: '2026-06-10' },
                        { id_torneo: 'torneo_3', nombre_torneo: 'Liga Universitaria de Vóley', deporte_torneo: 'Voley', categoria_torneo: 'Libre', cupos_max: 12, cupos_libres: 2, estado: 'Programado', fecha_inicio: '2026-07-05' },
                        { id_torneo: 'torneo_4', nombre_torneo: 'Torneo Ping-Pong Dobles', deporte_torneo: 'Ping-Pong', categoria_torneo: 'Libre', cupos_max: 8, cupos_libres: 6, estado: 'Programado', fecha_inicio: '2026-06-25' }
                    ];
                    localStorage.setItem('olympia_torneos_local', JSON.stringify(torneosLista));
                }
            }

            // Excluir los torneos que hayan sido eliminados mediante baja lógica
            const eliminados = JSON.parse(localStorage.getItem('olympia_eliminados_ids') || '[]');
            setTorneos(torneosLista.filter(t => !eliminados.includes(t.id_torneo)));
        };

        // Cargar Equipos del capitán
        const storedEquipos = localStorage.getItem('olympia_equipos');
        if (storedEquipos) {
            const list = JSON.parse(storedEquipos);
            const filtrados = list.filter(eq => eq.capitanEmail === userEmail);
            setEquipos(filtrados);
            if (filtrados.length > 0) {
                setEquipoSeleccionadoId(filtrados[0].id);
            }
        }

        // Cargar solicitudes de inscripción de la DB
        const cargarSolicitudes = async () => {
            try {
                const resp = await fetch("http://localhost/olympia-backend/solicitudes/obtener_solicitudes.php");
                const data = await resp.json();
                if (data && data.status === 'error') {
                    throw new Error(data.mensaje);
                }
                if (Array.isArray(data)) {
                    setSolicitudes(data);
                }
            } catch (err) {
                console.error("Error al cargar solicitudes de la DB:", err);
                const storedSolicitudes = localStorage.getItem('olympia_solicitudes');
                if (storedSolicitudes) {
                    setSolicitudes(JSON.parse(storedSolicitudes));
                }
            }
        };

        cargarTorneos();
        cargarSolicitudes();
    }, [userEmail]);

    const getMinPlayers = (deporte) => {
        switch (deporte) {
            case 'Futbol': return 7;
            case 'Basquet': return 5;
            case 'Voley': return 6;
            case 'Ping-Pong': return 1;
            default: return 5;
        }
    };

    const handleInscribirse = async (torneo) => {
        setError('');
        setSuccess('');

        if (!equipoSeleccionadoId) {
            setError('Debes registrar o seleccionar un equipo primero.');
            return;
        }

        const equipo = equipos.find(eq => eq.id === equipoSeleccionadoId);
        if (!equipo) {
            setError('El equipo seleccionado no es válido.');
            return;
        }

        // 1. Validar que el deporte coincida
        if (equipo.deporte.toLowerCase() !== torneo.deporte_torneo.toLowerCase()) {
            setError(`El deporte del equipo (${equipo.deporte}) no coincide con el del torneo (${torneo.deporte_torneo})`);
            return;
        }

        // 2. Validar que la plantilla cumpla con el mínimo
        const minReq = getMinPlayers(torneo.deporte_torneo);
        const count = equipo.jugadores ? equipo.jugadores.length : 0;
        if (count < minReq) {
            setError(`No cumples con el mínimo de jugadores: "${equipo.nombre}" tiene ${count} pero ${torneo.deporte_torneo === 'Futbol' ? 'Fútbol' : torneo.deporte_torneo} requiere al menos ${minReq} jugadores.`);
            return;
        }

        // 3. Validar si ya hay una solicitud o inscripción activa (comparación flexible de ID)
        const yaSolicitado = solicitudes.some(sol => 
            sol.idTorneo.toString() === torneo.id_torneo.toString() && sol.idEquipo.toString() === equipo.id.toString()
        );
        if (yaSolicitado) {
            setError(`Ya has solicitado la inscripción de "${equipo.nombre}" en este torneo.`);
            return;
        }

        // 4. Validar cupos
        if (torneo.cupos_libres <= 0) {
            setError('El torneo no cuenta con cupos libres disponibles.');
            return;
        }

        try {
            const resp = await fetch("http://localhost/olympia-backend/solicitudes/guardar_solicitud.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_torneo: torneo.id_torneo,
                    id_equipo: equipo.id
                })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                setSuccess(`¡Solicitud enviada para "${equipo.nombre}"! El organizador la revisará.`);
                // Recargar solicitudes de la DB
                const respSols = await fetch("http://localhost/olympia-backend/solicitudes/obtener_solicitudes.php");
                const dataSols = await respSols.json();
                if (Array.isArray(dataSols)) {
                    setSolicitudes(dataSols);
                }
            } else {
                setError(data.mensaje || 'Error al enviar la solicitud.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        }
    };

    // Filtrar la lista de torneos visibles
    const torneosFiltrados = torneos.filter(t => {
        const matchesSport = filtroDeporte === 'Todos' || t.deporte_torneo === filtroDeporte;
        const matchesSearch = t.nombre_torneo.toLowerCase().includes(busqueda.toLowerCase());
        return matchesSport && matchesSearch;
    });

    const selectedTeam = equipos.find(e => e.id === equipoSeleccionadoId);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Cabecera */}
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase tracking-tight">
                    Explorar Torneos Públicos
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Busca torneos activos e inscribe tu equipo. Recuerda cumplir con el mínimo de jugadores según el deporte.
                </p>
            </div>

            {/* Selector de Equipo Activo */}
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600/10 p-2.5 rounded-xl border border-blue-500/20 text-blue-400">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Inscribir Equipo Activo:</h3>
                        {selectedTeam ? (
                            <p className="text-xs text-slate-400">
                                {selectedTeam.nombre} ({selectedTeam.deporte} • {selectedTeam.jugadores?.length || 0} jugadores)
                            </p>
                        ) : (
                            <p className="text-xs text-red-400 font-bold">No tienes equipos registrados</p>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                    {equipos.length > 0 ? (
                        <select
                            value={equipoSeleccionadoId}
                            onChange={(e) => {
                                setEquipoSeleccionadoId(e.target.value);
                                setError('');
                                setSuccess('');
                            }}
                            className="px-4 py-2 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 text-sm cursor-pointer"
                        >
                            {equipos.map(eq => (
                                <option key={eq.id} value={eq.id}>
                                    {eq.nombre} ({eq.deporte})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <button
                            onClick={() => navigate('/capitan/nuevo-equipo')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                        >
                            Crear Equipo
                        </button>
                    )}
                </div>
            </div>

            {/* Alertas */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/30 border border-slate-850 p-4 rounded-2xl">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar torneo por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 text-xs transition-colors"
                    />
                </div>

                <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
                    {['Todos', 'Futbol', 'Basquet', 'Voley', 'Ping-Pong'].map((dep) => (
                        <button
                            key={dep}
                            onClick={() => setFiltroDeporte(dep)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                filtroDeporte === dep
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            {dep === 'Todos' ? 'Todos' : dep === 'Futbol' ? 'Fútbol' : dep}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grilla de Torneos */}
            {torneosFiltrados.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-850 p-12 rounded-3xl text-center text-slate-500">
                    <Trophy className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                    <p className="font-bold">No se encontraron torneos públicos</p>
                    <p className="text-xs mt-1">Prueba cambiando el filtro de deporte o los términos de búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {torneosFiltrados.map((t) => {
                        const solicitado = selectedTeam && solicitudes.some(sol => sol.idTorneo.toString() === t.id_torneo.toString() && sol.idEquipo.toString() === selectedTeam.id.toString());
                        const estadoSolicitado = solicitado ? solicitudes.find(sol => sol.idTorneo.toString() === t.id_torneo.toString() && sol.idEquipo.toString() === selectedTeam.id.toString()).estado : '';
                        const cuposLibres = t.cupos_libres !== undefined ? t.cupos_libres : 4;
                        const esAgotado = cuposLibres <= 0;
                        const minJugadores = getMinPlayers(t.deporte_torneo);
                        
                        return (
                            <div
                                key={t.id_torneo}
                                className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 flex flex-col justify-between transition-all"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase">
                                            {t.deporte_torneo === 'Futbol' ? 'Fútbol' : t.deporte_torneo}
                                        </span>
                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            esAgotado
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                                        }`}>
                                            {esAgotado ? 'Cupos Agotados' : `${cuposLibres} Cupos Libres`}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-black text-white line-clamp-1">{t.nombre_torneo}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Categoría: {t.categoria_torneo || 'Libre'}</p>

                                    <div className="mt-4 p-3 bg-slate-950/40 rounded-2xl border border-slate-850 space-y-1.5">
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Mínimo Plantilla:</span>
                                            <strong className="text-slate-200">{minJugadores} jugadores</strong>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Fecha de Inicio:</span>
                                            <strong className="text-slate-200">{t.fecha_inicio || '2026-06-01'}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    {solicitado ? (
                                        <div className={`w-full py-2.5 rounded-xl border text-center text-xs font-bold ${
                                            estadoSolicitado === 'Aprobado'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : estadoSolicitado === 'Rechazado'
                                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                        }`}>
                                            SOLICITUD: {estadoSolicitado.toUpperCase()}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleInscribirse(t)}
                                            disabled={esAgotado || !selectedTeam}
                                            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                                                esAgotado 
                                                ? 'bg-slate-800/50 border border-slate-800 text-slate-500 cursor-not-allowed'
                                                : !selectedTeam
                                                ? 'bg-slate-850 border border-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 active:scale-[0.98]'
                                            }`}
                                        >
                                            <Trophy className="h-3.5 w-3.5" />
                                            Solicitar Inscripción
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExploradorTorneos;
