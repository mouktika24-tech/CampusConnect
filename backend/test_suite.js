// Comprehensive Test Suite for CampusConnect College Event Management System
// Uses native Node.js fetch (zero dependencies)

const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = `${BASE_URL}${url}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(fullUrl, config);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running CampusConnect Verification Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TC01: Valid Login for all roles
    // -------------------------------------------------------------
    const adminLogin = await req('/login', {
      method: 'POST',
      body: { email: 'admin@cc.edu', password: 'admin123', role: 'Admin' }
    });
    assert(adminLogin.status === 200 && adminLogin.data.role === 'Admin', 'TC01: Valid admin login succeeds');

    const clubLogin = await req('/login', {
      method: 'POST',
      body: { email: 'club@cc.edu', password: 'club123', role: 'Club Head' }
    });
    assert(clubLogin.status === 200 && clubLogin.data.role === 'Club Head', 'TC01: Valid organizer login succeeds');

    const facultyLogin = await req('/login', {
      method: 'POST',
      body: { email: 'faculty@cc.edu', password: 'faculty123', role: 'Faculty Coordinator' }
    });
    assert(facultyLogin.status === 200 && facultyLogin.data.role === 'Faculty Coordinator', 'TC01: Valid faculty coordinator login succeeds');

    const volunteerLogin = await req('/login', {
      method: 'POST',
      body: { email: 'volunteer@cc.edu', password: 'volunteer123', role: 'Volunteer' }
    });
    assert(volunteerLogin.status === 200 && volunteerLogin.data.role === 'Volunteer', 'TC01: Valid volunteer login succeeds');

    // -------------------------------------------------------------
    // TC02: Invalid Login
    // -------------------------------------------------------------
    const invalidLogin = await req('/login', {
      method: 'POST',
      body: { email: 'admin@cc.edu', password: 'wrongpassword', role: 'Admin' }
    });
    assert(invalidLogin.status === 401, 'TC02: Invalid login returns 401 Unauthorized');

    // -------------------------------------------------------------
    // TC03: Student User Registration
    // -------------------------------------------------------------
    const testStudentEmail = `teststudent_${Date.now()}@cc.edu`;
    const studentReg = await req('/register-user', {
      method: 'POST',
      body: {
        name: 'Test Student John',
        email: testStudentEmail,
        password: 'password123',
        role: 'Student',
        department: 'Computer Science',
        studentId: 'CS-2026-999'
      }
    });
    assert(studentReg.status === 201 && studentReg.data.email === testStudentEmail, 'TC03: Student registration succeeds');
    const testStudent = studentReg.data;

    // -------------------------------------------------------------
    // TC04: Event Creation by Organizer (Pending status)
    // -------------------------------------------------------------
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const deadlineDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    const eventPayload = {
      name: 'Robotics Workshop 2026',
      description: 'Hands-on robotics and IoT workshop for students.',
      datetime: futureDate.toISOString(),
      registrationDeadline: deadlineDate.toISOString(),
      venue: 'Robotics Lab 3',
      category: 'Technical',
      capacity: 2, // low capacity to test full event
      club_id: clubLogin.data._id
    };

    const createdEventRes = await req('/events', {
      method: 'POST',
      body: eventPayload
    });
    const createdEvent = createdEventRes.data;
    assert(createdEventRes.status === 201 && createdEvent.status === 'Pending', 'TC04: Organizer creates event with Pending status');

    // -------------------------------------------------------------
    // TC05: Event Approval by Faculty
    // -------------------------------------------------------------
    // Attempt registration before approval
    const preReg = await req('/register', {
      method: 'POST',
      body: { student_id: testStudent._id, event_id: createdEvent._id }
    });
    assert(preReg.status === 400 && preReg.data.message.includes('Pending'), 'TC05: Registration rejected for Pending event');

    // Faculty approves event
    const approveRes = await req(`/events/${createdEvent._id}/status`, {
      method: 'PUT',
      body: { status: 'Approved', approvedBy: facultyLogin.data._id }
    });
    assert(approveRes.status === 200 && approveRes.data.status === 'Approved', 'TC05: Faculty Coordinator approves event');

    // -------------------------------------------------------------
    // TC06: Student Views Available Events
    // -------------------------------------------------------------
    const eventsListRes = await req('/events');
    const foundApproved = eventsListRes.data.some(e => e._id === createdEvent._id);
    assert(eventsListRes.status === 200 && foundApproved, 'TC06: Approved event is visible in available events list');

    // -------------------------------------------------------------
    // TC07: Successful Registration
    // -------------------------------------------------------------
    const regRes = await req('/register', {
      method: 'POST',
      body: { student_id: testStudent._id, event_id: createdEvent._id }
    });
    assert(regRes.status === 201 && regRes.data.status === 'Registered', 'TC07: Student successfully registers for approved open event');
    const firstRegistration = regRes.data;

    // -------------------------------------------------------------
    // TC08: Duplicate Registration Prevention
    // -------------------------------------------------------------
    const dupReg = await req('/register', {
      method: 'POST',
      body: { student_id: testStudent._id, event_id: createdEvent._id }
    });
    assert(dupReg.status === 400 && dupReg.data.message.includes('already registered'), 'TC08: Duplicate registration prevented with 400 status');

    // -------------------------------------------------------------
    // TC09: Capacity / Event Full Validation
    // -------------------------------------------------------------
    // Register 2nd student (reaches capacity of 2)
    const secondStudentEmail = `teststudent2_${Date.now()}@cc.edu`;
    const student2 = (await req('/register-user', {
      method: 'POST',
      body: { name: 'Second Student', email: secondStudentEmail, password: 'password123', role: 'Student' }
    })).data;

    await req('/register', {
      method: 'POST',
      body: { student_id: student2._id, event_id: createdEvent._id }
    });

    // 3rd student attempt
    const thirdStudentEmail = `teststudent3_${Date.now()}@cc.edu`;
    const student3 = (await req('/register-user', {
      method: 'POST',
      body: { name: 'Third Student', email: thirdStudentEmail, password: 'password123', role: 'Student' }
    })).data;

    const fullReg = await req('/register', {
      method: 'POST',
      body: { student_id: student3._id, event_id: createdEvent._id }
    });
    assert(fullReg.status === 400 && fullReg.data.message.includes('full capacity'), 'TC09: Event full validation rejects registration');

    // -------------------------------------------------------------
    // TC10: Registration Deadline Validation
    // -------------------------------------------------------------
    const expiredEvent = (await req('/events', {
      method: 'POST',
      body: {
        name: 'Expired Event',
        description: 'Past deadline test',
        datetime: futureDate.toISOString(),
        registrationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Hall B',
        status: 'Approved',
        club_id: clubLogin.data._id
      }
    })).data;

    const expiredReg = await req('/register', {
      method: 'POST',
      body: { student_id: student3._id, event_id: expiredEvent._id }
    });
    assert(expiredReg.status === 400 && expiredReg.data.message.includes('closed'), 'TC10: Deadline validation rejects registration');

    // -------------------------------------------------------------
    // TC11: Attendance Marking & Registration Verification
    // -------------------------------------------------------------
    // Unregistered student attendance should be rejected
    const nonRegStudent = (await req('/register-user', {
      method: 'POST',
      body: { name: 'Unregistered Student', email: `unreg_${Date.now()}@cc.edu`, password: 'password123', role: 'Student' }
    })).data;

    const nonRegAtt = await req('/attendance', {
      method: 'POST',
      body: {
        student_id: nonRegStudent._id,
        event_id: createdEvent._id,
        status: 'Present',
        markedBy: volunteerLogin.data._id
      }
    });
    assert(nonRegAtt.status === 400 && nonRegAtt.data.message.includes('not registered'), 'TC11: Attendance rejected for unregistered student');

    // Registered student attendance marking succeeds
    const validAtt = await req('/attendance', {
      method: 'POST',
      body: {
        student_id: testStudent._id,
        event_id: createdEvent._id,
        status: 'Present',
        markedBy: volunteerLogin.data._id
      }
    });
    assert(validAtt.status === 200 && validAtt.data.status === 'Present', 'TC11: Volunteer marks registered student Present');

    // -------------------------------------------------------------
    // TC12: Faculty Coordinator Verifies Attendance
    // -------------------------------------------------------------
    const verifyAtt = await req(`/attendance/verify/${createdEvent._id}`, {
      method: 'PUT',
      body: { verifiedBy: facultyLogin.data._id }
    });
    assert(verifyAtt.status === 200 && verifyAtt.data.modifiedCount > 0, 'TC12: Faculty Coordinator certifies attendance records');

    // -------------------------------------------------------------
    // TC13: Feedback Submission & Duplicate Prevention
    // -------------------------------------------------------------
    // Attended student feedback succeeds
    const feedbackRes = await req('/feedback', {
      method: 'POST',
      body: {
        event_id: createdEvent._id,
        student_id: testStudent._id,
        rating: 5,
        comments: 'Outstanding hands-on session with great mentors!'
      }
    });
    assert(feedbackRes.status === 201 && feedbackRes.data.rating === 5, 'TC13: Attended student successfully submits feedback rating & comments');

    // Duplicate feedback prevented
    const dupFeedback = await req('/feedback', {
      method: 'POST',
      body: {
        event_id: createdEvent._id,
        student_id: testStudent._id,
        rating: 4,
        comments: 'Duplicate attempt'
      }
    });
    assert(dupFeedback.status === 400, 'TC13: Duplicate feedback prevented');

    // Non-attending student feedback blocked
    const nonAttFeedback = await req('/feedback', {
      method: 'POST',
      body: {
        event_id: createdEvent._id,
        student_id: student2._id, // registered but not marked Present
        rating: 3,
        comments: 'I did not attend'
      }
    });
    assert(nonAttFeedback.status === 403, 'TC13: Non-attending student feedback blocked with 403 Forbidden');

    // -------------------------------------------------------------
    // TC14: Notifications Delivery
    // -------------------------------------------------------------
    const notifs = await req(`/notifications/${testStudent._id}`);
    assert(notifs.status === 200 && notifs.data.length > 0, 'TC14: In-app confirmation & attendance notifications delivered to student');

    // -------------------------------------------------------------
    // TC15: Registration Cancellation & Seat Release
    // -------------------------------------------------------------
    const cancelRes = await req(`/register/${firstRegistration._id}`, {
      method: 'DELETE'
    });
    assert(cancelRes.status === 200, 'TC15: Student successfully cancels registration');

    const refreshedEvent = (await req(`/events/${createdEvent._id}`)).data;
    assert(refreshedEvent.availableSeats > 0, 'TC15: Available seat count properly restores after cancellation');

    // -------------------------------------------------------------
    // TC16: Reports Overview Generation
    // -------------------------------------------------------------
    const reportsRes = await req('/reports/overview');
    assert(reportsRes.status === 200 && reportsRes.data.events.length > 0, 'TC16: Institutional reports overview generated with statistics');

    // -------------------------------------------------------------
    // TC17: Admin User Management
    // -------------------------------------------------------------
    const usersRes = await req('/users');
    assert(usersRes.status === 200 && usersRes.data.length >= 5, 'TC17: Admin user management lists all system users');

    // -------------------------------------------------------------
    // TC18: Custom Announcement Broadcast
    // -------------------------------------------------------------
    const announceRes = await req(`/events/${createdEvent._id}/announcement`, {
      method: 'POST',
      body: {
        title: 'Room Change',
        message: 'Workshop has moved to Hall 101'
      }
    });
    assert(announceRes.status === 200, 'TC18: Organizer broadcasts custom announcement to participants');

    // Cleanup test events
    await req(`/events/${expiredEvent._id}`, { method: 'DELETE' });
    await req(`/events/${createdEvent._id}`, { method: 'DELETE' });

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

  } catch (err) {
    console.error('Fatal Test Execution Error:', err.message);
    process.exit(1);
  }
}

runTests();
