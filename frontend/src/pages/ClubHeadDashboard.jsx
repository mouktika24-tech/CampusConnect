import React, { useState, useEffect } from 'react';
import { 
  LogOut, Plus, Trash2, Image as ImageIcon, Users, Calendar, MapPin, 
  Clock, Edit3, Send, CheckCircle, AlertCircle, X, BarChart2, Star, 
  MessageSquare, FileText, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const ClubHeadDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState('events'); // 'events' | 'reports'

  // Form Data for Create
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    datetime: '', 
    venue: '', 
    category: 'Technical', 
    capacity: 100, 
    registrationDeadline: '', 
    link: '', 
    type: 'Technical', 
    poster: null 
  });

  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);

  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [selectedEventForAnnouncement, setSelectedEventForAnnouncement] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');

  // Status message
  const [statusMsg, setStatusMsg] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const u = JSON.parse(storedUser);
    if (u.role !== 'Club Head' && u.role !== 'Admin') {
      return navigate('/login');
    }
    setUser(u);
    fetchData(u._id);
  }, [navigate]);

  const showToast = (text, type = 'info') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const fetchData = async (clubId) => {
    try {
      const [eventsRes, regsRes, attRes, feedRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events?all=true'),
        axios.get('http://localhost:5000/api/registrations'),
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/feedback')
      ]);

      // Filter events belonging to this organizer
      const myEvents = eventsRes.data.filter(e => (e.club_id?._id || e.club_id) === clubId);
      setEvents(myEvents);
      setRegistrations(regsRes.data);
      setAttendanceRecords(attRes.data);
      setFeedbacks(feedRes.data);
    } catch (err) {
      console.error('Error fetching organizer data:', err);
    }
  };

  // Create Event (FR2)
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('datetime', formData.datetime);
    data.append('venue', formData.venue || 'Campus Auditorium');
    data.append('category', formData.category);
    data.append('type', formData.category === 'Non-Technical' ? 'Non-Technical' : 'Technical');
    data.append('capacity', formData.capacity || 100);
    if (formData.registrationDeadline) {
      data.append('registrationDeadline', formData.registrationDeadline);
    } else {
      data.append('registrationDeadline', formData.datetime);
    }
    data.append('link', formData.link);
    data.append('club_id', user._id);
    if (formData.poster) data.append('poster', formData.poster);

    try {
      await axios.post('http://localhost:5000/api/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Event created successfully! Submitted for Faculty approval.', 'success');
      setFormData({ 
        name: '', description: '', datetime: '', venue: '', category: 'Technical', 
        capacity: 100, registrationDeadline: '', link: '', type: 'Technical', poster: null 
      });
      const fileInput = document.getElementById('poster-upload');
      if (fileInput) fileInput.value = '';
      fetchData(user._id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating event', 'error');
    }
  };

  // Edit / Update Event (FR2)
  const openEditModal = (event) => {
    setEditingEvent({
      ...event,
      datetime: event.datetime ? new Date(event.datetime).toISOString().slice(0, 16) : '',
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : ''
    });
    setEditModalOpen(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      await axios.put(`http://localhost:5000/api/events/${editingEvent._id}`, {
        name: editingEvent.name,
        description: editingEvent.description,
        datetime: editingEvent.datetime,
        venue: editingEvent.venue,
        category: editingEvent.category,
        capacity: Number(editingEvent.capacity),
        registrationDeadline: editingEvent.registrationDeadline,
        link: editingEvent.link
      });

      showToast(`Event "${editingEvent.name}" updated successfully. Registered students notified!`, 'success');
      setEditModalOpen(false);
      fetchData(user._id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating event', 'error');
    }
  };

  // Cancel Event
  const handleCancelEvent = async (eventId, currentStatus) => {
    if (currentStatus === 'Cancelled') {
      showToast('Event is already cancelled.', 'info');
      return;
    }
    if (!window.confirm("Cancel this event? Participants will receive an immediate cancellation alert.")) return;

    try {
      await axios.put(`http://localhost:5000/api/events/${eventId}/status`, { status: 'Cancelled' });
      showToast('Event marked as Cancelled. Registered students notified.', 'info');
      fetchData(user._id);
    } catch (err) {
      showToast('Error cancelling event', 'error');
    }
  };

  // Delete Event
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event completely? This will remove all registrations and attendance records.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      showToast('Event permanently deleted.', 'info');
      fetchData(user._id);
    } catch (err) {
      showToast('Error deleting event', 'error');
    }
  };

  // Open Participants List (FR7)
  const openParticipantsModal = (event) => {
    setSelectedEventForParticipants(event);
    setParticipantsModalOpen(true);
  };

  // Open Announcement Modal (FR9)
  const openAnnouncementModal = (event) => {
    setSelectedEventForAnnouncement(event);
    setAnnouncementTitle(`Update: ${event.name}`);
    setAnnouncementMessage('');
    setAnnouncementModalOpen(true);
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedEventForAnnouncement || !announcementMessage.trim()) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/events/${selectedEventForAnnouncement._id}/announcement`, {
        title: announcementTitle,
        message: announcementMessage
      });
      showToast(res.data.message || 'Announcement broadcasted to participants!', 'success');
      setAnnouncementModalOpen(false);
    } catch (err) {
      showToast('Failed to send announcement.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getEventRegistrations = (eventId) => {
    return registrations.filter(r => (r.event_id?._id || r.event_id) === eventId && r.status === 'Registered');
  };

  const getEventAttendanceCount = (eventId) => {
    return attendanceRecords.filter(a => (a.event_id?._id || a.event_id) === eventId && a.status === 'Present').length;
  };

  const getEventFeedbackStats = (eventId) => {
    const evFeeds = feedbacks.filter(f => (f.event_id?._id || f.event_id) === eventId);
    if (evFeeds.length === 0) return { avg: 'N/A', count: 0, reviews: [] };
    const avg = (evFeeds.reduce((acc, cur) => acc + cur.rating, 0) / evFeeds.length).toFixed(1);
    return { avg, count: evFeeds.length, reviews: evFeeds };
  };

  // Filtering
  const filteredEvents = events
    .filter(e => activeTab === 'All' ? true : (e.category || e.type || '') === activeTab)
    .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 pb-16">
        {/* Toast */}
        {statusMsg && (
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xl animate-fade-in ${
            statusMsg.type === 'error' 
              ? 'bg-red-500/20 border-red-500/50 text-red-300' 
              : statusMsg.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
          }`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              {statusMsg.text}
            </div>
            <button onClick={() => setStatusMsg(null)} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Header Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl shadow-lg border border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-200 to-accent">
              Club Head Organizer Portal
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Organize, publish, monitor participants, and analyze feedback for your club events
            </p>
          </div>
          
          {/* Navigation view toggle: Events vs Reports (FR11) */}
          <div className="flex items-center gap-2 bg-gray-900/80 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('events')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'events' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Events & Roster
            </button>
            <button
              onClick={() => setViewMode('reports')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'reports' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Analytics & Reports
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
          <input 
            type="text" 
            placeholder="Search your organized events..." 
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
                  activeTab === cat ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode 1: Events & Creation */}
        {viewMode === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Event Form (FR2: venue, category, capacity, deadline) */}
            <div className="lg:col-span-1 glass p-6 rounded-2xl border border-border/80 shadow-xl h-fit">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <Plus className="text-primary w-5 h-5"/> Create New Event
              </h2>
              
              <form onSubmit={handleCreateEvent} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Event Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CodeStorm Hackathon 2026" 
                    required 
                    className="input-field text-sm" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                    <select 
                      className="input-field appearance-none bg-gray-800 text-xs font-medium" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value, type: e.target.value === 'Non-Technical' ? 'Non-Technical' : 'Technical'})}
                    >
                      <option value="Technical">Technical</option>
                      <option value="Non-Technical">Non-Technical</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Sports">Sports</option>
                      <option value="Academic">Academic</option>
                      <option value="Extracurricular">Extracurricular</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Capacity (Seats)</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="input-field text-xs" 
                      value={formData.capacity} 
                      onChange={e => setFormData({...formData, capacity: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Venue</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hall A, Tech Campus" 
                    required 
                    className="input-field text-sm" 
                    value={formData.venue} 
                    onChange={e => setFormData({...formData, venue: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                  <textarea 
                    placeholder="Describe event schedule, requirements, prizes, etc." 
                    required 
                    rows="3" 
                    className="input-field text-xs" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Event Date & Time</label>
                    <input 
                      type="datetime-local" 
                      required 
                      className="input-field text-xs" 
                      value={formData.datetime} 
                      onChange={e => setFormData({...formData, datetime: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Registration Deadline</label>
                    <input 
                      type="datetime-local" 
                      className="input-field text-xs" 
                      value={formData.registrationDeadline} 
                      onChange={e => setFormData({...formData, registrationDeadline: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">External Link (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    className="input-field text-xs" 
                    value={formData.link} 
                    onChange={e => setFormData({...formData, link: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-accent"/> Poster Image
                  </label>
                  <input 
                    id="poster-upload" 
                    type="file" 
                    accept="image/*" 
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-indigo-500 transition-colors" 
                    onChange={e => setFormData({...formData, poster: e.target.files[0]})} 
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-2.5 text-sm font-semibold shadow-lg mt-2">
                  Submit Event
                </button>
                <p className="text-[11px] text-gray-400 text-center">
                  * Events submitted by organizers require Faculty approval before registrations open.
                </p>
              </form>
            </div>

            {/* Organized Events Roster */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="text-primary w-5 h-5"/> Your Managed Events
                </h2>
                <span className="text-xs text-gray-400">Total: {events.length}</span>
              </div>

              <div className="space-y-4">
                {filteredEvents.map(event => {
                  const regCount = getEventRegistrations(event._id).length;
                  const capacity = event.capacity || 100;
                  const attCount = getEventAttendanceCount(event._id);
                  const isApproved = event.status === 'Approved';
                  const isPending = event.status === 'Pending';
                  const isCancelled = event.status === 'Cancelled';

                  return (
                    <div 
                      key={event._id} 
                      className="glass rounded-xl border border-border/80 hover:border-gray-600 transition-all p-4 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        {/* Event Details */}
                        <div className="flex gap-4 items-start flex-grow">
                          {event.posterUrl ? (
                            <img src={event.posterUrl} alt="Poster" className="w-20 h-20 rounded-xl object-cover border border-border shrink-0" />
                          ) : (
                            <div className="w-20 h-20 bg-gray-900 rounded-xl flex items-center justify-center border border-border text-gray-600 shrink-0">
                              <ImageIcon className="w-6 h-6"/>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg text-white leading-tight">{event.name}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                (event.category || event.type) === 'Non-Technical' 
                                  ? 'bg-secondary/20 text-secondary' 
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {event.category || event.type || 'Technical'}
                              </span>

                              {/* Status Badge */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                isApproved 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                  : isPending 
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                                  : isCancelled
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : 'bg-gray-700 text-gray-300 border-gray-600'
                              }`}>
                                {event.status || 'Approved'}
                              </span>
                            </div>

                            <p className="text-xs text-gray-400 line-clamp-1">{event.description}</p>

                            <div className="flex items-center gap-4 text-xs text-gray-300 pt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-accent"/> 
                                {new Date(event.datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-primary"/> 
                                {event.venue || 'Campus Auditorium'}
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-indigo-300">
                                <Users className="w-3.5 h-3.5"/> 
                                {regCount} / {capacity} Registered
                              </span>
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5"/> 
                                {attCount} Attended
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Event Actions Toolbar */}
                        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto justify-end">
                          {/* View Participants (FR7) */}
                          <button
                            onClick={() => openParticipantsModal(event)}
                            className="btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-semibold flex-1 sm:flex-initial"
                            title="View Participant Roster"
                          >
                            <Users className="w-3.5 h-3.5 text-secondary" />
                            <span>Participants ({regCount})</span>
                          </button>

                          {/* Send Announcement (FR9) */}
                          <button
                            onClick={() => openAnnouncementModal(event)}
                            className="btn-secondary py-1.5 px-3 text-xs flex items-center justify-center gap-1 font-semibold flex-1 sm:flex-initial text-indigo-300 hover:text-white"
                            title="Send Announcement"
                          >
                            <Send className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Broadcast</span>
                          </button>

                          {/* Edit Event */}
                          <button
                            onClick={() => openEditModal(event)}
                            className="p-2 text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-lg border border-border/60 transition-colors flex items-center justify-center"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Cancel / Delete */}
                          <button 
                            onClick={() => handleCancelEvent(event._id, event.status)}
                            className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/30 flex items-center justify-center"
                            title="Cancel Event"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleDelete(event._id)} 
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30 flex items-center justify-center" 
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <div className="text-gray-500 text-center py-12 glass rounded-2xl border border-border">
                    No events found. Create your first event using the form on the left!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Analytics & Reports (FR11) */}
        {viewMode === 'reports' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass p-5 rounded-2xl border border-border">
                <p className="text-xs text-gray-400 uppercase font-semibold">Total Club Events</p>
                <p className="text-3xl font-bold text-white mt-1">{events.length}</p>
              </div>
              <div className="glass p-5 rounded-2xl border border-border">
                <p className="text-xs text-gray-400 uppercase font-semibold">Total Registrations</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {events.reduce((sum, e) => sum + getEventRegistrations(e._id).length, 0)}
                </p>
              </div>
              <div className="glass p-5 rounded-2xl border border-border">
                <p className="text-xs text-gray-400 uppercase font-semibold">Total Attendees Present</p>
                <p className="text-3xl font-bold text-secondary mt-1">
                  {events.reduce((sum, e) => sum + getEventAttendanceCount(e._id), 0)}
                </p>
              </div>
              <div className="glass p-5 rounded-2xl border border-border">
                <p className="text-xs text-gray-400 uppercase font-semibold">Feedback Reviews</p>
                <p className="text-3xl font-bold text-accent mt-1">
                  {events.reduce((sum, e) => sum + getEventFeedbackStats(e._id).count, 0)}
                </p>
              </div>
            </div>

            {/* Reports Breakdown Table */}
            <div className="glass rounded-2xl overflow-hidden border border-border">
              <div className="p-5 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="text-primary w-5 h-5"/> Event Performance & Attendance Report
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-800/80 text-gray-400 border-b border-border">
                      <th className="p-3.5 pl-6 font-semibold">Event Name</th>
                      <th className="p-3.5 font-semibold">Category</th>
                      <th className="p-3.5 font-semibold">Capacity</th>
                      <th className="p-3.5 font-semibold">Registered</th>
                      <th className="p-3.5 font-semibold">Turnout (Attended)</th>
                      <th className="p-3.5 font-semibold">Attendance %</th>
                      <th className="p-3.5 font-semibold">Avg Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => {
                      const regCount = getEventRegistrations(ev._id).length;
                      const attCount = getEventAttendanceCount(ev._id);
                      const rate = regCount > 0 ? Math.round((attCount / regCount) * 100) : 0;
                      const feed = getEventFeedbackStats(ev._id);

                      return (
                        <tr key={ev._id} className="border-b border-border/40 hover:bg-gray-800/30 transition-colors">
                          <td className="p-3.5 pl-6 font-bold text-white">{ev.name}</td>
                          <td className="p-3.5 text-gray-300">{ev.category || ev.type}</td>
                          <td className="p-3.5 text-gray-300">{ev.capacity || 100}</td>
                          <td className="p-3.5 font-semibold text-primary">{regCount}</td>
                          <td className="p-3.5 font-semibold text-secondary">{attCount}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                              {rate}%
                            </span>
                          </td>
                          <td className="p-3.5">
                            {feed.count > 0 ? (
                              <span className="flex items-center gap-1 font-bold text-amber-400">
                                <Star className="w-3 h-3 fill-current" /> {feed.avg} / 5 ({feed.count})
                              </span>
                            ) : (
                              <span className="text-gray-500">No reviews</span>
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

      {/* MODAL 1: Edit Event Modal (FR2) */}
      {editModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass p-6 sm:p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-border relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Edit3 className="text-primary w-5 h-5"/> Edit Event Details
            </h3>

            <form onSubmit={handleUpdateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Event Name</label>
                <input 
                  type="text" required className="input-field text-sm" 
                  value={editingEvent.name} onChange={e => setEditingEvent({...editingEvent, name: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Venue</label>
                <input 
                  type="text" required className="input-field text-sm" 
                  value={editingEvent.venue || ''} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                  <select 
                    className="input-field bg-gray-800 text-xs font-medium" 
                    value={editingEvent.category || 'Technical'} 
                    onChange={e => setEditingEvent({...editingEvent, category: e.target.value})}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Non-Technical">Non-Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Capacity</label>
                  <input 
                    type="number" min="1" required className="input-field text-xs" 
                    value={editingEvent.capacity || 100} onChange={e => setEditingEvent({...editingEvent, capacity: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                <textarea 
                  rows="3" required className="input-field text-xs" 
                  value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Event Date & Time</label>
                  <input 
                    type="datetime-local" required className="input-field text-xs" 
                    value={editingEvent.datetime} onChange={e => setEditingEvent({...editingEvent, datetime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Registration Deadline</label>
                  <input 
                    type="datetime-local" className="input-field text-xs" 
                    value={editingEvent.registrationDeadline || ''} onChange={e => setEditingEvent({...editingEvent, registrationDeadline: e.target.value})} 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary flex-1 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2 text-xs font-semibold shadow-lg">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Participants Roster Modal (FR7) */}
      {participantsModalOpen && selectedEventForParticipants && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass p-6 rounded-2xl w-full max-w-2xl shadow-2xl border border-border relative max-h-[85vh] flex flex-col">
            <button onClick={() => setParticipantsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            <div className="pb-4 border-b border-border">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-secondary w-5 h-5"/> Registered Participants
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Event: <strong className="text-white">{selectedEventForParticipants.name}</strong> • Total Registered: {getEventRegistrations(selectedEventForParticipants._id).length}
              </p>
            </div>

            <div className="overflow-y-auto flex-grow py-3 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-800/80 text-gray-400 border-b border-border">
                    <th className="p-2.5 font-medium">Student Name</th>
                    <th className="p-2.5 font-medium">Email / ID</th>
                    <th className="p-2.5 font-medium">Department</th>
                    <th className="p-2.5 font-medium">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {getEventRegistrations(selectedEventForParticipants._id).map((reg) => {
                    const student = reg.student_id;
                    const att = attendanceRecords.find(a => 
                      (a.student_id?._id || a.student_id) === (student?._id || student) &&
                      (a.event_id?._id || a.event_id) === selectedEventForParticipants._id
                    );
                    const isPresent = att && att.status === 'Present';

                    return (
                      <tr key={reg._id} className="border-b border-border/40 hover:bg-gray-800/40">
                        <td className="p-2.5 font-semibold text-white">{student?.name || 'Student'}</td>
                        <td className="p-2.5 text-gray-300">
                          <div>{student?.email}</div>
                          <div className="text-[10px] text-gray-500">{student?.studentId || 'N/A'}</div>
                        </td>
                        <td className="p-2.5 text-gray-300">{student?.department || 'General'}</td>
                        <td className="p-2.5">
                          {isPresent ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Present
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                              Not Marked
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {getEventRegistrations(selectedEventForParticipants._id).length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        No students have registered for this event yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button onClick={() => setParticipantsModalOpen(false)} className="btn-secondary py-1.5 px-4 text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Send Announcement Broadcast (FR9) */}
      {announcementModalOpen && selectedEventForAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl border border-border relative">
            <button onClick={() => setAnnouncementModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Send className="text-indigo-400 w-5 h-5"/> Send Event Broadcast
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Send an in-app update notification to all {getEventRegistrations(selectedEventForAnnouncement._id).length} registered participants.
            </p>

            <form onSubmit={handleSendAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Subject / Title</label>
                <input 
                  type="text" required className="input-field text-sm" 
                  value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Message</label>
                <textarea 
                  rows="4" required placeholder="e.g. Please bring your laptop with Node.js installed. Reporting time is 9:30 AM at Audi 2."
                  className="input-field text-xs" 
                  value={announcementMessage} onChange={e => setAnnouncementMessage(e.target.value)} 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAnnouncementModalOpen(false)} className="btn-secondary flex-1 py-2 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2 text-xs font-semibold shadow-lg">
                  Send to Participants
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubHeadDashboard;
