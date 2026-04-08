import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password, role });
      localStorage.setItem('user', JSON.stringify(res.data));
      
      switch(res.data.role) {
        case 'Admin': navigate('/admin'); break;
        case 'Club Head': navigate('/clubhead'); break;
        default: navigate('/student'); break;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-full min-h-[80vh]">
      <div className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CampusConnect</h2>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <select 
                className="input-field pl-10 appearance-none bg-gray-800"
                value={role} onChange={(e) => setRole(e.target.value)}
              >
                <option value="Student">Student</option>
                <option value="Club Head">Club Head</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="user@college.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required 
            />
            <p className="text-xs text-gray-500 mt-2">
              {role === 'Student' 
                ? 'Any username works for new students (default pass: "password").'
                : `Login using fixed ${role} credentials.`}
            </p>
          </div>

          <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2 mt-4">
            <LogIn className="w-5 h-5" /> Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
