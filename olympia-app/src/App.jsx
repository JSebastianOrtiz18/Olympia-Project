import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './Navbar';
import DashboardAdmin from './admin/admin_dashboard';
import FormTorneo from './torneos/formTorneo';
import FormEquipo from './equipos/formEquipo';
import LoginPage from './auth/LoginPage';
import ListaTorneos from './torneos/ListaTorneos';
import GestorEquipos from './equipos/GestorEquipos';
import DashboardUsuarios from './usuarios/DashboardUsuarios';
import ProtectedRoute from './auth/ProtectedRoute';

// Nuevos componentes a importar
import AccesoPin from './auth/AccesoPin';
import CargaResultadosAsistente from './torneos/CargaResultadosAsistente';
import DashboardCapitan from './usuarios/DashboardCapitan';
import GestorPlantilla from './equipos/GestorPlantilla';
import ExploradorTorneos from './torneos/ExploradorTorneos';
import GestionSolicitudes from './solicitudes/GestionSolicitudes';
import HistorialResultados from './torneos/HistorialResultados';

import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Routes>
          {/* Rutas Públicas de Acceso */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/asistente-pin" element={<AccesoPin />} />
          <Route path="/historial" element={
            <>
              <Navbar />
              <div className="flex-grow p-6 max-w-7xl mx-auto w-full">
                <HistorialResultados />
              </div>
            </>
          } />

          {/* Grupo Protegido para Organizador / SuperAdmin */}
          <Route element={<ProtectedRoute allowedRoles={['Organizador', 'SuperAdmin']} />}>
            <Route
              path="/admin/*"
              element={
                <>
                  <Navbar />
                  <div className="flex-grow p-6 max-w-7xl mx-auto w-full">
                    <Routes>
                      <Route path="/" element={<DashboardAdmin />} />
                      <Route path="/torneos" element={<ListaTorneos />} />
                      <Route path="/nuevo-torneo" element={<FormTorneo />} />
                      <Route path="/nuevo-torneo/editar/:idTorneo" element={<FormTorneo />} />
                      <Route path="/gestor-equipos/:idTorneo/:nombreTorneo" element={<GestorEquipos />} />
                      <Route path="/solicitudes" element={<GestionSolicitudes />} />
                      {/* SuperAdmin únicamente */}
                      <Route path="/gestion-usuarios" element={<DashboardUsuarios />} />
                      <Route path="*" element={<Navigate to="/admin" />} />
                    </Routes>
                  </div>
                </>
              }
            />
          </Route>

          {/* Grupo Protegido para Capitán (también permite a Organizador acceder por toggle de rol) */}
          {/* El SuperAdmin queda excluido de estas rutas para que no pueda participar en torneos */}
          <Route element={<ProtectedRoute allowedRoles={['Capitán', 'Organizador']} />}>
            <Route
              path="/capitan/*"
              element={
                <>
                  <Navbar />
                  <div className="flex-grow p-6 max-w-7xl mx-auto w-full">
                    <Routes>
                      <Route path="/" element={<DashboardCapitan />} />
                      <Route path="/nuevo-equipo" element={<FormEquipo />} />
                      <Route path="/plantilla/:idEquipo" element={<GestorPlantilla />} />
                      <Route path="/explorar" element={<ExploradorTorneos />} />
                      <Route path="*" element={<Navigate to="/capitan" />} />
                    </Routes>
                  </div>
                </>
              }
            />
          </Route>

          {/* Ruta Protegida Exclusiva para Asistente Autenticado por PIN */}
          <Route element={<ProtectedRoute allowedRoles={['Asistente']} />}>
            <Route path="/asistente/:idTorneo" element={<CargaResultadosAsistente />} />
          </Route>

          {/* Fallback de redirección */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
