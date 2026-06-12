# CampusConnect

CampusConnect is a modern, full-stack MERN (MongoDB, Express, React, Node.js) web application designed to streamline event organization, promotion, and student participation across college campuses. It features a responsive, glassmorphic dark-themed user interface with distinct workflows for students, club coordinators, and administrators.

---

## 🚀 Key Features

### 👨‍🎓 Student Dashboard
- **Browse & Search**: Search through events using a modern, long search bar.
- **Categorization**: Filter events by **Technical**, **Non-Technical**, or **All** tags.
- **Easy Registration**: Single-click registrations for campus events.
- **Personalized Schedule**: View a dedicated panel tracking your registered events and times.

### ♣️ Club Head Dashboard
- **Create & Manage Events**: Create new events complete with titles, descriptions, dates, times, and external registration links.
- **Poster Uploads**: Upload event posters directly to the server.
- **Categorization Option**: Tag events as Technical or Non-Technical to route them to appropriate dashboard views.
- **Metrics Tracking**: Monitor registration statistics for organizing leaders.

### 🛡️ Admin Dashboard
- **Full Moderation**: View all upcoming events and cancel/delete events when necessary.
- **Registration Statistics**: Track overall registration details and metrics across all clubs.
- **Clean Overview**: Manage users and events efficiently from a high-level table.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js, Multer (for poster uploads).
- **Database**: MongoDB (Local or Atlas).
- **Styling**: Vanilla CSS with custom utility components for glassmorphism and animations.

---

## ⚙️ How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and configure your variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/campusconnect
   ```
4. Start the backend server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the address shown in your terminal (typically `http://localhost:5173`).
