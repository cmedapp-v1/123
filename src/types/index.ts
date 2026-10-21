export type Gender = 'ذكر' | 'أنثى';

export interface Student {
  id: string;
  registrationNumber?: string; // رقم التسجيل (محفوظ في قاعدة البيانات والبطاقة الفردية)
  massarNumber: string; // Unique Massar code (رقم مسار)
  lastName: string;    // النسب بالعربية
  firstName: string;   // الاسم بالعربية
  fullNameAr?: string; // الاسم الكامل بالعربية
  lastNameFr?: string; // Nom en français
  firstNameFr?: string; // Prénom en français
  fullNameFr?: string; // الاسم الكامل بالفرنسية
  schoolLevel?: string; // المستوى الدراسي (مثال: الثانوي الإعدادي / التأهيلي / الأساسي)
  trackId?: string;    // معرف الشعبة (Filière)
  gender: Gender;      // الجنس
  birthDate: string;   // تاريخ الازدياد بصيغة JJ/MM/AAAA
  birthPlace?: string; // مكان الازدياد (Lieu de naissance)
  phone: string;       // الهاتف
  whatsapp: string;    // واتساب
  address: string;     // العنوان
  guardianName: string; // ولي الأمر
  guardianPhone: string; // هاتف ولي الأمر
  classId: string;     // معرف القسم
  registrationDate: string; // تاريخ التسجيل JJ/MM/AAAA
  createdAt: string;   // ISO timestamp
}

export interface Track {
  id: string;
  name: string;        // اسم الشعبة
  code: string;        // رمز الشعبة
  description: string; // الوصف
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;        // اسم القسم
  code: string;        // رمز القسم
  academicYear: string;// السنة الدراسية (e.g. 2026/2027)
  trackIds: [string, string]; // كل قسم يضم شعبتين بالضبط
  instructorIds: string[];    // يمكن أن يؤطره عدة مؤطرين
  notes?: string;
  createdAt: string;
}

export interface Instructor {
  id: string;
  fullName: string;    // الاسم الكامل للمؤطر/الأستاذ
  phone: string;       // الهاتف
  email: string;       // البريد الإلكتروني
  specialty: string;   // التخصص
  subjects: string;    // المواد / الوحدات
  notes?: string;
  createdAt: string;
}

export type TimeSlot = '09:00 - 11:00' | '11:00 - 13:00' | '14:00 - 16:00';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AbsenceReason =
  | 'مرض'
  | 'ظرف عائلي'
  | 'مشكل في النقل'
  | 'موعد إداري'
  | 'أخرى';

export interface Violation {
  id: string;
  studentId: string;
  timetableSessionId: string; // الحصة
  date: string; // JJ/MM/AAAA
  type: 'سلوك' | 'تأخر' | 'غير ذلك';
  description: string;
  recordedBy: string;
  recordedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  timetableSessionId: string; // الحصة
  classId: string;
  date: string;        // JJ/MM/AAAA
  timeSlot: string;    // الفترة
  status: AttendanceStatus; // حاضر / غائب / متأخر / غياب مبرر
  delayDuration?: number; // مدة التأخر بالدقائق
  violationId?: string; // المخالفة المرتبطة
  reason?: AbsenceReason;
  customReason?: string;
  note?: string;
  processedAt?: string; // تاريخ المعالجة
  processedBy?: string; // من قام بالمعالجة
  recordedAt: string;  // تاريخ النداء
}

export const DEFAULT_SCHOOL_LEVELS: string[] = [
  '1 Collège — الأولى إعدادي',
  '2 Collège — الثانية إعدادي',
  '3 Collège — الثالثة إعدادي',
  'Tronc commun — الجذع المشترك',
  '1 Bac — الأولى باكالوريا',
  '2 Bac — الثانية باكالوريا',
];

export interface AppSettings {
  centerName: string;          // اسم المركز
  academicYear: string;        // السنة الدراسية الافتراضية
  absenceAlertThreshold: number; // حد التنبيه لعدد الغيابات غير المبررة (افتراضياً 3)
  delegation: string;          // المديرية الإقليمية
  academy: string;             // الأكاديمية الجهوية
  address: string;             // عنوان المركز
  phone: string;               // هاتف المركز
  customLogoUrl?: string;      // مسار أو صورة الشعار المخصص (CMED افتراضياً)
  schoolLevels?: string[];     // قائمة المستويات الدراسية المعتمدة القابلة للتعديل من الإعدادات
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;   // JJ/MM/AAAA HH:mm
  action: string;      // نوع العملية
  details: string;     // التفاصيل
}

export type WeekDay = 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة' | 'السبت';
export type TimeSlotRange = '09:00 - 11:00' | '11:00 - 13:00' | '14:00 - 16:00';
export type SessionType = 'التأهيل التربوي' | 'التأهيل المهني';

export interface TimetableSession {
  id: string;
  day: WeekDay;
  timeSlot: TimeSlotRange;
  sessionType: SessionType;
  subjectName: string;      // اسم الحصة / المادة
  classIds: string[];       // الأقسام المرتبطة
  trackId?: string;         // الشعبة عند الاقتضاء
  instructorId: string;     // المنشط المسؤول
  room?: string;            // القاعة
  notes?: string;           // ملاحظات اختيارية
  createdAt: string;
}

export interface AppStateData {
  version: string;
  students: Student[];
  tracks: Track[];
  classes: ClassRoom[];
  instructors: Instructor[];
  attendanceRecords: AttendanceRecord[];
  timetableSessions: TimetableSession[];
  violations: Violation[];
  settings: AppSettings;
  activityLogs: ActivityLogItem[];
  adminPasswordHash?: string;
  isPasswordSet: boolean;
}

export type UserRole = 'admin' | 'supervisor' | 'instructor';

export interface UserRoleInfo {
  role: UserRole;
  labelAr: string;
  labelFr: string;
  description: string;
}

export type NavigationTab =
  // The main modules
  | 'dashboard'        // 1. لوحة القيادة
  | 'students'         // 2. إدارة المتعلمين
  | 'timetable'        // 3. جدول الحصص الأسبوعي
  | 'daily_roll_call'  // 4. ورقة النداء اليومية
  | 'absences'         // 5. تدبير الغيابات
  | 'justifications'   // 6. تدبير المبررات
  | 'reports'          // 7. التقارير
  | 'settings'         // 8. الإعدادات
  // Legacy aliases to preserve all existing links
  | 'roll_call'
  | 'absence_log'
  | 'classes'
  | 'tracks'
  | 'instructors'
  | 'documents'
  | 'backup';
