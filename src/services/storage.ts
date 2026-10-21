import { AppStateData, Student, ClassRoom, Track, DEFAULT_SCHOOL_LEVELS, TimetableSession, Instructor } from '../types';

const STORAGE_KEY = 'zrarda_absence_data_v1';
const IDB_NAME = 'zrarda_fs_store';
const IDB_STORE = 'handles';
const IDB_HANDLE_KEY = 'auto_backup_file_handle';

export const DEFAULT_TIMETABLE_SESSIONS: TimetableSession[] = [
  {
    id: 'ts_01',
    day: 'الإثنين',
    timeSlot: '09:00 - 11:00',
    sessionType: 'التأهيل التربوي',
    subjectName: 'اللغة العربية والتربية الإسلامية',
    classIds: ['cls_f1', 'cls_f2'],
    instructorId: '',
    room: 'قاعة رقم 1',
    notes: 'حصة مشتركة للأقسام',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'ts_02',
    day: 'الإثنين',
    timeSlot: '11:00 - 13:00',
    sessionType: 'التأهيل المهني',
    subjectName: 'تركيبات كهربائية تطبيقية',
    classIds: ['cls_f1'],
    trackId: 'tr_elec',
    instructorId: '',
    room: 'ورشة الكهرباء',
    notes: 'تطبيق عملي بالورشة',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'ts_03',
    day: 'الثلاثاء',
    timeSlot: '09:00 - 11:00',
    sessionType: 'التأهيل المهني',
    subjectName: 'الفصالة والخياطة المعاصرة',
    classIds: ['cls_f2'],
    trackId: 'tr_couture',
    instructorId: '',
    room: 'ورشة الخياطة',
    notes: 'تصميم أزياء',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'ts_04',
    day: 'الأربعاء',
    timeSlot: '14:00 - 16:00',
    sessionType: 'التأهيل التربوي',
    subjectName: 'الرياضيات والمهارات الرقمية',
    classIds: ['cls_f1', 'cls_f2'],
    instructorId: '',
    room: 'قاعة المعلوميات',
    notes: 'تمرينات تطبيقية',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

export const DEFAULT_SETTINGS = {
  centerName: 'مركز الفرصة الثانية - الجيل الجديد (زرارة)',
  academicYear: '2026/2027',
  absenceAlertThreshold: 3,
  delegation: 'المديرية الإقليمية الصخيرات - تمارة',
  academy: 'الأكاديمية الجهوية للتربية والتكوين لجهة الرباط - سلا - القنيطرة',
  address: 'جماعة زرارة',
  phone: '05 37 00 00 00',
  customLogoUrl: '/logo-cmed.jpeg',
  schoolLevels: DEFAULT_SCHOOL_LEVELS,
};

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'tr_elec',
    name: 'كهرباء المباني والطاقات المتجددة',
    code: 'ELEC-01',
    description: 'شعبة التكوين في التركيبات الكهربائية والطاقات النظيفة',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'tr_couture',
    name: 'الفصالة والخياطة وتصميم الأزياء',
    code: 'COUT-01',
    description: 'شعبة الحرف اليدوية والفصالة والخياطة المعاصرة',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'tr_info',
    name: 'المعلوميات والمكتبيات والتجارة الرقمية',
    code: 'INFO-01',
    description: 'شعبة المهارات الرقمية، التسيير المكتبي، والتجارة الإلكترونية',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

export const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'cls_f1',
    name: 'الفوج الأول - كهرباء ومعلوميات',
    code: 'G2-EL-01',
    academicYear: '2026/2027',
    trackIds: ['tr_elec', 'tr_info'],
    instructorIds: [],
    notes: 'قاعة الورشات التقنية',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'cls_f2',
    name: 'الفوج الثاني - فصالة وخياطة',
    code: 'G2-CO-02',
    academicYear: '2026/2027',
    trackIds: ['tr_couture', 'tr_info'],
    instructorIds: [],
    notes: 'ورشة الخياطة والتصميم',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

export const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'std_01',
    registrationNumber: '2026/REG-001',
    massarNumber: 'G134567890',
    lastName: 'العلمي',
    firstName: 'ياسين',
    fullNameAr: 'ياسين العلمي',
    lastNameFr: 'EL ALAMI',
    firstNameFr: 'Yassine',
    fullNameFr: 'EL ALAMI Yassine',
    schoolLevel: '3 Collège — الثالثة إعدادي',
    trackId: 'tr_elec',
    classId: 'cls_f1',
    gender: 'ذكر',
    birthDate: '15/04/2008',
    phone: '0612345678',
    whatsapp: '0612345678',
    address: 'حي النهضة، مركز زرارة',
    guardianName: 'محمد العلمي',
    guardianPhone: '0698765432',
    registrationDate: '01/09/2026',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'std_02',
    registrationNumber: '2026/REG-002',
    massarNumber: 'G148920112',
    lastName: 'بنعلي',
    firstName: 'فاطمة الزهراء',
    fullNameAr: 'فاطمة الزهراء بنعلي',
    lastNameFr: 'BENALI',
    firstNameFr: 'Fatima Zahra',
    fullNameFr: 'BENALI Fatima Zahra',
    schoolLevel: '2 Collège — الثانية إعدادي',
    trackId: 'tr_couture',
    classId: 'cls_f2',
    gender: 'أنثى',
    birthDate: '22/08/2008',
    phone: '0622334455',
    whatsapp: '0622334455',
    address: 'دوار أولاد موسى، زرارة',
    guardianName: 'حميد بنعلي',
    guardianPhone: '0677889900',
    registrationDate: '02/09/2026',
    createdAt: '2026-09-02T08:00:00.000Z',
  },
  {
    id: 'std_03',
    registrationNumber: '2026/REG-003',
    massarNumber: 'G139884210',
    lastName: 'المرابط',
    firstName: 'أيوب',
    fullNameAr: 'أيوب المرابط',
    lastNameFr: 'EL MOURABIT',
    firstNameFr: 'Ayoub',
    fullNameFr: 'EL MOURABIT Ayoub',
    schoolLevel: '1 Collège — الأولى إعدادي',
    trackId: 'tr_elec',
    classId: 'cls_f1',
    gender: 'ذكر',
    birthDate: '10/02/2007',
    phone: '0633445566',
    whatsapp: '0633445566',
    address: 'مركز زرارة، قرب المستوصف',
    guardianName: 'عمر المرابط',
    guardianPhone: '0644556677',
    registrationDate: '02/09/2026',
    createdAt: '2026-09-02T08:00:00.000Z',
  },
  {
    id: 'std_04',
    registrationNumber: '2026/REG-004',
    massarNumber: 'G143229871',
    lastName: 'التازي',
    firstName: 'مريم',
    fullNameAr: 'مريم التازي',
    lastNameFr: 'TAZI',
    firstNameFr: 'Meryem',
    fullNameFr: 'TAZI Meryem',
    schoolLevel: 'Tronc commun — الجذع المشترك',
    trackId: 'tr_couture',
    classId: 'cls_f2',
    gender: 'أنثى',
    birthDate: '05/11/2008',
    phone: '0655667788',
    whatsapp: '0655667788',
    address: 'حي الأمل، تاهلة',
    guardianName: 'عبد القادر التازي',
    guardianPhone: '0666778899',
    registrationDate: '03/09/2026',
    createdAt: '2026-09-03T08:00:00.000Z',
  },
  {
    id: 'std_05',
    registrationNumber: '2026/REG-005',
    massarNumber: 'G137754321',
    lastName: 'الصنهاجي',
    firstName: 'حمزة',
    fullNameAr: 'حمزة الصنهاجي',
    lastNameFr: 'SANHAJI',
    firstNameFr: 'Hamza',
    fullNameFr: 'SANHAJI Hamza',
    schoolLevel: '1 Bac — الأولى باكالوريا',
    trackId: 'tr_info',
    classId: 'cls_f1',
    gender: 'ذكر',
    birthDate: '30/06/2008',
    phone: '0644332211',
    whatsapp: '0644332211',
    address: 'دوار تيزي، جماعة زرارة',
    guardianName: 'رشيد الصنهاجي',
    guardianPhone: '0655443322',
    registrationDate: '04/09/2026',
    createdAt: '2026-09-04T08:00:00.000Z',
  },
  {
    id: 'std_06',
    registrationNumber: '2026/REG-006',
    massarNumber: 'G149912443',
    lastName: 'الحسني',
    firstName: 'سناء',
    fullNameAr: 'سناء الحسني',
    lastNameFr: 'EL HASSANI',
    firstNameFr: 'Sanae',
    fullNameFr: 'EL HASSANI Sanae',
    schoolLevel: '2 Bac — الثانية باكالوريا',
    trackId: 'tr_couture',
    classId: 'cls_f2',
    gender: 'أنثى',
    birthDate: '18/09/2007',
    phone: '0677112233',
    whatsapp: '0677112233',
    address: 'شارع المسيرة، زرارة',
    guardianName: 'مصطفى الحسني',
    guardianPhone: '0688223344',
    registrationDate: '04/09/2026',
    createdAt: '2026-09-04T08:00:00.000Z',
  },
  {
    id: 'std_07',
    registrationNumber: '2026/REG-007',
    massarNumber: 'G131109823',
    lastName: 'إدريسي',
    firstName: 'محمد أمين',
    fullNameAr: 'محمد أمين إدريسي',
    lastNameFr: 'IDRISSI',
    firstNameFr: 'Mohamed Amine',
    fullNameFr: 'IDRISSI Mohamed Amine',
    schoolLevel: '3 Collège — الثالثة إعدادي',
    trackId: 'tr_elec',
    classId: 'cls_f1',
    gender: 'ذكر',
    birthDate: '12/03/2008',
    phone: '0611447788',
    whatsapp: '0611447788',
    address: 'دوار عين بوعزة، زرارة',
    guardianName: 'حسن إدريسي',
    guardianPhone: '0622558899',
    registrationDate: '05/09/2026',
    createdAt: '2026-09-05T08:00:00.000Z',
  },
  {
    id: 'std_08',
    registrationNumber: '2026/REG-008',
    massarNumber: 'G146675432',
    lastName: 'الشاوي',
    firstName: 'خديجة',
    fullNameAr: 'خديجة الشاوي',
    lastNameFr: 'CHAOUI',
    firstNameFr: 'Khadija',
    fullNameFr: 'CHAOUI Khadija',
    schoolLevel: 'Tronc commun — الجذع المشترك',
    trackId: 'tr_couture',
    classId: 'cls_f2',
    gender: 'أنثى',
    birthDate: '04/12/2007',
    phone: '0699001122',
    whatsapp: '0699001122',
    address: 'حي الرياض، زرارة',
    guardianName: 'بوشتى الشاوي',
    guardianPhone: '0611223344',
    registrationDate: '05/09/2026',
    createdAt: '2026-09-05T08:00:00.000Z',
  },
];

