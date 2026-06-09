import React, { useState, useEffect } from 'react';
import { Search, Trophy, Calendar, Sparkles, User, Users, Filter, ArrowRight, ShieldCheck } from 'lucide-react';

const HistorialResultados = () => {
    const [busqueda, setBusqueda] = useState('');
    const [tipoBusqueda, setTipoBusqueda] = useState('Equipos'); // 'Equipos' o 'Jugadores'
    
    // Todos los datos cargados para cruzar
    const [todosEquipos, setTodosEquipos] = useState([]);
    const [todosTorneos, setTodosTorneos] = useState([]);
    const [todosPartidos, setTodosPartidos] = useState({}); // idTorneo -> partidos[]

    // Resultado de selección actual
    const [seleccionado, setSeleccionado] = useState(null); // equipo o jugador seleccionado
    const [partidosSeleccionado, setPartidosSeleccionado] = useState([]);
    
    // Filtros de historial
    const [filtroDeporte, setFiltroDeporte] = useState('Todos');
    const [filtroTorneo, setFiltroTorneo] = useState('Todos');

    useEffect(() => {
        // 1. Cargar equipos y plantillas de localStorage
        const storedEquipos = localStorage.getItem('olympia_equipos');
        const listaEquipos = storedEquipos ? JSON.parse(storedEquipos) : [];
        setTodosEquipos(listaEquipos);

        // 2. Cargar torneos
        const storedTorneos = localStorage.getItem('olympia_torneos_local');
        const listaTorneos = storedTorneos ? JSON.parse(storedTorneos) : [];
        setTodosTorneos(listaTorneos);

        // 3. Cargar todos los partidos registrados para cada torneo
        const partidosMap = {};
        listaTorneos.forEach(t => {
            const partidosTorneo = localStorage.getItem(`olympia_partidos_${t.id_torneo}`);
            if (partidosTorneo) {
                partidosMap[t.id_torneo] = JSON.parse(partidosTorneo);
            }
        });
        setTodosPartidos(partidosMap);
    }, []);

    // Buscar coincidencias
    const getCoincidencias = () => {
        if (!busqueda.trim()) return [];

        const q = busqueda.toLowerCase().trim();

        if (tipoBusqueda === 'Equipos') {
            return todosEquipos.filter(eq => eq.nombre.toLowerCase().includes(q));
        } else {
            // Buscar jugadores
            const matches = [];
            todosEquipos.forEach(eq => {
                if (eq.jugadores) {
                    eq.jugadores.forEach(jug => {
                        const nombreCompleto = `${jug.nombre} ${jug.apellido}`.toLowerCase();
                        if (nombreCompleto.includes(q) || jug.dni.includes(q)) {
                            matches.push({
                                ...jug,
                                equipoPerteneciente: eq
                            });
                        }
                    });
                }
            });
            return matches;
        }
    };

    const coincidencias = getCoincidencias();

    // Al hacer clic en un equipo o jugador, calcular su historial de partidos
    const handleSeleccionar = (item) => {
        setSeleccionado(item);
        setFiltroDeporte('Todos');
        setFiltroTorneo('Todos');

        let equipoNombre = '';
        if (tipoBusqueda === 'Equipos') {
            equipoNombre = item.nombre;
        } else {
            equipoNombre = item.equipoPerteneciente.nombre;
        }

        // Buscar todos los partidos de este equipo
        const historial = [];
        todosTorneos.forEach(torneo => {
            const partidosTorneo = todosPartidos[torneo.id_torneo] || [];
            partidosTorneo.forEach(p => {
                // Verificar si el equipo participó
                const participo = p.local === equipoNombre || p.visitante === equipoNombre;
                if (participo) {
                    historial.push({
                        ...p,
                        nombreTorneo: torneo.nombre_torneo,
                        deporteTorneo: torneo.deporte_torneo,
                        idTorneo: torneo.id_torneo
                    });
                }
            });
        });

        // Ordenar historial (finalizados primero, o por jornada)
        historial.sort((a, b) => {
            if (a.estado_partido === 'Finalizado' && b.estado_partido !== 'Finalizado') return -1;
            if (a.estado_partido !== 'Finalizado' && b.estado_partido === 'Finalizado') return 1;
            return 0;
        });

        setPartidosSeleccionado(historial);
    };

    // Aplicar filtros de deporte y torneo al historial del seleccionado
    const partidosFiltrados = partidosSeleccionado.filter(p => {
        const matchesDeporte = filtroDeporte === 'Todos' || p.deporteTorneo === filtroDeporte;
        const matchesTorneo = filtroTorneo === 'Todos' || p.idTorneo === filtroTorneo;
        return matchesDeporte && matchesTorneo;
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Cabecera */}
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase tracking-tight flex items-center gap-2">
                    <Search className="h-7 w-7 text-indigo-400" />
                    Historial y Resultados Públicos
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Consulta el historial completo de partidos, estadísticas y resultados de cualquier equipo o jugador registrado en la plataforma.
                </p>
            </div>

            {/* Dos Paneles: Buscador & Historial */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Panel de Búsqueda */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl backdrop-blur-md space-y-4">
                    <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 px-1">
                        <Filter className="h-4 w-4 text-blue-400" />
                        Buscador General
                    </h2>

                    {/* Selector de Tipo */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-850">
                        {['Equipos', 'Jugadores'].map(tipo => (
                            <button
                                key={tipo}
                                onClick={() => {
                                    setTipoBusqueda(tipo);
                                    setBusqueda('');
                                    setSeleccionado(null);
                                    setPartidosSeleccionado([]);
                                }}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                                    tipoBusqueda === tipo
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {tipo}
                            </button>
                        ))}
                    </div>

                    {/* Barra de entrada */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder={tipoBusqueda === 'Equipos' ? 'Escribe el nombre del equipo...' : 'Escribe el nombre, apellido o DNI...'}
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value);
                                setSeleccionado(null);
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-200 text-xs transition-colors"
                        />
                    </div>

                    {/* Lista de Coincidencias */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {busqueda.trim() === '' ? (
                            <p className="text-[10px] text-slate-500 text-center py-6">
                                Escribe arriba para buscar.
                            </p>
                        ) : coincidencias.length === 0 ? (
                            <p className="text-[10px] text-slate-400 text-center py-6">
                                No se encontraron {tipoBusqueda.toLowerCase()} con ese nombre.
                            </p>
                        ) : (
                            coincidencias.map((item, idx) => {
                                const isSelected = seleccionado && (
                                    tipoBusqueda === 'Equipos' 
                                    ? seleccionado.id === item.id 
                                    : seleccionado.dni === item.dni
                                );

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSeleccionar(item)}
                                        className={`w-full p-3 rounded-2xl border text-left flex justify-between items-center transition-all ${
                                            isSelected
                                            ? 'bg-indigo-600/10 border-indigo-500 text-white'
                                            : 'bg-slate-950/40 border-slate-850 hover:border-slate-750 text-slate-300'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-extrabold text-xs">
                                                {tipoBusqueda === 'Equipos' ? item.nombre : `${item.nombre} ${item.apellido}`}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {tipoBusqueda === 'Equipos' 
                                                    ? `${item.deporte} • Cat. ${item.categoria}`
                                                    : `DNI: ${item.dni} • Equipo: ${item.equipoPerteneciente.nombre}`
                                                }
                                            </div>
                                        </div>
                                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Panel de Historial de Resultados */}
                <div className="lg:col-span-2 space-y-4">
                    {seleccionado ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-md">
                            
                            {/* Cabecera del seleccionado */}
                            <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                                <div>
                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                                        {tipoBusqueda === 'Equipos' ? 'Ficha de Equipo' : 'Ficha de Jugador'}
                                    </span>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-2">
                                        {tipoBusqueda === 'Equipos' ? seleccionado.nombre : `${seleccionado.nombre} ${seleccionado.apellido}`}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {tipoBusqueda === 'Equipos'
                                            ? `Deporte: ${seleccionado.deporte} • Categoría: ${seleccionado.categoria} • Plantilla: ${seleccionado.jugadores?.length || 0} jugadores`
                                            : `DNI: ${seleccionado.dni} • Pertenece a: ${seleccionado.equipoPerteneciente.nombre} (${seleccionado.equipoPerteneciente.deporte})`
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Filtros Internos del Historial */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filtrar por Deporte</label>
                                    <select
                                        value={filtroDeporte}
                                        onChange={(e) => setFiltroDeporte(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-indigo-500 outline-none text-slate-300 text-xs"
                                    >
                                        <option value="Todos">Todos los deportes</option>
                                        <option value="Futbol">Fútbol</option>
                                        <option value="Basquet">Básquet</option>
                                        <option value="Voley">Vóley</option>
                                        <option value="Ping-Pong">Ping-Pong</option>
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filtrar por Torneo</label>
                                    <select
                                        value={filtroTorneo}
                                        onChange={(e) => setFiltroTorneo(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-indigo-500 outline-none text-slate-300 text-xs"
                                    >
                                        <option value="Todos">Todos los torneos</option>
                                        {todosTorneos.map(t => (
                                            <option key={t.id_torneo} value={t.id_torneo}>
                                                {t.nombre_torneo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Resultados y Partidos */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider px-1">
                                    Historial de Partidos ({partidosFiltrados.length})
                                </h3>

                                {partidosFiltrados.length === 0 ? (
                                    <p className="text-xs text-slate-500 text-center py-10 bg-slate-950/30 rounded-2xl border border-slate-850">
                                        No se registran partidos disputados o programados con los filtros seleccionados.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {partidosFiltrados.map((partido, pIdx) => {
                                            const finalizado = partido.estado_partido === 'Finalizado';
                                            const eqBuscado = tipoBusqueda === 'Equipos' ? seleccionado.nombre : seleccionado.equipoPerteneciente.nombre;
                                            
                                            // Determinar si ganó, perdió o empató
                                            let badgeResultado = null;
                                            if (finalizado) {
                                                const ml = parseInt(partido.marcador_local);
                                                const mv = parseInt(partido.marcador_visitante);
                                                const esLocal = partido.local === eqBuscado;
                                                
                                                if (ml === mv) {
                                                    badgeResultado = <span className="bg-slate-850 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded border border-slate-800 uppercase tracking-wide">Empate</span>;
                                                } else if ((ml > mv && esLocal) || (mv > ml && !esLocal)) {
                                                    badgeResultado = <span className="bg-green-500/10 text-green-400 text-[9px] font-black px-2 py-0.5 rounded border border-green-500/15 uppercase tracking-wide">Victoria</span>;
                                                } else {
                                                    badgeResultado = <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-2 py-0.5 rounded border border-red-500/15 uppercase tracking-wide">Derrota</span>;
                                                }
                                            }

                                            return (
                                                <div 
                                                    key={pIdx}
                                                    className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] bg-slate-850 text-slate-400 font-bold px-2 py-0.5 rounded uppercase border border-slate-800">
                                                                {partido.deporteTorneo === 'Futbol' ? 'Fútbol' : partido.deporteTorneo}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[150px]" title={partido.nombreTorneo}>
                                                                {partido.nombreTorneo}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-400">
                                                            {partido.fecha_jornada || 'Fixture'} • Estado: <strong className={finalizado ? 'text-green-400' : 'text-yellow-500'}>{partido.estado_partido}</strong>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {badgeResultado}
                                                        
                                                        {/* Marcador */}
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold text-xs ${partido.local === eqBuscado ? 'text-white' : 'text-slate-400'}`}>
                                                                {partido.local}
                                                            </span>
                                                            <span className="px-2 py-1 bg-slate-950 rounded-lg border border-slate-850 text-xs font-mono font-black text-indigo-300">
                                                                {finalizado ? `${partido.marcador_local} - ${partido.marcador_visitante}` : 'VS'}
                                                            </span>
                                                            <span className={`font-bold text-xs ${partido.visitante === eqBuscado ? 'text-white' : 'text-slate-400'}`}>
                                                                {partido.visitante}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="bg-slate-900/30 border border-slate-850 p-12 rounded-3xl text-center text-slate-500">
                            <Sparkles className="h-12 w-12 mx-auto text-slate-800 mb-3" />
                            <p className="font-bold text-slate-450">Ficha del Historial</p>
                            <p className="text-xs mt-1">Busca y selecciona un equipo o jugador en el panel de la izquierda para ver su historial completo.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default HistorialResultados;
