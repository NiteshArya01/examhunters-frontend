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
import NetworkBanner from './components/NetworkBanner'; // 👈 इम्पोर्ट करें

function App() {
  return (
    <Router>
      {/* 📡 ग्लोबल नेटवर्क बैनर जो हर पेज पर काम करेगा */}
      <NetworkBanner />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminUploadTest />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
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
        
        {/* 🛡️ Catch-All Route: अगर कोई गलत URL डालेगा, तो होम पेज पर जाएगा (Page Not Found Error नहीं आएगा) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;