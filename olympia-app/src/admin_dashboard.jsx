import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, ShieldCheck, Activity, Calendar, ArrowRight, Hourglass } from 'lucide-react';

const DashboardAdmin = () => {
    const userName = localStorage.getItem('olympia_user_name') || '';
    const [torneos, setTorneos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [activeTab, setActiveTab] = useState('activos'); // 'activos' o 'historial'

    const cargarTorneos = async () => {
        try {
            const resp = await fetch("http://localhost/olympia-backend/torneos/obtener_torneos.php");
            const data = await resp.json();
            if (Array.isArray(data)) {
                const eliminados = JSON.parse(localStorage.getItem('olympia_eliminados_ids') || '[]');
                const torneosVisibles = data.filter(t => !eliminados.includes(t.id_torneo));
                setTorneos(torneosVisibles);
            }
        } catch (error) {
            console.error("Error al cargar torneos:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarTorneos();
    }, []);

    // Filtrar torneos según pestaña (HU-7.1)
    // t.estado puede ser 'Activo', 'Programado', 'Finalizado'
    const torneosActivos = torneos.filter(t => t.estado === 'Activo' || t.estado === 'Programado');
    const torneosFinalizados = torneos.filter(t => t.estado === 'Finalizado');

    // Stats dinámicas
    const totalActivos = torneosActivos.filter(t => t.estado === 'Activo').length;
    const totalProgramados = torneosActivos.filter(t => t.estado === 'Programado').length;
    const totalFinalizados = torneosFinalizados.length;

    const renderTorneoCard = (torneo) => (
        <div 
            key={torneo.id_torneo} 
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                        {torneo.deporte_torneo}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                        torneo.estado === 'Activo' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : torneo.estado === 'Programado'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                        {torneo.estado}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {torneo.nombre_torneo}
                </h3>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Hourglass className="h-3 w-3" />
                    ID: {torneo.id_torneo}
                </span>
                <Link to={`/admin/gestor-equipos/${torneo.id_torneo}/${encodeURIComponent(torneo.nombre_torneo)}`}>
                    <button className="text-sm font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Panel de control <ArrowRight className="h-4 w-4" />
                    </button>
                </Link>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans animate-in fade-in duration-500">
            {/* Cabecera de bienvenida */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold uppercase tracking-wider mb-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Administrador de Torneo</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        {userName ? `¡Bienvenido, ${userName}!` : 'Panel de Control'}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-xl">
                        Gestiona tus competencias, procesa solicitudes de inscripción, genera fixtures oficiales y actualiza marcadores.
                    </p>
                </div>

                <div className="flex gap-4 relative z-10 shrink-0">
                    <Link to="/admin/nuevo-torneo">
                        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all">
                            + Crear Torneo
                        </button>
                    </Link>
                    <Link to="/admin/solicitudes">
                        <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all">
                            Ver Solicitudes
                        </button>
                    </Link>
                </div>
            </div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className="bg-green-500/10 p-3.5 rounded-xl border border-green-500/20 text-green-400">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Torneos En Curso</p>
                        <p className="text-2xl font-black text-white mt-1">{totalActivos}</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className="bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20 text-blue-400">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Próximos / Programados</p>
                        <p className="text-2xl font-black text-white mt-1">{totalProgramados}</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 text-slate-400">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Torneos Finalizados</p>
                        <p className="text-2xl font-black text-white mt-1">{totalFinalizados}</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
                    <div className="bg-purple-500/10 p-3.5 rounded-xl border border-purple-500/20 text-purple-400">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Registrados</p>
                        <p className="text-2xl font-black text-white mt-1">{torneos.length}</p>
                    </div>
                </div>
            </div>

            {/* Listado de Torneos por Pestañas */}
            <div>
                <div className="flex border-b border-slate-800 mb-6">
                    <button
                        onClick={() => setActiveTab('activos')}
                        className={`px-6 py-3 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-colors ${
                            activeTab === 'activos' 
                            ? 'border-blue-500 text-blue-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-400'
                        }`}
                    >
                        Torneos Activos / Programados ({torneosActivos.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`px-6 py-3 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-colors ${
                            activeTab === 'historial' 
                            ? 'border-blue-500 text-blue-400' 
                            : 'border-transparent text-slate-500 hover:text-slate-400'
                        }`}
                    >
                        Historial de Torneos ({torneosFinalizados.length})
                    </button>
                </div>

                {cargando ? (
                    <div className="text-center py-16 text-slate-500 font-bold">Cargando competencias...</div>
                ) : activeTab === 'activos' ? (
                    torneosActivos.length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
                            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No hay torneos activos</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                                Actualmente no posees torneos en juego o programados. ¡Crea uno nuevo para comenzar!
                            </p>
                            <Link to="/admin/nuevo-torneo">
                                <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs">
                                    Crear Copa
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {torneosActivos.map(renderTorneoCard)}
                        </div>
                    )
                ) : (
                    torneosFinalizados.length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
                            <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Historial vacío</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                No hay registros de torneos que hayan finalizado cronológicamente aún.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {torneosFinalizados.map(renderTorneoCard)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default DashboardAdmin;
