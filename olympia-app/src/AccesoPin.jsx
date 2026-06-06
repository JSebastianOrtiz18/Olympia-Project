import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';

const AccesoPin = () => {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [nombre, setNombre] = useState(''); // Estado para registrar el nombre del asistente (punto 5)
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validación: Nombre obligatorio para poder auditar quién modifica resultados (punto 5)
        if (!nombre.trim()) {
            setError('Por favor, ingresa tu Nombre y Apellido para identificarte al modificar resultados.');
            setLoading(false);
            return;
        }

        if (!pin.trim()) {
            setError('Por favor, ingresa el código PIN de acceso.');
            setLoading(false);
            return;
        }

        try {
            const resp = await fetch("http://localhost/olympia-backend/torneos/verificar_pin.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: pin.trim() })
            });
            const data = await resp.json();

            if (data.status === 'success') {
                const matchingTorneoId = data.id_torneo.toString();
                // Iniciar sesión temporal como Asistente
                localStorage.setItem('olympia_token', 'true');
                localStorage.setItem('olympia_role', 'Asistente');
                localStorage.setItem('olympia_asistente_torneo', matchingTorneoId);
                localStorage.setItem('olympia_asistente_nombre', nombre.trim()); // Registrar nombre del asistente para el historial de cambios (punto 5)
                
                // Redirigir a la vista del asistente
                navigate(`/asistente/${matchingTorneoId}`);
            } else {
                setError(data.mensaje || 'El código PIN ingresado es incorrecto o ya ha expirado. Por favor, solicita uno nuevo al organizador.');
                setLoading(false);
            }
        } catch (err) {
            setError('Error al conectar con el servidor.');
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex flex-col bg-slate-950 text-slate-100 bg-cover bg-center relative justify-center items-center p-6"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop")' }}
        >
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>

            <div className="relative z-10 w-full max-w-md bg-slate-900/85 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-lg">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-6 uppercase tracking-wider"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Login
                </button>

                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center rounded-2xl mb-4 shadow-lg shadow-indigo-600/5">
                        <KeyRound className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Acceso de Asistente</h1>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                        Identifícate e ingresa el PIN del torneo para registrar marcadores en tiempo real.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3.5 rounded-xl text-xs mb-6 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre y Apellido</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => {
                                setNombre(e.target.value);
                                setError('');
                            }}
                            placeholder="Ej. Juan Pérez"
                            className="block w-full py-3 px-4 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition-colors placeholder:text-slate-600"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Código PIN del Torneo</label>
                        <input
                            type="text"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setError('');
                            }}
                            placeholder="PIN (Ej. ref123)"
                            className="block w-full py-3 px-4 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-center tracking-widest font-mono font-bold text-sm transition-colors uppercase placeholder:text-slate-600 placeholder:tracking-normal"
                            maxLength={8}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'VERIFICANDO...' : 'INGRESAR AL FIXTURE'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[10px] text-indigo-400/80 font-bold bg-indigo-500/5 py-2 px-3 rounded-lg border border-indigo-500/10">
                        Demo PIN rápido: <span className="font-mono text-white select-all">ref123</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccesoPin;
