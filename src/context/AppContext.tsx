import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react';
import {
  AppStateData,
  Student,
  Track,
  ClassRoom,
  Instructor,
  AttendanceRecord,
  AppSettings,
  ActivityLogItem,
  NavigationTab,
  AttendanceStatus,
  AbsenceReason,
  UserRole,
  TimetableSession,
  Violation,
} from '../types';
import {
  loadDataFromLocalStorage,
  saveDataToLocalStorage,
  getFileHandleFromIDB,
  clearFileHandleFromIDB,
  pickBackupFile,
  verifyHandlePermission,
  writeDataToFileHandle,
  INITIAL_APP_STATE,
  hashPassword,
  getTodayDDMMYYYY,
} from '../services/storage';

export type FileHandleStatus = 'connected' | 'needs_permission' | 'disconnected';

export interface DocumentPrintConfig {
  type: 'summons' | 'entry_ticket' | 'exit_permit' | 'student_card' | null;
  student?: Student;
  absenceRecord?: AttendanceRecord;
  customData?: any;
}

interface AppContextType {
  data: AppStateData;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  fileHandleStatus: FileHandleStatus;
  fileHandleName: string | null;
  lastSavedTime: string | null;

  // File Handle operations
  connectAutoSaveFile: () => Promise<boolean>;
  reAuthorizeFileHandle: () => Promise<boolean>;
  disconnectAutoSaveFile: () => Promise<void>;

  // Authentication
  setupAdminPassword: (password: string) => Promise<boolean>;
  loginWithPassword: (password: string) => Promise<boolean>;
  logout: () => void;
  resetAdminPassword: () => void;
  changeAdminPassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  // Domain Actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateStudent: (student: Student) => { success: boolean; message?: string };
  deleteStudent: (id: string) => { success: boolean; message?: string };
  bulkDeleteStudents: (ids: string[]) => { success: boolean; count: number };
  bulkAddStudents: (students: Student[]) => void;

  addTrack: (track: Omit<Track, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateTrack: (track: Track) => { success: boolean; message?: string };
  deleteTrack: (id: string) => { success: boolean; message?: string };

  addClassRoom: (classroom: Omit<ClassRoom, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateClassRoom: (classroom: ClassRoom) => { success: boolean; message?: string };
  deleteClassRoom: (id: string) => { success: boolean; message?: string };

  addInstructor: (instructor: Omit<Instructor, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateInstructor: (instructor: Instructor) => { success: boolean; message?: string };
  deleteInstructor: (id: string) => { success: boolean; message?: string };

  recordAttendanceSession: (records: AttendanceRecord[]) => void;
  recordAttendanceSessionWithDetails: (records: AttendanceRecord[], violations: Violation[]) => void;
  addViolation: (violation: Omit<Violation, 'id' | 'recordedAt'>) => void;
  processAbsenceRecord: (recordId: string, status: AttendanceStatus, reason?: AbsenceReason, note?: string) => void;

  updateSettings: (settings: AppSettings) => void;
  restoreFullBackup: (importedData: AppStateData) => void;
  resetAllData: () => void;

  addTimetableSession: (session: Omit<TimetableSession, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  updateTimetableSession: (session: TimetableSession) => { success: boolean; message?: string };
  deleteTimetableSession: (id: string) => { success: boolean; message?: string };

  // Document printing trigger
  printConfig: DocumentPrintConfig;
  triggerPrintDocument: (config: DocumentPrintConfig) => void;
  closePrintPreview: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppStateData>(() => loadDataFromLocalStorage());
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('tracks');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileHandleStatus, setFileHandleStatus] = useState<FileHandleStatus>('disconnected');
  const [fileHandleName, setFileHandleName] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', String(isSidebarCollapsed));
    } catch {
      // Ignore
    }
  }, [isSidebarCollapsed]);

  const [printConfig, setPrintConfig] = useState<DocumentPrintConfig>({ type: null });

