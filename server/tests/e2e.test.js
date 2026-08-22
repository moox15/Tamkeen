import config from '../src/config/index.js';

// End-to-End HTTP Integration Test Suite
const BASE_URL = 'http://localhost:3001/api';

async function runE2ETests() {
  console.log('🚀 Running End-to-End HTTP API Workflow Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  let adminCookie = '';
  let adminCsrf = '';
  let studentCookie = '';
  let studentCsrf = '';
  let studentUuid = '';
  let studentEmail = `student_${Date.now()}@tamkeen.sa`;
  let studentPass = 'Student@123456';
  let createdLessonUuid = '';
  let createdHwUuid = '';
  let studentProfileId = null;

  try {
    // ------------------------------------------------------------
    // STEP 1: Admin Login
    // ------------------------------------------------------------
    console.log('🔹 Step 1: Admin Login');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@tamkeen.sa', password: 'Admin@123456' }),
    });
    
    assert(adminLoginRes.status === 200, 'Admin login returns 200 OK');
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.user.role === 'admin', 'Admin user role returned in response');
    assert(adminLoginData.user.email === 'admin@tamkeen.sa', 'Admin email verified');
    
    const setCookie = adminLoginRes.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
    adminCsrf = adminLoginData.csrfToken;

    // ------------------------------------------------------------
    // STEP 2: Admin Dashboard Stats
    // ------------------------------------------------------------
    console.log('\n🔹 Step 2: Fetch Admin Dashboard KPIs');
    const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: {
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf,
      },
    });
    assert(dashRes.status === 200, 'Admin dashboard returns 200 OK');
    const dashData = await dashRes.json();
    assert(typeof dashData.totalStudents === 'number', 'KPI statistics totalStudents present');
    assert(typeof dashData.activeSubscriptions === 'number', 'KPI statistics activeSubscriptions present');

    // ------------------------------------------------------------
    // STEP 3: Admin Creates Student
    // ------------------------------------------------------------
    console.log('\n🔹 Step 3: Admin Creates Student');
    const createStudRes = await fetch(`${BASE_URL}/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf,
      },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPass,
        full_name: 'فيصل السبيعي',
        phone: '0551234567',
        grade: 'الصف الأول متوسط',
        academic_stage: 'middle',
        notes: 'طالب متميز في الرياضيات',
        subject_ids: [1, 2],
      }),
    });
    assert(createStudRes.status === 201, 'Student created successfully with 201 Created');
    const createStudData = await createStudRes.json();
    studentUuid = createStudData.uuid;
    assert(!!studentUuid, 'Student UUID returned');

    // Fetch created student details
    const studentDetailRes = await fetch(`${BASE_URL}/admin/students/${studentUuid}`, {
      headers: { 'Cookie': adminCookie, 'X-CSRF-Token': adminCsrf },
    });
    assert(studentDetailRes.status === 200, 'Admin fetches student details');
    const studentDetailData = await studentDetailRes.json();
    studentProfileId = studentDetailData.profile.id;
    assert(studentDetailData.user.full_name === 'فيصل السبيعي', 'Student name matches input');

    // ------------------------------------------------------------
    // STEP 4: Admin Creates Package & Subscription
    // ------------------------------------------------------------
    console.log('\n🔹 Step 4: Admin Assigns Subscription');
    const subRes = await fetch(`${BASE_URL}/admin/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf,
      },
      body: JSON.stringify({
        student_profile_id: studentProfileId,
        total_lessons: 12,
        start_date: '2026-08-22',
        status: 'active',
        notes: 'باقة 12 حصة فردية',
      }),
    });
    assert(subRes.status === 201, 'Subscription created successfully (12 lessons)');

    // ------------------------------------------------------------
    // STEP 5: Admin Records Payment
    // ------------------------------------------------------------
    console.log('\n🔹 Step 5: Admin Records Payment');
    const payRes = await fetch(`${BASE_URL}/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf,
      },
      body: JSON.stringify({
        student_profile_id: studentProfileId,
        amount_due: 240,
        amount_paid: 240,
        payment_date: '2026-08-22',
        payment_method: 'bank_transfer',
        status: 'paid',
        notes: 'تم التحويل لحساب الراجحي',
      }),
    });
    assert(payRes.status === 201, 'Payment recorded successfully (240 SAR Paid)');

    // ------------------------------------------------------------
    // STEP 6: Admin Schedules Lesson
    // ------------------------------------------------------------
    console.log('\n🔹 Step 6: Admin Schedules Lesson');
    const lessonRes = await fetch(`${BASE_URL}/admin/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf,
      },
      body: JSON.stringify({
        student_profile_id: studentProfileId,
        subject_id: 1, // الرياضيات
        date: '2026-08-23',
        start_time: '17:00',
        end_time: '18:00',
        title: 'العمليات على الأعداد الصحيحة',
        meeting_link: 'https://zoom.us/j/123456789',
        notes: 'مراجعة الفصل الأول',
      }),
    });
    assert(lessonRes.status === 201, 'Lesson scheduled successfully');
    const lessonData = await lessonRes.json();
    createdLessonUuid = lessonData.uuid;

    // Get lesson ID for homework creation
    const lessonDetailRes = await fetch(`${BASE_URL}/admin/lessons/${createdLessonUuid}`, {
      headers: { 'Cookie': adminCookie, 'X-CSRF-Token': adminCsrf },
    });
    const lessonDetail = await lessonDetailRes.json();
    const lessonId = lessonDetail.lesson.id;

    // ------------------------------------------------------------
    // STEP 7: Admin Creates Homework
    // ------------------------------------------------------------
    console.log('\n🔹 Step 7: Admin Creates Homework with Questions');
    const hwRes = await fetch(`${BASE_URL}/admin/homework`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf,
      },
      body: JSON.stringify({
        lesson_id: lessonId,
        title: 'واجب الأعداد الصحيحة',
        description: 'أجب عن الأسئلة بدقة',
        due_date: '2026-08-25',
        max_grade: 10,
        questions: [
          {
            question_text: 'ناتج (-5) + 8 يساوي:',
            question_type: 'multiple_choice',
            options: '3, -3, 13, -13',
            correct_answer: '3',
            points: 5,
            order_index: 0,
          },
          {
            question_text: 'العدد الصفر هو عدد موجب وسالب معاً:',
            question_type: 'true_false',
            options: 'صح, خطأ',
            correct_answer: 'خطأ',
            points: 5,
            order_index: 1,
          },
        ],
      }),
    });
    assert(hwRes.status === 201, 'Homework created with auto-gradable questions');
    const hwData = await hwRes.json();
    createdHwUuid = hwData.uuid;

    // ------------------------------------------------------------
    // STEP 8: Student Login
    // ------------------------------------------------------------
    console.log('\n🔹 Step 8: Student Login & Session Verification');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: studentPass }),
    });
    assert(studentLoginRes.status === 200, 'Student logs in successfully');
    const studentLoginData = await studentLoginRes.json();
    assert(studentLoginData.user.role === 'student', 'Student role verified');
    
    const setStudentCookie = studentLoginRes.headers.get('set-cookie');
    if (setStudentCookie) {
      studentCookie = setStudentCookie.split(';')[0];
    }
    studentCsrf = studentLoginData.csrfToken;

    // ------------------------------------------------------------
    // STEP 9: Student Views Dashboard
    // ------------------------------------------------------------
    console.log('\n🔹 Step 9: Student Fetches Own Dashboard');
    const sDashRes = await fetch(`${BASE_URL}/student/dashboard`, {
      headers: { 'Cookie': studentCookie, 'X-CSRF-Token': studentCsrf },
    });
    assert(sDashRes.status === 200, 'Student dashboard 200 OK');
    const sDashData = await sDashRes.json();
    assert(sDashData.activeSub.total_lessons === 12, 'Student sees 12 purchased lessons');
    assert(sDashData.activeSub.remaining_lessons === 12, 'Student sees 12 remaining lessons before completion');

    // ------------------------------------------------------------
    // STEP 10: Student Submits Homework & Tests Auto-Grading
    // ------------------------------------------------------------
    console.log('\n🔹 Step 10: Student Submits Homework & Tests Auto-Grading Engine');
    const sHwDetailRes = await fetch(`${BASE_URL}/student/homework/${createdHwUuid}`, {
      headers: { 'Cookie': studentCookie, 'X-CSRF-Token': studentCsrf },
    });
    const sHwDetail = await sHwDetailRes.json();
    const q1Id = sHwDetail.questions[0].id;
    const q2Id = sHwDetail.questions[1].id;

    // Student answers Q1 correctly ('3') and Q2 correctly ('خطأ') -> expect 10/10
    const submitRes = await fetch(`${BASE_URL}/student/homework/${createdHwUuid}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
        'X-CSRF-Token': studentCsrf,
      },
      body: JSON.stringify({
        answers: [
          { question_id: q1Id, answer_text: '3' },
          { question_id: q2Id, answer_text: 'خطأ' },
        ],
      }),
    });
    assert(submitRes.status === 201, 'Homework submitted successfully');
    const submitData = await submitRes.json();
    assert(submitData.autoScore === 10, 'Auto-grading engine calculated full marks: 10 / 10');

    // ------------------------------------------------------------
    // STEP 11: Admin Marks Lesson Completed & Tests Lesson Deduction
    // ------------------------------------------------------------
    console.log('\n🔹 Step 11: Admin Completes Lesson -> Verifies Lesson Balance Deducted');
    const completeLessonRes = await fetch(`${BASE_URL}/admin/lessons/${createdLessonUuid}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
        'X-CSRF-Token': adminCsrf,
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(completeLessonRes.status === 200, 'Lesson marked completed by Admin');

    // Student verifies updated remaining balance (11 remaining out of 12)
    const updatedSubRes = await fetch(`${BASE_URL}/student/subscription`, {
      headers: { 'Cookie': studentCookie, 'X-CSRF-Token': studentCsrf },
    });
    const updatedSubs = await updatedSubRes.json();
    assert(updatedSubs[0].completed_lessons === 1, 'Completed lessons count updated to 1');
    assert(updatedSubs[0].remaining_lessons === 11, 'Remaining lessons balance updated to 11 (12 - 1 = 11)');

    // ------------------------------------------------------------
    // STEP 12: Security Isolation / RBAC Test
    // ------------------------------------------------------------
    console.log('\n🔹 Step 12: Security Tests (RBAC & Endpoint Protection)');
    const unauthorizedAdminAccess = await fetch(`${BASE_URL}/admin/students`, {
      headers: { 'Cookie': studentCookie, 'X-CSRF-Token': studentCsrf },
    });
    assert(unauthorizedAdminAccess.status === 403, 'RBAC Protected: Student cannot access Admin endpoint (403 Forbidden)');

    console.log(`\n============================================================`);
    console.log(`🎉 End-to-End Verification Complete: ${passed} Passed, ${failed} Failed`);
    console.log(`============================================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('❌ E2E Execution Error:', err);
    process.exit(1);
  }
}

runE2ETests();
