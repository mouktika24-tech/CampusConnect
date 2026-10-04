import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, LogOut, CheckCircle, Users, AlertCircle, X, Star, MessageSquare, Tag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const StudentDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  
  // Feedback Modal State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Status message
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();

  const fetchData = async (uId) => {
    try {
      const [eventsRes, regsRes, attRes, feedRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events'),
        axios.get('http://localhost:5000/api/registrations'),
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/feedback')
      ]);

      setEvents(eventsRes.data);
      const studentRegs = regsRes.data.filter(r => (r.student_id?._id || r.student_id) === uId);
      setRegistrations(studentRegs);
      
      const studentAtt = attRes.data.filter(a => (a.student_id?._id || a.student_id) === uId);
      setAttendanceRecords(studentAtt);

      const studentFeeds = feedRes.data.filter(f => (f.student_id?._id || f.student_id) === uId);
      setSubmittedFeedbacks(studentFeeds);
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const u = JSON.parse(storedUser);
    if (u.role !== 'Student') {
      // allow student access, or redirect if not student
      if (u.role === 'Admin') return navigate('/admin');
      if (u.role === 'Club Head') return navigate('/clubhead');
      if (u.role === 'Faculty Coordinator') return navigate('/faculty');
      if (u.role === 'Volunteer') return navigate('/volunteer');
    }
    setUser(u);
    fetchData(u._id);
  }, [navigate]);

  const showNotification = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleRegister = async (eventObj) => {
    try {
      const res = await axios.post('http://localhost:5000/api/register', {
        student_id: user._id,
        event_id: eventObj._id
      });
      
      showNotification(`Registered successfully for ${eventObj.name}!`, 'success');
      fetchData(user._id);

      if (eventObj.link) {
        window.open(eventObj.link, '_blank');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      showNotification(errMsg, 'error');
    }
  };

  const handleCancelRegistration = async (registrationId, eventName) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${eventName}"? Your seat will be released.`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/register/${registrationId}`);
      showNotification(`Registration for "${eventName}" has been cancelled.`, 'info');
      fetchData(user._id);
    } catch (err) {
      showNotification('Failed to cancel registration.', 'error');
    }
  };

  const openFeedbackModal = (eventObj) => {
    setSelectedEventForFeedback(eventObj);
    setFeedbackRating(5);
    setFeedbackComments('');
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventForFeedback) return;
    setFeedbackSubmitting(true);

    try {
      await axios.post('http://localhost:5000/api/feedback', {
        event_id: selectedEventForFeedback._id,
        student_id: user._id,
        rating: feedbackRating,
        comments: feedbackComments
      });

      showNotification('Thank you! Your feedback has been submitted.', 'success');
      setFeedbackModalOpen(false);
      fetchData(user._id);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to submit feedback', 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Filtering Logic
  const filteredEvents = events.filter(e => {
    // Category / Type filter
    const matchesTab = activeTab === 'All' 
      ? true 
      : ((e.category || e.type || '').toLowerCase() === activeTab.toLowerCase());
    
    // Search query filter (matches name, description, venue, or club)
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.club_id?.name && e.club_id.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Date filter
    let matchesDate = true;
    if (dateFilter === 'Upcoming') {
      matchesDate = new Date(e.datetime) >= new Date();
    } else if (dateFilter === 'Today') {
      const todayStr = new Date().toDateString();
      matchesDate = new Date(e.datetime).toDateString() === todayStr;
    }

    return matchesTab && matchesSearch && matchesDate;
  });

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 pb-16">
        {/* Banner Alert Toast */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xl animate-fade-in ${
            message.type === 'error' 
              ? 'bg-red-500/20 border-red-500/50 text-red-300' 
              : message.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
          }`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dashboard Title Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl shadow-lg border border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-200 to-accent">
              Student Dashboard
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Welcome back, <span className="text-white font-medium">{user?.name}</span> ({user?.department || 'Student'} • ID: {user?.studentId || 'STU-Current'})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-gray-800 border border-border text-gray-300">
              Active Registrations: <strong className="text-secondary">{registrations.length}</strong>
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
          <input 
            type="text" 
            placeholder="Search events by title, venue, or organizers..." 
            className="input-field flex-grow w-full text-sm" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Category tabs */}
            <div className="flex bg-gray-900/90 rounded-xl p-1 border border-border shrink-0">
              {['All', 'Technical', 'Non-Technical', 'Cultural', 'Sports', 'Academic'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    activeTab === cat 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 border border-border text-xs rounded-xl px-3 py-2 text-gray-300 outline-none shrink-0"
            >
              <option value="All">All Dates</option>
              <option value="Upcoming">Upcoming Only</option>
              <option value="Today">Today Only</option>
            </select>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: My Registrations Panel */}
          <div className="lg:w-1/3 shrink-0">
            <div className="glass p-6 rounded-2xl sticky top-24 shadow-xl border border-border/80">
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between text-white">
                <span className="flex items-center gap-2">
                  <CheckCircle className="text-secondary w-5 h-5"/> My Registrations
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">
                  {registrations.length}
                </span>
              </h2>

              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {registrations.map(reg => {
                  const ev = reg.event_id;
                  if (!ev) return null;
                  
                  // Check if student attended this event
                  const attRecord = attendanceRecords.find(a => (a.event_id?._id || a.event_id) === ev._id);
                  const isPresent = attRecord && attRecord.status === 'Present';
                  
                  // Check if student already gave feedback
                  const feedbackGiven = submittedFeedbacks.some(f => (f.event_id?._id || f.event_id) === ev._id);

                  return (
                    <div key={reg._id} className="bg-gray-800/60 p-4 rounded-xl border border-border/80 hover:border-gray-600 transition-all shadow-md">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="font-bold text-white text-sm leading-tight">{ev.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          (ev.category || ev.type) === 'Non-Technical' 
                            ? 'bg-secondary/20 text-secondary border border-secondary/30' 
                            : 'bg-primary/20 text-primary border border-primary/30'
                        }`}>
                          {ev.category || ev.type || 'Event'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-accent shrink-0"/> 
                          <span>{new Date(ev.datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0"/> 
                          <span>{ev.venue || 'Campus Auditorium'}</span>
                        </div>
                      </div>

                      {/* Attendance Badge */}
                      <div className="mb-3 pt-2 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">Attendance:</span>
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" /> Present (Attended)
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                            Pending / Not Marked
                          </span>
                        )}
                      </div>

                      {/* Action buttons: Cancel Registration or Feedback */}
                      <div className="flex items-center gap-2 pt-1">
                        {/* If Attended: Allow Feedback submission (FR10) */}
                        {isPresent && (
                          <button
                            onClick={() => openFeedbackModal(ev)}
                            disabled={feedbackGiven}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              feedbackGiven 
                                ? 'bg-gray-700/40 text-gray-400 border border-gray-600/30 cursor-default' 
                                : 'bg-accent/20 hover:bg-accent/30 text-amber-300 border border-accent/40 shadow-sm'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {feedbackGiven ? 'Feedback Saved' : 'Give Feedback'}
                          </button>
                        )}

                        {/* Student Cancellation Button (FR7) */}
                        <button
                          onClick={() => handleCancelRegistration(reg._id, ev.name)}
                          className="py-1.5 px-3 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/30 transition-all ml-auto"
                          title="Cancel Registration"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}

                {registrations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    You have not registered for any events yet. Browse events on the right to participate!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Events Directory */}
          <div className="lg:w-2/3 flex-grow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                <Calendar className="text-primary w-6 h-6"/> Available Events
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                Showing {filteredEvents.length} events
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map(event => {
                const isRegistered = registrations.some(r => (r.event_id?._id || r.event_id) === event._id);
                const isFull = event.isFull || (event.availableSeats !== undefined && event.availableSeats <= 0);
                const isDeadlinePassed = event.isPastDeadline || (event.registrationDeadline && new Date() > new Date(event.registrationDeadline));
                const isAvailable = !isRegistered && !isFull && !isDeadlinePassed;

                return (
                  <div 
                    key={event._id} 
                    className="glass rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col relative border border-border/80 group"
                  >
                    {/* Top colored accent line */}
                    <div className={`h-2 ${
                      (event.category || event.type) === 'Non-Technical' 
                        ? 'bg-gradient-to-r from-secondary to-green-300' 
                        : 'bg-gradient-to-r from-primary to-accent'
                    }`}></div>

                    {/* Poster if available */}
                    {event.posterUrl ? (
                      <div className="h-44 overflow-hidden relative border-b border-border">
                        <img 
                          src={event.posterUrl} 
                          alt={event.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-dark/80 backdrop-blur-md text-white border border-white/10 uppercase">
                          {event.category || event.type || 'Technical'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-4 pb-0 flex justify-end">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-border uppercase">
                          {event.category || event.type || 'Technical'}
                        </span>
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="mb-2">
                        <h3 className="text-xl font-bold text-white leading-snug line-clamp-1">{event.name}</h3>
                        <p className="text-xs text-indigo-300 font-medium mt-0.5">
                          Organized by {event.club_id?.name || 'College Club'}
                        </p>
                      </div>

                      <p className="text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed flex-grow">
                        {event.description}
                      </p>

                      {/* Event Details Grid (FR4: venue, date, deadline, available seats) */}
                      <div className="space-y-2 text-xs text-gray-300 mb-5 bg-gray-900/60 p-3 rounded-xl border border-border/60">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" /> 
                          <span>{new Date(event.datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-accent shrink-0" /> 
                          <span>{event.venue || 'Campus Auditorium'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border/40">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-secondary shrink-0" />
                            <span className={isFull ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                              {event.availableSeats !== undefined ? event.availableSeats : (event.capacity || 100)} / {event.capacity || 100} seats left
                            </span>
                          </div>
                          {event.registrationDeadline && (
                            <span className={`text-[10px] ${isDeadlinePassed ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                              Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Registration Action Button (FR5 & FR6) */}
                      <div>
                        {isRegistered ? (
                          <div className="w-full py-2.5 rounded-xl font-semibold text-center text-xs bg-secondary/20 text-secondary border border-secondary/50 shadow-inner flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Already Registered
                          </div>
                        ) : isDeadlinePassed ? (
                          <button 
                            disabled 
                            className="w-full py-2.5 rounded-xl font-semibold text-xs bg-red-900/30 text-red-400 border border-red-800/40 cursor-not-allowed opacity-80"
                          >
                            Registration Closed (Deadline Passed)
                          </button>
                        ) : isFull ? (
                          <button 
                            disabled 
                            className="w-full py-2.5 rounded-xl font-semibold text-xs bg-gray-800 text-gray-500 border border-border cursor-not-allowed"
                          >
                            Event Full (Capacity Reached)
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRegister(event)}
                            className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg"
                          >
                            <span>Register Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredEvents.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400 glass rounded-2xl border border-border">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                  <p className="font-semibold">No events found matching your criteria</p>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or category filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FR10: Student Feedback Modal */}
      {feedbackModalOpen && selectedEventForFeedback && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl border border-border relative">
            <button 
              onClick={() => setFeedbackModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-accent/20 rounded-xl">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Event Feedback</h3>
                <p className="text-xs text-gray-400">{selectedEventForFeedback.name}</p>
              </div>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Overall Rating (1 - 5 Stars)</label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star 
                        className={`w-7 h-7 ${
                          star <= feedbackRating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-accent ml-2">{feedbackRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Comments & Feedback</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Share your thoughts on the event organization, speakers, content, and experience..."
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  className="input-field text-sm"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="btn-primary flex-1 py-2 text-xs font-semibold shadow-lg"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
