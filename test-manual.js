#!/usr/bin/env node

/**
 * Manual Test Suite for Designathon API
 * Tests all endpoints: Authentication, Users, Courses, Feedback, Analytics, Admin
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000";
let authToken = null;
let supervisorToken = null;
let maverickToken = null;
let testUserId = null;
let testCourseId = null;
let testSessionId = null;
let testFeedbackCycleId = null;
let testTrainerId = null;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    log(`\n▶ Testing: ${name}`, "blue");
    await fn();
    log(`✅ PASS: ${name}`, "green");
    return true;
  } catch (error) {
    log(`❌ FAIL: ${name}`, "red");
    if (error.response?.data) {
      log(`   Error: ${JSON.stringify(error.response.data)}`, "red");
    } else {
      log(`   Error: ${error.message}`, "red");
    }
    return false;
  }
}

// ============ AUTHENTICATION TESTS ============

async function testAuthentication() {
  log("\n\n========== AUTHENTICATION TESTS ==========", "yellow");

  // Test login with seeded admin user
  await test("Login with admin credentials", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "admin@maverick360.com",
      password: "Admin@123",
    });
    authToken = res.data.accessToken;
    log(`   Token received: ${authToken.substring(0, 20)}...`, "yellow");
  });

  // Test GET /me
  await test("GET /me (current user)", async () => {
    const res = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   User: ${res.data.email} (${res.data.role})`, "yellow");
  });

  // Test login with supervisor
  await test("Login with supervisor credentials", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "supervisor@maverick360.com",
      password: "Supervisor@123",
    });
    supervisorToken = res.data.accessToken;
    log(`   Supervisor token received`, "yellow");
  });

  // Test login with maverick
  await test("Login with maverick credentials", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "maverick@maverick360.com",
      password: "Maverick@123",
    });
    maverickToken = res.data.accessToken;
    log(`   Maverick token received`, "yellow");
  });

  // Test OTP request
  await test("OTP request", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/otp/request`, {
      email: "admin@maverick360.com",
    });
    log(`   OTP sent to: ${res.data.email}`, "yellow");
  });
}

// ============ USER MANAGEMENT TESTS ============

async function testUserManagement() {
  log("\n\n========== USER MANAGEMENT TESTS ==========", "yellow");

  await test("List users with pagination", async () => {
    const res = await axios.get(`${BASE_URL}/api/users?page=1&pageSize=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(
      `   Found ${res.data.data?.length || 0} users, Total: ${res.data.total}`,
      "yellow",
    );
  });

  await test("Create new user", async () => {
    const res = await axios.post(
      `${BASE_URL}/api/users`,
      {
        email: `testuser_${Date.now()}@test.com`,
        password: "TestPass123!",
        name: `Test User ${Date.now()}`,
        employeeId: `EMP${Date.now()}`,
        role: "User",
        mobile: "9999999999",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    testUserId = res.data.id;
    log(`   Created user: ${res.data.email}`, "yellow");
  });

  if (testUserId) {
    await test("Get single user", async () => {
      const res = await axios.get(`${BASE_URL}/api/users/${testUserId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log(`   User: ${res.data.email}`, "yellow");
    });

    await test("Update user details", async () => {
      const res = await axios.put(
        `${BASE_URL}/api/users/${testUserId}`,
        {
          name: `Updated User ${Date.now()}`,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      log(`   Updated: ${res.data.name}`, "yellow");
    });

    await test("Change user status", async () => {
      const res = await axios.patch(
        `${BASE_URL}/api/users/${testUserId}/status`,
        {
          status: "Active",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      log(`   Status: ${res.data.status}`, "yellow");
    });
  }

  await test("Get supervisor mapping", async () => {
    const res = await axios.get(`${BASE_URL}/api/users/supervisor-mapping`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(
      `   Found ${Object.keys(res.data).length} supervisor mappings`,
      "yellow",
    );
  });
}

// ============ COURSES & SESSIONS TESTS ============

async function testCoursesAndSessions() {
  log("\n\n========== COURSES & SESSIONS TESTS ==========", "yellow");

  await test("Create course", async () => {
    const res = await axios.post(
      `${BASE_URL}/api/master/courses`,
      {
        name: `Test Course ${Date.now()}`,
        type: "SoftSkills",
        trainerType: "Internal",
        domain: "Leadership",
        objectives: "Test course for validation",
        durationDays: 5,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    testCourseId = res.data.id;
    log(`   Course created: ${res.data.name}`, "yellow");
  });

  await test("List courses", async () => {
    const res = await axios.get(`${BASE_URL}/api/master/courses`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Found ${res.data.length || 0} courses`, "yellow");
  });

  // Fetch trainer ID for session creation
  await test("Get trainers", async () => {
    const res = await axios.get(`${BASE_URL}/api/master/trainers`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.data.length > 0) {
      testTrainerId = res.data[0].id;
      log(`   Found trainer: ${res.data[0].name}`, "yellow");
    } else {
      throw new Error("No trainers found");
    }
  });

  if (testCourseId && testTrainerId) {
    await test("Create session", async () => {
      const res = await axios.post(
        `${BASE_URL}/api/master/sessions`,
        {
          courseId: testCourseId,
          trainerId: testTrainerId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          location: "Conference Room A",
          capacity: 20,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      testSessionId = res.data.id;
      log(`   Session created: ${res.data.id}`, "yellow");
    });

    await test("List sessions", async () => {
      const res = await axios.get(`${BASE_URL}/api/master/sessions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      log(`   Found ${res.data.length || 0} sessions`, "yellow");
    });
  }
}

// ============ FEEDBACK TESTS ============

async function testFeedback() {
  log("\n\n========== FEEDBACK TESTS ==========", "yellow");

  let testMaverickFormId = null;
  let testSupervisorFormId = null;

  await test("Get feedback cycles", async () => {
    const res = await axios.get(`${BASE_URL}/api/feedback/cycles`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Found ${res.data.length || 0} cycles`, "yellow");
    if (res.data.length > 0) {
      testFeedbackCycleId = res.data[0].id;
    }
  });

  await test("List Maverick forms", async () => {
    const res = await axios.get(`${BASE_URL}/api/feedback/maverick`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Found ${res.data.length || 0} forms`, "yellow");
    if (res.data.length > 0) {
      testMaverickFormId = res.data[0].id;
    }
  });

  await test("Update Maverick feedback form (draft)", async () => {
    if (!testMaverickFormId) throw new Error("No Maverick form found");
    const res = await axios.put(
      `${BASE_URL}/api/feedback/maverick/${testMaverickFormId}/draft`,
      {
        overallRating: 4,
        keyLearnings: "Great course content",
        suggestedImprovements: "More interactive sessions",
        followUpResponse: "Will apply learnings",
      },
      {
        headers: { Authorization: `Bearer ${maverickToken}` },
      },
    );
    log(`   Form updated: ${res.data.savedAt}`, "yellow");
  });

  await test("Submit Maverick feedback form", async () => {
    if (!testMaverickFormId) throw new Error("No Maverick form found");
    const res = await axios.post(
      `${BASE_URL}/api/feedback/maverick/${testMaverickFormId}/submit`,
      {
        overallRating: 4,
        keyLearnings: "Great course content",
        suggestedImprovements: "More interactive sessions",
        followUpResponse: "Will apply learnings",
      },
      {
        headers: { Authorization: `Bearer ${maverickToken}` },
      },
    );
    log(`   Form submitted: ${res.data.formId}`, "yellow");
  });

  await test("List Supervisor forms", async () => {
    const res = await axios.get(`${BASE_URL}/api/feedback/supervisor`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Found ${res.data.length || 0} supervisor forms`, "yellow");
    if (res.data.length > 0) {
      testSupervisorFormId = res.data[0].id;
    }
  });

  await test("Submit Supervisor evaluation", async () => {
    if (!testSupervisorFormId) throw new Error("No Supervisor form found");
    const res = await axios.post(
      `${BASE_URL}/api/feedback/supervisor/${testSupervisorFormId}/submit`,
      {
        technicalScore: 4,
        softSkillsScore: 5,
        projectPerformScore: 4,
        teamCollabScore: 5,
        overallReadinessScore: 4,
        comments: "Excellent performance and engagement",
        futureTrainingRecs: ["Advanced leadership module"],
      },
      {
        headers: { Authorization: `Bearer ${supervisorToken}` },
      },
    );
    log(`   Evaluation submitted: ${res.data.formId}`, "yellow");
  });
}

// ============ ANALYTICS TESTS ============

async function testAnalytics() {
  log("\n\n========== ANALYTICS TESTS ==========", "yellow");

  await test("Dashboard overview", async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/overview`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Active sessions: ${res.data.activeSessions}`, "yellow");
    log(`   Closed cycles: ${res.data.closedCycles}`, "yellow");
    log(`   Total submissions: ${res.data.totalSubmissions}`, "yellow");
    log(`   Overdue cycles: ${res.data.overdueCycles}`, "yellow");
  });

  await test("Leaderboard", async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/leaderboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Top performers: ${res.data.length || 0}`, "yellow");
  });

  await test("Report export (JSON)", async () => {
    const res = await axios.get(
      `${BASE_URL}/api/analytics/report?format=json`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    log(`   Report generated`, "yellow");
  });
}

// ============ ADMIN TESTS ============

async function testAdmin() {
  log("\n\n========== ADMIN TESTS ==========", "yellow");

  await test("Get audit logs", async () => {
    const res = await axios.get(`${BASE_URL}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Found ${res.data.data.length || 0} audit entries`, "yellow");
  });

  await test("Get notifications", async () => {
    const res = await axios.get(`${BASE_URL}/api/notifications?pageSize=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    log(`   Found ${res.data.data.length || 0} notifications`, "yellow");
  });

  await test("Mark notification as read", async () => {
    const res = await axios.get(`${BASE_URL}/api/notifications?pageSize=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const notification = res.data.data?.[0];
    if (!notification) return;
    const updateRes = await axios.patch(
      `${BASE_URL}/api/notifications/${notification.id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    log(`   Marked as read at ${updateRes.data.readAt}`, "yellow");
  });
}

async function runAllTests() {
  log("║  DESIGNATHON MANUAL TEST SUITE        ║", "blue");
  log("║  Testing all API endpoints            ║", "blue");
  log("╚════════════════════════════════════════╝", "blue");

  try {
    await test("Server connectivity", async () => {
      await axios.get(`${BASE_URL}/api/health`);
    });
  } catch (e) {
    log(
      "⚠️  Server not responding. Make sure to run: cd backend && npm run dev",
      "red",
    );
    process.exit(1);
  }

  await testAuthentication();
  await testUserManagement();
  await testCoursesAndSessions();
  await testFeedback();
  await testAnalytics();
  await testAdmin();

  log("\n\n╔════════════════════════════════════════╗", "blue");
  log("║  TEST SUITE COMPLETED                 ║", "blue");
  log("╚════════════════════════════════════════╝", "blue");
  log("\nNote: Some tests may fail if prerequisites are not met.", "yellow");
  log("Check the backend logs for detailed error information.\n", "yellow");
}

runAllTests().catch((err) => {
  log(`\nFatal error: ${err.message}`, "red");
  process.exit(1);
});
