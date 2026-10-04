import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle, XCircle, Clock, MapPin, Users, Calendar, 
  ShieldCheck, AlertCircle, X, ChevronRight, FileCheck, Search 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const FacultyDashboard = () => {
  const [events, setEvents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'attendance'
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const u = JSON.parse(storedUser);
    if (u.role !== 'Faculty Coordinator' && u.role !== 'Admin') {
      return navigate('/login');
    }
    setUser(u);
    fetchData();
  }, [navigate]);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [eventsRes, attRes, regRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events?all=true'),
        axios.get('http://localhost:5000/api/attendance'),
        axios.get('http://localhost:5000/api/registrations')
      ]);

      setEvents(eventsRes.data);
      setAttendanceRecords(attRes.data);
      setRegistrations(regRes.data);
    } catch (err) {
      console.error('Error fetching faculty data:', err);
    }
  };

  // FR3: Approve Event
  const handleApproveEvent = async (eventId, eventName) => {
    try {
      await axios.put(`http://localhost:5000/api/events/${eventId}/status`, {
        status: 'Approved',
        approvedBy: user._id
      });
      showToast(`Event "${eventName}" has been Approved. Registration is now open!`, 'success');
      fetchData();
    } catch (err) {
      showToast('Failed to approve event.', 'error');
    }
  };

  // FR3: Reject Event
  const handleRejectEvent = async (eventId, eventName) => {
    if (!window.confirm(`Are you sure you want to reject "${eventName}"?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/events/${eventId}/status`, {
        status: 'Rejected',
        approvedBy: user._id
      });
      showToast(`Event "${eventName}" was marked as Rejected.`, 'info');
      fetchData();
    } catch (err) {
      showToast('Failed to reject event.', 'error');
    }
  };

  // FR8: Verify Attendance Records
  const handleVerifyAttendance = async (eventId, eventName) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/attendance/verify/${eventId}`, {
        verifiedBy: user._id
      });
      showToast(`Attendance verified for "${eventName}". (${res.data.modifiedCount} records certified)`, 'success');
      fetchData();
    } catch (err) {
      showToast('Error verifying attendance.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const pendingEvents = events.filter(e => e.status === 'Pending');
  const approvedEvents = events.filter(e => e.status === 'Approved');

  // Attendance by event summary
  const eventsWithAttendance = events.map(ev => {
    const evAtt = attendanceRecords.filter(a => (a.event_id?._id || a.event_id) === ev._id);
    const evRegs = registrations.filter(r => (r.event_id?._id || r.event_id) === ev._id && r.status === 'Registered');
    const isVerified = evAtt.length > 0 && evAtt.every(a => a.verified);
    const presentCount = evAtt.filter(a => a.status === 'Present').length;

    return {
      ...ev,
      registeredCount: evRegs.length,
      attendanceCount: evAtt.length,
      presentCount,
      isVerified,
      records: evAtt
    };
  }).filter(e => e.attendanceCount > 0 || e.status === 'Approved');

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar user={user} onLogout={handleLogout} />

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

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl shadow-lg border border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-100 to-primary">
              Faculty Coordinator Portal
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Review and approve campus events, monitor compliance, and verify official attendance records
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending Approvals: <strong>{pendingEvents.length}</strong>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-900/80 p-1.5 rounded-2xl border border-border gap-2 max-w-md">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pending' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pending Approvals ({pendingEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'approved' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Monitored Events ({approvedEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'attendance' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Verify Attendance
          </button>
        </div>

        {/* TAB 1: Pending Approvals (FR3) */}
        {activeTab === 'pending' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="text-amber-400 w-5 h-5"/> Events Awaiting Faculty Approval
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingEvents.map(event => (
                <div key={event._id} className="glass p-6 rounded-2xl border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                        Pending Approval
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1.5">{event.name}</h3>
                      <p className="text-xs text-indigo-300 mt-0.5">
                        Organizer: {event.club_id?.name || 'Club Head'} ({event.club_id?.department || 'Student Affairs'})
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 border border-border">
                      {event.category || event.type}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/50 p-3 rounded-xl border border-border/50">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent"/>
                      <span>{new Date(event.datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary"/>
                      <span>{event.venue || 'Campus Auditorium'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-secondary"/>
                      <span>Capacity: {event.capacity || 100} Seats</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span>Deadline: {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : 'None'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleRejectEvent(event._id, event.name)}
                      className="btn-secondary flex-1 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20 border-red-500/30 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject Event
                    </button>
                    <button
                      onClick={() => handleApproveEvent(event._id, event.name)}
                      className="btn-primary flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve & Open
                    </button>
                  </div>
                </div>
              ))}

              {pendingEvents.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400 glass rounded-2xl border border-border">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="font-semibold text-white">All Caught Up!</p>
                  <p className="text-xs text-gray-500 mt-1">There are no pending events waiting for approval right now.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Monitored Events */}
        {activeTab === 'approved' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-primary w-5 h-5"/> Approved Campus Events
            </h2>

            <div className="glass rounded-2xl overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-800/80 text-gray-400 border-b border-border">
                      <th className="p-3 pl-6 font-semibold">Event Name</th>
                      <th className="p-3 font-semibold">Organizer</th>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold">Venue</th>
                      <th className="p-3 font-semibold">Date & Time</th>
                      <th className="p-3 font-semibold">Seats / Capacity</th>
                      <th className="p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedEvents.map(ev => {
                      const regCount = registrations.filter(r => (r.event_id?._id || r.event_id) === ev._id && r.status === 'Registered').length;
                      return (
                        <tr key={ev._id} className="border-b border-border/40 hover:bg-gray-800/30">
                          <td className="p-3 pl-6 font-bold text-white">{ev.name}</td>
                          <td className="p-3 text-gray-300">{ev.club_id?.name || 'Club'}</td>
                          <td className="p-3 text-gray-300">{ev.category || ev.type}</td>
                          <td className="p-3 text-gray-300">{ev.venue || 'Campus Auditorium'}</td>
                          <td className="p-3 text-gray-300">{new Date(ev.datetime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td className="p-3">
                            <span className="text-indigo-300 font-semibold">
                              {regCount} / {ev.capacity || 100}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              Approved
                            </span>
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

        {/* TAB 3: Verify Attendance (FR8) */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-secondary w-5 h-5"/> Attendance Verification & Certification
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verify participant records submitted by volunteers to qualify students for feedback and certificates
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {eventsWithAttendance.map(event => (
                <div key={event._id} className="glass p-5 rounded-2xl border border-border/80 shadow-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-white">{event.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                          {event.category || event.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>Venue: {event.venue || 'Campus Auditorium'}</span>
                        <span>Total Registered: <strong className="text-white">{event.registeredCount}</strong></span>
                        <span>Attended Present: <strong className="text-emerald-400">{event.presentCount}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {event.isVerified ? (
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <CheckCircle className="w-4 h-4" /> Certified & Verified
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVerifyAttendance(event._id, event.name)}
                          disabled={event.attendanceCount === 0}
                          className={`btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-md ${
                            event.attendanceCount === 0 ? 'opacity-50 cursor-not-allowed' : 'bg-primary hover:bg-indigo-500'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{event.attendanceCount === 0 ? 'No Attendance Marked Yet' : 'Verify Attendance Records'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyDashboard;
