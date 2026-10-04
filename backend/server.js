require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');
const Feedback = require('./models/Feedback');

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, ''));
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusconnect')
  .then(async () => {
    console.log('MongoDB Connected');
    // Ensure default test accounts exist for seamless testing
    await seedDefaultUsers();
  })
  .catch(err => console.log('MongoDB Connection Error:', err.message));

// Seed default users for all roles if they don't exist
async function seedDefaultUsers() {
  const defaults = [
    { email: 'admin@cc.edu', password: 'admin123', name: 'Main Admin', role: 'Admin', department: 'Administration' },
    { email: 'club@cc.edu', password: 'club123', name: 'Default Club Organizer', role: 'Club Head', department: 'Student Affairs' },
    { email: 'faculty@cc.edu', password: 'faculty123', name: 'Dr. Sarah Jenkins', role: 'Faculty Coordinator', department: 'Computer Science' },
    { email: 'volunteer@cc.edu', password: 'volunteer123', name: 'Alex Volunteer', role: 'Volunteer', department: 'Information Technology' }
  ];

  for (const def of defaults) {
    const exists = await User.findOne({ email: def.email });
    if (!exists) {
      await User.create(def);
      console.log(`Seeded default ${def.role}: ${def.email}`);
    }
  }
}

// Helper: send notification
async function createNotification(userId, title, message, type = 'System', eventId = null) {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      event_id: eventId
    });
  } catch (e) {
    console.error('Notification creation failed:', e.message);
  }
}

// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Fixed default credential shortcuts for demonstration
    if (role === 'Admin') {
      if (email !== 'admin@cc.edu' || password !== 'admin123') {
        const adminUser = await User.findOne({ email, role: 'Admin' });
        if (!adminUser || adminUser.password !== password) {
          return res.status(401).json({ message: 'Invalid Admin Credentials' });
        }
        return res.json(adminUser);
      }
      let admin = await User.findOne({ email });
      if (!admin) {
        admin = new User({ email, password, name: 'Main Admin', role: 'Admin', department: 'Administration' });
        await admin.save();
      }
      return res.json(admin);
    } 
    else if (role === 'Club Head') {
      if (email !== 'club@cc.edu' || password !== 'club123') {
        const clubUser = await User.findOne({ email, role: 'Club Head' });
        if (!clubUser || clubUser.password !== password) {
          return res.status(401).json({ message: 'Invalid Club Head Credentials' });
        }
        return res.json(clubUser);
      }
      let club = await User.findOne({ email });
      if (!club) {
        club = new User({ email, password, name: 'Default Club Organizer', role: 'Club Head', department: 'Student Affairs' });
        await club.save();
      }
      return res.json(club);
    }
    else if (role === 'Faculty Coordinator') {
      if (email !== 'faculty@cc.edu' || password !== 'faculty123') {
        const facUser = await User.findOne({ email, role: 'Faculty Coordinator' });
        if (!facUser || facUser.password !== password) {
          return res.status(401).json({ message: 'Invalid Faculty Coordinator Credentials' });
        }
        return res.json(facUser);
      }
      let faculty = await User.findOne({ email });
      if (!faculty) {
        faculty = new User({ email, password, name: 'Dr. Sarah Jenkins', role: 'Faculty Coordinator', department: 'Computer Science' });
        await faculty.save();
      }
      return res.json(faculty);
    }
    else if (role === 'Volunteer') {
      if (email !== 'volunteer@cc.edu' || password !== 'volunteer123') {
        const volUser = await User.findOne({ email, role: 'Volunteer' });
        if (!volUser || volUser.password !== password) {
          return res.status(401).json({ message: 'Invalid Volunteer Credentials' });
        }
        return res.json(volUser);
      }
      let volunteer = await User.findOne({ email });
      if (!volunteer) {
        volunteer = new User({ email, password, name: 'Alex Volunteer', role: 'Volunteer', department: 'Information Technology' });
        await volunteer.save();
      }
      return res.json(volunteer);
    }
    else {
      // Student logic
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ 
          email, 
          password, 
          name: email.split('@')[0], 
          role: 'Student',
          department: 'General Engineering',
          studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000)
        });
        await user.save();
      } else {
        if (user.password !== password) return res.status(401).json({ message: 'Invalid password' });
        if (user.role !== 'Student') return res.status(403).json({ message: `This email is registered as ${user.role}. Please select ${user.role} role.` });
      }
      return res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Explicit user registration
