import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Settings, Trash2, Shield, Plus, ArrowLeft, Key, Copy, Check } from 'lucide-react';

const ListaTorneos = () => {
    const navigate = useNavigate();
    const [torneos, setTorneos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [pins, setPins] = useState({}); // Mapa de idTorneo -> PIN (punto 3)
    const [copiadoId, setCopiadoId] = useState(null); // Feedback visual de PIN copiado

    // Cargar los PINs de los torneos (del backend o localStorage)
    const cargarPins = (listaTorneos) => {
        const pMap = {};
        listaTorneos.forEach(t => {
            const p = t.pin_asistente || localStorage.getItem(`olympia_pin_${t.id_torneo}`);
            if (p) pMap[t.id_torneo] = p;
        });
        setPins(pMap);
    };

    const cargarTorneos = async () => {
        try {
            setCargando(true);
            const resp = await fetch("http://localhost/olympia-backend/torneos/obtener_torneos.php");
            const data = await resp.json();
            if (Array.isArray(data)) {
                // Filtramos los eliminados si manejamos baja lógica en localStorage o localmente
                const eliminados = JSON.parse(localStorage.getItem('olympia_eliminados_ids') || '[]');
                const torneosVisibles = data.filter(t => !eliminados.includes(t.id_torneo));
                setTorneos(torneosVisibles);
                cargarPins(torneosVisibles);
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

    // Generar un PIN único de 6 caracteres alfanuméricos desde la lista (punto 3)
    const handleGenerarPinLista = async (idTorneo) => {
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
                setPins(prev => ({ ...prev, [idTorneo]: pin }));
                alert(`¡Código PIN generado con éxito: ${pin}!`);
            } else {
                alert(data.mensaje || "Error al generar PIN.");
            }
        } catch (error) {
            alert("Error de conexión al generar PIN.");
        }
    };

    // Copiar el PIN al portapapeles con feedback visual
    const handleCopiarPinLista = (idTorneo, pin) => {
        navigator.clipboard.writeText(pin);
        setCopiadoId(idTorneo);
        setTimeout(() => setCopiadoId(null), 1500);
    };

    const handleEliminarTorneo = async (idTorneo, nombreTorneo) => {
        try {
            // Verificar si tiene partidos registrados (HU-1.3)
            const respFixture = await fetch(`http://localhost/olympia-backend/fixture/obtener_fixture.php?id_torneo=${idTorneo}`);
            const dataFixture = await respFixture.json();
            
            if (dataFixture && dataFixture.partidos && dataFixture.partidos.length > 0) {
                alert(`⚠️ Error: No se puede eliminar "${nombreTorneo}" porque ya tiene partidos registrados o la competencia ya ha comenzado.`);
                return;
            }

            // Si no tiene partidos, pedir confirmación antes de la baja lógica
            const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar el torneo "${nombreTorneo}"?\n\nEsta acción es irreversible.`);
            if (confirmar) {
                // Simulación de baja lógica (HU-1.3)
                const eliminados = JSON.parse(localStorage.getItem('olympia_eliminados_ids') || '[]');
                eliminados.push(idTorneo);
                localStorage.setItem('olympia_eliminados_ids', JSON.stringify(eliminados));
                
                // Actualizar lista en pantalla
                setTorneos(prev => prev.filter(t => t.id_torneo !== idTorneo));
                alert(`¡Torneo "${nombreTorneo}" eliminado con éxito!`);
            }
        } catch (error) {
            alert("Error al verificar los datos del torneo.");
        }
    };

    const obtenerColorEstado = (estado) => {
        switch (estado) {
            case 'Activo': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'Programado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'Finalizado': return 'bg-slate-800 text-slate-400 border-slate-700';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    return (
        <div className="space-y-6 font-sans animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-blue-500" />
                        Gestión de Torneos
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Crea, edita, programa y elimina las competencias activas.
                    </p>
                </div>
                <Link to="/admin/nuevo-torneo">
                    <button className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all">
                        <Plus className="h-4 w-4" /> Nuevo Torneo
                    </button>
                </Link>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/60 border-b border-slate-850 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Nombre del Torneo</th>
                                <th className="px-6 py-4">Deporte / Categoría</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">PIN Asistente</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                            {cargando ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold">
                                        Cargando torneos...
                                    </td>
                                </tr>
                            ) : torneos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No hay torneos registrados.
                                    </td>
                                </tr>
                            ) : (
                                torneos.map((t) => (
                                    <tr key={t.id_torneo} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-5 text-sm font-semibold text-slate-500">
                                            #{t.id_torneo}
                                        </td>
                                        <td className="px-6 py-5 text-sm font-black text-white">
                                            {t.nombre_torneo}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-slate-300">
                                            <span className="font-bold">{t.deporte_torneo}</span>
                                            <span className="text-slate-500 mx-2">•</span>
                                            <span className="text-xs text-slate-400">{t.categoria_torneo || 'Libre'}</span>
                                        </td>
                                        <td className="px-6 py-5 text-sm">
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${obtenerColorEstado(t.estado)}`}>
                                                {t.estado}
                                            </span>
                                        </td>
                                        {/* PIN de Asistente: Columna para ver, generar o copiar el código de acceso */}
                                        <td className="px-6 py-5 text-sm text-center">
                                            {pins[t.id_torneo] ? (
                                                <div className="inline-flex items-center gap-2 bg-slate-850 border border-slate-750 px-3 py-1.5 rounded-lg">
                                                    <span className="font-mono font-bold text-yellow-400 tracking-wider">
                                                        {pins[t.id_torneo]}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopiarPinLista(t.id_torneo, pins[t.id_torneo])}
                                                        className="text-slate-400 hover:text-white transition-colors"
                                                        title="Copiar PIN"
                                                    >
                                                        {copiadoId === t.id_torneo ? (
                                                            <Check className="h-3.5 w-3.5 text-green-400" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleGenerarPinLista(t.id_torneo)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 rounded-lg text-xs font-bold transition-all"
                                                    title="Generar PIN de Asistente"
                                                >
                                                    <Key className="h-3.5 w-3.5" /> Generar PIN
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-sm text-center">
                                            <div className="flex justify-center items-center gap-3">
                                                <Link 
                                                    to={`/admin/gestor-equipos/${t.id_torneo}/${encodeURIComponent(t.nombre_torneo)}`}
                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Panel de control
                                                </Link>
                                                
                                                <button
                                                    onClick={() => navigate(`/admin/nuevo-torneo/editar/${t.id_torneo}`)}
                                                    className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-400 hover:text-white rounded-lg transition-colors"
                                                    title="Editar Torneo"
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleEliminarTorneo(t.id_torneo, t.nombre_torneo)}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                                                    title="Eliminar Torneo"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ListaTorneos;
