import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Trophy, AlertTriangle, Save, ArrowLeft } from 'lucide-react';

const FormTorneo = () => {
    const navigate = useNavigate();
    const { idTorneo } = useParams();
    const isEditMode = !!idTorneo;

    const [formData, setFormData] = useState({
        nombreTorneo: '',
        fechaInicio: '',
        fechaFin: '',
        maxEquipos: 4,
        formatoTorneo: 'Liga',
        categoriaTorneo: 'Libre',
        deporteTorneo: 'Futbol'
    });

    const [hasMatches, setHasMatches] = useState(false);
    const [cargando, setCargando] = useState(isEditMode);

    useEffect(() => {
        if (isEditMode) {
            const cargarDatosEdicion = async () => {
                try {
                    // 1. Obtener los torneos para rellenar el formulario
                    const respTorneos = await fetch("http://localhost/olympia-backend/torneos/obtener_torneos.php");
                    const dataTorneos = await respTorneos.json();
                    
                    if (Array.isArray(dataTorneos)) {
                        // El backend obtener_torneos.php no devuelve fechas, pero podemos simularlas o consultar otro endpoint.
                        // Como es un prototipo, buscaremos los datos básicos y rellenaremos fechas ficticias si no vienen.
                        const torneo = dataTorneos.find(t => t.id_torneo === parseInt(idTorneo));
                        if (torneo) {
                            // En el backend, las fechas reales están guardadas. Para el demo de edición:
                            setFormData({
                                nombreTorneo: torneo.nombre_torneo,
                                fechaInicio: '2026-06-01', // Fechas demo
                                fechaFin: '2026-06-30',
                                maxEquipos: 8,
                                formatoTorneo: torneo.formato_torneo || 'Liga',
                                categoriaTorneo: torneo.categoria_torneo || 'Libre',
                                deporteTorneo: torneo.deporte_torneo
                            });
                        }
                    }

                    // 2. Verificar si ya tiene partidos registrados (HU-1.2)
                    const respFixture = await fetch(`http://localhost/olympia-backend/fixture/obtener_fixture.php?id_torneo=${idTorneo}`);
                    const dataFixture = await respFixture.json();
                    if (dataFixture && dataFixture.partidos && dataFixture.partidos.length > 0) {
                        setHasMatches(true);
                    }
                } catch (error) {
                    console.error("Error al cargar datos del torneo para edición:", error);
                } finally {
                    setCargando(false);
                }
            };
            cargarDatosEdicion();
        }
    }, [idTorneo, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Bloquear si el torneo ya empezó y es un campo no editable
        if (hasMatches && (name === 'formatoTorneo' || name === 'fechaInicio' || name === 'fechaFin' || name === 'deporteTorneo')) {
            return;
        }

        if (name === 'formatoTorneo' && value === 'Grupos') {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
                maxEquipos: Math.max(4, prevData.maxEquipos)
            }));
        } else {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validación de fechas (HU-1.1)
        if (new Date(formData.fechaFin) < new Date(formData.fechaInicio)) {
            alert("La fecha de finalización no puede ser anterior a la fecha de inicio.");
            return;
        }

        const maxEq = parseInt(formData.maxEquipos);

        if (formData.formatoTorneo === 'Grupos' && maxEq < 4) {
            alert("Para el formato 'Fase de Grupos' la capacidad máxima debe ser de al menos 4 equipos.");
            return;
        }

        if (formData.formatoTorneo === 'Eliminatoria') {
            const esPotenciaDe2 = (maxEq & (maxEq - 1)) === 0;
            if (!esPotenciaDe2) {
                const confirmar = window.confirm(`Has configurado una capacidad de ${maxEq} equipos para un torneo Eliminatorio.\n\nAl no ser un número exacto para llaves perfectas (4, 8, 16...), el sistema asignará "Byes" (pases directos) a algunos equipos en la primera ronda.\n\n¿Deseas continuar?`);
                if (!confirmar) return;
            }
        }

        if (isEditMode) {
            // Simulamos guardado de edición ya que el backend de la cátedra solo inserta
            alert("¡Cambios guardados con éxito! (Simulado en la base de datos para el prototipo)");
            navigate('/admin/torneos');
            return;
        }

        const datosParaEnviar = {
            nombre_torneo: formData.nombreTorneo,
            torneo_inicio: formData.fechaInicio,
            torneo_fin: formData.fechaFin,
            max_equipos: maxEq,
            formato_torneo: formData.formatoTorneo,
            categoria_torneo: formData.categoriaTorneo,
            deporte_torneo: formData.deporteTorneo
        };

        try {
            const response = await fetch("http://localhost/olympia-backend/torneos/guardar_torneo.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosParaEnviar),
            });

            const resultado = await response.json();

            if (resultado.status === "success") {
                alert("¡Torneo creado con éxito!");
                navigate('/admin/torneos');
            } else {
                alert("Error: " + resultado.mensaje);
            }
        } catch (error) {
            alert("No se pudo conectar con el servidor.");
        }
    };

    const minEquiposPermitido = formData.formatoTorneo === 'Grupos' ? 4 : 2;

    if (cargando) {
        return <div className="text-center py-16 text-slate-500 font-bold">Cargando formulario...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 font-sans animate-in fade-in duration-300">
            
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Volver
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="relative z-10 flex items-center gap-4 mb-6">
                    <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-500/20 text-blue-400">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">
                            {isEditMode ? 'Editar Torneo' : 'Registrar Nuevo Torneo'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-0.5">
                            {isEditMode ? `Configuración del torneo ID: ${idTorneo}` : 'Establece los parámetros básicos de la competencia'}
                        </p>
                    </div>
                </div>

                {hasMatches && (
                    <div className="bg-orange-500/10 border border-orange-500/30 text-orange-200 p-4 rounded-2xl text-xs flex items-start gap-3 mb-6">
                        <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0" />
                        <div>
                            <span className="font-bold">Torneo con Partidos Programados:</span> Las fechas y el formato no pueden ser modificados porque el fixture ya se encuentra generado y en curso (HU-1.2).
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Torneo</label>
                        <input 
                            type="text" 
                            name="nombreTorneo" 
                            value={formData.nombreTorneo} 
                            onChange={handleChange} 
                            required 
                            placeholder="Ej. Copa de Campeones" 
                            className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deporte</label>
                            <select 
                                name="deporteTorneo" 
                                value={formData.deporteTorneo} 
                                onChange={handleChange} 
                                required 
                                disabled={hasMatches}
                                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors bg-no-repeat bg-right"
                            >
                                <option value="Futbol">Fútbol</option>
                                <option value="Basquet">Básquet</option>
                                <option value="Voley">Vóley</option>
                                <option value="Ping-Pong">Ping-Pong</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoría</label>
                            <select 
                                name="categoriaTorneo" 
                                value={formData.categoriaTorneo} 
                                onChange={handleChange} 
                                required 
                                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                            >
                                <option value="Sub-18">Sub-18</option>
                                <option value="Libre">Libre</option>
                                <option value="Veteranos">Veteranos</option>
                                <option value="Junior">Junior</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Formato</label>
                            <select 
                                name="formatoTorneo" 
                                value={formData.formatoTorneo} 
                                onChange={handleChange} 
                                required 
                                disabled={hasMatches}
                                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                            >
                                <option value="Liga">Liga</option>
                                <option value="Eliminatoria">Eliminatoria</option>
                                <option value="Grupos">Fase de Grupos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Capacidad Máx. Equipos</label>
                            <input
                                type="number"
                                name="maxEquipos"
                                min={minEquiposPermitido}
                                value={formData.maxEquipos}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                            />
                            {formData.formatoTorneo === 'Eliminatoria' && (
                                <p className="text-[10px] text-orange-400 mt-1.5 font-semibold">Llave perfecta sugerida: 4, 8, 16 o 32 equipos.</p>
                            )}
                            {formData.formatoTorneo === 'Grupos' && (
                                <p className="text-[10px] text-blue-400 mt-1.5 font-semibold">Mínimo obligatorio: 4 equipos.</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha de Inicio</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <input 
                                    type="date" 
                                    name="fechaInicio" 
                                    value={formData.fechaInicio} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={hasMatches}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha de Fin</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <input 
                                    type="date" 
                                    name="fechaFin" 
                                    value={formData.fechaFin} 
                                    onChange={handleChange} 
                                    required 
                                    disabled={hasMatches}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-100 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {isEditMode ? 'Guardar Cambios' : 'Crear Torneo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormTorneo;