export const INITIAL_APP_STATE: AppStateData = {
  version: '1.0.0',
  students: DEFAULT_STUDENTS,
  tracks: DEFAULT_TRACKS,
  classes: DEFAULT_CLASSES,
  instructors: [],
  attendanceRecords: [],
  timetableSessions: DEFAULT_TIMETABLE_SESSIONS,
  violations: [],
  settings: DEFAULT_SETTINGS,
  activityLogs: [],
  isPasswordSet: false,
};

// --- LocalStorage Layer ---

export function loadDataFromLocalStorage(): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_APP_STATE };
    const parsed = JSON.parse(raw);
    const normalizeSchoolLevel = (lvl?: string) => {
      if (!lvl) return DEFAULT_SCHOOL_LEVELS[0];
      if (lvl === 'الثانوي الإعدادي') return '3 Collège — الثالثة إعدادي';
      if (lvl === 'التعليم الأساسي') return '1 Collège — الأولى إعدادي';
      if (lvl === 'الثانوي التأهيلي') return 'Tronc commun — الجذع المشترك';
      if (lvl === 'الابتدائي') return '1 Collège — الأولى إعدادي';
      return lvl;
    };

    const existingStudents: Student[] = Array.isArray(parsed.students) && parsed.students.length > 0
      ? parsed.students.map((s: Student, idx: number) => ({
          ...s,
          registrationNumber: s.registrationNumber || `2026/REG-${String(idx + 1).padStart(3, '0')}`,
          fullNameAr: s.fullNameAr || `${s.lastName || ''} ${s.firstName || ''}`.trim(),
          fullNameFr: s.fullNameFr || (s.lastNameFr || s.firstNameFr ? `${s.lastNameFr || ''} ${s.firstNameFr || ''}`.trim() : `${s.lastName || ''} ${s.firstName || ''}`.trim()),
          schoolLevel: normalizeSchoolLevel(s.schoolLevel),
        }))
      : DEFAULT_STUDENTS;

    const existingTracks: Track[] = Array.isArray(parsed.tracks) && parsed.tracks.length > 0
      ? parsed.tracks
      : DEFAULT_TRACKS;

    const existingClasses: ClassRoom[] = Array.isArray(parsed.classes) && parsed.classes.length > 0
      ? parsed.classes
      : DEFAULT_CLASSES;

    // Ensure official administrative hierarchy from ministerial specification is applied
    const rawSettings = parsed.settings || {};
    const settings: any = {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      // If previously stored with older placeholder academy/delegation, upgrade to official
      academy:
        !rawSettings.academy || rawSettings.academy.includes('فاس')
          ? DEFAULT_SETTINGS.academy
          : rawSettings.academy,
      delegation:
        !rawSettings.delegation || rawSettings.delegation.includes('تازة')
          ? DEFAULT_SETTINGS.delegation
          : rawSettings.delegation,
      centerName:
        !rawSettings.centerName || rawSettings.centerName.includes('الفرصة')
          ? DEFAULT_SETTINGS.centerName
          : rawSettings.centerName,
      customLogoUrl: rawSettings.customLogoUrl || DEFAULT_SETTINGS.customLogoUrl,
      schoolLevels:
        Array.isArray(rawSettings.schoolLevels) && rawSettings.schoolLevels.length > 0
          ? rawSettings.schoolLevels
          : DEFAULT_SETTINGS.schoolLevels,
    };

    return {
      version: parsed.version || '1.0.0',
      students: existingStudents,
      tracks: existingTracks,
      classes: existingClasses,
      instructors: Array.isArray(parsed.instructors) ? parsed.instructors : [],
      attendanceRecords: Array.isArray(parsed.attendanceRecords) ? parsed.attendanceRecords : [],
      timetableSessions: Array.isArray(parsed.timetableSessions) && parsed.timetableSessions.length > 0 ? parsed.timetableSessions : DEFAULT_TIMETABLE_SESSIONS,
      violations: Array.isArray(parsed.violations) ? parsed.violations : [],
      settings,
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
      adminPasswordHash: parsed.adminPasswordHash,
      isPasswordSet: Boolean(parsed.isPasswordSet),
    };
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return { ...INITIAL_APP_STATE };
  }
}