app.post('/api/register-user', async (req, res) => {
  try {
    const { name, email, password, role, department, studentId, year, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered. Please sign in.' });
    }

    const newUser = new User({
      name,
      email,
      password,
      role,
      department: department || 'General',
      studentId: studentId || (role === 'Student' ? 'STU-' + Math.floor(1000 + Math.random() * 9000) : undefined),
      year: year || '1st Year',
      phone: phone || ''
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Users list
app.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role && role !== 'All' ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'Admin' && user.email === 'admin@cc.edu') {
      return res.status(400).json({ message: 'Cannot delete primary administrator account' });
    }
    await User.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ student_id: req.params.id });
    await Attendance.deleteMany({ student_id: req.params.id });
    await Feedback.deleteMany({ student_id: req.params.id });
    res.json({ message: 'User and associated data removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Event Routes ---
app.get('/api/events', async (req, res) => {
  try {
    const { status, all } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    } else if (all !== 'true') {
      // By default or for student dashboard, show approved events or events without status
      // (ensuring backward compatibility with existing DB records where status might be empty)
      filter = { status: { $in: ['Approved', undefined, null] } };
    }

    const events = await Event.find(filter).populate('club_id', 'name email department');
    
    // Attach current registration count to each event for seat tracking
    const eventIds = events.map(e => e._id);
    const regCounts = await Registration.aggregate([
      { $match: { event_id: { $in: eventIds }, status: 'Registered' } },
      { $group: { _id: '$event_id', count: { $sum: 1 } } }
    ]);
    const regMap = {};
    regCounts.forEach(r => { regMap[r._id.toString()] = r.count; });

    const enrichedEvents = events.map(ev => {
      const registeredCount = regMap[ev._id.toString()] || 0;
      const capacity = ev.capacity || 100;
      const availableSeats = Math.max(0, capacity - registeredCount);
      const isPastDeadline = ev.registrationDeadline ? new Date() > new Date(ev.registrationDeadline) : false;
      const isFull = registeredCount >= capacity;

      return {
        ...ev.toObject(),
        registeredCount,
        availableSeats,
        isPastDeadline,
        isFull
      };
    });

    res.json(enrichedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('club_id', 'name email department');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const regCount = await Registration.countDocuments({ event_id: event._id, status: 'Registered' });
    const capacity = event.capacity || 100;
    
    res.json({
      ...event.toObject(),
      registeredCount: regCount,
      availableSeats: Math.max(0, capacity - regCount)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Event
app.post('/api/events', upload.single('poster'), async (req, res) => {
  try {
    const posterUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : (req.body.posterUrl || null);
    
    // If registration deadline wasn't provided, default to event datetime
    let regDeadline = req.body.registrationDeadline;
    if (!regDeadline && req.body.datetime) {
      regDeadline = req.body.datetime;
    }

    // Role-based initial status: If submitted by Club Head, 'Pending' for Faculty Coordinator approval.
    // If user is Admin or Faculty Coordinator, 'Approved'.
    const creator = await User.findById(req.body.club_id);
    let initialStatus = 'Pending';
    if (creator && (creator.role === 'Admin' || creator.role === 'Faculty Coordinator')) {
      initialStatus = 'Approved';
    }

    const event = new Event({ 
      ...req.body, 
      capacity: req.body.capacity ? Number(req.body.capacity) : 100,
      registrationDeadline: regDeadline,
      status: req.body.status || initialStatus,
      posterUrl 
    });
    await event.save();

    // Notify faculty coordinators about new pending event
    if (event.status === 'Pending') {
      const faculties = await User.find({ role: 'Faculty Coordinator' });
      for (const fac of faculties) {
        await createNotification(
          fac._id,
          'New Event Pending Approval',
          `Event "${event.name}" was submitted by ${creator?.name || 'Club Organizer'} and requires your approval.`,
          'Approval',
          event._id
        );
      }
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Event Details
app.put('/api/events/:id', upload.single('poster'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.posterUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }
    if (updateData.capacity) {
      updateData.capacity = Number(updateData.capacity);
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Notify registered students about event update
    const regs = await Registration.find({ event_id: event._id, status: 'Registered' });
    for (const r of regs) {
      await createNotification(
        r.student_id,
        'Event Details Updated',
        `Important: Details for "${event.name}" have been updated. Please check the latest venue and schedule.`,
        'EventUpdate',
        event._id
      );
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Faculty / Admin: Approve, Reject, or Cancel Event
app.put('/api/events/:id/status', async (req, res) => {
  try {
    const { status, approvedBy } = req.body;
    if (!['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.status = status;
    if (approvedBy) event.approvedBy = approvedBy;
    await event.save();

    // Notify Organizer of status change
    if (event.club_id) {
      await createNotification(
        event.club_id,
        `Event ${status}`,
        `Your event "${event.name}" has been marked as ${status} by faculty/admin.`,
        'Approval',
        event._id
      );
    }

    // If cancelled, notify all registered students
    if (status === 'Cancelled') {
      const regs = await Registration.find({ event_id: event._id, status: 'Registered' });
      for (const r of regs) {
        await createNotification(
          r.student_id,
          'Event Cancelled',
          `We regret to inform you that "${event.name}" scheduled for ${new Date(event.datetime).toLocaleDateString()} has been cancelled.`,
          'EventUpdate',
          event._id
        );
      }
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send custom announcement to event participants
app.post('/api/events/:id/announcement', async (req, res) => {
  try {
    const { message, title } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const regs = await Registration.find({ event_id: event._id, status: 'Registered' });
    for (const r of regs) {
      await createNotification(
        r.student_id,
        title || `Announcement: ${event.name}`,
        message,
        'EventUpdate',
        event._id
      );
    }

    res.json({ message: `Announcement sent to ${regs.length} participants` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (ev && ev.posterUrl) {
      const filename = ev.posterUrl.split('/uploads/')[1];
      if (filename) {
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }
    await Event.findByIdAndDelete(req.params.id);
    // Cleanup registrations, attendance, feedback, notifications
    await Registration.deleteMany({ event_id: req.params.id });
    await Attendance.deleteMany({ event_id: req.params.id });
    await Feedback.deleteMany({ event_id: req.params.id });
    res.json({ message: 'Event deleted and related records cleaned' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Registration Routes & Validation ---
app.post('/api/register', async (req, res) => {
  try {
    const { student_id, event_id } = req.body;
    if (!student_id || !event_id) {
      return res.status(400).json({ message: 'student_id and event_id are required' });
    }

    // 1. Fetch Event
    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 2. Validate Event Status
    if (event.status && event.status !== 'Approved') {
      return res.status(400).json({ message: `Cannot register: Event is currently ${event.status}. Only approved events accept registrations.` });
    }

    // 3. Validate Registration Deadline
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (new Date() > deadline) {
        return res.status(400).json({ message: `Registration is closed! The deadline was ${deadline.toLocaleString()}.` });
      }
    }

    // 4. Validate Capacity / Seat Availability
    const capacity = event.capacity || 100;
    const activeRegCount = await Registration.countDocuments({ event_id, status: 'Registered' });
    if (activeRegCount >= capacity) {
      return res.status(400).json({ message: `Registration failed: This event is already at full capacity (${capacity} seats).` });
    }

    // 5. Prevent Duplicate Registration
    const existing = await Registration.findOne({ student_id, event_id });
    if (existing) {
      if (existing.status === 'Registered') {
        return res.status(400).json({ message: 'You are already registered for this event!' });
      } else {
        // If previously cancelled, re-activate
        existing.status = 'Registered';
        existing.registeredAt = new Date();
        await existing.save();

        await createNotification(
          student_id,
          'Registration Re-confirmed',
          `Your registration for "${event.name}" has been successfully re-activated. Venue: ${event.venue || 'Campus Auditorium'}.`,
          'Registration',
          event._id
        );

        return res.status(200).json(existing);
      }
    }

    // 6. Save Registration
    const reg = new Registration({
      student_id,
      event_id,
      status: 'Registered',
      registeredAt: new Date()
    });
    await reg.save();

    // 7. Dispatch Confirmation Notification
    await createNotification(
      student_id,
      'Registration Confirmed! 🎉',
      `You have successfully registered for "${event.name}". Venue: ${event.venue || 'Campus Auditorium'} at ${new Date(event.datetime).toLocaleString()}.`,
      'Registration',
      event._id
    );

    res.status(201).json(reg);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this event!' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const { student_id, event_id } = req.query;
    const filter = {};
    if (student_id) filter.student_id = student_id;
    if (event_id) filter.event_id = event_id;

    const regs = await Registration.find(filter)
      .populate('student_id', 'name email department studentId year phone')
      .populate('event_id')
      .sort({ registeredAt: -1 });

    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel registration (Student cancellation)
app.delete('/api/register/:id', async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id).populate('event_id');
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    const eventName = reg.event_id?.name || 'the event';
    const studentId = reg.student_id;
    const eventId = reg.event_id?._id;

    await Registration.findByIdAndDelete(req.params.id);

    // Also remove any attendance record if it was present
    await Attendance.deleteMany({ student_id: studentId, event_id: eventId });

    // Send cancellation notification
    await createNotification(
      studentId,
      'Registration Cancelled',
      `Your registration for "${eventName}" has been cancelled. Your reserved seat has been released.`,
      'Registration',
      eventId
    );

    res.json({ message: 'Registration successfully cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Attendance Routes ---
// Get attendance list for an event
app.get('/api/attendance', async (req, res) => {
  try {
    const { event_id } = req.query;
    const filter = event_id ? { event_id } : {};
    const records = await Attendance.find(filter)
      .populate('student_id', 'name email department studentId')
      .populate('markedBy', 'name role')
      .populate('verifiedBy', 'name role')
      .sort({ markedAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Volunteer: Mark Attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { student_id, event_id, status, markedBy } = req.body;
    if (!student_id || !event_id) {
      return res.status(400).json({ message: 'student_id and event_id are required' });
    }

    // Validation: Verify that the student is actually registered for the event!
    const registration = await Registration.findOne({ student_id, event_id, status: 'Registered' });
    if (!registration) {
      return res.status(400).json({ message: 'Validation failed: This student is not registered for this event!' });
    }

    let record = await Attendance.findOne({ student_id, event_id });
    if (record) {
      record.status = status || 'Present';
      record.markedBy = markedBy || record.markedBy;
      record.markedAt = new Date();
      await record.save();
    } else {
      record = new Attendance({
        student_id,
        event_id,
        registration_id: registration._id,
        status: status || 'Present',
        markedBy,
        markedAt: new Date(),
        verified: false
      });
      await record.save();
    }

    // In-app alert for the student
    const event = await Event.findById(event_id);
    if (status === 'Present') {
      await createNotification(
        student_id,
        'Attendance Verified Present',
        `Your attendance for "${event?.name || 'Event'}" has been marked as Present. You are now eligible to submit feedback!`,
        'Attendance',
        event_id
      );
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Faculty Coordinator: Verify attendance records for an event
app.put('/api/attendance/verify/:eventId', async (req, res) => {
  try {
    const { verifiedBy } = req.body;
    const eventId = req.params.eventId;

    const result = await Attendance.updateMany(
      { event_id: eventId },
      { verified: true, verifiedBy, verifiedAt: new Date() }
    );

    res.json({ message: 'Attendance records successfully verified', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Feedback Routes ---
// Submit Feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { event_id, student_id, rating, comments } = req.body;
    if (!event_id || !student_id || !rating || !comments) {
      return res.status(400).json({ message: 'Event, student, rating (1-5), and comments are required.' });
    }

    // 1. Validate student attended the event
    const attendance = await Attendance.findOne({ event_id, student_id, status: 'Present' });
    if (!attendance) {
      return res.status(403).json({ message: 'Only students who attended and were marked Present can submit feedback for this event.' });
    }

    // 2. Prevent duplicate feedback
    const existing = await Feedback.findOne({ event_id, student_id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event.' });
    }

    const feedback = new Feedback({
      event_id,
      student_id,
      rating: Number(rating),
      comments: comments.trim()
    });
    await feedback.save();

    res.status(201).json(feedback);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get feedback for an event
app.get('/api/feedback', async (req, res) => {
  try {
    const { event_id } = req.query;
    const filter = event_id ? { event_id } : {};
    const feedbackList = await Feedback.find(filter)
      .populate('student_id', 'name email department')
      .populate('event_id', 'name datetime')
      .sort({ createdAt: -1 });

    res.json(feedbackList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feedback summary for an event or all events
app.get('/api/feedback/summary/:eventId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ event_id: req.params.eventId });
    const count = feedback.length;
    const avgRating = count > 0 
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / count).toFixed(1) 
      : 0;

    res.json({
      totalReviews: count,
      averageRating: Number(avgRating),
      reviews: feedback
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Notification Routes ---
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/read/:id', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/read-all/:userId', async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.params.userId }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Reports Route ---
app.get('/api/reports/overview', async (req, res) => {
  try {
    const [events, registrations, attendance, feedback, users] = await Promise.all([
      Event.find().populate('club_id', 'name'),
      Registration.find().populate('student_id', 'name email department').populate('event_id', 'name'),
      Attendance.find().populate('student_id', 'name email').populate('event_id', 'name'),
      Feedback.find().populate('event_id', 'name')
    ]);

    // Aggregate statistics per event
    const eventStats = events.map(ev => {
      const evRegs = registrations.filter(r => r.event_id?._id?.toString() === ev._id.toString() && r.status === 'Registered');
      const evAtt = attendance.filter(a => a.event_id?._id?.toString() === ev._id.toString() && a.status === 'Present');
      const evFeed = feedback.filter(f => f.event_id?._id?.toString() === ev._id.toString());
      const avgRate = evFeed.length > 0 
        ? (evFeed.reduce((acc, cur) => acc + cur.rating, 0) / evFeed.length).toFixed(1)
        : 'N/A';
      const attRate = evRegs.length > 0 
        ? Math.round((evAtt.length / evRegs.length) * 100) 
        : 0;

      return {
        _id: ev._id,
        name: ev.name,
        category: ev.category || ev.type,
        venue: ev.venue || 'Campus Auditorium',
        datetime: ev.datetime,
        status: ev.status,
        capacity: ev.capacity || 100,
        registeredCount: evRegs.length,
        presentCount: evAtt.length,
        attendanceRate: `${attRate}%`,
        feedbackCount: evFeed.length,
        averageRating: avgRate,
        organizer: ev.club_id?.name || 'Club Head'
      };
    });

    res.json({
      totalEvents: events.length,
      totalRegistrations: registrations.filter(r => r.status === 'Registered').length,
      totalAttendeesPresent: attendance.filter(a => a.status === 'Present').length,
      totalFeedback: feedback.length,
      events: eventStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
