import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Search, ShieldAlert, ArrowLeft, UserCheck, ShieldClose } from 'lucide-react';

const DashboardUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estado para asignar rol
    const [asignarData, setAsignarData] = useState({
        dni: '',
        rol: '2' // 2=Organizador, 3=Asistente
    });

    const cargarUsuarios = async () => {
        let listaUsuarios = [];
        
        // 1. Intentar cargar de backend
        try {
            const resp = await fetch("http://localhost/olympia-backend/usuarios/obtener_usuario.php");
            const data = await resp.json();
            if (Array.isArray(data)) {
                listaUsuarios = data;
            }
        } catch (error) {
            console.log("Backend offline o error al obtener usuarios. Usando locales.");
        }

        // 2. Sincronizar o cargar de localStorage
        const storedUsuarios = localStorage.getItem('olympia_usuarios');
        if (storedUsuarios) {
            listaUsuarios = JSON.parse(storedUsuarios);
        } else {
            // Inicializar base de datos de usuarios si no existe
            listaUsuarios = [
                { dni_usuario: '11111111', nombre_usuario: 'Administrador', apellido_usuario: 'Principal', email: 'admin@olympia.com', roles_asignados: 'SuperAdmin' },
                { dni_usuario: '22222222', nombre_usuario: 'Marcos', apellido_usuario: 'Gómez', email: 'organizador@olympia.com', roles_asignados: 'Organizador' },
                { dni_usuario: '33333333', nombre_usuario: 'Lucía', apellido_usuario: 'Fernández', email: 'capitan@olympia.com', roles_asignados: 'Capitán' },
                { dni_usuario: '44444444', nombre_usuario: 'Esteban', apellido_usuario: 'Paz', email: 'esteban@olympia.com', roles_asignados: 'Capitán' }
            ];
            localStorage.setItem('olympia_usuarios', JSON.stringify(listaUsuarios));
        }

        setUsuarios(listaUsuarios);
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const handleAsignarCambio = (e) => {
        setAsignarData({ ...asignarData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    // Cambiar rol de usuario por DNI
    const cambiarRol = (dni, nuevoRolString) => {
        const nuevosUsuarios = usuarios.map(u => {
            if (u.dni_usuario.toString() === dni.toString()) {
                return { ...u, roles_asignados: nuevoRolString };
            }
            return u;
        });

        localStorage.setItem('olympia_usuarios', JSON.stringify(nuevosUsuarios));
        setUsuarios(nuevosUsuarios);
        setSuccess(`Rol actualizado con éxito para el usuario DNI: ${dni}`);

        // Intentar actualizar también en el backend
        fetch("http://localhost/olympia-backend/usuarios/guardar_colaborador.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dni: dni,
                rol: nuevoRolString === 'Organizador' ? '2' : nuevoRolString === 'Asistente' ? '3' : '4'
            })
        }).catch(err => console.log("Backend offline, rol guardado localmente"));
    };

    const handleAsignarRolForm = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const user = usuarios.find(u => u.dni_usuario.toString() === asignarData.dni.toString());
        if (!user) {
            setError(`No se encontró ningún usuario registrado con el DNI ${asignarData.dni}`);
            return;
        }

        if (user.roles_asignados === 'SuperAdmin') {
            setError('No puedes modificar el rol del Administrador Principal.');
            return;
        }

        const rolString = asignarData.rol === '2' ? 'Organizador' : 'Asistente';
        cambiarRol(asignarData.dni, rolString);
        setAsignarData({ dni: '', rol: '2' });
    };

    // Filtrar usuarios
    const usuariosFiltrados = usuarios.filter(u =>
        `${u.nombre_usuario} ${u.apellido_usuario}`.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.dni_usuario.toString().includes(busqueda)
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Volver - Solo se muestra si el usuario no es SuperAdmin, para evitar redirecciones circulares */}
            {localStorage.getItem('olympia_role') !== 'SuperAdmin' && (
                <Link 
                    to="/admin" 
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider mb-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Panel
                </Link>
            )}

            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-500/10 p-3 rounded-2xl border border-orange-500/20 text-orange-400">
                        <Users className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent uppercase tracking-tight">
                            Personal y Usuarios
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            SuperAdmin Panel: Eleva roles de usuarios a Organizador o Asistente, o revoca privilegios.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-400 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Dos Secciones: Asignar Rol & Tabla */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Asignación Rápida */}
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl backdrop-blur-md space-y-4">
                    <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-orange-400" />
                        Asignar Rol Rápido
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Ingresa el DNI de un usuario previamente registrado en el sistema para elevarlo a Organizador o Asistente.
                    </p>

                    <form onSubmit={handleAsignarRolForm} className="space-y-4 pt-2">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">DNI del Usuario</label>
                            <input 
                                type="number" 
                                name="dni" 
                                value={asignarData.dni} 
                                onChange={handleAsignarCambio} 
                                required 
                                placeholder="Ej. 33333333" 
                                className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-100 text-xs transition-colors"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Seleccionar Rol</label>
                            <select 
                                name="rol" 
                                value={asignarData.rol} 
                                onChange={handleAsignarCambio} 
                                className="block w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-200 text-xs cursor-pointer"
                            >
                                <option value="2">Organizador Secundario</option>
                                <option value="3">Asistente de Campo</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/10 active:scale-[0.98] transition-all"
                        >
                            Confirmar Asignación
                        </button>
                    </form>
                </div>

                {/* Base de Datos de Usuarios */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
                    <div className="p-5 border-b border-slate-850 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-base font-bold text-white uppercase tracking-wider">
                            Base de Datos de Usuarios
                        </h2>
                        
                        <div className="relative w-full sm:w-60">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar por DNI o Nombre..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-850 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-200 text-xs transition-colors"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-950/40 text-slate-400 font-bold border-b border-slate-850 uppercase tracking-wider">
                                    <th className="px-6 py-4">DNI</th>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Rol Asignado</th>
                                    <th className="px-6 py-4 text-right">Acción Rápida</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                                {usuariosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">
                                            No se encontraron usuarios registrados en la base.
                                        </td>
                                    </tr>
                                ) : (
                                    usuariosFiltrados.map((u) => {
                                        const esAdmin = u.roles_asignados === 'SuperAdmin';
                                        const esOrganizador = u.roles_asignados === 'Organizador';

                                        return (
                                            <tr key={u.dni_usuario} className="hover:bg-slate-950/20 transition-colors">
                                                <td className="px-6 py-4 font-mono text-slate-400 font-medium">{u.dni_usuario}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-extrabold text-white">{u.nombre_usuario} {u.apellido_usuario}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                                                        esAdmin
                                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        : esOrganizador
                                                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                        : u.roles_asignados === 'Asistente'
                                                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                                        : 'bg-slate-800 text-slate-350 border-slate-700'
                                                    }`}>
                                                        {u.roles_asignados}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {esAdmin ? (
                                                        <span className="text-[10px] text-slate-650 italic">Inmutable</span>
                                                    ) : esOrganizador ? (
                                                        <button
                                                            onClick={() => cambiarRol(u.dni_usuario, 'Capitán')}
                                                            className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 rounded-lg font-bold text-[10px] transition-colors"
                                                            title="Quitar privilegios de organizador"
                                                        >
                                                            Revocar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => cambiarRol(u.dni_usuario, 'Organizador')}
                                                            className="px-2.5 py-1 bg-orange-600/10 hover:bg-orange-650/20 border border-orange-500/25 text-orange-400 rounded-lg font-bold text-[10px] transition-colors"
                                                            title="Promover a organizador del sistema"
                                                        >
                                                            Promover
                                                        </button>
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
        </div>
    );
};

export default DashboardUsuarios;
