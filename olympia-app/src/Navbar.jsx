import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Users, Trophy, Sparkles, User, RefreshCw, LogOut } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Comprobamos si el usuario ha iniciado sesión (HU-2.1 / HU-6.3)
    const isAuth = localStorage.getItem('olympia_token') === 'true';
    const originalRole = localStorage.getItem('olympia_role') || 'Capitán';

    // Para el SuperAdmin forzamos el modo visual Organizador, de modo que no pueda participar en torneos (punto 1)
    const viewMode = originalRole === 'SuperAdmin' ? 'Organizador' : (localStorage.getItem('olympia_view_mode') || 'Capitán');

    const handleToggleView = () => {
        const nextMode = viewMode === 'Organizador' ? 'Capitán' : 'Organizador';
        localStorage.setItem('olympia_view_mode', nextMode);
        if (nextMode === 'Organizador') {
            navigate('/admin');
        } else {
            navigate('/capitan');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('olympia_token');
        localStorage.removeItem('olympia_role');
        localStorage.removeItem('olympia_view_mode');
        localStorage.removeItem('olympia_user_email');
        localStorage.removeItem('olympia_user_name');
        localStorage.removeItem('olympia_user_dni');
        localStorage.removeItem('olympia_asistente_torneo');
        localStorage.removeItem('olympia_asistente_nombre');
        navigate('/');
    };

    const isLinkActive = (path) => {
        return location.pathname === path;
    };

    const linkStyle = (path) => {
        return `px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 flex items-center gap-2 ${isLinkActive(path)
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`;
    };

    return (
        <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 relative z-50">
            {/* Logo y Badge de Modo */}
            <div className="flex items-center gap-3">
                <div className="bg-blue-600/10 p-1.5 rounded-lg border border-blue-500/20 text-blue-400">
                    <Trophy className="h-5 w-5" />
                </div>
                <span className="font-black text-lg text-white tracking-widest">OLYMPIA</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {!isAuth ? 'Público' : originalRole === 'SuperAdmin' ? 'SuperAdmin' : `${viewMode} Mode`}
                </span>
            </div>

            {/* Enlaces Dinámicos según Rol y Autenticación */}
            <div className="flex flex-wrap justify-center gap-2">
                {!isAuth ? (
                    // Vista para visitantes no logueados (punto 2)
                    <Link to="/historial" className={linkStyle('/historial')}>
                        <Sparkles className="h-4 w-4" /> Buscar Resultados
                    </Link>
                ) : viewMode === 'Organizador' ? (
                    // Vista Organizador / SuperAdmin
                    <>
                        {originalRole !== 'SuperAdmin' && (
                            <>
                                <Link to="/admin" className={linkStyle('/admin')}>
                                    <ShieldAlert className="h-4 w-4" /> Inicio
                                </Link>
                                <Link to="/admin/torneos" className={linkStyle('/admin/torneos')}>
                                    <Trophy className="h-4 w-4" /> Torneos
                                </Link>
                                <Link to="/admin/solicitudes" className={linkStyle('/admin/solicitudes')}>
                                    <Users className="h-4 w-4" /> Solicitudes
                                </Link>
                            </>
                        )}
                        {originalRole === 'SuperAdmin' && (
                            <Link to="/admin/gestion-usuarios" className={linkStyle('/admin/gestion-usuarios')}>
                                <User className="h-4 w-4" /> Personal
                            </Link>
                        )}
                    </>
                ) : (
                    // Vista Capitán
                    <>
                        <Link to="/capitan" className={linkStyle('/capitan')}>
                            <User className="h-4 w-4" /> Mis Equipos
                        </Link>
                        <Link to="/capitan/explorar" className={linkStyle('/capitan/explorar')}>
                            <Trophy className="h-4 w-4" /> Explorar Torneos
                        </Link>
                        <Link to="/historial" className={linkStyle('/historial')}>
                            <Sparkles className="h-4 w-4" /> Historial
                        </Link>
                    </>
                )}
            </div>

            {/* Acciones de Login / Logout y Cambio de Vista */}
            <div className="flex items-center gap-4">
                {isAuth ? (
                    <>
                        {/* Solo los Organizadores generales pueden cambiar de vista, el SuperAdmin no (punto 1) */}
                        {originalRole === 'Organizador' && (
                            <button
                                onClick={handleToggleView}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/10 transition-all active:scale-[0.97]"
                                title="Alternar entre vista de Administrador y Capitán"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Vista: {viewMode === 'Organizador' ? 'Capitán' : 'Organizador'}
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Salir
                        </button>
                    </>
                ) : (
                    // Botón para iniciar sesión si es visitante
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 transition-all"
                    >
                        Iniciar Sesión
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
