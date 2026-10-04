import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Check, Trash2, Calendar, Shield, Award, Users, CheckCircle } from 'lucide-react';
import axios from 'axios';

const Navbar = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/${user._id}`);
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (e) {
      console.error('Error fetching notifications:', e.message);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [user?._id]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!user?._id) return;
    try {
      await axios.put(`http://localhost:5000/api/notifications/read-all/${user._id}`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Faculty Coordinator': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Club Head': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      case 'Volunteer': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <header className="glass sticky top-0 z-50 px-4 sm:px-8 py-3.5 border-b border-border/80 mb-6 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => {
            if (user?.role === 'Admin') navigate('/admin');
            else if (user?.role === 'Club Head') navigate('/clubhead');
            else if (user?.role === 'Faculty Coordinator') navigate('/faculty');
            else if (user?.role === 'Volunteer') navigate('/volunteer');
            else navigate('/student');
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              CampusConnect
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full border bg-gray-800/80 text-gray-300 border-border">
              College Event Hub
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Role Badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border hidden sm:inline-flex items-center gap-1.5 ${getRoleBadgeColor(user?.role)}`}>
            {user?.role === 'Admin' && <Shield className="w-3 h-3" />}
            {user?.role === 'Faculty Coordinator' && <Award className="w-3 h-3" />}
            {user?.role === 'Volunteer' && <Users className="w-3 h-3" />}
            {user?.role || 'Guest'}
          </span>

          {/* In-app Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-border text-gray-300 hover:text-white transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-dark text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Modal */}
            {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 glass rounded-2xl shadow-2xl border border-border p-4 z-50 animate-fade-in max-h-[480px] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-xs text-primary hover:text-indigo-400 font-medium transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto space-y-2 py-2 flex-grow pr-1 custom-scrollbar">
                  {notifications.map(n => (
                    <div 
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        n.read 
                          ? 'bg-gray-800/40 border-border/40 text-gray-400' 
                          : 'bg-primary/10 border-primary/40 text-gray-200 font-medium'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-accent inline-block"></span>}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="line-clamp-3 leading-relaxed text-gray-300">{n.message}</p>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="py-8 text-center text-gray-500 text-xs">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-white leading-tight">{user?.name}</span>
            <span className="text-[11px] text-gray-400">{user?.department || user?.email}</span>
          </div>

          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="btn-secondary py-1.5 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-1.5 shrink-0 hover:border-red-500/50 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
