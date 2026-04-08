import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, LogOut, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchData = async (uId) => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events'),
        axios.get('http://localhost:5000/api/registrations')
      ]);
      setEvents(eventsRes.data);
      setRegistrations(regsRes.data.filter(r => r.student_id?._id === uId || r.student_id === uId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const u = JSON.parse(storedUser);
    setUser(u);
    fetchData(u._id);
  }, [navigate]);

  const handleRegister = async (eventObj) => {
    try {
      await axios.post('http://localhost:5000/api/register', {
        student_id: user._id,
        event_id: eventObj._id
      });
      
      fetchData(user._id);

      if (eventObj.link) {
        window.open(eventObj.link, '_blank');
      } else {
        alert('Successfully registered!');
      }
    } catch (err) {
      alert('You are already registered or an error occurred.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredEvents = (activeTab === 'All' ? events : events.filter(e => (e.type || 'Technical') === activeTab))
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-lg border border-border">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Student Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, {user?.name}</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 shrink-0">
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <input 
          type="text" 
          placeholder="Search all events..." 
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

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4 shrink-0">
          <div className="glass p-6 rounded-2xl sticky top-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="text-secondary"/> My Registrations</h2>
            <div className="space-y-4">
              {registrations.map(reg => (
                <div key={reg._id} className="bg-gray-800/50 p-4 rounded-xl border border-border hover:bg-gray-800 transition-colors">
                   <h3 className="font-bold text-white leading-tight mb-2">{reg.event_id?.name || 'Unknown Event'}</h3>
                   <div className="text-xs text-gray-400 flex items-center gap-1.5"><Clock className="w-3 h-3 text-secondary"/> {reg.event_id?.datetime ? new Date(reg.event_id.datetime).toLocaleString() : 'N/A'}</div>
                   <div className="text-[10px] mt-2 font-bold px-2 py-0.5 rounded-full inline-block bg-gray-700 text-gray-300">{(reg.event_id?.type) || 'Technical'}</div>
                   {reg.event_id?.link && (
                     <a href={reg.event_id.link} target="_blank" rel="noopener noreferrer" className="ml-2 mt-3 text-sm text-primary font-medium hover:text-indigo-400 transition-colors inline-block">
                       Form &rarr;
                     </a>
                   )}
                </div>
              ))}
              {registrations.length === 0 && <p className="text-sm text-gray-500 text-center py-6">You have not registered for any events yet.</p>}
            </div>
          </div>
        </div>

        <div className="lg:w-3/4 flex-grow">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-primary"/> Upcoming Events</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              const isRegistered = registrations.some(r => r.event_id?._id === event._id);
              return (
                <div key={event._id} className="glass rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col relative w-full">
                  <div className={`h-2 ${event.type === 'Non-Technical' ? 'bg-gradient-to-r from-secondary to-green-300' : 'bg-gradient-to-r from-secondary to-primary'}`}></div>
                  {event.posterUrl && <img src={event.posterUrl} alt={event.name} className="w-full h-40 object-cover border-b border-border" />}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white leading-tight pr-2">{event.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-300 mb-6 flex-grow">
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {new Date(event.datetime).toLocaleString()}</div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Organized by {event.club_id?.name || 'Club'}</div>
                    </div>
                    
                    <button 
                      onClick={() => handleRegister(event)}
                      className={`w-full py-2.5 rounded-xl font-semibold outline-none transition-all ${isRegistered ? 'bg-secondary/20 text-secondary border border-secondary/50 cursor-default opacity-80' : 'btn-primary'}`}
                      disabled={isRegistered}
                    >
                      {isRegistered ? 'Registered' : (event.link ? 'Register via Link' : 'Register Now')}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredEvents.length === 0 && <div className="col-span-full py-12 text-center text-gray-500 glass rounded-2xl">No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} events found matching your search.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
