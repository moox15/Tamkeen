import { z } from 'zod';

// ============================================================
// AUTH SCHEMAS
// ============================================================
export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

// ============================================================
// STUDENT SCHEMAS
// ============================================================
export const createStudentSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  full_name: z.string().min(2, 'الاسم الكامل مطلوب'),
  phone: z.string().optional(),
  grade: z.string().min(1, 'الصف مطلوب'),
  academic_stage: z.enum(['primary', 'middle', 'high'], { message: 'المرحلة الدراسية غير صالحة' }),
  notes: z.string().optional(),
  subject_ids: z.array(z.number()).optional(),
});

export const updateStudentSchema = z.object({
  full_name: z.string().min(2, 'الاسم الكامل مطلوب').optional(),
  phone: z.string().optional(),
  grade: z.string().optional(),
  academic_stage: z.enum(['primary', 'middle', 'high']).optional(),
  notes: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  subject_ids: z.array(z.number()).optional(),
});

// ============================================================
// TEACHER SCHEMAS
// ============================================================
export const createTeacherSchema = z.object({
  full_name: z.string().min(2, 'اسم المعلم مطلوب'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  specialization: z.string().optional(),
  notes: z.string().optional(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

// ============================================================
// LESSON SCHEMAS
// ============================================================
export const createLessonSchema = z.object({
  student_profile_id: z.number({ message: 'الطالب مطلوب' }),
  subject_id: z.number({ message: 'المادة مطلوبة' }),
  teacher_id: z.number().optional(),
  subscription_id: z.number().optional(),
  title: z.string().optional(),
  date: z.string().min(1, 'التاريخ مطلوب'),
  start_time: z.string().min(1, 'وقت البداية مطلوب'),
  end_time: z.string().min(1, 'وقت النهاية مطلوب'),
  meeting_link: z.string().optional(),
  notes: z.string().optional(),
  admin_notes: z.string().optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const updateLessonStatusSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled'], {
    message: 'حالة الحصة غير صالحة',
  }),
});

export const updateAttendanceSchema = z.object({
  attendance: z.enum(['present', 'absent', 'excused', 'pending'], {
    message: 'حالة الحضور غير صالحة',
  }),
});

// ============================================================
// HOMEWORK SCHEMAS
// ============================================================
export const createHomeworkSchema = z.object({
  lesson_id: z.number({ message: 'الحصة مطلوبة' }),
  title: z.string().min(1, 'عنوان الواجب مطلوب'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  max_grade: z.number().min(0).default(100),
  questions: z.array(z.object({
    question_text: z.string().min(1, 'نص السؤال مطلوب'),
    question_type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'file_upload']),
    options: z.string().optional(),
    correct_answer: z.string().optional(),
    points: z.number().min(0).default(1),
    order_index: z.number().default(0),
  })).min(1, 'يجب إضافة سؤال واحد على الأقل'),
});

export const gradeSubmissionSchema = z.object({
  manual_score: z.number().min(0).optional(),
  total_score: z.number().min(0).optional(),
  feedback: z.string().optional(),
  question_grades: z.array(z.object({
    question_id: z.number(),
    points_earned: z.number().min(0),
    is_correct: z.number().optional().nullable(),
  })).optional(),
});

export const submitHomeworkSchema = z.object({
  answers: z.array(z.object({
    question_id: z.number(),
    answer_text: z.string().optional(),
  })),
});

// ============================================================
// SUBSCRIPTION SCHEMAS
// ============================================================
export const createSubscriptionSchema = z.object({
  student_profile_id: z.number({ message: 'الطالب مطلوب' }),
  package_id: z.number().optional(),
  total_lessons: z.number().min(1, 'عدد الحصص مطلوب'),
  start_date: z.string().min(1, 'تاريخ البداية مطلوب'),
  expiry_date: z.string().optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'completed', 'pending_payment']).default('active'),
  notes: z.string().optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

// ============================================================
// PACKAGE SCHEMAS
// ============================================================
export const createPackageSchema = z.object({
  name: z.string().min(1, 'اسم الباقة مطلوب'),
  lesson_count: z.number().min(1, 'عدد الحصص مطلوب'),
  price: z.number().min(0, 'السعر مطلوب'),
  currency: z.string().default('SAR'),
  description: z.string().optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

// ============================================================
// PAYMENT SCHEMAS
// ============================================================
export const createPaymentSchema = z.object({
  subscription_id: z.number().optional(),
  student_profile_id: z.number({ message: 'الطالب مطلوب' }),
  amount_due: z.number().min(0, 'المبلغ المطلوب مطلوب'),
  amount_paid: z.number().min(0, 'المبلغ المدفوع مطلوب'),
  payment_date: z.string().optional(),
  payment_method: z.enum(['bank_transfer', 'cash', 'online', 'other']).optional(),
  status: z.enum(['paid', 'partially_paid', 'pending', 'refunded', 'cancelled']).default('pending'),
  notes: z.string().optional(),
});

// ============================================================
// NOTE SCHEMA
// ============================================================
export const createNoteSchema = z.object({
  content: z.string().min(1, 'محتوى الملاحظة مطلوب'),
});

// ============================================================
// SUBJECT SCHEMA
// ============================================================
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'اسم المادة مطلوب'),
  name_en: z.string().optional(),
});
