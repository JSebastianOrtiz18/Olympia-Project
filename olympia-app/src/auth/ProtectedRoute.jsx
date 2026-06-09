import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    // Busca la llave y el rol en el almacenamiento del navegador
    const isAuth = localStorage.getItem('olympia_token');
    const userRole = localStorage.getItem('olympia_role') || 'Capitán';

    // Si no hay llave, lo patea al Login
    if (!isAuth) {
        return <Navigate to="/" replace />;
    }

    // Restricción para SuperAdmin: No puede gestionar torneos, fixtures ni solicitudes.
    // Solo se le permite acceder a la sección de gestión de personal (/admin/gestion-usuarios).
    const path = window.location.pathname;
    if (userRole === 'SuperAdmin' && path.startsWith('/admin') && !path.startsWith('/admin/gestion-usuarios')) {
        return <Navigate to="/admin/gestion-usuarios" replace />;
    }

    // Si se especificaron roles permitidos y el rol actual no está en la lista
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirige al inicio o al panel correspondiente según el rol
        if (userRole === 'Organizador') {
            return <Navigate to="/admin" replace />;
        } else if (userRole === 'SuperAdmin') {
            return <Navigate to="/admin/gestion-usuarios" replace />;
        } else if (userRole === 'Asistente') {
            const pinTorneo = localStorage.getItem('olympia_asistente_torneo');
            return <Navigate to={`/asistente/${pinTorneo}`} replace />;
        } else {
            return <Navigate to="/capitan" replace />;
        }
    }

    // Si todo está bien, lo deja pasar
    return <Outlet />;
};

export default ProtectedRoute;
