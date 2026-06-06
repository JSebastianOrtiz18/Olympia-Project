import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Save, XCircle, AlertCircle, Users, CalendarDays, Trophy, Zap, Layers, RefreshCw, Key, KeyRound, Copy, Check, History } from 'lucide-react';

const GestorEquipos = () => {
    const { idTorneo, nombreTorneo } = useParams();

    const [activeTab, setActiveTab] = useState('participantes');
    const [originalDisponibles, setOriginalDisponibles] = useState([]);
    const [originalAsignados, setOriginalAsignados] = useState([]);
    const [equiposDisponibles, setEquiposDisponibles] = useState([]);
    const [equiposAsignados, setEquiposAsignados] = useState([]);
    const [maxEquipos, setMaxEquipos] = useState(0);
    const [hayCambios, setHayCambios] = useState(false);

    const [partidos, setPartidos] = useState([]);
    const [formatoTorneo, setFormatoTorneo] = useState('Desconocido');
    const [generandoFixture, setGenerandoFixture] = useState(false);
    const [cargando, setCargando] = useState(true);

    // Estados para PIN Asistente (HU-6.2)
    const [pinAsistente, setPinAsistente] = useState('');
    const [copiado, setCopiado] = useState(false);

    // Estados para edición de marcadores (HU-4.1)
    const [partidoEditando, setPartidoEditando] = useState(null);
    const [scoreLocal, setScoreLocal] = useState('');
    const [scoreVisitante, setScoreVisitante] = useState('');
    const [scoreError, setScoreError] = useState('');

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const respEquipos = await fetch(`http://localhost/olympia-backend/equipos/obtener_equipos_torneo.php?id_torneo=${idTorneo}`);
            const dataEquipos = await respEquipos.json();

            if (dataEquipos.status !== 'error') {
                setOriginalDisponibles(dataEquipos.disponibles);
                setOriginalAsignados(dataEquipos.asignados);
                setEquiposDisponibles(dataEquipos.disponibles);
                setEquiposAsignados(dataEquipos.asignados);
                setMaxEquipos(dataEquipos.max_equipos);
                setHayCambios(false);
            }
            
            // Cargar PIN
            const pinDb = dataEquipos.pin_asistente;
            const storedPin = pinDb || localStorage.getItem(`olympia_pin_${idTorneo}`);
            if (storedPin) {
                setPinAsistente(storedPin);
            }

            cargarFixture();
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setCargando(false);
        }
    };

    const cargarFixture = async () => {
        try {
            const resp = await fetch(`http://localhost/olympia-backend/fixture/obtener_fixture.php?id_torneo=${idTorneo}`);
            const data = await resp.json();
            if (data.partidos) {
                // Para que el demo funcione con modificaciones locales, cargamos lo guardado localmente si existe
                const localPartidos = localStorage.getItem(`olympia_partidos_${idTorneo}`);
                if (localPartidos) {
                    setPartidos(JSON.parse(localPartidos));
                } else {
                    setPartidos(data.partidos);
                }
                setFormatoTorneo(data.formato);
            }
        } catch (error) {
            console.error("Error al cargar fixture:", error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [idTorneo]);

    const moverAAsignados = (equipo) => {
        if (equiposAsignados.length >= maxEquipos) return;
        setEquiposDisponibles(prev => prev.filter(e => e.id_equipo !== equipo.id_equipo));
        setEquiposAsignados(prev => [...prev, equipo]);
        setHayCambios(true);
    };

    const moverADisponibles = (equipo) => {
        setEquiposAsignados(prev => prev.filter(e => e.id_equipo !== equipo.id_equipo));
        setEquiposDisponibles(prev => [...prev, equipo]);
        setHayCambios(true);
    };

    const cancelarCambios = () => {
        setEquiposDisponibles(originalDisponibles);
        setEquiposAsignados(originalAsignados);
        setHayCambios(false);
    };

    const guardarCambiosBD = async () => {
        const idsFinales = equiposAsignados.map(e => e.id_equipo);
        try {
            const resp = await fetch("http://localhost/olympia-backend/equipos/guardar_asignaciones_batch.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_torneo: idTorneo, equipos: idsFinales })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                alert("¡Ajustes guardados con éxito!");
                cargarDatos();
            } else {
                alert(data.mensaje);
            }
        } catch (error) {
            alert("Error conectando con el servidor");
        }
    };

    // Generar PIN único (HU-6.2)
    const handleGenerarPin = async () => {
        try {
            const resp = await fetch("http://localhost/olympia-backend/torneos/generar_pin_asistente.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_torneo: idTorneo })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                const pin = data.pin;
                localStorage.setItem(`olympia_pin_${idTorneo}`, pin);
                setPinAsistente(pin);
                alert(`¡Código PIN generado para asistentes: ${pin}!`);
            } else {
                alert(data.mensaje || "Error al generar PIN en el servidor.");
            }
        } catch (error) {
            alert("Error de conexión al generar PIN.");
        }
    };

    // Copiar PIN al portapapeles
    const copiarPin = () => {
        if (!pinAsistente) return;
        navigator.clipboard.writeText(pinAsistente);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    // --- LÓGICA DE VALIDACIÓN POR FORMATO ---
    const validarGeneracionFixture = (formato, cantidad) => {
        const formatoStr = formato.toLowerCase();

        if (cantidad < 2) {
            alert("Necesitas al menos 2 equipos para generar un fixture.");
            return false;
        }

        if (formatoStr === 'fase de grupos' && cantidad < 4) {
            alert("⚠️ Para el formato 'Fase de Grupos' necesitas registrar al menos 4 equipos.");
            return false;
        }

        if (formatoStr === 'eliminatoria') {
            const esPotenciaDe2 = (cantidad & (cantidad - 1)) === 0;
            if (!esPotenciaDe2) {
                return window.confirm(`Tienes ${cantidad} equipos.\n\nAl no ser un número exacto para llaves perfectas (4, 8, 16...), el sistema adelantará automáticamente a algunos equipos a la siguiente ronda.\n\n¿Deseas continuar?`);
            }
        }

        if (formatoStr === 'liga' && cantidad % 2 !== 0) {
            return window.confirm(`Tienes un número impar de equipos (${cantidad}).\n\nEsto significa que en cada jornada, un equipo quedará libre (sin jugar).\n\n¿Deseas continuar?`);
        }

        return true;
    };

    const handleGenerarFixture = async () => {
        if (hayCambios) {
            alert("Tienes cambios sin guardar en los participantes. Guárdalos primero antes de generar el fixture.");
            return;
        }

        const cantidadEquipos = originalAsignados.length;

        if (!validarGeneracionFixture(formatoTorneo, cantidadEquipos)) {
            return;
        }

        const mensajeConfirmacion = partidos.length > 0
        ? `¡ATENCIÓN! Ya existe un fixture generado.\n\nSi regeneras el fixture SE BORRARÁN todos los partidos actuales y sus marcadores.\n\n¿Deseas continuar?`
        : `¿Generar fixture inicial para formato ${formatoTorneo}?`;

        if (window.confirm(mensajeConfirmacion)) {
            setGenerandoFixture(true);
            try {
                const resp = await fetch("http://localhost/olympia-backend/fixture/generar_fixture.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id_torneo: idTorneo })
                });
                const data = await resp.json();

                if (data.status === 'success') {
                    // Limpiamos resultados locales guardados
                    localStorage.removeItem(`olympia_partidos_${idTorneo}`);
                    alert(data.mensaje);
                    cargarFixture();
                } else {
                    alert(data.mensaje);
                }
            } catch (error) {
                alert("Error al conectar con el servidor para generar fixture.");
            } finally {
                setGenerandoFixture(false);
            }
        }
    };

    // --- CARGAR/EDITAR MARCADORES (HU-4.1) ---
    const iniciarCargaMarcador = (partido) => {
        setPartidoEditando(partido);
        setScoreLocal(partido.estado_partido === 'Finalizado' ? partido.marcador_local.toString() : '');
        setScoreVisitante(partido.estado_partido === 'Finalizado' ? partido.marcador_visitante.toString() : '');
        setScoreError('');
    };

    const guardarMarcador = (e) => {
        e.preventDefault();
        setScoreError('');

        // Expresión regular para verificar si es entero positivo válido (sólo dígitos)
        const regexEntero = /^\d+$/;

        if (!regexEntero.test(scoreLocal) || !regexEntero.test(scoreVisitante)) {
            setScoreError("Por favor, ingrese únicamente valores numéricos enteros positivos válidos para este deporte");
            return;
        }

        const sl = parseInt(scoreLocal);
        const sv = parseInt(scoreVisitante);

        // Registrar auditoría de cambios de marcadores (punto 5)
        const logsAnteriores = JSON.parse(localStorage.getItem(`olympia_logs_${idTorneo}`) || '[]');
        
        // Obtener marcador anterior para dejar registro del cambio
        const scoreAnteriorLocal = partidoEditando.marcador_local !== null && partidoEditando.marcador_local !== undefined ? partidoEditando.marcador_local : 'Sin registrar';
        const scoreAnteriorVisitante = partidoEditando.marcador_visitante !== null && partidoEditando.marcador_visitante !== undefined ? partidoEditando.marcador_visitante : 'Sin registrar';
        
        const nuevoLog = {
            id_log: `log_${Date.now()}`,
            usuario: 'Organizador (Admin)',
            fecha: new Date().toLocaleString('es-AR'),
            partido: `${partidoEditando.local} vs ${partidoEditando.visitante}`,
            marcador_anterior: `${scoreAnteriorLocal} - ${scoreAnteriorVisitante}`,
            marcador_nuevo: `${sl} - ${sv}`,
            detalle: `Modificó marcador de ${partidoEditando.local} vs ${partidoEditando.visitante} (Antes: ${scoreAnteriorLocal}-${scoreAnteriorVisitante} | Ahora: ${sl}-${sv})`
        };
        logsAnteriores.unshift(nuevoLog); // Mostrar más recientes primero
        localStorage.setItem(`olympia_logs_${idTorneo}`, JSON.stringify(logsAnteriores));

        // Actualizar localmente la lista de partidos
        const nuevosPartidos = partidos.map(p => {
            if (p.id_partido === partidoEditando.id_partido) {
                return {
                    ...p,
                    marcador_local: sl,
                    marcador_visitante: sv,
                    estado_partido: 'Finalizado'
                };
            }
            return p;
        });

        setPartidos(nuevosPartidos);
        localStorage.setItem(`olympia_partidos_${idTorneo}`, JSON.stringify(nuevosPartidos));
        setPartidoEditando(null);
        alert("¡Resultado guardado con éxito! La tabla de posiciones se ha recalculado (HU-4.1).");
    };

    // --- CÁLCULO DE TABLA DE POSICIONES EN TIEMPO REAL ---
    const calcularTablaPosiciones = () => {
        const tabla = {};

        partidos.forEach(p => {
            if (p.local && p.local !== 'Libre' && !tabla[p.local]) {
                tabla[p.local] = { equipo: p.local, pj: 0, pg: 0, pe: 0, pp: 0, pts: 0, gf: 0, gc: 0, dg: 0 };
            }
            if (p.visitante && p.visitante !== 'Libre' && !tabla[p.visitante]) {
                tabla[p.visitante] = { equipo: p.visitante, pj: 0, pg: 0, pe: 0, pp: 0, pts: 0, gf: 0, gc: 0, dg: 0 };
            }

            if (p.estado_partido === 'Finalizado' && p.local !== 'Libre' && p.visitante !== 'Libre') {
                const ml = parseInt(p.marcador_local);
                const mv = parseInt(p.marcador_visitante);

                if (!isNaN(ml) && !isNaN(mv)) {
                    const el = tabla[p.local];
                    const ev = tabla[p.visitante];

                    if (el && ev) {
                        el.pj += 1;
                        ev.pj += 1;
                        el.gf += ml;
                        el.gc += mv;
                        ev.gf += mv;
                        ev.gc += ml;

                        if (ml > mv) {
                            el.pg += 1;
                            el.pts += 3;
                            ev.pp += 1;
                        } else if (mv > ml) {
                            ev.pg += 1;
                            ev.pts += 3;
                            el.pp += 1;
                        } else {
                            el.pe += 1;
                            el.pts += 1;
                            ev.pe += 1;
                            ev.pts += 1;
                        }
                        el.dg = el.gf - el.gc;
                        ev.dg = ev.gf - ev.gc;
                    }
                }
            }
        });

        return Object.values(tabla).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.dg !== a.dg) return b.dg - a.dg;
            return b.gf - a.gf;
        });
    };

    const tablaPosiciones = calcularTablaPosiciones();

    // --- RENDERIZADO LIGA (ROUND ROBIN) ---
    const renderLiga = () => {
        const jornadas = partidos.reduce((acc, partido) => {
            const jornada = partido.fase_jornada || 'Jornada N/A';
            if (!acc[jornada]) acc[jornada] = [];
            acc[jornada].push(partido);
            return acc;
        }, {});

        return (
            <div className="space-y-8">
                {Object.keys(jornadas).map((jornada, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800">
                            <h4 className="font-bold text-white text-md flex items-center gap-2">
                                <Layers className="h-4 w-4 text-blue-500" />
                                {jornada}
                            </h4>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {jornadas[jornada].map(partido => renderMatchCard(partido))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // --- RENDERIZADO FASE DE GRUPOS ---
    const renderFaseGrupos = () => {
        const gruposEstructura = partidos.reduce((acc, partido) => {
            const faseCompleta = partido.fase_jornada || 'Grupo Indefinido';
            const partes = faseCompleta.split(' - ');
            const grupo = partes[0] || 'Grupos';
            const fecha = partes[1] || 'Fecha Única';

            if (!acc[grupo]) acc[grupo] = {};
            if (!acc[grupo][fecha]) acc[grupo][fecha] = [];
            acc[grupo][fecha].push(partido);
            return acc;
        }, {});

        return (
            <div className="space-y-10">
                {Object.entries(gruposEstructura).map(([nombreGrupo, fechas]) => (
                    <div key={nombreGrupo} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="bg-blue-600/10 border-b border-slate-850 px-6 py-3">
                            <h4 className="font-bold text-blue-400 text-md flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                {nombreGrupo}
                            </h4>
                        </div>
                        <div className="p-5 space-y-6">
                            {Object.entries(fechas).map(([nombreFecha, partidosFecha]) => (
                                <div key={nombreFecha}>
                                    <h5 className="font-bold text-slate-500 mb-3 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
                                        {nombreFecha}
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {partidosFecha.map(partido => renderMatchCard(partido))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // --- RENDERIZADO ELIMINATORIA (BRACKET) ---
    const renderEliminatoria = () => {
        const fases = partidos.reduce((acc, partido) => {
            const fase = partido.fase_jornada || 'Fase Única';
            if (!acc[fase]) acc[fase] = [];
            acc[fase].push(partido);
            return acc;
        }, {});

        return (
            <div className="space-y-8">
                {Object.entries(fases).map(([fase, partidosFase]) => (
                    <div key={fase} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="bg-slate-950/65 px-6 py-3 border-b border-slate-850 flex justify-between items-center">
                            <h4 className="font-bold text-white text-md flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                {fase}
                            </h4>
                            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                {partidosFase.length} Partido{partidosFase.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {partidosFase.map((partido) => renderMatchCard(partido))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Componente reutilizable para tarjetas pequeñas
    const renderMatchCard = (partido) => {
        const isFinalizado = partido.estado_partido === 'Finalizado';
        return (
            <div key={partido.id_partido} className="border border-slate-800 rounded-xl p-4 bg-slate-950 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                    <span>Partido #{partido.id_partido}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        isFinalizado 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                        {partido.estado_partido}
                    </span>
                </div>
                
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-lg border border-slate-850">
                        <span className="font-semibold text-slate-200 truncate pr-2" title={partido.local}>{partido.local}</span>
                        <span className="font-black text-white font-mono text-sm">
                            {isFinalizado ? partido.marcador_local : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-lg border border-slate-850">
                        <span className="font-semibold text-slate-200 truncate pr-2" title={partido.visitante}>{partido.visitante}</span>
                        <span className="font-black text-white font-mono text-sm">
                            {isFinalizado ? partido.marcador_visitante : '-'}
                        </span>
                    </div>
                </div>

                {partido.local !== 'Libre' && partido.visitante !== 'Libre' && (
                    <button 
                        onClick={() => iniciarCargaMarcador(partido)}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                    >
                        {isFinalizado ? 'Editar Marcador' : 'Cargar Resultado'}
                    </button>
                )}
            </div>
        );
    };

    const renderContenidoFixture = () => {
        const formatoStr = formatoTorneo.toLowerCase();
        if (formatoStr === 'fase de grupos') return renderFaseGrupos();
        if (formatoStr === 'eliminatoria') return renderEliminatoria();
        return renderLiga();
    };

    return (
        <div className="space-y-6 font-sans animate-in fade-in duration-300">
            <Link to="/admin" className="text-sm font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors mb-4">
                &larr; Volver al Panel
            </Link>

            {/* Cabecera del Centro de Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        {nombreTorneo}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-500/20">
                            Formato: {formatoTorneo}
                        </span>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10 shrink-0">
                    <div className="bg-slate-950/60 border border-slate-850 px-4 py-2 rounded-xl text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Equipos</p>
                        <p className="text-xl font-black text-white mt-0.5">{originalAsignados.length} / {maxEquipos}</p>
                    </div>
                </div>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex border-b border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab('participantes')}
                    className={`flex items-center px-6 py-3 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-colors ${
                        activeTab === 'participantes' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                    <Users className="w-4 h-4 mr-2" />
                    Asignar Equipos
                </button>
                <button
                    onClick={() => setActiveTab('fixture')}
                    className={`flex items-center px-6 py-3 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-colors ${
                        activeTab === 'fixture' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Fixture y Resultados
                </button>
                <button
                    onClick={() => setActiveTab('configuracion')}
                    className={`flex items-center px-6 py-3 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-colors ${
                        activeTab === 'configuracion' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                    <Key className="w-4 h-4 mr-2" />
                    PIN Asistente
                </button>
                <button
                    onClick={() => setActiveTab('historial')}
                    className={`flex items-center px-6 py-3 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-colors ${
                        activeTab === 'historial' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                    <History className="w-4 h-4 mr-2" />
                    Historial de Cambios
                </button>
            </div>

            {/* CONTENIDO DE PESTAÑAS */}
            {cargando ? (
                <div className="text-center py-16 text-slate-500 font-bold">Cargando detalles...</div>
            ) : (
                <>
                    {/* 1. ASIGNAR EQUIPOS */}
                    {activeTab === 'participantes' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Equipos Participantes</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">Asigna qué clubes competirán en esta edición.</p>
                                </div>
                                {hayCambios && (
                                    <div className="flex items-center text-orange-400 bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20 text-xs font-semibold animate-pulse">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        Tienes cambios sin guardar
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Disponibles */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[400px]">
                                    <div className="bg-slate-950/60 px-5 py-4 border-b border-slate-800 font-bold text-slate-350">
                                        Equipos Disponibles
                                    </div>
                                    <div className="p-4 flex-grow overflow-y-auto bg-slate-950/30">
                                        {equiposDisponibles.length === 0 ? (
                                            <p className="text-center text-slate-600 mt-16 text-sm">No hay más equipos en este deporte.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {equiposDisponibles.map(eq => (
                                                    <li key={eq.id_equipo} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-xl hover:border-slate-750 transition-colors">
                                                        <span className="font-bold text-slate-200 text-sm">{eq.nombre_equipo}</span>
                                                        <button
                                                            onClick={() => moverAAsignados(eq)}
                                                            disabled={equiposAsignados.length >= maxEquipos}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-30 disabled:hover:bg-blue-600"
                                                        >
                                                            Añadir &rarr;
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Asignados */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[400px]">
                                    <div className="bg-blue-500/5 px-5 py-4 border-b border-slate-800 font-bold text-blue-400">
                                        Inscritos en Torneo
                                    </div>
                                    <div className="p-4 flex-grow overflow-y-auto bg-slate-950/30">
                                        {equiposAsignados.length === 0 ? (
                                            <p className="text-center text-slate-600 mt-16 text-sm">Aún no hay equipos asignados.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {equiposAsignados.map(eq => (
                                                    <li key={eq.id_equipo} className="flex justify-between items-center bg-slate-900 border border-slate-850 p-3 rounded-xl hover:border-slate-750 transition-colors">
                                                        <span className="font-bold text-slate-200 text-sm">{eq.nombre_equipo}</span>
                                                        <button
                                                            onClick={() => moverADisponibles(eq)}
                                                            className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={cancelarCambios} disabled={!hayCambios} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-slate-350 disabled:opacity-40 transition-colors">
                                    Cancelar Cambios
                                </button>
                                <button onClick={guardarCambiosBD} disabled={!hayCambios} className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors">
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. FIXTURE Y POSICIONES */}
                    {activeTab === 'fixture' && (
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Cronograma de partidos */}
                            <div className="xl:col-span-2 space-y-6">
                                {partidos.length === 0 ? (
                                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                                        <CalendarDays className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-white mb-2">Fixture No Generado</h3>
                                        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                                            El torneo no posee fixture programado aún.
                                        </p>
                                        <button
                                            onClick={handleGenerarFixture}
                                            disabled={generandoFixture || originalAsignados.length < 2}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 disabled:opacity-45 transition-colors"
                                        >
                                            Generar Fixture
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-bold text-white">Cronograma Oficial</h3>
                                            <button
                                                onClick={handleGenerarFixture}
                                                disabled={generandoFixture}
                                                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" /> Regenerar Fixture
                                            </button>
                                        </div>

                                        {renderContenidoFixture()}
                                    </>
                                )}
                            </div>

                            {/* Tabla de Posiciones en Tiempo Real */}
                            {partidos.length > 0 && formatoTorneo !== 'Eliminatoria' && (
                                <div className="xl:col-span-1 space-y-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                        Standings (Posiciones)
                                    </h3>
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-500 font-bold uppercase tracking-wider">
                                                    <th className="px-4 py-3">Pos</th>
                                                    <th className="px-4 py-3">Club</th>
                                                    <th className="px-3 py-3 text-center">PJ</th>
                                                    <th className="px-3 py-3 text-center font-extrabold text-blue-400">Pts</th>
                                                    <th className="px-3 py-3 text-center">DG</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-850">
                                                {tablaPosiciones.map((row, idx) => (
                                                    <tr key={row.equipo} className="hover:bg-slate-800/10">
                                                        <td className="px-4 py-3 font-semibold text-slate-500">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-bold text-white truncate max-w-[120px]" title={row.equipo}>
                                                            {row.equipo}
                                                        </td>
                                                        <td className="px-3 py-3 text-center text-slate-400">{row.pj}</td>
                                                        <td className="px-3 py-3 text-center font-black text-white">{row.pts}</td>
                                                        <td className="px-3 py-3 text-center text-slate-400">
                                                            {row.dg > 0 ? `+${row.dg}` : row.dg}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. PIN ASISTENTE */}
                    {activeTab === 'configuracion' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-600/10 p-3 rounded-2xl border border-indigo-500/20 text-indigo-400">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">PIN de Acceso Temporal</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">Permite a los asistentes/árbitros cargar marcadores (HU-6.2).</p>
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm">
                                Genera un PIN único para que el personal asistente pueda ingresar marcadores de este torneo sin necesidad de registrarse. Si regeneras el PIN, las sesiones activas con el código anterior serán invalidadas.
                            </p>

                            {pinAsistente ? (
                                <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PIN Activo</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black text-white font-mono tracking-widest bg-slate-900 border border-slate-800 px-6 py-2 rounded-xl">
                                            {pinAsistente}
                                        </span>
                                        <button 
                                            onClick={copiarPin}
                                            className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                                            title="Copiar PIN"
                                        >
                                            {copiado ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Comparte este código con tu asistente de campo.</p>
                                </div>
                            ) : (
                                <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl text-center text-slate-500 text-sm">
                                    No hay un PIN generado para este torneo.
                                </div>
                            )}

                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={handleGenerarPin}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                                >
                                    {pinAsistente ? 'Regenerar PIN' : 'Generar PIN'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 4. HISTORIAL DE CAMBIOS (BITÁCORA DE AUDITORÍA) (punto 5) */}
                    {activeTab === 'historial' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Historial de Cambios</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">Auditoría detallada de las modificaciones de marcadores realizadas para este torneo.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm("¿Seguro que deseas limpiar la bitácora de auditoría de este torneo?")) {
                                            localStorage.removeItem(`olympia_logs_${idTorneo}`);
                                            // Forzamos re-render de React modificando localmente el estado de los partidos
                                            setPartidos([...partidos]);
                                        }
                                    }}
                                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all"
                                >
                                    Limpiar Bitácora
                                </button>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950/60 border-b border-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400">
                                                <th className="px-6 py-4">Usuario</th>
                                                <th className="px-6 py-4">Fecha y Hora</th>
                                                <th className="px-6 py-4">Partido</th>
                                                <th className="px-6 py-4 text-center">Marcador Anterior</th>
                                                <th className="px-6 py-4 text-center">Marcador Nuevo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-850">
                                            {(() => {
                                                const logs = JSON.parse(localStorage.getItem(`olympia_logs_${idTorneo}`) || '[]');
                                                if (logs.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-bold">
                                                                No se han registrado modificaciones de marcadores aún.
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                                return logs.map((log) => (
                                                    <tr key={log.id_log} className="hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-5 text-sm">
                                                            <span className="font-bold text-white">{log.usuario}</span>
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-slate-400">
                                                            {log.fecha}
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-slate-300 font-medium">
                                                            {log.partido}
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-center">
                                                            <span className="font-mono text-slate-500 bg-slate-950/50 border border-slate-850 px-2 py-1 rounded">
                                                                {log.marcador_anterior}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-center">
                                                            <span className="font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded font-bold">
                                                                {log.marcador_nuevo}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* MODAL MOCK CARGA DE MARCADOR (HU-4.1) */}
            {partidoEditando && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-white text-lg">Carga de Marcador</h4>
                                <p className="text-slate-400 text-xs">Partido #{partidoEditando.id_partido} • {partidoEditando.fase_jornada}</p>
                            </div>
                            <button 
                                onClick={() => setPartidoEditando(null)} 
                                className="text-slate-500 hover:text-white font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        {scoreError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                                <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                                <span className="font-semibold leading-relaxed">{scoreError}</span>
                            </div>
                        )}

                        <form onSubmit={guardarMarcador} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider truncate" title={partidoEditando.local}>
                                        {partidoEditando.local} (Local)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={scoreLocal} 
                                        onChange={(e) => { setScoreLocal(e.target.value); setScoreError(''); }} 
                                        required 
                                        placeholder="Goles/Puntos"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-blue-500 outline-none text-white text-center font-black text-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider truncate" title={partidoEditando.visitante}>
                                        {partidoEditando.visitante} (Visita)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={scoreVisitante} 
                                        onChange={(e) => { setScoreVisitante(e.target.value); setScoreError(''); }} 
                                        required 
                                        placeholder="Goles/Puntos"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-blue-500 outline-none text-white text-center font-black text-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                                <button 
                                    type="button"
                                    onClick={() => setPartidoEditando(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-lg text-xs font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/10 transition-all"
                                >
                                    Guardar Resultado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestorEquipos;
