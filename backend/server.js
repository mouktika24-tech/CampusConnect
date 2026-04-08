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
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err.message));

// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;
  
  try {
    if (role === 'Admin') {
      if (email !== 'admin@cc.edu' || password !== 'admin123') return res.status(401).json({ message: 'Invalid Admin Credentials' });
      let admin = await User.findOne({ email });
      if(!admin) {
         admin = new User({ email, password, name: 'Main Admin', role: 'Admin' });
         await admin.save();
      }
      return res.json(admin);
    } 
    else if (role === 'Club Head') {
      if (email !== 'club@cc.edu' || password !== 'club123') return res.status(401).json({ message: 'Invalid Club Credentials' });
      let club = await User.findOne({ email });
      if(!club) {
         club = new User({ email, password, name: 'Default Club', role: 'Club Head' });
         await club.save();
      }
      return res.json(club);
    } 
    else {
      // Student logic
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ email, password, name: email.split('@')[0], role: 'Student' });
        await user.save();
      } else {
        if (user.password !== password) return res.status(401).json({ message: 'Invalid password' });
        if (user.role !== 'Student') return res.status(403).json({ message: 'This email is reserved for another role.' });
      }
      return res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Event Routes ---
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().populate('club_id', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', upload.single('poster'), async (req, res) => {
  try {
    const posterUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
    const event = new Event({ ...req.body, posterUrl });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if(ev && ev.posterUrl) {
      const filename = ev.posterUrl.split('/uploads/')[1];
      const filePath = path.join(__dirname, 'uploads', filename);
      if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await Event.findByIdAndDelete(req.params.id);
    // Cleanup registrations
    await Registration.deleteMany({ event_id: req.params.id });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Registration Routes ---
app.post('/api/register', async (req, res) => {
  try {
    const reg = new Registration(req.body);
    await reg.save();
    res.status(201).json(reg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/registrations', async (req, res) => {
  try {
    const regs = await Registration.find().populate('student_id', 'name email').populate('event_id');
    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/register/:id', async (req, res) => {
  try {
    await Registration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registration cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
