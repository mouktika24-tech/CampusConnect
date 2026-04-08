import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClubHeadDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [formData, setFormData] = useState({ name: '', description: '', datetime: '', link: '', type: 'Technical', poster: null });
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || JSON.parse(storedUser).role !== 'Club Head') return navigate('/login');
    const u = JSON.parse(storedUser);
    setUser(u);
    
    fetchData(u._id);
  }, [navigate]);

  const fetchData = async (clubId) => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events'),
        axios.get('http://localhost:5000/api/registrations')
      ]);
      setEvents(eventsRes.data.filter(e => e.club_id?._id === clubId || e.club_id === clubId));
      setRegistrations(regsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('datetime', formData.datetime);
    data.append('link', formData.link);
    data.append('type', formData.type);
    data.append('club_id', user._id);
    if (formData.poster) data.append('poster', formData.poster);

    try {
      await axios.post('http://localhost:5000/api/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ name: '', description: '', datetime: '', link: '', type: 'Technical', poster: null });
      document.getElementById('poster-upload').value = '';
      fetchData(user._id);
    } catch (err) {
      alert('Error creating event');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this event?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      fetchData(user._id);
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

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-lg border border-border">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Club Head Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your club's events</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 shrink-0">
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <input 
          type="text" 
          placeholder="Search your events..." 
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-primary"/> Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <input type="text" placeholder="Event Name" required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            
            <select className="input-field appearance-none bg-gray-800" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
            </select>

            <textarea placeholder="Description" required className="input-field h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <input type="datetime-local" required className="input-field" value={formData.datetime} onChange={e => setFormData({...formData, datetime: e.target.value})} />
            <input type="url" placeholder="Registration Link (Optional)" className="input-field" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4"/> Event Poster Image
              </label>
              <input id="poster-upload" type="file" accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-500 transition-colors" onChange={e => setFormData({...formData, poster: e.target.files[0]})} />
            </div>

            <button type="submit" className="btn-primary w-full mt-4">Create Event</button>
          </form>
        </div>

        <div className="lg:col-span-2 glass p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Your Events</h2>
          <div className="space-y-4">
            {(activeTab === 'All' ? events : events.filter(e => (e.type || 'Technical') === activeTab))
              .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).map(event => (
              <div key={event._id} className="bg-gray-800/50 rounded-xl border border-border flex justify-between items-center hover:bg-gray-800 transition-colors overflow-hidden">
                <div className="flex items-stretch">
                  {event.posterUrl ? (
                    <img src={event.posterUrl} alt="Poster" className="w-24 h-full object-cover border-r border-border" />
                  ) : (
                    <div className="w-24 h-auto bg-gray-900 flex items-center justify-center border-r border-border text-gray-600"><ImageIcon /></div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-white">{event.name}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${event.type === 'Non-Technical' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>{event.type || 'Technical'}</span>
                    </div>
                    <p className="text-sm text-gray-400">{new Date(event.datetime).toLocaleString()}</p>
                    <p className="text-sm text-primary font-medium mt-1">{getEventRegistrations(event._id)} registrations</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(event._id)} className="p-4 mr-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete Event">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {events.length === 0 && <p className="text-gray-500 text-center py-8">You haven't created any events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubHeadDashboard;
