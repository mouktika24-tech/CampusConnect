import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClubHeadDashboard from './pages/ClubHeadDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark text-light flex flex-col">
        {/* We can add a sticky nav bar later */}
        <div className="flex-grow w-full p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/clubhead" element={<ClubHeadDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