export function saveDataToLocalStorage(data: AppStateData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
}

// --- IndexedDB Handle Store ---

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return resolve(null);
      }
      const timeout = setTimeout(() => resolve(null), 1500);
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => {
        clearTimeout(timeout);
        resolve(request.result);
      };
      request.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export async function saveFileHandleToIDB(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(handle, IDB_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Could not save handle to IDB:', error);
  }
}

export async function getFileHandleFromIDB(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearFileHandleFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.delete(IDB_HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Error clearing handle from IDB:', error);
  }
}

// --- File System Access API Auto-Save ---

export async function pickBackupFile(): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) {
    throw new Error('متصفحك لا يدعم واجهة الوصول إلى الملفات File System Access API. يرجى استخدام متصفح Chrome أو Edge أو Opera على الحاسوب.');
  }

  const handle = await (window as any).showSaveFilePicker({
    suggestedName: `نسخة_احتياطية_مركز_زرارة_${new Date().toISOString().slice(0, 10)}.json`,
    types: [
      {
        description: 'ملف بيانات بصيغة JSON',
        accept: {
          'application/json': ['.json'],
        },
      },
    ],
  });

  if (handle) {
    await saveFileHandleToIDB(handle);
  }
  return handle;
}

export async function verifyHandlePermission(handle: FileSystemFileHandle, requestIfDenied = false): Promise<boolean> {
  try {
    // Check current permission
    const currentStatus = await (handle as any).queryPermission({ mode: 'readwrite' });
    if (currentStatus === 'granted') return true;

    if (requestIfDenied) {
      const newStatus = await (handle as any).requestPermission({ mode: 'readwrite' });
      return newStatus === 'granted';
    }
    return false;
  } catch (error) {
    console.error('Error checking handle permission:', error);
    return false;
  }
}

