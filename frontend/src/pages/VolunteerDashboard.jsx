import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, XCircle, Search, Calendar, MapPin, Clock, 
  AlertCircle, X, Check, ShieldCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const VolunteerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [user, setUser] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return navigate('/login');
    const u = JSON.parse(storedUser);
    if (u.role !== 'Volunteer' && u.role !== 'Admin' && u.role !== 'Club Head') {
      return navigate('/login');
    }
    setUser(u);
    fetchEvents();
  }, [navigate]);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/events?status=Approved');
      setEvents(res.data);
      if (res.data.length > 0 && !selectedEventId) {
        setSelectedEventId(res.data[0]._id);
        fetchEventAttendanceData(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching events for volunteer:', err);
    }
  };

  const fetchEventAttendanceData = async (eventId) => {
    try {
      const [regsRes, attRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/registrations?event_id=${eventId}`),
        axios.get(`http://localhost:5000/api/attendance?event_id=${eventId}`)
      ]);
      setRegistrations(regsRes.data.filter(r => r.status === 'Registered'));
      setAttendanceRecords(attRes.data);
    } catch (err) {
      console.error('Error fetching event roster:', err);
    }
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    fetchEventAttendanceData(eventId);
  };

  // FR8: Mark Attendance (Volunteer)
  const handleMarkAttendance = async (studentId, studentName, status) => {
    try {
      await axios.post('http://localhost:5000/api/attendance', {
        student_id: studentId,
        event_id: selectedEventId,
        status,
        markedBy: user._id
      });

      showToast(`Marked ${studentName} as ${status}!`, 'success');
      fetchEventAttendanceData(selectedEventId);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error marking attendance', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const selectedEvent = events.find(e => e._id === selectedEventId);

  // Filter registered students by search query
  const filteredRegistrations = registrations.filter(r => {
    const student = r.student_id;
    if (!student) return false;
    const query = studentSearch.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.studentId?.toLowerCase().includes(query) ||
      student.department?.toLowerCase().includes(query)
    );
  });

  const presentCount = attendanceRecords.filter(a => a.status === 'Present').length;
  const absentCount = attendanceRecords.filter(a => a.status === 'Absent').length;

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

        {/* Dashboard Title Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-2xl shadow-lg border border-border gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-emerald-200 to-primary">
              Volunteer Attendance Desk
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Record live event attendance for verified registered students on event day
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Desk Volunteer: {user?.name}
            </span>
          </div>
        </div>

        {/* Event Selector & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Select Event */}
          <div className="lg:col-span-1 glass p-6 rounded-2xl border border-border/80 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="text-primary w-5 h-5"/> Select Active Event
            </h2>

            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="input-field text-sm font-semibold bg-gray-800"
            >
              {events.map(e => (
                <option key={e._id} value={e._id}>
                  {e.name} ({new Date(e.datetime).toLocaleDateString()})
                </option>
              ))}
              {events.length === 0 && <option value="">No approved events found</option>}
            </select>

            {selectedEvent && (
              <div className="bg-gray-900/60 p-4 rounded-xl border border-border/60 space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-accent"/>
                  <span>{new Date(selectedEvent.datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary"/>
                  <span>Venue: {selectedEvent.venue || 'Campus Auditorium'}</span>
                </div>
                <div className="pt-2 border-t border-border/40 text-[11px] text-gray-400">
                  Organizer: <strong className="text-white">{selectedEvent.club_id?.name || 'Club'}</strong>
                </div>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-gray-800/60 p-3 rounded-xl border border-border text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Registered</p>
                <p className="text-xl font-bold text-white mt-1">{registrations.length}</p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 text-center">
                <p className="text-[10px] text-emerald-400 font-bold uppercase">Present</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{presentCount}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/30 text-center">
                <p className="text-[10px] text-red-400 font-bold uppercase">Absent</p>
                <p className="text-xl font-bold text-red-400 mt-1">{absentCount}</p>
              </div>
            </div>
          </div>

          {/* Registered Students Roster & Attendance Marking (FR8) */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl border border-border/80 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-border/80">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="text-secondary w-5 h-5"/> Registered Student Roster
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name, ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs w-full"
                />
              </div>
            </div>

            {/* Student Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-800/80 text-gray-400 border-b border-border">
                    <th className="p-3 pl-4 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Student ID / Roll No</th>
                    <th className="p-3 font-semibold">Department</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 pr-4 font-semibold text-right">Attendance Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => {
                    const student = reg.student_id;
                    if (!student) return null;

                    const att = attendanceRecords.find(a => 
                      (a.student_id?._id || a.student_id) === student._id
                    );
                    const isPresent = att && att.status === 'Present';
                    const isAbsent = att && att.status === 'Absent';

                    return (
                      <tr key={reg._id} className="border-b border-border/40 hover:bg-gray-800/30 transition-colors">
                        <td className="p-3 pl-4">
                          <p className="font-bold text-white">{student.name}</p>
                          <p className="text-[10px] text-gray-400">{student.email}</p>
                        </td>
                        <td className="p-3 font-medium text-gray-300">
                          {student.studentId || 'STU-Gen'}
                        </td>
                        <td className="p-3 text-gray-300">
                          {student.department || 'Engineering'}
                        </td>
                        <td className="p-3">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <CheckCircle className="w-3 h-3" /> Present
                            </span>
                          ) : isAbsent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                              <XCircle className="w-3 h-3" /> Absent
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleMarkAttendance(student._id, student.name, 'Present')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                isPresent 
                                  ? 'bg-emerald-600 text-white shadow-md' 
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Present
                            </button>
                            <button
                              onClick={() => handleMarkAttendance(student._id, student.name, 'Absent')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                isAbsent 
                                  ? 'bg-red-600 text-white shadow-md' 
                                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRegistrations.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        {registrations.length === 0 
                          ? 'No students have registered for this event yet.' 
                          : 'No matching registered students found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VolunteerDashboard;