  // Initialize File System Access Handle from IndexedDB
  useEffect(() => {
    let mounted = true;
    async function checkHandle() {
      try {
        const handle = await getFileHandleFromIDB();
        if (handle && mounted) {
          setFileHandle(handle);
          setFileHandleName(handle.name);
          const hasPerm = await verifyHandlePermission(handle, false);
          if (mounted) {
            setFileHandleStatus(hasPerm ? 'connected' : 'needs_permission');
          }
        } else if (mounted) {
          setFileHandleStatus('disconnected');
        }
      } catch (err) {
        console.warn('Handle check skipped:', err);
        if (mounted) {
          setFileHandleStatus('disconnected');
        }
      }
    }
    checkHandle();
    return () => {
      mounted = false;
    };
  }, []);

  // Save to localStorage & auto-save to file on computer whenever data changes
  const persistState = useCallback(
    async (nextData: AppStateData) => {
      saveDataToLocalStorage(nextData);
      const timeStr = new Date().toLocaleTimeString('ar-MA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedTime(timeStr);

      if (fileHandle) {
        const written = await writeDataToFileHandle(fileHandle, nextData);
        if (written) {
          setFileHandleStatus('connected');
        } else {
          const hasPerm = await verifyHandlePermission(fileHandle, false);
          setFileHandleStatus(hasPerm ? 'connected' : 'needs_permission');
        }
      }
    },
    [fileHandle]
  );

  const updateStateWithLog = useCallback(
    (updater: (prev: AppStateData) => AppStateData, actionDesc?: string, detailsDesc?: string) => {
      setData((prev) => {
        let updated = updater(prev);
        if (actionDesc) {
          const now = new Date();
          const timestamp = `${getTodayDDMMYYYY()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const newLog: ActivityLogItem = {
            id: 'log_' + Math.random().toString(36).substring(2, 9),
            timestamp,
            action: actionDesc,
            details: detailsDesc || '',
          };
          // Keep up to 300 logs as requested
          const activityLogs = [newLog, ...(updated.activityLogs || [])].slice(0, 300);
          updated = { ...updated, activityLogs };
        }
        persistState(updated);
        return updated;
      });
    },
    [persistState]
  );

  // File Handle Handlers
  const connectAutoSaveFile = async (): Promise<boolean> => {
    try {
      const handle = await pickBackupFile();
      if (handle) {
        setFileHandle(handle);
        setFileHandleName(handle.name);
        setFileHandleStatus('connected');
        await writeDataToFileHandle(handle, data);
        updateStateWithLog(
          (prev) => prev,
          'ربط ملف الحفظ التلقائي',
          `تم تحديد الملف: ${handle.name}`
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('File selection skipped or failed:', err);
      return false;
    }
  };

  const reAuthorizeFileHandle = async (): Promise<boolean> => {
    if (!fileHandle) return false;
    const granted = await verifyHandlePermission(fileHandle, true);
    if (granted) {
      setFileHandleStatus('connected');
      await writeDataToFileHandle(fileHandle, data);
      return true;
    }
    return false;
  };

  const disconnectAutoSaveFile = async (): Promise<void> => {
    await clearFileHandleFromIDB();
    setFileHandle(null);
    setFileHandleName(null);
    setFileHandleStatus('disconnected');
    updateStateWithLog(
      (prev) => prev,
      'إلغاء ربط ملف الحفظ',
      'تم إلغاء الحفظ التلقائي على الملف المحلي'
    );
  };

  // Authentication
  const setupAdminPassword = async (password: string): Promise<boolean> => {
    if (!password || password.trim().length < 4) {
      return false;
    }
    const hash = await hashPassword(password.trim());
    updateStateWithLog(
      (prev) => ({
        ...prev,
        adminPasswordHash: hash,
        isPasswordSet: true,
      }),
      'تهيئة كلمة مرور الإدارة',
      'تم إنشاء كلمة المرور بنجاح'
    );
    setIsAuthenticated(true);
    return true;
  };

  const loginWithPassword = async (password: string): Promise<boolean> => {
    if (!data.isPasswordSet || !data.adminPasswordHash) {
      return false;
    }
    const hash = await hashPassword(password.trim());
    if (hash === data.adminPasswordHash) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const resetAdminPassword = () => {
    updateStateWithLog(
      (prev) => ({
        ...prev,
        adminPasswordHash: undefined,
        isPasswordSet: false,
      }),
      'إعادة تعيين كلمة مرور الإدارة',
      'تمت إعادة تعيين كلمة المرور إلى الحالة الأولية'
    );
    setIsAuthenticated(false);
  };

  const changeAdminPassword = async (
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!data.adminPasswordHash) {
      return { success: false, message: 'لم يتم إعداد كلمة مرور مسبقاً.' };
    }
    const oldHash = await hashPassword(oldPass.trim());
    if (oldHash !== data.adminPasswordHash) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة.' };
    }
    if (newPass.trim().length < 4) {
      return { success: false, message: 'يجب أن لا تقل كلمة المرور الجديدة عن 4 أحرف/أرقام.' };
    }
    const newHash = await hashPassword(newPass.trim());
    updateStateWithLog(
      (prev) => ({
        ...prev,
        adminPasswordHash: newHash,
      }),
      'تغيير كلمة المرور',
      'تم تغيير كلمة مرور الإدارة'
    );
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح.' };
  };

  // Student Actions
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>): { success: boolean; message?: string } => {
    const trimmedMassar = studentData.massarNumber.trim().toUpperCase();
    if (!trimmedMassar) {
      return { success: false, message: 'رقم مسار إجباري.' };
    }
    if (!studentData.lastName.trim() || !studentData.firstName.trim()) {
      return { success: false, message: 'النسب والاسم إجباريان.' };
    }
    const exists = data.students.some((s) => s.massarNumber.trim().toUpperCase() === trimmedMassar);
    if (exists) {
      return { success: false, message: `رقم مسار "${trimmedMassar}" مسجل مسبقاً لمستفيد آخر.` };
    }

    const newStudent: Student = {
      ...studentData,
      id: 'std_' + Math.random().toString(36).substring(2, 9),
      massarNumber: trimmedMassar,
      lastName: studentData.lastName.trim(),
      firstName: studentData.firstName.trim(),
      createdAt: new Date().toISOString(),
    };

    updateStateWithLog(
      (prev) => ({
        ...prev,
        students: [newStudent, ...prev.students],
      }),
      'إضافة مستفيد جديد',
      `${newStudent.firstName} ${newStudent.lastName} (مسار: ${newStudent.massarNumber})`
    );
    return { success: true };
  };

  const updateStudent = (student: Student): { success: boolean; message?: string } => {
    const trimmedMassar = student.massarNumber.trim().toUpperCase();
    if (!trimmedMassar) {
      return { success: false, message: 'رقم مسار إجباري.' };
    }
    if (!student.lastName.trim() || !student.firstName.trim()) {
      return { success: false, message: 'النسب والاسم إجباريان.' };
    }
    const duplicate = data.students.some(
      (s) => s.id !== student.id && s.massarNumber.trim().toUpperCase() === trimmedMassar
    );
    if (duplicate) {
      return { success: false, message: `رقم مسار "${trimmedMassar}" مكرر لمستفيد آخر.` };
    }

    updateStateWithLog(
      (prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === student.id ? { ...student, massarNumber: trimmedMassar } : s)),
      }),
      'تعديل بيانات مستفيد',
      `${student.firstName} ${student.lastName} (مسار: ${trimmedMassar})`
    );
    return { success: true };
  };

  const deleteStudent = (id: string): { success: boolean; message?: string } => {
    const target = data.students.find((s) => s.id === id);
    if (!target) return { success: false, message: 'المتعلم غير موجود.' };

    updateStateWithLog(
      (prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== id),
        // Preserve absence history as per safety rules
      }),
      'حذف متعلم',
      `${target.firstName} ${target.lastName} (مسار: ${target.massarNumber}) - مع الحفاظ على أرشيف الغيابات التاريخي`
    );
    return { success: true };
  };

  const bulkDeleteStudents = (ids: string[]): { success: boolean; count: number } => {
    const idSet = new Set(ids);
    const targets = data.students.filter((s) => idSet.has(s.id));
    if (targets.length === 0) return { success: false, count: 0 };

    updateStateWithLog(
      (prev) => ({
        ...prev,
        students: prev.students.filter((s) => !idSet.has(s.id)),
        // Preserve absence history as per administrative archive rules
      }),
      'حذف جماعي للمتعلمين',
      `تم حذف ${targets.length} متعلم(ة) مع الحفاظ على أرشيف الغيابات التاريخي`
    );
    return { success: true, count: targets.length };
  };

  const bulkAddStudents = (newStudents: Student[]) => {
    updateStateWithLog(
      (prev) => ({
        ...prev,
        students: [...newStudents, ...prev.students],
      }),
      'استيراد مستفيدين دفعة واحدة',
      `تم استيراد ${newStudents.length} مستفيد من ملف CSV`
    );
  };

  // Track Actions
  const addTrack = (trackData: Omit<Track, 'id' | 'createdAt'>): { success: boolean; message?: string } => {
    if (!trackData.name.trim() || !trackData.code.trim()) {
      return { success: false, message: 'اسم الشعبة ورمزها مطلوبان.' };
    }
    const exists = data.tracks.some(
      (t) => t.code.trim().toLowerCase() === trackData.code.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, message: `رمز الشعبة "${trackData.code}" مستخدم مسبقاً.` };
    }

    const newTrack: Track = {
      ...trackData,
      id: 'trk_' + Math.random().toString(36).substring(2, 9),
      name: trackData.name.trim(),
      code: trackData.code.trim(),
      createdAt: new Date().toISOString(),
    };

    updateStateWithLog(
      (prev) => ({
        ...prev,
        tracks: [...prev.tracks, newTrack],
      }),
      'إضافة شعبة جديدة',
      `${newTrack.name} (${newTrack.code})`
    );
    return { success: true };
  };

  const updateTrack = (track: Track): { success: boolean; message?: string } => {
    if (!track.name.trim() || !track.code.trim()) {
      return { success: false, message: 'اسم الشعبة ورمزها مطلوبان.' };
    }
    const duplicate = data.tracks.some(
      (t) => t.id !== track.id && t.code.trim().toLowerCase() === track.code.trim().toLowerCase()
    );
    if (duplicate) {
      return { success: false, message: `رمز الشعبة "${track.code}" مستخدم مسبقاً.` };
    }

    updateStateWithLog(
      (prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === track.id ? track : t)),
      }),
      'تعديل شعبة',
      `${track.name} (${track.code})`
    );
    return { success: true };
  };

  const deleteTrack = (id: string): { success: boolean; message?: string } => {
    const isUsedInClass = data.classes.some(
      (c) => c.trackIds && (c.trackIds[0] === id || c.trackIds[1] === id)
    );
    if (isUsedInClass) {
      return {
        success: false,
        message: 'لا يمكن حذف هذه الشعبة لأنها مرتبطة بأحد الأقسام البيداغوجية. يرجى تعديل القسم أولاً.',
      };
    }

    const target = data.tracks.find((t) => t.id === id);
    updateStateWithLog(
      (prev) => ({
        ...prev,
        tracks: prev.tracks.filter((t) => t.id !== id),
      }),
      'حذف شعبة',
      target ? `${target.name} (${target.code})` : id
    );
    return { success: true };
  };

  // Class Actions (Rule: Exactly 2 tracks per class)
  const addClassRoom = (clsData: Omit<ClassRoom, 'id' | 'createdAt'>): { success: boolean; message?: string } => {
    if (!clsData.name.trim() || !clsData.code.trim()) {
      return { success: false, message: 'اسم القسم ورمزه مطلوبان.' };
    }
    if (!clsData.trackIds || clsData.trackIds.length !== 2 || !clsData.trackIds[0] || !clsData.trackIds[1]) {
      return { success: false, message: 'قاعدة إجبارية: كل قسم يجب أن يضم شعبتين بالضبط.' };
    }
    if (clsData.trackIds[0] === clsData.trackIds[1]) {
      return { success: false, message: 'يجب اختيار شعبتين مختلفتين للقسم الواحد.' };
    }

    const exists = data.classes.some(
      (c) => c.code.trim().toLowerCase() === clsData.code.trim().toLowerCase()
    );
    if (exists) {
      return { success: false, message: `رمز القسم "${clsData.code}" مستخدم مسبقاً.` };
    }

    const newClass: ClassRoom = {
      ...clsData,
      id: 'cls_' + Math.random().toString(36).substring(2, 9),
      name: clsData.name.trim(),
      code: clsData.code.trim(),
      trackIds: [clsData.trackIds[0], clsData.trackIds[1]],
      createdAt: new Date().toISOString(),
    };

    updateStateWithLog(
      (prev) => ({
        ...prev,
        classes: [...prev.classes, newClass],
      }),
      'إضافة قسم بيداغوجي',
      `${newClass.name} (${newClass.code})`
    );
    return { success: true };
  };

  const updateClassRoom = (classroom: ClassRoom): { success: boolean; message?: string } => {
    if (!classroom.name.trim() || !classroom.code.trim()) {
      return { success: false, message: 'اسم القسم ورمزه مطلوبان.' };
    }
    if (!classroom.trackIds || classroom.trackIds.length !== 2 || !classroom.trackIds[0] || !classroom.trackIds[1]) {
      return { success: false, message: 'قاعدة إجبارية: كل قسم يجب أن يضم شعبتين بالضبط.' };
    }
    if (classroom.trackIds[0] === classroom.trackIds[1]) {
      return { success: false, message: 'يجب اختيار شعبتين مختلفتين للقسم الواحد.' };
    }

    const duplicate = data.classes.some(
      (c) => c.id !== classroom.id && c.code.trim().toLowerCase() === classroom.code.trim().toLowerCase()
    );
    if (duplicate) {
      return { success: false, message: `رمز القسم "${classroom.code}" مستخدم مسبقاً.` };
    }

    updateStateWithLog(
      (prev) => ({
        ...prev,
        classes: prev.classes.map((c) => (c.id === classroom.id ? classroom : c)),
      }),
      'تعديل قسم بيداغوجي',
      `${classroom.name} (${classroom.code})`
    );
    return { success: true };
  };

  const deleteClassRoom = (id: string): { success: boolean; message?: string } => {
    const studentCount = data.students.filter((s) => s.classId === id).length;
    if (studentCount > 0) {
      return {
        success: false,
        message: `لا يمكن حذف هذا القسم لأنه يضم ${studentCount} مستفيدين. يرجى نقل المستفيدين أولاً.`,
      };
    }

    const target = data.classes.find((c) => c.id === id);
    updateStateWithLog(
      (prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== id),
      }),
      'حذف قسم بيداغوجي',
      target ? `${target.name} (${target.code})` : id
    );
    return { success: true };
  };

  // Instructor Actions
  const addInstructor = (instData: Omit<Instructor, 'id' | 'createdAt'>): { success: boolean; message?: string } => {
    if (!instData.fullName.trim()) {
      return { success: false, message: 'اسم المؤطر مطلوب.' };
    }

    const newInst: Instructor = {
      ...instData,
      id: 'inst_' + Math.random().toString(36).substring(2, 9),
      fullName: instData.fullName.trim(),
      createdAt: new Date().toISOString(),
    };

    updateStateWithLog(
      (prev) => ({
        ...prev,
        instructors: [...prev.instructors, newInst],
      }),
      'إضافة مؤطر/أستاذ',
      newInst.fullName
    );
    return { success: true };
  };

  const updateInstructor = (instructor: Instructor): { success: boolean; message?: string } => {
    if (!instructor.fullName.trim()) {
      return { success: false, message: 'اسم المؤطر مطلوب.' };
    }

    updateStateWithLog(
      (prev) => ({
        ...prev,
        instructors: prev.instructors.map((i) => (i.id === instructor.id ? instructor : i)),
      }),
      'تعديل بيانات مؤطر',
      instructor.fullName
    );
    return { success: true };
  };

  const deleteInstructor = (id: string): { success: boolean; message?: string } => {
    const target = data.instructors.find((i) => i.id === id);
    updateStateWithLog(
      (prev) => ({
        ...prev,
        instructors: prev.instructors.filter((i) => i.id !== id),
        classes: prev.classes.map((c) => ({
          ...c,
          instructorIds: c.instructorIds.filter((instId) => instId !== id),
        })),
      }),
      'حذف مؤطر',
      target ? target.fullName : id
    );
    return { success: true };
  };

  // Roll Call & Attendance Recording
  // Roll Call & Attendance Recording
  const recordAttendanceSession = (records: AttendanceRecord[]) => {
    recordAttendanceSessionWithDetails(records, []);
  };

  const recordAttendanceSessionWithDetails = (records: AttendanceRecord[], violations: Violation[]) => {
    if (records.length === 0 && violations.length === 0) return;
    
    updateStateWithLog(
      (prev) => {
        const studentIdsInBatch = new Set(records.map((r) => r.studentId));
        const date = records.length > 0 ? records[0].date : '';
        const slot = records.length > 0 ? records[0].timeSlot : '';
        
        const filteredRecords = prev.attendanceRecords.filter(
          (r) => !(r.date === date && r.timeSlot === slot && studentIdsInBatch.has(r.studentId))
        );
        
        return {
          ...prev,
          attendanceRecords: [...records, ...filteredRecords],
          violations: [...(prev.violations || []), ...violations],
        };
      },
      'تسجيل الحضور والمخالفات',
      `تسجيل ${records.length} سجل حضور و ${violations.length} مخالفات`
    );
  };

  const addViolation = (violationData: Omit<Violation, 'id' | 'recordedAt'>) => {
    const newViolation: Violation = {
      ...violationData,
      id: 'viol_' + Math.random().toString(36).substring(2, 9),
      recordedAt: new Date().toISOString(),
    };
    updateStateWithLog(
      (prev) => ({
        ...prev,
        violations: [...(prev.violations || []), newViolation],
      }),
      'تسجيل مخالفة',
      `تم تسجيل مخالفة للمتعلم ${violationData.studentId}: ${violationData.type}`
    );
  };

  // Process Absence (Reason, Note, Status change)
  const processAbsenceRecord = (
    recordId: string,
    status: AttendanceStatus,
    reason?: AbsenceReason,
    note?: string
  ) => {
    const now = new Date();
    const processedAt = `${getTodayDDMMYYYY()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    updateStateWithLog(
      (prev) => {
        const updatedRecords = prev.attendanceRecords.map((rec) => {
          if (rec.id === recordId) {
            return {
              ...rec,
              status,
              reason: status === 'excused' || status === 'absent' || status === 'late' ? reason : undefined,
              note,
              processedAt,
              processedBy: 'الإدارة',
            };
          }
          return rec;
        });
        return {
          ...prev,
          attendanceRecords: updatedRecords,
        };
      },
      'معالجة سجل غياب',
      `تم تحديث الحالة إلى "${status === 'excused' ? 'غياب مبرر' : status === 'absent' ? 'غائب' : status === 'late' ? 'متأخر' : 'حاضر'}" ${reason ? `(السبب: ${reason})` : ''}`
    );
  };

  // Timetable Sessions
  const addTimetableSession = (
    sessionData: Omit<TimetableSession, 'id' | 'createdAt'>
  ): { success: boolean; message?: string } => {
    const newSession: TimetableSession = {
      ...sessionData,
      id: 'ts_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    updateStateWithLog(
      (prev) => ({
        ...prev,
        timetableSessions: [...(prev.timetableSessions || []), newSession],
      }),
      'إضافة حصة دراسية',
      `تمت إضافة حصة (${newSession.subjectName}) ليوم ${newSession.day} (${newSession.timeSlot})`
    );
    return { success: true };
  };

  const updateTimetableSession = (
    updated: TimetableSession
  ): { success: boolean; message?: string } => {
    updateStateWithLog(
      (prev) => ({
        ...prev,
        timetableSessions: (prev.timetableSessions || []).map((s) =>
          s.id === updated.id ? updated : s
        ),
      }),
      'تعديل حصة دراسية',
      `تم تحديث حصة (${updated.subjectName}) ليوم ${updated.day}`
    );
    return { success: true };
  };

  const deleteTimetableSession = (
    id: string
  ): { success: boolean; message?: string } => {
    const sessionToDelete = (data.timetableSessions || []).find((s) => s.id === id);
    updateStateWithLog(
      (prev) => ({
        ...prev,
        timetableSessions: (prev.timetableSessions || []).filter((s) => s.id !== id),
      }),
      'حذف حصة دراسية',
      sessionToDelete ? `تم حذف حصة (${sessionToDelete.subjectName})` : `تم حذف الحصة رقم ${id}`
    );
    return { success: true };
  };

  // Settings
  const updateSettings = (newSettings: AppSettings) => {
    updateStateWithLog(
      (prev) => ({
        ...prev,
        settings: newSettings,
      }),
      'تحديث إعدادات المركز',
      `السنة الدراسية: ${newSettings.academicYear} - حد التنبيه: ${newSettings.absenceAlertThreshold}`
    );
  };

  // Restore & Reset
  const restoreFullBackup = (importedData: AppStateData) => {
    startTransition(() => {
      setData(importedData);
      persistState(importedData);
    });
  };

  const resetAllData = () => {
    const emptyState = { ...INITIAL_APP_STATE };
    setData(emptyState);
    persistState(emptyState);
  };

  // Document Printing
  const triggerPrintDocument = (config: DocumentPrintConfig) => {
    setPrintConfig(config);
    setActiveTab('reports');
  };

  const closePrintPreview = () => {
    setPrintConfig({ type: null });
  };

  return (
    <AppContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        currentRole,
        setCurrentRole,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        activeSettingsTab,
        setActiveSettingsTab,
        isAuthenticated,
        setIsAuthenticated,
        fileHandleStatus,
        fileHandleName,
        lastSavedTime,

        connectAutoSaveFile,
        reAuthorizeFileHandle,
        disconnectAutoSaveFile,

        setupAdminPassword,
        loginWithPassword,
        logout,
        resetAdminPassword,
        changeAdminPassword,

        addStudent,
        updateStudent,
        deleteStudent,
        bulkDeleteStudents,
        bulkAddStudents,

        addTrack,
        updateTrack,
        deleteTrack,

        addClassRoom,
        updateClassRoom,
        deleteClassRoom,

        addInstructor,
        updateInstructor,
        deleteInstructor,

        recordAttendanceSession,
        recordAttendanceSessionWithDetails,
        addViolation,
        processAbsenceRecord,

        updateSettings,
        restoreFullBackup,
        resetAllData,

        addTimetableSession,
        updateTimetableSession,
        deleteTimetableSession,

        printConfig,
        triggerPrintDocument,
        closePrintPreview,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
