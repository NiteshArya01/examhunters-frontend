import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  let user = {};

  // Safe parsing to avoid crash on back button
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // 1. अगर टोकन नहीं है या यूज़र डेटा नहीं है
  if (!token || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // 2. अगर यूज़र का रोल सही नहीं है
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  // 3. सब सही है तो पेज दिखाएं
  return children;
};

export default ProtectedRoute;