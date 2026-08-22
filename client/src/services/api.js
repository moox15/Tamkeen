// API service layer — all backend communication goes through here
const API_BASE = '/api';

let csrfToken = null;

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  // Add CSRF token for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send cookies
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      const error = new Error(data.error || 'حدث خطأ غير متوقع.');
      error.status = res.status;
      error.data = data;
      throw error;
    }
    
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw new Error('فشل الاتصال بالخادم. تحقق من الاتصال بالإنترنت.');
  }
}

// ============================================================
// AUTH
// ============================================================
export const auth = {
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.csrfToken) csrfToken = data.csrfToken;
    return data;
  },
  
  async logout() {
    const data = await request('/auth/logout', { method: 'POST' });
    csrfToken = null;
    return data;
  },
  
  async me() {
    const data = await request('/auth/me');
    if (data.csrfToken) csrfToken = data.csrfToken;
    return data;
  },
  
  async changePassword(currentPassword, newPassword) {
    return request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  
  async forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  async resetPassword(token, password) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
};

// ============================================================
// ADMIN
// ============================================================
export const admin = {
  // Dashboard
  getDashboard: () => request('/admin/dashboard'),
  
  // Students
  getStudents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/students${qs ? `?${qs}` : ''}`);
  },
  getStudent: (uuid) => request(`/admin/students/${uuid}`),
  createStudent: (data) => request('/admin/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (uuid, data) => request(`/admin/students/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStudentStatus: (uuid, isActive) => request(`/admin/students/${uuid}/status`, { method: 'PUT', body: JSON.stringify({ is_active: isActive }) }),
  resetStudentPassword: (uuid, password) => request(`/admin/students/${uuid}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  deleteStudent: (uuid) => request(`/admin/students/${uuid}`, { method: 'DELETE' }),
  
  // Teachers
  getTeachers: () => request('/admin/teachers'),
  createTeacher: (data) => request('/admin/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id, data) => request(`/admin/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeacher: (id) => request(`/admin/teachers/${id}`, { method: 'DELETE' }),
  
  // Subjects
  getSubjects: () => request('/admin/subjects'),
  createSubject: (data) => request('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) => request(`/admin/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id) => request(`/admin/subjects/${id}`, { method: 'DELETE' }),
  
  // Lessons
  getLessons: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/lessons${qs ? `?${qs}` : ''}`);
  },
  getLesson: (uuid) => request(`/admin/lessons/${uuid}`),
  createLesson: (data) => request('/admin/lessons', { method: 'POST', body: JSON.stringify(data) }),
  updateLesson: (uuid, data) => request(`/admin/lessons/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLessonStatus: (uuid, status) => request(`/admin/lessons/${uuid}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateAttendance: (uuid, attendance) => request(`/admin/lessons/${uuid}/attendance`, { method: 'PUT', body: JSON.stringify({ attendance }) }),
  
  // Homework
  getHomeworkList: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/homework${qs ? `?${qs}` : ''}`);
  },
  createHomework: (data) => request('/admin/homework', { method: 'POST', body: JSON.stringify(data) }),
  updateHomework: (uuid, data) => request(`/admin/homework/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHomework: (uuid) => request(`/admin/homework/${uuid}`, { method: 'DELETE' }),
  getHomeworkSubmissions: (uuid) => request(`/admin/homework/${uuid}/submissions`),
  getAllSubmissions: () => request('/admin/homework/submissions/all'),
  gradeSubmission: (id, data) => request(`/admin/homework/submissions/${id}/grade`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Packages
  getPackages: () => request('/admin/packages'),
  createPackage: (data) => request('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id, data) => request(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id) => request(`/admin/packages/${id}`, { method: 'DELETE' }),
  
  // Subscriptions
  getSubscriptions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/subscriptions${qs ? `?${qs}` : ''}`);
  },
  createSubscription: (data) => request('/admin/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (uuid, data) => request(`/admin/subscriptions/${uuid}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Payments
  getPayments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/payments${qs ? `?${qs}` : ''}`);
  },
  createPayment: (data) => request('/admin/payments', { method: 'POST', body: JSON.stringify(data) }),
  
  // Notes
  getStudentNotes: (uuid) => request(`/admin/students/${uuid}/notes`),
  createStudentNote: (uuid, content) => request(`/admin/students/${uuid}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),
  
  // Audit logs
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
  
  // Notifications
  getNotifications: () => request('/admin/notifications'),
  markNotificationRead: (id) => request(`/admin/notifications/${id}/read`, { method: 'PUT' }),
};

// ============================================================
// STUDENT
// ============================================================
export const student = {
  getDashboard: () => request('/student/dashboard'),
  getProfile: () => request('/student/profile'),
  updateProfile: (data) => request('/student/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getSchedule: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/student/schedule${qs ? `?${qs}` : ''}`);
  },
  getLessons: () => request('/student/lessons'),
  getLesson: (uuid) => request(`/student/lessons/${uuid}`),
  getHomework: () => request('/student/homework'),
  getHomeworkDetail: (uuid) => request(`/student/homework/${uuid}`),
  submitHomework: (uuid, answers) => request(`/student/homework/${uuid}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  getProgress: () => request('/student/progress'),
  getSubscription: () => request('/student/subscription'),
  getNotifications: () => request('/student/notifications'),
  markNotificationRead: (id) => request(`/student/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/student/notifications/read-all', { method: 'PUT' }),
};
