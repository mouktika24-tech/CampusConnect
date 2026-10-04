# Gap Analysis: CampusConnect - College Event Management System

## 1. Executive Summary
This document provides a concise gap analysis comparing the existing **CampusConnect** prototype against the software engineering requirements specification provided in the problem statement document.

---

## 2. Requirements Gap Analysis

| Requirement | Already Present? | Missing / Incomplete? | Action |
| :--- | :--- | :--- | :--- |
| **FR1: User Registration & Login (Role-Based Access)** | **Partially Present**: Login exists with basic role switching for `Student`, `Club Head`, and `Admin`. Basic student auto-creation on login. | **Incomplete**: Missing roles `Faculty Coordinator` and `Volunteer`. No user registration form with college details (student ID, department, year/team). Passwords stored in plain text without token auth. | • Extend `User` model to support all 5 roles: `Student`, `Club Head` (Event Organizer), `Faculty Coordinator`, `Volunteer`, `Admin`.<br>• Add college metadata (`studentId`, `department`, `year`, `phone`).<br>• Add Register / Sign-up tab on Login screen.<br>• Provide default credentials for quick testing of all 5 roles. |
| **FR2: Event Management (Organizers)** | **Partially Present**: Club Heads can create events (name, description, datetime, link, type, poster image) and delete events. | **Incomplete**: Missing required event fields: `venue`, `category` (expanded), `capacity`, `registrationDeadline`, and `status` ('Pending', 'Approved', 'Rejected', 'Cancelled'). No event update/edit or cancel status. Organizers cannot see participant lists. | • Update `Event` model to include `venue`, `category`, `capacity`, `registrationDeadline`, `status`.<br>• Add Edit/Update Event modal & backend endpoint.<br>• Add Cancel Event capability.<br>• Add "View Participants" modal with student details and attendance status. |
| **FR3: Event Approval (Faculty Coordinator)** | **Missing**: Newly created events are immediately visible without faculty review. | **Missing Completely**: No Faculty Coordinator role, dashboard, or approval workflow. | • Create Faculty Coordinator Dashboard (`/faculty`).<br>• Implement `PUT /api/events/:id/status` to allow Faculty Coordinators to review, approve, or reject pending events.<br>• Only approved events become open for student registrations. |
| **FR4: Event Viewing, Searching & Filtering (Student)** | **Partially Present**: Student dashboard lists events, searches by name, filters by Technical/Non-Technical. | **Incomplete**: Does not display `venue`, `registrationDeadline`, or `availableSeats` count. No category or date filtering. | • Update event cards to show Venue, Date/Time, Registration Deadline, and Available Seats remaining (`capacity - activeRegistrations`).<br>• Add multi-category filter and date filter.<br>• Clearly indicate full or closed events. |
| **FR5 & FR6: Event Registration & Validation** | **Partially Present**: Single-click registration creates DB record. Unique DB index on `{ student_id, event_id }`. | **Incomplete**: No capacity validation (allows registering beyond capacity). No deadline validation (allows registering after deadline). No event status validation (allows registering for unapproved events). Raw 500 error on duplicate registration. | • Update `POST /api/register` with strict validations:<br>1. Event must be `Approved`.<br>2. Current date <= `registrationDeadline`.<br>3. Count of registrations < `capacity`.<br>4. Prevent duplicate registration with clean 400 error message.<br>• Decrement/update available seat count dynamically in UI and backend. |
| **FR7: Registration Management & Cancellation** | **Partially Present**: Student dashboard shows list of registered events. Backend has `DELETE /api/register/:id`. | **Incomplete**: Students cannot cancel registration in the UI. Organizers cannot view participant roster. | • Add "Cancel Registration" button with confirmation modal in student panel.<br>• Update status or remove registration and release seat.<br>• Provide Organizers with a detailed participant list modal (with search & export). |
| **FR8: Attendance Management (Volunteer & Faculty)** | **Missing**: No attendance data model or tracking mechanism. | **Missing Completely**: No Volunteer dashboard to mark attendance; no Faculty verification mechanism. | • Create `Attendance` model (`student_id`, `event_id`, `status: ['Present', 'Absent']`, `markedBy`, `markedAt`, `verified: Boolean`, `verifiedBy`, `verifiedAt`).<br>• Create Volunteer Dashboard (`/volunteer`) to select events, view registered students, and mark Present/Absent.<br>• Allow Faculty Coordinators to review and verify attendance records. |
| **FR9: Notifications System** | **Missing**: No notification model or user alerts. | **Missing Completely**: No in-app alerts for registration confirmations, cancellations, or updates. | • Create `Notification` model (`user_id`, `title`, `message`, `type`, `read`, `createdAt`).<br>• Trigger notifications on registration confirmation, cancellation, event approval/update, and attendance marking.<br>• Add Notification Bell component with dropdown in header across all dashboards. |
| **FR10: Feedback Management** | **Missing**: No feedback model or submission interface. | **Missing Completely**: Students cannot submit ratings or comments; organizers cannot view feedback. | • Create `Feedback` model (`event_id`, `student_id`, `rating: 1-5`, `comments`, `createdAt`).<br>• Allow ONLY students with verified attendance ('Present') to submit feedback.<br>• Prevent duplicate feedback per student per event.<br>• Add Feedback summary cards (average rating, review list) in Organizer and Admin dashboards. |
| **FR11: Reports Generation** | **Incomplete**: Admin has 3 basic metric cards. No reports for organizers or downloadable summaries. | **Incomplete**: Missing Event Reports, Registration Reports, Attendance Reports (rates & counts), and Feedback Analysis Reports. | • Build comprehensive Reports component accessible by Admins and Organizers.<br>• Include: 1) Event & Registration report, 2) Attendance rate analysis (% present), 3) Feedback rating distributions.<br>• Provide export/print functionality for reports. |
| **FR12: Administration & User Management** | **Incomplete**: Admin can only view event directory and delete events. | **Incomplete**: Admin cannot view or manage users, assign roles, or audit registrations. | • Add User Management tab in Admin Dashboard (view all users, filter by role, add new user, delete user).<br>• Add event status control (Approve/Reject/Cancel/Delete) in Admin panel.<br>• Display system health & activity logs. |

