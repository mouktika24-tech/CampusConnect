import React, { useState, useEffect } from 'react';
import { 
  LogOut, Trash2, Users, CalendarDays, BarChart, Tag, Shield, 
  CheckCircle, XCircle, FileText, Star, AlertCircle, X, Search, Filter, Printer 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSection, setCurrentSection] = useState('events'); // 'events' | 'users' | 'reports'
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const u = JSON.parse(storedUser);
    if (u.role !== 'Admin') return navigate('/login');
    setCurrentUser(u);
    
    fetchData();
  }, [navigate]);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [eventsRes, regsRes, attRes, feedRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events?all=true'),
        axios.get('http://localhost:5000/api/registrations'),
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/feedback'),
        axios.get('http://localhost:5000/api/users')
      ]);
      setEvents(eventsRes.data);
      setRegistrations(regsRes.data);
      setAttendanceRecords(attRes.data);
      setFeedbacks(feedRes.data);
      setUsersList(usersRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event? This will also remove all its registrations, attendance, and feedback.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      showToast('Event removed successfully', 'info');
      fetchData();
    } catch (err) {
      showToast('Error deleting event', 'error');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/events/${id}/status`, { 
        status, 
        approvedBy: currentUser?._id 
      });
      showToast(`Event status updated to ${status}`, 'success');
      fetchData();
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Delete user account "${userEmail}"? All associated student records will be removed.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`);
      showToast('User account successfully removed', 'info');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getEventRegistrations = (eventId) => {
    return registrations.filter(r => (r.event_id?._id || r.event_id) === eventId && r.status === 'Registered').length;
  };

  const getEventAttendance = (eventId) => {
    return attendanceRecords.filter(a => (a.event_id?._id || a.event_id) === eventId && a.status === 'Present').length;
  };

  const filteredEvents = (activeTab === 'All' ? events : events.filter(e => (e.category || e.type || 'Technical') === activeTab))
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase())));

  const filteredUsers = usersList.filter(u => {
    const matchesRole = userRoleFilter === 'All' ? true : u.role === userRoleFilter;
    const query = userSearchQuery.toLowerCase();
    const matchesSearch = u.name?.toLowerCase().includes(query) || 
                          u.email?.toLowerCase().includes(query) ||
                          u.department?.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar user={currentUser} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 pb-16">
        {/* Toast */}
        {toast && (
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xl animate-fade-in ${
            toast.type === 'error' 
              ? 'bg-red-500/20 border-red-500/50 text-red-300' 
              : toast.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
          }`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              {toast.text}
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl shadow-lg border border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-primary to-accent mb-1">
              Admin Control Room
            </h1>
            <p className="text-gray-400 text-sm">Centralized platform oversight, user management, and compliance reports</p>
          </div>

          {/* Section Navigation Tabs (FR11, FR12) */}
          <div className="flex items-center gap-1.5 bg-gray-900/80 p-1.5 rounded-2xl border border-border">
            <button
              onClick={() => setCurrentSection('events')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                currentSection === 'events' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Events Moderation
            </button>
            <button
              onClick={() => setCurrentSection('users')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                currentSection === 'users' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Users Management
            </button>
            <button
              onClick={() => setCurrentSection('reports')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                currentSection === 'reports' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> System Reports
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-border/80">
            <div className="p-3.5 bg-primary/20 rounded-xl"><CalendarDays className="w-7 h-7 text-primary" /></div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Total Events</p>
              <p className="text-2xl font-bold text-white mt-0.5">{events.length}</p>
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-border/80">
            <div className="p-3.5 bg-accent/20 rounded-xl"><Users className="w-7 h-7 text-accent" /></div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Total Registrations</p>
              <p className="text-2xl font-bold text-white mt-0.5">{registrations.filter(r => r.status === 'Registered').length}</p>
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-border/80">
            <div className="p-3.5 bg-secondary/20 rounded-xl"><CheckCircle className="w-7 h-7 text-secondary" /></div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Turnout (Attended)</p>
              <p className="text-2xl font-bold text-white mt-0.5">{attendanceRecords.filter(a => a.status === 'Present').length}</p>
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-border/80">
            <div className="p-3.5 bg-indigo-500/20 rounded-xl"><Shield className="w-7 h-7 text-indigo-400" /></div>
            <div>
              <p className="text-gray-400 text-xs font-medium">Registered Users</p>
              <p className="text-2xl font-bold text-white mt-0.5">{usersList.length}</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Events Moderation */}
        {currentSection === 'events' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Tabs */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
              <input 
                type="text" 
                placeholder="Search all existing events..." 
                className="input-field flex-grow w-full text-sm" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              <div className="flex bg-gray-900/90 rounded-xl p-1 border border-border shrink-0 w-full md:w-auto overflow-x-auto">
                {['All', 'Technical', 'Non-Technical', 'Cultural', 'Sports', 'Academic'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)} 
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      activeTab === cat ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Directory Table */}
            <div className="glass rounded-2xl overflow-hidden border border-border">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                  <Tag className="text-primary w-5 h-5"/> Campus Events Directory
                </h2>
                <span className="text-xs text-gray-400">Total: {filteredEvents.length} events</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-800/80 text-gray-400">
                      <th className="p-3 pl-6 font-semibold border-b border-border">Event Info</th>
                      <th className="p-3 font-semibold border-b border-border">Category</th>
                      <th className="p-3 font-semibold border-b border-border">Date & Venue</th>
                      <th className="p-3 font-semibold border-b border-border">Capacity & Regs</th>
                      <th className="p-3 font-semibold border-b border-border">Status</th>
                      <th className="p-3 font-semibold border-b border-border text-right pr-6">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => {
                      const regCount = getEventRegistrations(event._id);
                      const isApproved = event.status === 'Approved';
                      const isPending = event.status === 'Pending';
                      const isCancelled = event.status === 'Cancelled';

                      return (
                        <tr key={event._id} className="border-b border-border/40 hover:bg-gray-800/30 transition-colors">
                          <td className="p-3 pl-6">
                            <p className="font-bold text-white text-sm">{event.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Organizer: {event.club_id?.name || 'Club'}
                            </p>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              (event.category || event.type) === 'Non-Technical' 
                                ? 'bg-secondary/20 text-secondary' 
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {event.category || event.type || 'Technical'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-300">
                            <div>{new Date(event.datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                            <div className="text-[11px] text-gray-400">{event.venue || 'Campus Auditorium'}</div>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                              {regCount} / {event.capacity || 100} Registered
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isApproved 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : isPending
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {event.status || 'Approved'}
                            </span>
                          </td>
                          <td className="p-3 pr-6 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {isPending && (
                                <button
                                  onClick={() => handleUpdateStatus(event._id, 'Approved')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                                  title="Approve Event"
                                >
                                  Approve
                                </button>
                              )}
                              {!isCancelled && (
                                <button
                                  onClick={() => handleUpdateStatus(event._id, 'Cancelled')}
                                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px]"
                                  title="Cancel Event"
                                >
                                  Cancel
                                </button>
                              )}
                              <button 
                                onClick={() => handleDelete(event._id)} 
                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Delete Event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredEvents.length === 0 && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500">
                          No events found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: User Management (FR12) */}
        {currentSection === 'users' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Filter */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, department..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="input-field pl-10 text-sm w-full"
                />
              </div>

              <div className="flex bg-gray-900/90 rounded-xl p-1 border border-border shrink-0 w-full md:w-auto overflow-x-auto">
                {['All', 'Student', 'Club Head', 'Faculty Coordinator', 'Volunteer', 'Admin'].map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      userRoleFilter === r ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="glass rounded-2xl overflow-hidden border border-border">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                  <Users className="text-secondary w-5 h-5"/> Platform Users Roster
                </h2>
                <span className="text-xs text-gray-400">Total: {filteredUsers.length} users</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-800/80 text-gray-400">
                      <th className="p-3 pl-6 font-semibold border-b border-border">User Details</th>
                      <th className="p-3 font-semibold border-b border-border">Role</th>
                      <th className="p-3 font-semibold border-b border-border">Department / ID</th>
                      <th className="p-3 font-semibold border-b border-border">Joined Date</th>
                      <th className="p-3 font-semibold border-b border-border text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u._id} className="border-b border-border/40 hover:bg-gray-800/30 transition-colors">
                        <td className="p-3 pl-6">
                          <p className="font-bold text-white text-sm">{u.name}</p>
                          <p className="text-[11px] text-gray-400">{u.email}</p>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            u.role === 'Admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            u.role === 'Faculty Coordinator' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            u.role === 'Club Head' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                            u.role === 'Volunteer' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-gray-300">
                          <div>{u.department || 'General'}</div>
                          {u.studentId && <div className="text-[10px] text-gray-500">{u.studentId}</div>}
                        </td>
                        <td className="p-3 text-gray-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3 pr-6 text-right">
                          {u.email !== 'admin@cc.edu' && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.email)}
                              className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: System Reports (FR11) */}
        {currentSection === 'reports' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-primary w-5 h-5"/> Institutional Event & Participation Report
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Comprehensive audit of registrations, turnouts, and attendee ratings</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Export Report
              </button>
            </div>

            {/* Detailed Table */}
            <div className="glass rounded-2xl overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-800/90 text-gray-300 border-b border-border">
                      <th className="p-3.5 pl-6 font-semibold">Event Name</th>
                      <th className="p-3.5 font-semibold">Organizer</th>
                      <th className="p-3.5 font-semibold">Capacity</th>
                      <th className="p-3.5 font-semibold">Registrations</th>
                      <th className="p-3.5 font-semibold">Fill Rate</th>
                      <th className="p-3.5 font-semibold">Attended (Present)</th>
                      <th className="p-3.5 font-semibold">Turnout Rate</th>
                      <th className="p-3.5 font-semibold">Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => {
                      const regCount = getEventRegistrations(ev._id);
                      const attCount = getEventAttendance(ev._id);
                      const cap = ev.capacity || 100;
                      const fillRate = Math.min(100, Math.round((regCount / cap) * 100));
                      const turnoutRate = regCount > 0 ? Math.round((attCount / regCount) * 100) : 0;
                      
                      const evFeeds = feedbacks.filter(f => (f.event_id?._id || f.event_id) === ev._id);
                      const avgRating = evFeeds.length > 0 
                        ? (evFeeds.reduce((sum, f) => sum + f.rating, 0) / evFeeds.length).toFixed(1) 
                        : 'N/A';

                      return (
                        <tr key={ev._id} className="border-b border-border/40 hover:bg-gray-800/30">
                          <td className="p-3.5 pl-6 font-bold text-white">{ev.name}</td>
                          <td className="p-3.5 text-gray-300">{ev.club_id?.name || 'Club'}</td>
                          <td className="p-3.5 text-gray-300">{cap}</td>
                          <td className="p-3.5 font-semibold text-primary">{regCount}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${fillRate}%` }}></div>
                              </div>
                              <span className="text-[11px] text-gray-300 font-semibold">{fillRate}%</span>
                            </div>
                          </td>
                          <td className="p-3.5 font-semibold text-secondary">{attCount}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              {turnoutRate}%
                            </span>
                          </td>
                          <td className="p-3.5">
                            {avgRating !== 'N/A' ? (
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Star className="w-3 h-3 fill-current" /> {avgRating} / 5 ({evFeeds.length})
                              </span>
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