export async function writeDataToFileHandle(handle: FileSystemFileHandle, data: AppStateData): Promise<boolean> {
  try {
    const isPermitted = await verifyHandlePermission(handle, false);
    if (!isPermitted) return false;

    const writable = await (handle as any).createWritable();
    const content = JSON.stringify(data, null, 2);
    await writable.write(content);
    await writable.close();
    return true;
  } catch (error) {
    console.error('Error writing to file handle:', error);
    return false;
  }
}

// --- Download & Upload JSON Backups ---

export function downloadJsonBackup(data: AppStateData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  a.href = url;
  a.download = `نسخة_احتياطية_مركز_زرارة_${day}_${month}_${year}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- CSV / Excel with BOM & Semicolon (فاصلة منقوطة) ---

/**
 * Exporte la liste des élèves au format CSV/Excel selon les exigences :
 * - Uniquement les colonnes spécifiées (Nom complet Arabe, Nom complet Français, Massar, Niveau scolaire, Filière, Classe, Sexe)
 * - Sans la colonne du numéro d'inscription
 * - Encodage UTF-8 avec BOM (\uFEFF) pour préserver l'arabe dans Microsoft Excel
 */
export function exportStudentsListToCSV(
  students: Student[],
  classes: ClassRoom[],
  tracks: Track[],
  filterTitle?: string
): void {
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const trackMap = new Map(tracks.map((t) => [t.id, t.name]));

  const headers = [
    'الاسم الكامل بالعربية',
    'الاسم الكامل بالفرنسية',
    'رقم مسار',
    'المستوى الدراسي',
    'الشعبة',
    'القسم',
    'الجنس',
  ];

  const rows = students.map((s) => {
    const cls = classes.find((c) => c.id === s.classId);
    const trackName = s.trackId && trackMap.has(s.trackId)
      ? trackMap.get(s.trackId)
      : cls?.trackIds?.[0] && trackMap.has(cls.trackIds[0])
      ? trackMap.get(cls.trackIds[0])
      : 'عام';

    const nameAr = s.fullNameAr || `${s.lastName} ${s.firstName}`.trim();
    const nameFr = s.fullNameFr || (s.lastNameFr || s.firstNameFr ? `${s.lastNameFr || ''} ${s.firstNameFr || ''}`.trim() : '');
    const schoolLevel = s.schoolLevel || DEFAULT_SCHOOL_LEVELS[0];

    return [
      nameAr,
      nameFr,
      s.massarNumber,
      schoolLevel,
      trackName || '',
      cls?.name || '',
      s.gender,
    ];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';')),
  ].join('\r\n');

  // Add UTF-8 BOM so Microsoft Excel opens Arabic without mangling
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = getTodayDDMMYYYY().replace(/\//g, '-');
  a.download = `لائحة_المتعلمين_${filterTitle ? filterTitle + '_' : ''}${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportStudentsToCSV(students: Student[], classes: ClassRoom[]): void {
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  // Standard export aligned with no registration number in public lists
  const headers = [
    'الاسم الكامل بالعربية',
    'الاسم الكامل بالفرنسية',
    'رقم مسار',
    'المستوى الدراسي',
    'الجنس',
    'القسم',
    'تاريخ الازدياد',
    'الهاتف',
    'العنوان',
    'ولي الأمر',
  ];

  const rows = students.map((s) => [
    s.fullNameAr || `${s.lastName} ${s.firstName}`.trim(),
    s.fullNameFr || (s.lastNameFr || s.firstNameFr ? `${s.lastNameFr || ''} ${s.firstNameFr || ''}`.trim() : ''),
    s.massarNumber,
    s.schoolLevel || DEFAULT_SCHOOL_LEVELS[0],
    s.gender,
    classMap.get(s.classId) || '',
    s.birthDate,
    s.phone || '',
    (s.address || '').replace(/;/g, '،'),
    s.guardianName || '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(';')),
  ].join('\r\n');

  // Add UTF-8 BOM so Microsoft Excel opens Arabic without mangling
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `لائحة_المستفيدين_مركز_زرارة_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateStudentsImportTemplate(): void {
  const headers = [
    'رقم مسار',
    'النسب',
    'الاسم',
    'الجنس',
    'تاريخ الازدياد (JJ/MM/AAAA)',
    'الهاتف',
    'واتساب',
    'العنوان',
    'ولي الأمر',
    'هاتف ولي الأمر',
    'اسم القسم أو الرمز',
    'تاريخ التسجيل (JJ/MM/AAAA)',
  ];

  const exampleRow = [
    'G134567890',
    'العلمي',
    'ياسين',
    'ذكر',
    '15/04/2008',
    '0612345678',
    '0612345678',
    'حي النهضة، زرارة',
    'محمد العلمي',
    '0698765432',
    'القسم الأول',
    '01/09/2026',
  ];

  const csvContent = [
    headers.join(';'),
    exampleRow.map((val) => `"${val}"`).join(';'),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'نموذج_استيراد_المستفيدين.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseStudentsCSV(
  csvText: string,
  classes: ClassRoom[],
  existingStudents: Student[]
): {
  success: boolean;
  imported: Student[];
  errors: string[];
} {
  const errors: string[] = [];
  const imported: Student[] = [];

  // Remove potential BOM and split lines
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) {
    return { success: false, imported: [], errors: ['الملف فارغ'] };
  }

  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { success: false, imported: [], errors: ['الملف لا يحتوي على صفوف بيانات'] };
  }

  // Detect delimiter (semicolon preferred, fallback to comma if user created with commas)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Map classes by name and code
  const classByQuery = new Map<string, string>();
  classes.forEach((c) => {
    classByQuery.set(c.name.trim().toLowerCase(), c.id);
    classByQuery.set(c.code.trim().toLowerCase(), c.id);
  });

  const existingMassars = new Set(existingStudents.map((s) => s.massarNumber.trim().toUpperCase()));
  const newMassars = new Set<string>();

  // Process data lines
  for (let i = 1; i < lines.length; i++) {
    const lineIndex = i + 1;
    const rawLine = lines[i];

    // Simple CSV parser handling quotes
    const cells: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const char = rawLine[charIdx];
      if (char === '"') {
        if (insideQuotes && rawLine[charIdx + 1] === '"') {
          currentCell += '"';
          charIdx++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    if (cells.length < 3) {
      errors.push(`السطر ${lineIndex}: عدد الأعمدة غير كافٍ.`);
      continue;
    }

    const massarNumber = cells[0]?.trim().toUpperCase() || '';
    const lastName = cells[1]?.trim() || '';
    const firstName = cells[2]?.trim() || '';
    const rawGender = cells[3]?.trim() || 'ذكر';
    const birthDate = cells[4]?.trim() || '01/01/2008';
    const phone = cells[5]?.trim() || '';
    const whatsapp = cells[6]?.trim() || '';
    const address = cells[7]?.trim() || '';
    const guardianName = cells[8]?.trim() || '';
    const guardianPhone = cells[9]?.trim() || '';
    const classQuery = cells[10]?.trim().toLowerCase() || '';
    const registrationDate = cells[11]?.trim() || '01/09/2026';

    if (!massarNumber) {
      errors.push(`السطر ${lineIndex}: رقم مسار إجباري.`);
      continue;
    }
    if (existingMassars.has(massarNumber) || newMassars.has(massarNumber)) {
      errors.push(`السطر ${lineIndex}: رقم مسار "${massarNumber}" مكرر.`);
      continue;
    }
    if (!lastName || !firstName) {
      errors.push(`السطر ${lineIndex}: النسب والاسم إجباريان.`);
      continue;
    }

    // Match class or assign to first class if not matched
    let matchedClassId = classByQuery.get(classQuery) || '';
    if (!matchedClassId && classes.length > 0) {
      matchedClassId = classes[0].id;
    }

    const gender: 'ذكر' | 'أنثى' = rawGender.includes('أنثى') || rawGender.toLowerCase() === 'f' || rawGender.includes('انثى') ? 'أنثى' : 'ذكر';

    newMassars.add(massarNumber);
    imported.push({
      id: 'std_' + Math.random().toString(36).substring(2, 9),
      massarNumber,
      lastName,
      firstName,
      gender,
      birthDate,
      phone,
      whatsapp,
      address,
      guardianName,
      guardianPhone,
      classId: matchedClassId,
      schoolLevel: DEFAULT_SCHOOL_LEVELS[0],
      registrationDate,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    success: errors.length === 0,
    imported,
    errors,
  };
}

// --- Date Helpers (JJ/MM/AAAA) ---

export function getTodayDDMMYYYY(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseDDMMYYYY(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDateToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Simple hash for local admin password
export async function hashPassword(plainText: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function exportTimetableToCSV(
  sessions: TimetableSession[],
  classes: ClassRoom[],
  tracks: Track[],
  instructors: Instructor[]
): void {
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const trackMap = new Map(tracks.map((t) => [t.id, t.name]));
  const instMap = new Map(instructors.map((i) => [i.id, i.fullName]));

  const headers = [
    'اليوم',
    'الفترة الزمنية',
    'نوع الحصة',
    'اسم الحصة / المادة',
    'الأقسام المرتبطة',
    'الشعبة',
    'المنشط المسؤول',
    'القاعة',
    'ملاحظات',
  ];

  const rows = sessions.map((s) => {
    const classNames = (s.classIds || []).map((cid) => classMap.get(cid) || cid).join('، ');
    const trackName = s.trackId ? trackMap.get(s.trackId) || '' : 'عام';
    const instName = instMap.get(s.instructorId) || 'غير محدد';
    return [
      s.day,
      s.timeSlot,
      s.sessionType,
      s.subjectName,
      classNames,
      trackName,
      instName,
      s.room || '',
      s.notes || '',
    ];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `جدول_الحصص_الأسبوعي_مركز_زرارة_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
