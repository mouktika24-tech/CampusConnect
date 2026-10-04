import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClubHeadDashboard from './pages/ClubHeadDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark text-light flex flex-col font-sans selection:bg-primary selection:text-white">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/clubhead" element={<ClubHeadDashboard />} />
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/volunteer" element={<VolunteerDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
