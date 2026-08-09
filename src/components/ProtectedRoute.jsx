import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 1. अगर यूज़र logged in नहीं है, तो लॉगिन पेज पर भेजें
  if (!token || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // 2. अगर यूज़र का रोल Allowed Role से मैच नहीं करता (जैसे Student अगर Admin Page खोलना चाहे)
  if (allowedRole && user.role !== allowedRole) {
    // Admin को उसके डैशबोर्ड पर और Student को उसके डैशबोर्ड पर रीडायरेक्ट करें
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  // 3. अगर सब सही है, तो कंपोनेंट/पेज रेंडर करें
  return children;
};

export default ProtectedRoute;