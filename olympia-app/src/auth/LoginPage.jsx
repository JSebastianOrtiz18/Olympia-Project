import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Calendar, ShieldCheck, Trophy, Sparkles } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [registerData, setRegisterData] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        fechaNac: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: ''
    });

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = loginData;

        if (!email || !password) {
            setError('Todos los campos son obligatorios');
            return;
        }

        try {
            const resp = await fetch("http://localhost/olympia-backend/usuarios/login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                const { nombre, apellido, email: userEmail, rol, dni } = data.user;
                const fullName = `${nombre} ${apellido}`;

                localStorage.setItem('olympia_token', 'true');
                localStorage.setItem('olympia_role', rol);
                localStorage.setItem('olympia_user_email', userEmail);
                localStorage.setItem('olympia_user_name', fullName);
                localStorage.setItem('olympia_user_dni', dni.toString());

                // El SuperAdmin y el Organizador inician sesión directamente en modo Organizador (no participan como capitán)
                localStorage.setItem('olympia_view_mode', (rol === 'Organizador' || rol === 'SuperAdmin') ? 'Organizador' : 'Capitán');

                setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');

                setTimeout(() => {
                    if (rol === 'SuperAdmin') {
                        navigate('/admin/gestion-usuarios');
                    } else if (rol === 'Organizador') {
                        navigate('/admin');
                    } else {
                        navigate('/capitan');
                    }
                }, 1000);
            } else {
                setError(data.mensaje || 'Error al iniciar sesión.');
            }
        } catch (err) {
            setError('Error al conectar con el servidor backend.');
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const { nombre, apellido, dni, fechaNac, email, telefono, password, confirmPassword } = registerData;

        // Validaciones HU-2.1
        if (!nombre || !apellido || !dni || !fechaNac || !email || !password) {
            setError('Por favor, completa todos los campos obligatorios');
            return;
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            const resp = await fetch("http://localhost/olympia-backend/usuarios/registro.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    dni,
                    fechaNac,
                    email,
                    telefono,
                    password
                })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                const { nombre: resNombre, apellido: resApellido, email: resEmail, rol, dni: resDni } = data.user;
                const fullName = `${resNombre} ${resApellido}`;

                localStorage.setItem('olympia_token', 'true');
                localStorage.setItem('olympia_role', rol);
                localStorage.setItem('olympia_user_email', resEmail);
                localStorage.setItem('olympia_user_name', fullName);
                localStorage.setItem('olympia_user_dni', resDni.toString());
                localStorage.setItem('olympia_view_mode', 'Capitán');

                setSuccess('¡Cuenta creada con éxito! Redirigiendo...');
                setTimeout(() => {
                    navigate('/capitan');
                }, 1500);
            } else {
                setError(data.mensaje || 'Error al registrar usuario.');
            }
        } catch (err) {
            setError('Error al conectar con el servidor backend.');
        }
    };



    return (
        <div 
            className="min-h-screen flex flex-col bg-slate-950 text-slate-100 bg-cover bg-center relative font-sans overflow-y-auto"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop")' }}
        >
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>

            {/* Cabecera */}
            <header className="relative z-10 flex justify-between items-center px-6 py-4 bg-slate-900/50 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 tracking-wider">
                        OLYMPIA
                    </span>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => navigate('/historial')}
                        className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                        Buscar Resultados
                    </button>
                    <button 
                        onClick={() => navigate('/asistente-pin')}
                        className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
                    >
                        Ingreso Asistente (PIN)
                    </button>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-6">
                <div className="bg-slate-900/85 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl p-8 backdrop-blur-lg">
                    
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-500/20">
                            <Sparkles className="h-3 w-3" />
                            <span>Gestor de Torneos Deportivos</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase bg-clip-text bg-gradient-to-b from-white to-slate-400">
                            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                        </h1>
                        <p className="text-sm text-slate-400 mt-2">
                            {isRegister ? 'Registra tus datos para comenzar a competir' : 'Ingresa a tu cuenta para administrar o participar'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            {success}
                        </div>
                    )}

                    {!isRegister ? (
                        /* FORMULARIO LOGIN */
                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        name="email"
                                        value={loginData.email}
                                        onChange={handleLoginChange}
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <input
                                        name="password"
                                        value={loginData.password}
                                        onChange={handleLoginChange}
                                        type="password"
                                        required
                                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                                        placeholder="••••••••••••"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-3.5 px-4 rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-blue-600/20 active:scale-[0.98]"
                            >
                                INICIAR SESIÓN
                            </button>


                        </form>
                    ) : (
                        /* FORMULARIO REGISTRO (HU-2.1) */
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <input
                                            name="nombre"
                                            value={registerData.nombre}
                                            onChange={handleRegisterChange}
                                            type="text"
                                            required
                                            className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                            placeholder="Juan"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Apellido *</label>
                                    <input
                                        name="apellido"
                                        value={registerData.apellido}
                                        onChange={handleRegisterChange}
                                        type="text"
                                        required
                                        className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                        placeholder="Pérez"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">DNI *</label>
                                    <input
                                        name="dni"
                                        value={registerData.dni}
                                        onChange={handleRegisterChange}
                                        type="number"
                                        required
                                        className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                        placeholder="Sin puntos"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">F. Nacimiento *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <input
                                            name="fechaNac"
                                            value={registerData.fechaNac}
                                            onChange={handleRegisterChange}
                                            type="date"
                                            required
                                            className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Correo Electrónico *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        name="email"
                                        value={registerData.email}
                                        onChange={handleRegisterChange}
                                        type="email"
                                        required
                                        className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Teléfono (Opcional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <input
                                        name="telefono"
                                        value={registerData.telefono}
                                        onChange={handleRegisterChange}
                                        type="number"
                                        className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                        placeholder="Ej. 1123456789"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contraseña *</label>
                                    <input
                                        name="password"
                                        value={registerData.password}
                                        onChange={handleRegisterChange}
                                        type="password"
                                        required
                                        className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                        placeholder="Mín. 8 caracteres"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirmar *</label>
                                    <input
                                        name="confirmPassword"
                                        value={registerData.confirmPassword}
                                        onChange={handleRegisterChange}
                                        type="password"
                                        required
                                        className="block w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 text-sm transition-colors"
                                        placeholder="Repite contraseña"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full py-3 rounded-xl shadow-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm tracking-wide transition-all shadow-green-600/20 active:scale-[0.98] mt-2"
                            >
                                REGISTRARSE
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-400">
                            {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                        </span>
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError('');
                                setSuccess('');
                            }}
                            className="text-blue-500 font-bold ml-1.5 hover:underline"
                        >
                            {isRegister ? 'Inicia Sesión aquí' : 'Regístrate aquí'}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default LoginPage;
