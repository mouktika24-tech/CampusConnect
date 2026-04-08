import React, { useState, useEffect } from 'react';
import { LogOut, Trash2, Users, CalendarDays, BarChart, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || JSON.parse(storedUser).role !== 'Admin') return navigate('/login');
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events'),
        axios.get('http://localhost:5000/api/registrations')
      ]);
      setEvents(eventsRes.data);
      setRegistrations(regsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this event? This will also remove all its registrations.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting event');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getEventRegistrations = (eventId) => {
    return registrations.filter(r => r.event_id?._id === eventId || r.event_id === eventId).length;
  };

  const filteredEvents = (activeTab === 'All' ? events : events.filter(e => (e.type || 'Technical') === activeTab))
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-lg border border-border">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-1">Admin Control Room</h1>
          <p className="text-gray-400 text-sm">Platform oversight and management</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 shrink-0">
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <input 
          type="text" 
          placeholder="Search all existing events..." 
          className="input-field flex-grow w-full" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
        <div className="flex bg-gray-800 rounded-lg p-1 border border-border shrink-0 w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('All')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'All' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>All</button>
          <button onClick={() => setActiveTab('Technical')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'Technical' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Technical</button>
          <button onClick={() => setActiveTab('Non-Technical')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'Non-Technical' ? 'bg-secondary text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Non-Technical</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-primary/20 rounded-full"><CalendarDays className="w-8 h-8 text-primary" /></div>
          <div>
            <p className="text-gray-400 text-sm font-medium">Total Events</p>
            <p className="text-3xl font-bold">{events.length}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-accent/20 rounded-full"><Users className="w-8 h-8 text-accent" /></div>
          <div>
            <p className="text-gray-400 text-sm font-medium">Total Registrations</p>
            <p className="text-3xl font-bold">{registrations.length}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl flex items-center gap-4">
          <div className="p-4 bg-secondary/20 rounded-full"><BarChart className="w-8 h-8 text-secondary" /></div>
          <div>
            <p className="text-gray-400 text-sm font-medium">Active Clubs</p>
            <p className="text-3xl font-bold">{new Set(events.map(e => e.club_id?._id || e.club_id)).size}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="text-primary w-5 h-5"/> Events Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-sm">
                <th className="p-4 font-medium border-b border-border pl-6">Event Info</th>
                <th className="p-4 font-medium border-b border-border">Category</th>
                <th className="p-4 font-medium border-b border-border">Date & Time</th>
                <th className="p-4 font-medium border-b border-border">Registrations</th>
                <th className="p-4 font-medium border-b border-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event._id} className="border-b border-border/50 hover:bg-gray-800/30 transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-light flex items-center gap-2">
                       {event.name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3"/> Organiser: {event.club_id?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="p-4">
                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${(event.type || 'Technical') === 'Non-Technical' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                       {event.type || 'Technical'}
                     </span>
                  </td>
                  <td className="p-4 text-sm text-gray-300">
                    {new Date(event.datetime).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      {getEventRegistrations(event._id)} Students
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleDelete(event._id)} 
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} events found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