---

## 3. Incremental Implementation Plan
1. **Database Schema Enhancements**:
   - `User.js`: Add roles (`Faculty Coordinator`, `Volunteer`), `studentId`, `department`, `year`, `phone`.
   - `Event.js`: Add `venue`, `category`, `capacity`, `registrationDeadline`, `status` ('Pending', 'Approved', 'Rejected', 'Cancelled').
   - `Registration.js`: Ensure robust timestamps, status tracking.
   - `Attendance.js` (NEW): Track student attendance, marking by volunteer, verification by faculty.
   - `Notification.js` (NEW): Track in-app user notifications.
   - `Feedback.js` (NEW): Track student ratings (1-5) and comments.
2. **Backend API Endpoints**:
   - Enhanced `/api/login` & `/api/register-user` with role support and default test credentials.
   - Enhanced `/api/events` with status filtering, capacity/deadline checks, update (`PUT /api/events/:id`), status updates (`PUT /api/events/:id/status`), and cancel endpoints.
   - Enhanced `/api/register` with duplicate, deadline, capacity, and approval validation. Cancellation via `/api/register/:id`.
   - Attendance APIs: `/api/attendance` (GET, POST mark attendance, PUT verify attendance).
   - Notification APIs: `/api/notifications/:userId`, `/api/notifications/mark-read`.
   - Feedback APIs: `/api/feedback` (POST submit if attended, GET by event).
   - Reports APIs & User Management APIs for Admins and Organizers.
3. **Frontend UI Components & Dashboards**:
   - Shared Header with User Info, Notification Bell dropdown, and Logout.
   - Extended **Login & Registration** page supporting all 5 roles and test accounts.
   - Extended **Student Dashboard**: Venue, available seats, deadlines, category/date filters, cancel registration, attended events feedback modal, in-app notifications.
   - Extended **Club Head (Organizer) Dashboard**: Venue, capacity, deadline fields in event creation; edit event modal; participant list modal; feedback view; reports tab.
   - New **Faculty Coordinator Dashboard** (`/faculty`): Review pending events (approve/reject), verify volunteer attendance records, monitor campus events.
   - New **Volunteer Dashboard** (`/volunteer`): Select event, view registered student list, mark Present/Absent with real-time feedback.
   - Extended **Admin Dashboard**: User management table (view, filter by role, delete), event approval/moderation, comprehensive system reports.
