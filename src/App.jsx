import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AdminUploadTest from './components/AdminUploadTest';
import StudentDashboard from './components/StudentDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CategoryTests from './components/CategoryTests';
import ExamWindow from './components/ExamWindow';
import LandingPage from './components/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminUploadTest />
            </ProtectedRoute>
          }
        />

        {/* Protected Student Route */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/category/:categoryId"
          element={
            <ProtectedRoute allowedRole="student">
              <CategoryTests />
            </ProtectedRoute>
          }
        />


        <Route
          path="/student/exam/:testId"
          element={
            <ProtectedRoute allowedRole="student">
              <ExamWindow />
            </ProtectedRoute>
          }
        />
        {/* Unknown Route Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;