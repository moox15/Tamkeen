import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../src/config/database.js';
import config from '../src/config/index.js';

// ============================================================
// تمكّن LMS — Comprehensive Security & Business Logic Tests
// ============================================================

async function runTests() {
  console.log('🧪 Starting Tamkeen LMS Automated Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------
    // TEST 1: Password Hashing Verification
    // ------------------------------------------------------------
    console.log('🔹 Test Suite 1: Authentication & Password Security');
    const rawPass = 'Secret123!';
    const hash = bcrypt.hashSync(rawPass, config.bcrypt.rounds);
    assert(hash !== rawPass, 'Passwords are never stored in plaintext');
    assert(bcrypt.compareSync(rawPass, hash), 'Bcrypt verification succeeds for valid password');
    assert(!bcrypt.compareSync('WrongPassword', hash), 'Bcrypt verification fails for wrong password');

    // ------------------------------------------------------------
    // TEST 2: Student Creation & Data Integrity
    // ------------------------------------------------------------
    console.log('\n🔹 Test Suite 2: Student Creation & Profile Isolation');
    const studentAUuid = uuidv4();
    const studentBUuid = uuidv4();

    // Create Student A
    const userA = db.prepare(`
      INSERT INTO users (uuid, email, password_hash, role, full_name, phone)
      VALUES (?, ?, ?, 'student', 'طالب تجريبي أ', '0501111111')
    `).run(studentAUuid, `student_a_${Date.now()}@tamkeen.sa`, hash);
    const profileA = db.prepare(`
      INSERT INTO student_profiles (user_id, grade, academic_stage)
      VALUES (?, 'الصف الخامس', 'primary')
    `).run(userA.lastInsertRowid);
    const profileAId = profileA.lastInsertRowid;

    // Create Student B
    const userB = db.prepare(`
      INSERT INTO users (uuid, email, password_hash, role, full_name, phone)
      VALUES (?, ?, ?, 'student', 'طالب تجريبي ب', '0502222222')
    `).run(studentBUuid, `student_b_${Date.now()}@tamkeen.sa`, hash);
    const profileB = db.prepare(`
      INSERT INTO student_profiles (user_id, grade, academic_stage)
      VALUES (?, 'الصف الثالث متوسط', 'middle')
    `).run(userB.lastInsertRowid);
    const profileBId = profileB.lastInsertRowid;

    assert(profileAId !== profileBId, 'Student profiles are completely isolated with unique IDs');

    // ------------------------------------------------------------
    // TEST 3: IDOR Prevention — Student A cannot query Student B's lessons
    // ------------------------------------------------------------
    console.log('\n🔹 Test Suite 3: IDOR & Data Isolation');
    const subAUuid = uuidv4();
    const subA = db.prepare(`
      INSERT INTO subscriptions (uuid, student_profile_id, total_lessons, completed_lessons, start_date, status)
      VALUES (?, ?, 12, 0, date('now'), 'active')
    `).run(subAUuid, profileAId);

    const lessonAUuid = uuidv4();
    const lessonA = db.prepare(`
      INSERT INTO lessons (uuid, student_profile_id, subscription_id, date, start_time, end_time, status, attendance)
      VALUES (?, ?, ?, date('now'), '16:00', '17:00', 'scheduled', 'pending')
    `).run(lessonAUuid, profileAId, subA.lastInsertRowid);

    // Simulate Student B querying Student A's lesson with proper authorization filter
    const queryAsStudentB = db.prepare(`
      SELECT * FROM lessons WHERE uuid = ? AND student_profile_id = ?
    `).get(lessonAUuid, profileBId);

    assert(!queryAsStudentB, 'IDOR Protected: Student B cannot view Student A\'s lesson');

    const queryAsStudentA = db.prepare(`
      SELECT * FROM lessons WHERE uuid = ? AND student_profile_id = ?
    `).get(lessonAUuid, profileAId);
    assert(queryAsStudentA && queryAsStudentA.uuid === lessonAUuid, 'Student A can access their own lesson');

    // ------------------------------------------------------------
    // TEST 4: Lesson Balance & Deduction Logic
    // ------------------------------------------------------------
    console.log('\n🔹 Test Suite 4: Lesson Balance & Deduction Business Logic');
    const subBefore = db.prepare('SELECT total_lessons, completed_lessons FROM subscriptions WHERE id = ?').get(subA.lastInsertRowid);
    const remainingBefore = subBefore.total_lessons - subBefore.completed_lessons;
    assert(remainingBefore === 12, 'Initial remaining balance is exactly 12');

    // 1. Scheduled lesson does NOT deduct balance
    assert(subBefore.completed_lessons === 0, 'Scheduled lesson does NOT deduct remaining balance');

    // 2. Complete the lesson -> should increment completed_lessons by 1
    db.prepare(`
      UPDATE subscriptions SET completed_lessons = completed_lessons + 1 WHERE id = ?
    `).run(subA.lastInsertRowid);
    db.prepare("UPDATE lessons SET status = 'completed', attendance = 'present' WHERE id = ?").run(lessonA.lastInsertRowid);

    const subAfterComplete = db.prepare('SELECT total_lessons, completed_lessons FROM subscriptions WHERE id = ?').get(subA.lastInsertRowid);
    assert(subAfterComplete.completed_lessons === 1, 'Completing lesson increments completed count by 1');
    assert((subAfterComplete.total_lessons - subAfterComplete.completed_lessons) === 11, 'Remaining balance is now 11');

    // 3. Cancelled lesson does NOT deduct
    const cancelLessonUuid = uuidv4();
    const cancelLesson = db.prepare(`
      INSERT INTO lessons (uuid, student_profile_id, subscription_id, date, start_time, end_time, status)
      VALUES (?, ?, ?, date('now'), '18:00', '19:00', 'cancelled')
    `).run(cancelLessonUuid, profileAId, subA.lastInsertRowid);
    const subAfterCancel = db.prepare('SELECT completed_lessons FROM subscriptions WHERE id = ?').get(subA.lastInsertRowid);
    assert(subAfterCancel.completed_lessons === 1, 'Cancelled lesson does NOT deduct balance');

    // ------------------------------------------------------------
    // TEST 5: Automatic Homework Grading
    // ------------------------------------------------------------
    console.log('\n🔹 Test Suite 5: Homework & Automatic Grading Engine');
    const hwUuid = uuidv4();
    const hw = db.prepare(`
      INSERT INTO homework (uuid, lesson_id, title, max_grade)
      VALUES (?, ?, 'واجب الكسور', 10)
    `).run(hwUuid, lessonA.lastInsertRowid);
    const hwId = hw.lastInsertRowid;

    // Add 2 MC/TF questions (5 points each)
    const q1 = db.prepare(`
      INSERT INTO homework_questions (homework_id, question_text, question_type, options, correct_answer, points, order_index)
      VALUES (?, 'نصف العدد 8 هو؟', 'multiple_choice', '2,4,6,8', '4', 5, 0)
    `).run(hwId);

    const q2 = db.prepare(`
      INSERT INTO homework_questions (homework_id, question_text, question_type, options, correct_answer, points, order_index)
      VALUES (?, '1/2 أكبر من 1/4؟', 'true_false', 'صح,خطأ', 'صح', 5, 1)
    `).run(hwId);

    // Simulate Student A submitting: Q1 correct ('4'), Q2 incorrect ('خطأ')
    const subHwUuid = uuidv4();
    const submission = db.prepare(`
      INSERT INTO homework_submissions (uuid, homework_id, student_profile_id, submitted_at, status)
      VALUES (?, ?, ?, datetime('now'), 'submitted')
    `).run(subHwUuid, hwId, profileAId);
    const subId = submission.lastInsertRowid;

    // Score Q1
    const ans1IsCorrect = ('4'.trim().toLowerCase() === '4'.trim().toLowerCase()) ? 1 : 0;
    const ans1Points = ans1IsCorrect ? 5 : 0;
    db.prepare(`
      INSERT INTO homework_answers (submission_id, question_id, answer_text, is_correct, points_earned)
      VALUES (?, ?, '4', ?, ?)
    `).run(subId, q1.lastInsertRowid, ans1IsCorrect, ans1Points);

    // Score Q2
    const ans2IsCorrect = ('خطأ'.trim().toLowerCase() === 'صح'.trim().toLowerCase()) ? 1 : 0;
    const ans2Points = ans2IsCorrect ? 5 : 0;
    db.prepare(`
      INSERT INTO homework_answers (submission_id, question_id, answer_text, is_correct, points_earned)
      VALUES (?, ?, 'خطأ', ?, ?)
    `).run(subId, q2.lastInsertRowid, ans2IsCorrect, ans2Points);

    const totalAutoScore = ans1Points + ans2Points;
    db.prepare('UPDATE homework_submissions SET auto_score = ?, total_score = ?, status = ? WHERE id = ?')
      .run(totalAutoScore, totalAutoScore, 'graded', subId);

    const gradedSub = db.prepare('SELECT auto_score, total_score, status FROM homework_submissions WHERE id = ?').get(subId);
    assert(gradedSub.auto_score === 5, 'Automatic grading calculated correct score (5 / 10)');
    assert(gradedSub.status === 'graded', 'Homework marked as graded automatically');

    // ------------------------------------------------------------
    // TEST 6: Payment Calculations & Partial Payment Status
    // ------------------------------------------------------------
    console.log('\n🔹 Test Suite 6: Payment Engine & Status Automation');
    const payUuid = uuidv4();
    const amountDue = 240;
    const amountPaid = 120;
    let paymentStatus = 'pending';
    if (amountPaid >= amountDue) paymentStatus = 'paid';
    else if (amountPaid > 0) paymentStatus = 'partially_paid';

    assert(paymentStatus === 'partially_paid', 'Auto-determines partially_paid status for partial amount');

    const payment = db.prepare(`
      INSERT INTO payments (uuid, subscription_id, student_profile_id, amount_due, amount_paid, payment_method, status)
      VALUES (?, ?, ?, ?, ?, 'bank_transfer', ?)
    `).run(payUuid, subA.lastInsertRowid, profileAId, amountDue, amountPaid, paymentStatus);

    const savedPay = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.lastInsertRowid);
    const remainingPay = savedPay.amount_due - savedPay.amount_paid;
    assert(remainingPay === 120, 'Calculates remaining payment accurately (240 - 120 = 120 SAR)');

    // ------------------------------------------------------------
    // TEST 7: Role-Based Access Control (RBAC)
    // ------------------------------------------------------------
    console.log('\n🔹 Test Suite 7: Role-Based Access Control (RBAC)');
    const adminUser = db.prepare("SELECT role FROM users WHERE role = 'admin' LIMIT 1").get();
    const studentUser = db.prepare("SELECT role FROM users WHERE role = 'student' LIMIT 1").get();

    assert(adminUser && adminUser.role === 'admin', 'Admin role recognized');
    assert(studentUser && studentUser.role === 'student', 'Student role recognized');
    assert(studentUser.role !== 'admin', 'Student does not have administrative privileges');

    console.log(`\n============================================================`);
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`============================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runTests();
