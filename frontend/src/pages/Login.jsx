import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Mail, Building, Award, UserPlus, CheckCircle, Shield } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState('Student');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState('2nd Year');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister) {
      // User Registration (FR1)
      try {
        const payload = {
          name,
          email,
          password,
          role,
          department,
          studentId: role === 'Student' ? (studentId || 'STU-' + Math.floor(1000 + Math.random() * 9000)) : undefined,
          year: role === 'Student' ? year : undefined
        };
        const res = await axios.post('http://localhost:5000/api/register-user', payload);
        localStorage.setItem('user', JSON.stringify(res.data));
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => routeUser(res.data), 800);
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
      }
    } else {
      // User Login (FR1)
      try {
        const res = await axios.post('http://localhost:5000/api/login', { email, password, role });
        localStorage.setItem('user', JSON.stringify(res.data));
        routeUser(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  const routeUser = (userObj) => {
    switch(userObj.role) {
      case 'Admin': navigate('/admin'); break;
      case 'Club Head': navigate('/clubhead'); break;
      case 'Faculty Coordinator': navigate('/faculty'); break;
      case 'Volunteer': navigate('/volunteer'); break;
      default: navigate('/student'); break;
    }
  };

  // Helper for 1-click test fill
  const fillCredentials = (r, em, pw) => {
    setIsRegister(false);
    setRole(r);
    setEmail(em);
    setPassword(pw);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] py-6 px-4">
      <div className="glass p-6 sm:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl mb-3 shadow-inner">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
            CampusConnect
          </h2>
          <p className="text-gray-400 mt-1 text-sm">College Event Management System</p>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="flex bg-gray-900/80 p-1 rounded-xl mb-6 border border-border">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              !isRegister ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isRegister ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Role</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                className="input-field pl-10 appearance-none bg-gray-800 text-sm font-medium"
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Student">Student / Participant</option>
                <option value="Club Head">Club Head (Event Organizer)</option>
                <option value="Faculty Coordinator">Faculty Coordinator</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>

          {/* If Registering, extra fields */}
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  className="input-field text-sm" 
                  placeholder="e.g. Maya Sharma"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Department</label>
                  <input 
                    type="text" 
                    className="input-field text-sm" 
                    placeholder="e.g. Computer Science"
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                  />
                </div>

                {role === 'Student' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Student ID (Roll No)</label>
                    <input 
                      type="text" 
                      className="input-field text-sm" 
                      placeholder="e.g. CS2026-042"
                      value={studentId} 
                      onChange={(e) => setStudentId(e.target.value)} 
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="email" 
                className="input-field pl-10 text-sm" 
                placeholder={role === 'Student' ? 'student@college.edu' : 'user@cc.edu'}
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="password" 
                className="input-field pl-10 text-sm" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full flex justify-center items-center gap-2 mt-5 py-2.5 font-semibold text-sm shadow-xl"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isRegister ? 'Create Account' : `Sign In as ${role}`}
          </button>
        </form>

        {/* Demo Fast-Login Helpers */}
        <div className="mt-6 pt-5 border-t border-border/80">
          <p className="text-xs text-gray-400 font-medium mb-2.5 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-accent" /> Quick Demo Role Switcher:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('Student', 'aditya@gmail.com', 'aditya')}
              className="px-2 py-1.5 text-xs bg-gray-800/80 hover:bg-gray-700/80 border border-border/80 rounded-lg text-gray-300 hover:text-white transition-all text-left"
            >
              👨‍🎓 Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('Club Head', 'club@cc.edu', 'club123')}
              className="px-2 py-1.5 text-xs bg-gray-800/80 hover:bg-gray-700/80 border border-border/80 rounded-lg text-gray-300 hover:text-white transition-all text-left"
            >
              ♣️ Club Head
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('Faculty Coordinator', 'faculty@cc.edu', 'faculty123')}
              className="px-2 py-1.5 text-xs bg-gray-800/80 hover:bg-gray-700/80 border border-border/80 rounded-lg text-gray-300 hover:text-white transition-all text-left"
            >
              👩‍🏫 Faculty
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('Volunteer', 'volunteer@cc.edu', 'volunteer123')}
              className="px-2 py-1.5 text-xs bg-gray-800/80 hover:bg-gray-700/80 border border-border/80 rounded-lg text-gray-300 hover:text-white transition-all text-left"
            >
              🤝 Volunteer
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('Admin', 'admin@cc.edu', 'admin123')}
              className="px-2 py-1.5 text-xs bg-gray-800/80 hover:bg-gray-700/80 border border-border/80 rounded-lg text-gray-300 hover:text-white transition-all text-left col-span-2 sm:col-span-1"
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
