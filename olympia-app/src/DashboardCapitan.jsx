import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Users, Plus, ArrowRight, Sparkles, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

const DashboardCapitan = () => {
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('olympia_user_email') || 'capitan@olympia.com';
    const userName = localStorage.getItem('olympia_user_name') || '';
    const [equipos, setEquipos] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);

    useEffect(() => {
        // Carga inicial de equipos de localStorage
        const storedEquipos = localStorage.getItem('olympia_equipos');
        let listaEquipos = [];
        if (storedEquipos) {
            listaEquipos = JSON.parse(storedEquipos);
        } else {
            // Inicializar datos demo para Capitán
            listaEquipos = [
                {
                    id: 'eq_1',
                    nombre: 'Dream Team FC',
                    descripcion: 'El equipo estrella del barrio',
                    categoria: 'Libre',
                    deporte: 'Futbol',
                    capitanEmail: 'capitan@olympia.com',
                    jugadores: [
                        { dni: '12345671', nombre: 'Carlos', apellido: 'Tévez' },
                        { dni: '12345672', nombre: 'Lionel', apellido: 'Messi' },
                        { dni: '12345673', nombre: 'Sergio', apellido: 'Agüero' },
                        { dni: '12345674', nombre: 'Ángel', apellido: 'Di María' },
                        { dni: '12345675', nombre: 'Javier', apellido: 'Mascherano' },
                        { dni: '12345676', nombre: 'Nicolás', apellido: 'Otamendi' },
                        { dni: '12345677', nombre: 'Emiliano', apellido: 'Martínez' }
                    ]
                },
                {
                    id: 'eq_2',
                    nombre: 'Golden State Basket',
                    descripcion: 'Tiradores de tres puntos',
                    categoria: 'Libre',
                    deporte: 'Basquet',
                    capitanEmail: 'capitan@olympia.com',
                    jugadores: [
                        { dni: '22345671', nombre: 'Stephen', apellido: 'Curry' },
                        { dni: '22345672', nombre: 'Klay', apellido: 'Thompson' }
                    ]
                }
            ];
            localStorage.setItem('olympia_equipos', JSON.stringify(listaEquipos));
        }

        // Filtrar solo los equipos del capitán actual
        setEquipos(listaEquipos.filter(eq => eq.capitanEmail === userEmail));

        // Carga de solicitudes
        const storedSolicitudes = localStorage.getItem('olympia_solicitudes');
        let listaSolicitudes = [];
        if (storedSolicitudes) {
            listaSolicitudes = JSON.parse(storedSolicitudes);
        } else {
            listaSolicitudes = [];
            localStorage.setItem('olympia_solicitudes', JSON.stringify(listaSolicitudes));
        }
        setSolicitudes(listaSolicitudes.filter(sol => sol.idEquipo === 'eq_1' || listaEquipos.some(eq => eq.id === sol.idEquipo && eq.capitanEmail === userEmail)));
    }, [userEmail]);

    const getPlayerLimit = (deporte) => {
        switch (deporte) {
            case 'Futbol': return 18;
            case 'Basquet': return 12;
            case 'Voley': return 12;
            case 'Ping-Pong': return 2;
            default: return 18;
        }
    };

    const getMinPlayers = (deporte) => {
        switch (deporte) {
            case 'Futbol': return 7;
            case 'Basquet': return 5;
            case 'Voley': return 6;
            case 'Ping-Pong': return 1;
            default: return 5;
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Encabezado */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase">
                        {userName ? `¡Bienvenido, ${userName}!` : 'Panel del Capitán'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Crea equipos, gestiona plantillas y solicita inscripciones a torneos deportivos.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/capitan/nuevo-equipo')}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                >
                    <Plus className="h-5 w-5" />
                    Registrar Equipo
                </button>
            </div>

            {/* Enlaces Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/capitan/explorar"
                    className="group bg-gradient-to-br from-blue-950/40 to-slate-900 border border-slate-800/80 p-6 rounded-3xl hover:border-blue-500/50 transition-all flex justify-between items-center"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600/10 p-3.5 rounded-2xl border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Explorar Torneos Activos</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Encuentra campeonatos e inscribe tus equipos aptos.</p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                    to="/historial"
                    className="group bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-slate-800/80 p-6 rounded-3xl hover:border-indigo-500/50 transition-all flex justify-between items-center"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600/10 p-3.5 rounded-2xl border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Buscador y Historial</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Consulta resultados de partidos, equipos y jugadores.</p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* Dos Columnas: Mis Equipos & Solicitudes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Mis Equipos */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Mis Equipos ({equipos.length})
                        </h2>
                    </div>

                    {equipos.length === 0 ? (
                        <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-3xl text-center text-slate-400">
                            <Users className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                            <p className="font-bold text-slate-300">Aún no tienes equipos registrados</p>
                            <p className="text-xs text-slate-500 mt-1">Crea tu primer equipo para inscribirte en torneos.</p>
                            <button
                                onClick={() => navigate('/capitan/nuevo-equipo')}
                                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-colors"
                            >
                                Registrar mi primer equipo
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {equipos.map((eq) => {
                                const count = eq.jugadores ? eq.jugadores.length : 0;
                                const max = getPlayerLimit(eq.deporte);
                                const min = getMinPlayers(eq.deporte);
                                const isReady = count >= min;

                                return (
                                    <div
                                        key={eq.id}
                                        className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs bg-blue-500/10 text-blue-400 font-extrabold px-3 py-1 rounded-full border border-blue-500/20 uppercase">
                                                    {eq.deporte === 'Futbol' ? 'Fútbol' : eq.deporte}
                                                </span>
                                                <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-lg">
                                                    Cat: {eq.categoria}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">{eq.nombre}</h3>
                                            <p className="text-xs text-slate-400 line-clamp-2 mb-4">{eq.descripcion}</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Barra de progreso de jugadores */}
                                            <div>
                                                <div className="flex justify-between text-xs font-semibold mb-1">
                                                    <span className="text-slate-400">Jugadores Plantilla</span>
                                                    <span className={`${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                                                        {count} / {max}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${isReady ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                        style={{ width: `${Math.min((count / max) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                                                    <span>Mínimo para jugar: {min}</span>
                                                    {!isReady && (
                                                        <span className="text-yellow-500 flex items-center gap-0.5">
                                                            <AlertTriangle className="h-3 w-3" /> Faltan {min - count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/capitan/plantilla/${eq.id}`)}
                                                className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-850/50 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <Users className="h-3.5 w-3.5" />
                                                Gestionar Plantilla
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Solicitudes de Inscripción */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        Inscripciones
                    </h2>

                    <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl space-y-4">
                        {solicitudes.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-6">
                                No has solicitado inscripción en ningún torneo.
                            </p>
                        ) : (
                            solicitudes.map((sol) => (
                                <div 
                                    key={sol.id} 
                                    className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-white truncate max-w-[140px]" title={sol.nombreTorneo}>
                                            {sol.nombreTorneo}
                                        </span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                                            sol.estado === 'Aprobado' 
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                            : sol.estado === 'Rechazado'
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                            {sol.estado}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                                        <span>Equipo: <strong className="text-slate-300">{sol.nombreEquipo}</strong></span>
                                        <span>{sol.fechaSolicitud}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        
                        <button
                            onClick={() => navigate('/capitan/explorar')}
                            className="w-full py-2 text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                        >
                            Ver Torneos Públicos &rarr;
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardCapitan;
