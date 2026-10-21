import React, { useState, useMemo, useRef } from 'react';
import {
  UserPlus,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  Edit,
  Trash2,
  Printer,
  X,
  AlertTriangle,
  Users,
  CheckCircle,
  Calculator,
  Eye,
  FileText,
  Filter,
  Layers,
  School,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Calendar,
  Phone,
  MapPin,
  ShieldAlert,
  ArrowUpDown,
  FileCheck,
} from 'lucide-react';
import { Student, Gender, DEFAULT_SCHOOL_LEVELS } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  exportStudentsListToCSV,
  generateStudentsImportTemplate,
  parseStudentsCSV,
  getTodayDDMMYYYY,
} from '../../services/storage';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const StudentsView: React.FC = () => {
  const {
    data,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkDeleteStudents,
    bulkAddStudents,
    triggerPrintDocument,
  } = useApp();

  // Search and Filters: Filière, Classe, Sexe, Niveau scolaire + General Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<string>('all');

  // Multi-selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Calculation display state
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);

  // Deletion modals
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Detailed Student View Modal (Fiche détaillée avec N° d'inscription)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Export Modal & Print List Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrintListModalOpen, setIsPrintListModalOpen] = useState(false);

  // Form State (Add / Edit Student)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Configured school levels from AppSettings
  const configuredLevels = useMemo(() => {
    return data.settings.schoolLevels && data.settings.schoolLevels.length > 0
      ? data.settings.schoolLevels
      : DEFAULT_SCHOOL_LEVELS;
  }, [data.settings.schoolLevels]);

  // Form Fields
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [massarNumber, setMassarNumber] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [fullNameAr, setFullNameAr] = useState('');
  const [lastNameFr, setLastNameFr] = useState('');
  const [firstNameFr, setFirstNameFr] = useState('');
  const [fullNameFr, setFullNameFr] = useState('');
  const [schoolLevel, setSchoolLevel] = useState(DEFAULT_SCHOOL_LEVELS[0]);
  const [trackId, setTrackId] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState<Gender>('ذكر');
  const [birthDate, setBirthDate] = useState('01/01/2008');
  const [birthPlace, setBirthPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [registrationDate, setRegistrationDate] = useState(getTodayDDMMYYYY());
  const [formError, setFormError] = useState<string | null>(null);

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification Banner
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Maps for quick lookup
  const classMap = useMemo(() => new Map(data.classes.map((c) => [c.id, c])), [data.classes]);
  const trackMap = useMemo(() => new Map(data.tracks.map((t) => [t.id, t])), [data.tracks]);

  // Options for modal dropdown (preserving current student's level if custom)
  const formSchoolLevelOptions = useMemo(() => {
    const list = [...configuredLevels];
    if (editingStudent?.schoolLevel && !list.includes(editingStudent.schoolLevel)) {
      list.push(editingStudent.schoolLevel);
    }
    return list;
  }, [configuredLevels, editingStudent]);

  // Helper resolvers
  const getStudentNameAr = (student: Student) => {
    if (student.fullNameAr && student.fullNameAr.trim()) return student.fullNameAr.trim();
    return `${student.lastName || ''} ${student.firstName || ''}`.trim() || '—';
  };

  const getStudentNameFr = (student: Student) => {
    if (student.fullNameFr && student.fullNameFr.trim()) return student.fullNameFr.trim();
    if (student.lastNameFr || student.firstNameFr) {
      return `${student.lastNameFr || ''} ${student.firstNameFr || ''}`.trim();
    }
    return '—';
  };

  const getStudentTrackName = (student: Student) => {
    if (student.trackId && trackMap.has(student.trackId)) {
      return trackMap.get(student.trackId)?.name || '';
    }
    const cls = classMap.get(student.classId);
    if (cls?.trackIds && cls.trackIds.length > 0) {
      const names = cls.trackIds
        .map((tId) => trackMap.get(tId)?.name)
        .filter(Boolean);
      return names.join(' / ') || 'عام';
    }
    return 'عام';
  };

  const getStudentSchoolLevel = (student: Student) => {
    return student.schoolLevel || configuredLevels[0] || DEFAULT_SCHOOL_LEVELS[0];
  };

  // Filtered students according to requirements:
  // - Filière (الشعبة)
  // - Classe (القسم)
  // - Sexe (الجنس)
  // - Niveau scolaire (المستوى الدراسي)
  // - General search query (الاسم عربي/فرنسي، رقم مسار، المستوى الدراسي، الهاتف)
  const filteredStudents = useMemo(() => {
    return data.students.filter((s) => {
      // 1. Filière filter
      if (selectedTrackId !== 'all') {
        const cls = classMap.get(s.classId);
        const matchesStudentTrack = s.trackId === selectedTrackId;
        const matchesClassTrack = cls?.trackIds?.includes(selectedTrackId as any);
        if (!matchesStudentTrack && !matchesClassTrack) return false;
      }

      // 2. Classe filter
      if (selectedClassId !== 'all' && s.classId !== selectedClassId) {
        return false;
      }

      // 3. Gender filter
      if (genderFilter !== 'all' && s.gender !== genderFilter) {
        return false;
      }

      // 4. School Level filter (المستوى الدراسي)
      if (selectedSchoolLevel !== 'all') {
        const lvl = getStudentSchoolLevel(s);
        if (lvl !== selectedSchoolLevel) {
          return false;
        }
      }

      // 5. General search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameAr = getStudentNameAr(s).toLowerCase();
        const nameFr = getStudentNameFr(s).toLowerCase();
        const massar = s.massarNumber.toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const guardian = (s.guardianName || '').toLowerCase();
        const lvl = getStudentSchoolLevel(s).toLowerCase();
        if (
          !nameAr.includes(q) &&
          !nameFr.includes(q) &&
          !massar.includes(q) &&
          !phone.includes(q) &&
          !guardian.includes(q) &&
          !lvl.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    data.students,
    selectedTrackId,
    selectedClassId,
    genderFilter,
    selectedSchoolLevel,
    searchQuery,
    classMap,
    trackMap,
    configuredLevels,
  ]);

  // Selection calculations
  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.includes(s.id));

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredStudents.map((s) => s.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      const visibleIds = filteredStudents.map((s) => s.id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Effectif statistics calculation
  // "Si aucun élève n'est sélectionné, calculer l'effectif de la liste filtrée."
  const effectifs = useMemo(() => {
    const isSelectionActive = selectedStudentIds.length > 0;
    const baseStudents = isSelectionActive
      ? filteredStudents.filter((s) => selectedStudentIds.includes(s.id))
      : filteredStudents;

    const total = baseStudents.length;
    const males = baseStudents.filter((s) => s.gender === 'ذكر').length;
    const females = baseStudents.filter((s) => s.gender === 'أنثى').length;
    const totalFiltered = filteredStudents.length;
    const totalAll = data.students.length;

    // Breakdown by school level
    const byLevel: Record<string, number> = {};
    baseStudents.forEach((s) => {
      const lvl = getStudentSchoolLevel(s);
      byLevel[lvl] = (byLevel[lvl] || 0) + 1;
    });

    return {
      isSelectionActive,
      total,
      males,
      females,
      malePercent: total > 0 ? Math.round((males / total) * 100) : 0,
      femalePercent: total > 0 ? Math.round((females / total) * 100) : 0,
      totalFiltered,
      totalAll,
      byLevel,
    };
  }, [filteredStudents, selectedStudentIds, data.students.length, configuredLevels]);

  // Open Add modal with auto-generated registration number
  const openAddModal = () => {
    setEditingStudent(null);
    const nextSeq = data.students.length + 1;
    setRegistrationNumber(`2026/REG-${String(nextSeq).padStart(3, '0')}`);
    setMassarNumber('');
    setLastName('');
    setFirstName('');
    setFullNameAr('');
    setLastNameFr('');
    setFirstNameFr('');
    setFullNameFr('');
    setSchoolLevel('الثانوي الإعدادي');
    setTrackId(data.tracks[0]?.id || '');
    setClassId(data.classes[0]?.id || '');
    setGender('ذكر');
    setBirthDate('01/01/2008');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setGuardianName('');
    setGuardianPhone('');
    setRegistrationDate(getTodayDDMMYYYY());
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit modal
  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setRegistrationNumber(student.registrationNumber || `2026/REG-${student.id.slice(-3)}`);
    setMassarNumber(student.massarNumber);
    setLastName(student.lastName);
    setFirstName(student.firstName);
    setFullNameAr(student.fullNameAr || `${student.lastName} ${student.firstName}`.trim());
    setLastNameFr(student.lastNameFr || '');
    setFirstNameFr(student.firstNameFr || '');
    setFullNameFr(student.fullNameFr || `${student.lastNameFr || ''} ${student.firstNameFr || ''}`.trim());
    setSchoolLevel(student.schoolLevel || 'الثانوي الإعدادي');
    setTrackId(student.trackId || '');
    setClassId(student.classId);
    setGender(student.gender);
    setBirthDate(student.birthDate);
    setBirthPlace(student.birthPlace || '');
    setPhone(student.phone || '');
    setWhatsapp(student.whatsapp || '');
    setAddress(student.address || '');
    setGuardianName(student.guardianName || '');
    setGuardianPhone(student.guardianPhone || '');
    setRegistrationDate(student.registrationDate || getTodayDDMMYYYY());
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save student (add or update)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanMassar = massarNumber.trim().toUpperCase();
    const cleanLast = lastName.trim();
    const cleanFirst = firstName.trim();
    const cleanReg = registrationNumber.trim();

    if (!cleanMassar || (!cleanLast && !fullNameAr.trim())) {
      setFormError('يرجى ملء الحقول الإلزامية: رقم مسار، والاسم بالعربية.');
      return;
    }

    if (!classId) {
      setFormError('يرجى تعيين القسم البيداغوجي للمتعلم.');
      return;
    }

    const duplicate = data.students.find(
      (s) => s.massarNumber.toUpperCase() === cleanMassar && (!editingStudent || s.id !== editingStudent.id)
    );
    if (duplicate) {
      setFormError(`رقم مسار (${cleanMassar}) مسجل مسبقاً لمتعلم آخر.`);
      return;
    }

    const computedFullNameAr = fullNameAr.trim() || `${cleanLast} ${cleanFirst}`.trim();
    const computedFullNameFr = fullNameFr.trim() || `${lastNameFr.trim()} ${firstNameFr.trim()}`.trim();

    const payload = {
      registrationNumber: cleanReg || `2026/REG-${Math.floor(100 + Math.random() * 900)}`,
      massarNumber: cleanMassar,
      lastName: cleanLast || computedFullNameAr.split(' ').slice(1).join(' ') || computedFullNameAr,
      firstName: cleanFirst || computedFullNameAr.split(' ')[0] || computedFullNameAr,
      fullNameAr: computedFullNameAr,
      lastNameFr: lastNameFr.trim(),
      firstNameFr: firstNameFr.trim(),
      fullNameFr: computedFullNameFr,
      schoolLevel: schoolLevel.trim() || 'الثانوي الإعدادي',
      trackId: trackId || undefined,
      gender,
      birthDate: birthDate.trim() || '01/01/2008',
      birthPlace: birthPlace.trim() || '',
      phone: phone.trim() || '',
      whatsapp: whatsapp.trim() || '',
      address: address.trim() || '',
      guardianName: guardianName.trim() || '',
      guardianPhone: guardianPhone.trim() || '',
      classId,
      registrationDate: registrationDate.trim() || getTodayDDMMYYYY(),
    };

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        ...payload,
      });
      showNotification('تم تحديث بيانات المتعلم بنجاح.');
    } else {
      addStudent(payload);
      showNotification('تم إضافة المتعلم بنجاح.');
    }

    setIsFormOpen(false);
  };

  // Single delete
  const handleConfirmSingleDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentToDelete.id));
      showNotification(`تم حذف المتعلم (${getStudentNameAr(studentToDelete)}) مع الحفاظ على أرشيف الغيابات.`);
      setStudentToDelete(null);
    }
  };

  // Bulk delete selected students
  const handleConfirmBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    bulkDeleteStudents(selectedStudentIds);
    setSelectedStudentIds([]);
    setIsBulkDeleteModalOpen(false);
    showNotification(`تم حذف ${count} متعلم(ة) محدد(ة) بنجاح مع الحفاظ التام على أرشيف وسجلات الغياب.`);
  };

  // Export handlers
  const handleExportCSV = (scope: 'filtered' | 'selected' | 'all') => {
    let targetList: Student[] = [];
    let suffix = 'جميع_المتعلمين';

    if (scope === 'selected' && selectedStudentIds.length > 0) {
      targetList = data.students.filter((s) => selectedStudentIds.includes(s.id));
      suffix = `المحددون_${targetList.length}`;
    } else if (scope === 'filtered') {
      targetList = filteredStudents;
      suffix = `المصفاة_${targetList.length}`;
    } else {
      targetList = data.students;
    }

    if (targetList.length === 0) {
      showNotification('لا توجد بيانات لتصديرها.', 'error');
      return;
    }

    // Export without registration number
    exportStudentsListToCSV(targetList, data.classes, data.tracks, suffix);
    setIsExportModalOpen(false);
    showNotification(`تم تصدير ${targetList.length} متعلم(ة) إلى ملف Excel/CSV بنجاح.`);
  };

  // CSV Import handler
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseStudentsCSV(text, data.classes, data.students);

      if (result.errors.length > 0) {
        setImportErrors(result.errors);
      } else {
        setImportErrors([]);
      }

      if (result.imported.length > 0) {
        bulkAddStudents(result.imported);
        setImportSuccessCount(result.imported.length);
        showNotification(`تم استيراد ${result.imported.length} متعلم بنجاح!`);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="space-y-6 text-black" dir="rtl">
      {/* Official CMED Institutional Header */}
      <InstitutionalLogoHeader
        variant="compact"
        pageTitle="إدارة المتعلمين والمستفيدين"
        pageSubtitle="مركز الفرصة الثانية - الجيل الجديد (زرارة)"
      />

      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold transition-all border ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Top Filter and Actions Panel */}
      <div className="canva-panel p-5 space-y-4">
        {/* Row 1: Filters (Filière, Classe, Sexe + Search) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* General Search Input */}
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث عام بالاسم (عربي/فرنسي) أو مسار..."
                className="canva-input pr-9 pl-4 py-2 text-xs text-slate-800 w-full"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter 1: Filière (الشعبة) */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="canva-input px-3.5 py-2 text-xs font-bold text-slate-700 bg-white"
                title="تصفية حسب الشعبة"
              >
                <option value="all">الشعبة: جميع الشُعب</option>
                {data.tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Classe (القسم) */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="canva-input px-3.5 py-2 text-xs font-bold text-slate-700 bg-white"
                title="تصفية حسب القسم"
              >
                <option value="all">القسم: جميع الأقسام</option>
                {data.classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Sexe (الجنس) */}
            <div className="flex items-center gap-1.5">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="canva-input px-3.5 py-2 text-xs font-bold text-slate-700 bg-white"
                title="تصفية حسب الجنس"
              >
                <option value="all">الجنس: كل الفئات (الكل)</option>
                <option value="ذكر">ذكور فقط</option>
                <option value="أنثى">إناث فقط</option>
              </select>
            </div>

            {/* Clear filters shortcut */}
            {(selectedTrackId !== 'all' || selectedClassId !== 'all' || genderFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTrackId('all');
                  setSelectedClassId('all');
                  setGenderFilter('all');
                  setSearchQuery('');
                }}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all font-medium cursor-pointer"
                title="إلغاء جميع الفلاتر"
              >
                إعادة ضبط
              </button>
            )}
          </div>

          {/* Action Buttons: Add, Effectifs, Export, Delete Selected */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Button: Add Student */}
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#76C7B7] hover:bg-[#62B5A5] text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة متعلم</span>
            </button>

            {/* Button: Calculate Effectifs (حساب العدد) */}
            <button
              onClick={() => setIsCountModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F4EDFB] hover:bg-[#E8D9F6] text-[#4C2673] border border-[#D5BEE8] text-xs font-bold rounded-2xl shadow-xs transition-all cursor-pointer"
              title="حساب وتفصيل عدد المتعلمين ونسب الذكور والإناث"
            >
              <Calculator className="w-4 h-4 text-[#4C2673]" />
              <span>حساب العدد</span>
              {selectedStudentIds.length > 0 && (
                <span className="bg-[#4C2673] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {selectedStudentIds.length}
                </span>
              )}
            </button>

            {/* Button: Export List (تصدير القائمة) */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={filteredStudents.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="تصدير القائمة بصيغة Excel أو PDF"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>تصدير القائمة</span>
            </button>

            {/* Button: Delete Selected (حذف المحددين) */}
            {selectedStudentIds.length > 0 && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition-all cursor-pointer animate-pulse"
                title="حذف المتعلمين المحددين"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>حذف المحددين ({selectedStudentIds.length})</span>
              </button>
            )}

            {/* Import CSV Button */}
            <button
              onClick={() => {
                setImportErrors([]);
                setImportSuccessCount(null);
                setIsImportModalOpen(true);
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-2xl transition-all cursor-pointer"
              title="استيراد CSV"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Selection & Effectif Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">
              المتعلمون المطابقون للتصفية:{' '}
              <strong className="text-black font-mono text-sm bg-slate-100 px-2.5 py-0.5 rounded-full">
                {filteredStudents.length}
              </strong>
            </span>

            {/* Live selected count */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedStudentIds.length > 0
                  ? 'bg-[#E7F7F4] text-[#125547] border border-[#76C7B7]/40'
                  : 'bg-slate-50 text-slate-400'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>المحدد حالياً: {selectedStudentIds.length}</span>
            </span>

            {/* Quick quick info on active selection/filters */}
            <span className="hidden sm:inline-flex items-center gap-2 text-slate-500 font-medium">
              <span className="text-blue-600 font-bold">ذكور: {effectifs.males}</span>
              <span>•</span>
              <span className="text-rose-600 font-bold">إناث: {effectifs.females}</span>
              {effectifs.isSelectionActive && (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                  (محسوب من المتعلمين المحددين)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>مركز الفرصة الثانية الجيل الجديد • نظام ويندوز</span>
          </div>
        </div>
      </div>

      {/* Main Table: Strictly the 9 requested columns */}
      <div className="canva-panel p-5 overflow-x-auto">
        {filteredStudents.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              لا يوجد متعلمون مطابقون للتصفية الحالية
            </p>
            <p className="text-xs text-slate-400 mt-1">
              قم بتعديل الفلاتر أو اضغط على «إضافة متعلم» لإدراج بيانات جديدة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-black font-bold select-none">
                  {/* 1. Case de sélection (خانة التحديد) */}
                  <th className="py-3.5 px-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllVisible}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                      title={allVisibleSelected ? 'إلغاء تحديد الكل' : 'تحديد جميع المعروضين'}
                    >
                      {allVisibleSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#76C7B7]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>

                  {/* 2. الاسم الكامل بالعربية */}
                  <th className="py-3.5 px-4 min-w-[150px]">الاسم الكامل بالعربية</th>

                  {/* 3. الاسم الكامل بالفرنسية */}
                  <th className="py-3.5 px-4 min-w-[150px]">الاسم الكامل بالفرنسية</th>

                  {/* 4. رقم مسار */}
                  <th className="py-3.5 px-4 min-w-[110px]">رقم مسار</th>

                  {/* 5. المستوى الدراسي */}
                  <th className="py-3.5 px-4 min-w-[120px]">المستوى الدراسي</th>

                  {/* 6. الشعبة */}
                  <th className="py-3.5 px-4 min-w-[140px]">الشعبة</th>

                  {/* 7. القسم */}
                  <th className="py-3.5 px-4 min-w-[110px]">القسم</th>

                  {/* 8. الجنس */}
                  <th className="py-3.5 px-4 min-w-[80px]">الجنس</th>

                  {/* 9. الإجراءات */}
                  <th className="py-3.5 px-4 text-center w-32">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const cls = classMap.get(student.classId);
                  const nameAr = getStudentNameAr(student);
                  const nameFr = getStudentNameFr(student);
                  const schoolLevel = getStudentSchoolLevel(student);
                  const trackName = getStudentTrackName(student);

                  return (
                    <tr
                      key={student.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-[#E7F7F4]/40 hover:bg-[#E7F7F4]/60'
                          : 'hover:bg-[#F4EDFB]/30'
                      }`}
                    >
                      {/* 1. خانة التحديد */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectStudent(student.id)}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#76C7B7]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* 2. الاسم الكامل بالعربية */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="font-bold text-slate-900 hover:text-[#4C2673] transition-colors text-right cursor-pointer"
                          title="عرض البطاقة الفردية المفصلة للمتعلم"
                        >
                          {nameAr}
                        </button>
                      </td>

                      {/* 3. الاسم الكامل بالفرنسية */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 tracking-wide">
                        {nameFr}
                      </td>

                      {/* 4. رقم مسار */}
                      <td className="py-3.5 px-4 font-mono font-bold text-black tabular-nums">
                        {student.massarNumber}
                      </td>

                      {/* 5. المستوى الدراسي */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                          {schoolLevel}
                        </span>
                      </td>

                      {/* 6. الشعبة */}
                      <td className="py-3.5 px-4 text-[#4C2673] font-bold text-xs">
                        {trackName}
                      </td>

                      {/* 7. القسم */}
                      <td className="py-3.5 px-4">
                        <span className="text-[#4C2673] bg-[#F4EDFB] border border-[#D5BEE8]/50 px-2.5 py-0.5 rounded-lg font-bold text-xs">
                          {cls?.name || 'غير محدد'}
                        </span>
                      </td>

                      {/* 8. الجنس */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            student.gender === 'ذكر'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      {/* 9. الإجراءات */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Fiche détaillée (View details) */}
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                            title="عرض البطاقة الفردية المفصلة (تتضمن رقم التسجيل وكافة المعلومات)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print student ID Card */}
                          <button
                            onClick={() =>
                              triggerPrintDocument({
                                type: 'student_card',
                                student,
                              })
                            }
                            className="p-1.5 bg-[#F4EDFB] hover:bg-[#E8D9F6] text-[#4C2673] rounded-xl transition-all cursor-pointer"
                            title="طباعة بطاقة المستفيد"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#4C2673]" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all cursor-pointer"
                            title="تعديل بيانات المتعلم"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-600" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                            title="حذف المتعلم مع الحفاظ على الأرشيف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Effectif Calculation (حساب العدد) */}
      {isCountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-black">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F4EDFB] text-[#4C2673] flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5 text-[#4C2673]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    حساب وتفصيل عدد المتعلمين (Effectifs)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {effectifs.isSelectionActive
                      ? `بناءً على المتعلمين المحددين (${effectifs.total})`
                      : `بناءً على قائمة التصفية الحالية (${effectifs.total})`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCountModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope explanation notice */}
            {effectifs.isSelectionActive ? (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
                تم احتساب الإحصائيات الخاصة بـ <strong>{effectifs.total}</strong> متعلم(ة) تم تحديدهم يدوياً من الجدول.
              </div>
            ) : (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 font-medium">
                لم يتم تحديد أي متعلم يدوياً، لذلك تم احتساب إحصائيات <strong>كامل اللائحة المصفاة</strong> ({effectifs.total} متعلم).
              </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* Total */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 block mb-1">العدد المحسوب</span>
                <span className="text-2xl font-mono font-bold text-black">{effectifs.total}</span>
                <span className="text-[10px] text-slate-400 block mt-1">متعلم(ة)</span>
              </div>

              {/* Males */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 text-center">
                <span className="text-xs font-bold text-blue-700 block mb-1">عدد الذكور</span>
                <span className="text-2xl font-mono font-bold text-blue-800">{effectifs.males}</span>
                <span className="text-[11px] font-bold text-blue-600 block mt-1">
                  {effectifs.malePercent}%
                </span>
              </div>

              {/* Females */}
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 text-center">
                <span className="text-xs font-bold text-rose-700 block mb-1">عدد الإناث</span>
                <span className="text-2xl font-mono font-bold text-rose-800">{effectifs.females}</span>
                <span className="text-[11px] font-bold text-rose-600 block mt-1">
                  {effectifs.femalePercent}%
                </span>
              </div>
            </div>

            {/* Proportion Progress Bar */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>التوزيع حسب الجنس:</span>
                <span>ذكور: {effectifs.malePercent}% • إناث: {effectifs.femalePercent}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${effectifs.malePercent}%` }}
                  className="bg-blue-600 h-full transition-all duration-300"
                  title={`ذكور: ${effectifs.males}`}
                />
                <div
                  style={{ width: `${effectifs.femalePercent}%` }}
                  className="bg-rose-500 h-full transition-all duration-300"
                  title={`إناث: ${effectifs.females}`}
                />
              </div>
            </div>

            {/* Additional Context Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>إجمالي المتعلمين المطابقين للتصفية:</span>
                <strong className="font-mono text-black">{effectifs.totalFiltered}</strong>
              </div>
              <div className="flex justify-between">
                <span>إجمالي المسجلين في قاعدة بيانات المركز:</span>
                <strong className="font-mono text-black">{effectifs.totalAll}</strong>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCountModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fiche détaillée de l'élève (Conserve et affiche le N° d'inscription) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-black max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-xs max-w-[130px] flex items-center justify-center shrink-0">
                  <img
                    src={data.settings.customLogoUrl || '/logo-cmed.jpeg'}
                    alt="CMED"
                    className="w-full h-auto max-h-9 object-contain"
                    style={{ aspectRatio: '440 / 131' }}
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    البطاقة الفردية المفصلة للمتعلم
                  </h3>
                  <p className="text-xs text-slate-500">
                    مركز الفرصة الثانية - الجيل الجديد (زرارة) • {data.settings.delegation}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Header Identity Card */}
            <div className="bg-gradient-to-r from-[#F4EDFB]/60 to-[#E7F7F4]/60 p-4 rounded-2xl border border-slate-200/80 mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {getStudentNameAr(viewingStudent)}
                </h4>
                <p className="text-xs font-medium text-slate-600 tracking-wider">
                  {getStudentNameFr(viewingStudent)}
                </p>
              </div>

              {/* Crucial: Numéro d'inscription (رقم التسجيل) is preserved and displayed here! */}
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs text-left">
                <span className="text-[10px] font-bold text-slate-400 block">رقم التسجيل الإداري (N°)</span>
                <span className="text-sm font-mono font-bold text-[#4C2673]">
                  {viewingStudent.registrationNumber || '2026/REG-001'}
                </span>
              </div>
            </div>

            {/* Detailed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">رقم مسار:</span>
                <strong className="font-mono text-black text-sm">{viewingStudent.massarNumber}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">المستوى الدراسي:</span>
                <strong className="text-slate-900">{getStudentSchoolLevel(viewingStudent)}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">الشعبة:</span>
                <strong className="text-[#4C2673]">{getStudentTrackName(viewingStudent)}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">القسم:</span>
                <strong className="text-slate-900">{classMap.get(viewingStudent.classId)?.name || 'غير محدد'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">الجنس:</span>
                <span className={`px-2 py-0.5 rounded-md font-bold ${
                  viewingStudent.gender === 'ذكر' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {viewingStudent.gender}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">تاريخ الازدياد:</span>
                <strong className="font-mono text-slate-900">{viewingStudent.birthDate}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">مكان الازدياد:</span>
                <strong className="text-slate-900">{viewingStudent.birthPlace || 'غير محدد'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">هاتف المتعلم:</span>
                <strong className="font-mono text-slate-900">{viewingStudent.phone || 'غير مسجل'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">رقم الواتساب:</span>
                <strong className="font-mono text-emerald-700">{viewingStudent.whatsapp || 'غير مسجل'}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">ولي الأمر:</span>
                <strong className="text-slate-900">{viewingStudent.guardianName || 'غير مسجل'}</strong>
                {viewingStudent.guardianPhone && (
                  <span className="block font-mono text-slate-500 mt-0.5">هاتف: {viewingStudent.guardianPhone}</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">تاريخ التسجيل بالمركز:</span>
                <strong className="font-mono text-slate-900">{viewingStudent.registrationDate}</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
                <span className="text-slate-400 block mb-0.5">عنوان السكن:</span>
                <strong className="text-slate-900">{viewingStudent.address || 'مركز زرارة'}</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  triggerPrintDocument({
                    type: 'student_card',
                    student: viewingStudent,
                  });
                  setViewingStudent(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F4EDFB] hover:bg-[#E8D9F6] text-[#4C2673] rounded-2xl text-xs font-bold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة بطاقة المستفيد</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const st = viewingStudent;
                    setViewingStudent(null);
                    openEditModal(st);
                  }}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setViewingStudent(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Exportation (تصدير القائمة - Excel & PDF sans numéro d'inscription) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-black">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    تصدير لائحة المتعلمين
                  </h3>
                  <p className="text-xs text-slate-500">
                    Excel و PDF بترميز UTF-8 سليم بدون رقم التسجيل
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
              اختر نطاق التصدير وتنسيق الملف المطلوب. تطبق قواعد عدم تضمين رقم التسجيل الإداري في الملفات المصدرة.
            </p>

            <div className="space-y-3 mb-6">
              {/* Option 1: Filtered list */}
              <button
                onClick={() => handleExportCSV('filtered')}
                className="w-full p-3.5 bg-slate-50 hover:bg-[#E7F7F4]/40 border border-slate-200 hover:border-[#76C7B7] rounded-2xl text-right flex items-center justify-between transition-all cursor-pointer group"
              >
                <div>
                  <strong className="text-xs text-slate-800 block">
                    تصدير Excel (CSV): اللائحة المصفاة الحالية
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    عدد السجلات: {filteredStudents.length} متعلم(ة)
                  </span>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              </button>

              {/* Option 2: Selected only (if any) */}
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={() => handleExportCSV('selected')}
                  className="w-full p-3.5 bg-[#F4EDFB]/50 hover:bg-[#F4EDFB] border border-[#D5BEE8] rounded-2xl text-right flex items-center justify-between transition-all cursor-pointer"
                >
                  <div>
                    <strong className="text-xs text-[#4C2673] block">
                      تصدير Excel (CSV): المتعلمون المحددون فقط
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      عدد المحددين: {selectedStudentIds.length} متعلم(ة)
                    </span>
                  </div>
                  <FileSpreadsheet className="w-5 h-5 text-[#4C2673] shrink-0" />
                </button>
              )}

              {/* Option 3: All registered students */}
              <button
                onClick={() => handleExportCSV('all')}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-right flex items-center justify-between transition-all cursor-pointer"
              >
                <div>
                  <strong className="text-xs text-slate-800 block">
                    تصدير Excel (CSV): جميع المتعلمين المسجلين
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    إجمالي المركز: {data.students.length} متعلم(ة)
                  </span>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-slate-600 shrink-0" />
              </button>

              {/* Option 4: PDF Export / Print Official List */}
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setIsPrintListModalOpen(true);
                }}
                className="w-full p-3.5 bg-rose-50/60 hover:bg-rose-50 border border-rose-200 rounded-2xl text-right flex items-center justify-between transition-all cursor-pointer"
              >
                <div>
                  <strong className="text-xs text-rose-800 block">
                    معاينة وطباعة اللائحة الرسمية بتنسيق PDF
                  </strong>
                  <span className="text-[11px] text-rose-600">
                    تنسيق A4 مخصص متوافق مع نظام Windows مع الترويسة الرسمية
                  </span>
                </div>
                <Printer className="w-5 h-5 text-rose-600 shrink-0" />
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Printable Official PDF List (A4 Preview) */}
      {isPrintListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl relative text-black my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-3">
                <Printer className="w-6 h-6 text-[#76C7B7]" />
                <h3 className="text-base font-bold text-slate-900">
                  معاينة اللائحة الرسمية للطباعة والحفظ بتنسيق PDF
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة / حفظ كـ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintListModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Official Document Sheet */}
            <div className="p-8 border border-slate-300 rounded-2xl bg-white text-black font-sans">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-5 text-center text-xs leading-relaxed font-bold">
                <div className="text-right">
                  <p>المملكة المغربية</p>
                  <p>وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
                  <p>{data.settings.academy}</p>
                  <p>{data.settings.delegation}</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center mx-auto mb-1 text-xs">
                    م.ف.2
                  </div>
                  <p className="text-[11px] text-slate-600">السنة التكوينية: {data.settings.academicYear}</p>
                </div>
                <div className="text-left">
                  <p>{data.settings.centerName}</p>
                  <p>جماعة زرارة - إقليم تازة</p>
                  <p className="font-mono text-[11px]">تاريخ الاستخراج: {getTodayDDMMYYYY()}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold underline decoration-2 underline-offset-4">
                  لائحة المتعلمين والمتعلمات
                </h2>
                <div className="flex justify-center gap-4 text-xs font-medium text-slate-700 mt-2">
                  <span>الشعبة: {selectedTrackId !== 'all' ? trackMap.get(selectedTrackId)?.name : 'جميع الشُعب'}</span>
                  <span>•</span>
                  <span>القسم: {selectedClassId !== 'all' ? classMap.get(selectedClassId)?.name : 'جميع الأقسام'}</span>
                  <span>•</span>
                  <span>الفئة: {genderFilter !== 'all' ? genderFilter : 'الذكور والإناث'}</span>
                </div>
              </div>

              {/* Statistical Strip */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl mb-4 flex justify-around text-xs font-bold">
                <span>المجموع: {filteredStudents.length} متعلم(ة)</span>
                <span>الذكور: {filteredStudents.filter((s) => s.gender === 'ذكر').length}</span>
                <span>الإناث: {filteredStudents.filter((s) => s.gender === 'أنثى').length}</span>
              </div>

              {/* Printable Table (Strictly NO numéro d'inscription) */}
              <table className="w-full text-right text-[11px] border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold">
                    <th className="border border-black py-2 px-2 text-center w-8">#</th>
                    <th className="border border-black py-2 px-3">الاسم الكامل بالعربية</th>
                    <th className="border border-black py-2 px-3">الاسم الكامل بالفرنسية</th>
                    <th className="border border-black py-2 px-3 text-center">رقم مسار</th>
                    <th className="border border-black py-2 px-3">المستوى الدراسي</th>
                    <th className="border border-black py-2 px-3">الشعبة</th>
                    <th className="border border-black py-2 px-3">القسم</th>
                    <th className="border border-black py-2 px-2 text-center">الجنس</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id} className="border-b border-slate-300">
                      <td className="border border-black py-1.5 px-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-black py-1.5 px-3 font-bold">{getStudentNameAr(s)}</td>
                      <td className="border border-black py-1.5 px-3">{getStudentNameFr(s)}</td>
                      <td className="border border-black py-1.5 px-3 text-center font-mono font-bold">{s.massarNumber}</td>
                      <td className="border border-black py-1.5 px-3">{getStudentSchoolLevel(s)}</td>
                      <td className="border border-black py-1.5 px-3">{getStudentTrackName(s)}</td>
                      <td className="border border-black py-1.5 px-3">{classMap.get(s.classId)?.name || '—'}</td>
                      <td className="border border-black py-1.5 px-2 text-center">{s.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer signature */}
              <div className="mt-12 flex justify-between text-xs font-bold px-6">
                <p>الحارس(ة) العام(ة) للمركز</p>
                <p>خاتم وتوقيع إدارة المركز</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bulk Delete Confirmation (حذف المحددين مع الحفاظ على الأرشيف) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl relative text-black">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تأكيد حذف المتعلمين المحددين
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  العدد المعني بالحذف: {selectedStudentIds.length} متعلم(ة)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              هل أنت متأكد من رغبتك في حذف{' '}
              <strong className="text-black font-bold">
                {selectedStudentIds.length} متعلم(ة) محدد(ة)
              </strong>{' '}
              من اللائحة الجارية؟
            </p>

            {/* Crucial requirement: Preserving absence history */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl mb-6 text-xs text-emerald-800 space-y-1 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ضمان حفظ الأرشيف:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                طبقاً لقواعد حفظ البيانات الإدارية بالمركز، لن يتم مسح سجلات الحضور والغياب أو المبررات السابقة، بل سيتم حفظ أرشيفها التاريخي كاملاً في النظام.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-600/25 transition-all cursor-pointer"
              >
                نعم، تأكيد حذف ({selectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Single Delete Confirmation */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl relative text-black">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                تأكيد حذف المتعلم
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              هل أنت متأكد من رغبتك في حذف المتعلم:{' '}
              <strong className="text-black font-bold">
                {getStudentNameAr(studentToDelete)}
              </strong>{' '}
              (رقم مسار: {studentToDelete.massarNumber})؟
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl mb-6 text-xs text-emerald-800 font-medium">
              سيتم حذف المتعلم من اللائحة الجارية مع الحفاظ على سجلات غيابه السابقة في أرشيف المركز.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-2xl shadow-md shadow-rose-600/25 transition-all cursor-pointer"
              >
                نعم، احذف المتعلم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Student (Supports all fields including N° d'inscription) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-black">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E7F7F4] text-[#125547] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-[#76C7B7]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStudent ? 'تعديل بيانات المتعلم' : 'إضافة متعلم جديد'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    مركز الفرصة الثانية الجيل الجديد (زرارة)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Numéro d'inscription (رقم التسجيل الإداري) - preserved in DB & fiche */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>رقم التسجيل الإداري (N° d'inscription)</span>
                    <span className="text-[10px] text-slate-400 font-normal">محفوظ في القاعدة والبطاقة</span>
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="مثال: 2026/REG-001"
                    className="canva-input w-full px-4 py-2 text-xs font-mono text-slate-800 font-bold"
                  />
                </div>

                {/* 2. Numéro Massar (رقم مسار) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم مسار (Code Massar) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={massarNumber}
                    onChange={(e) => setMassarNumber(e.target.value.toUpperCase())}
                    placeholder="مثال: G134567890"
                    className="canva-input w-full px-4 py-2 text-xs font-mono uppercase text-slate-800 font-bold"
                  />
                </div>

                {/* 3. Nom complet en arabe (الاسم الكامل بالعربية) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الاسم الكامل بالعربية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameAr}
                    onChange={(e) => {
                      setFullNameAr(e.target.value);
                      if (!lastName && !firstName) {
                        const parts = e.target.value.trim().split(' ');
                        setFirstName(parts[0] || '');
                        setLastName(parts.slice(1).join(' ') || '');
                      }
                    }}
                    placeholder="مثال: ياسين العلمي"
                    className="canva-input w-full px-4 py-2 text-xs text-slate-800 font-bold"
                  />
                </div>

                {/* 4. Nom complet en français (الاسم الكامل بالفرنسية) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الاسم الكامل بالفرنسية (Nom complet en français)
                  </label>
                  <input
                    type="text"
                    value={fullNameFr}
                    onChange={(e) => setFullNameFr(e.target.value)}
                    placeholder="مثال: EL ALAMI Yassine"
                    className="canva-input w-full px-4 py-2 text-xs text-slate-800 font-medium"
                    dir="ltr"
                  />
                </div>

                {/* 5. Niveau scolaire (المستوى الدراسي) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    المستوى الدراسي (Niveau scolaire)
                  </label>
                  <select
                    value={schoolLevel}
                    onChange={(e) => setSchoolLevel(e.target.value)}
                    className="canva-input w-full px-4 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="الثانوي الإعدادي">الثانوي الإعدادي</option>
                    <option value="التعليم الأساسي">التعليم الأساسي</option>
                    <option value="الثانوي التأهيلي">الثانوي التأهيلي</option>
                    <option value="الابتدائي">الابتدائي</option>
                  </select>
                </div>

                {/* 6. Filière (الشعبة) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الشعبة المهنية (Filière)
                  </label>
                  <select
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    className="canva-input w-full px-4 py-2 text-xs font-bold text-slate-800"
                  >
                    <option value="">تلقائي حسب القسم</option>
                    {data.tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. Classe (القسم) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    القسم البيداغوجي <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="canva-input w-full px-4 py-2 text-xs font-bold text-slate-800"
                  >
                    {data.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 8. Sexe (الجنس) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الجنس <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('ذكر')}
                      className={`py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                        gender === 'ذكر'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      ذكر
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('أنثى')}
                      className={`py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                        gender === 'أنثى'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      أنثى
                    </button>
                  </div>
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تاريخ الازدياد (JJ/MM/AAAA)
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    placeholder="15/04/2008"
                    className="canva-input w-full px-4 py-2 text-xs font-mono tabular-nums text-slate-800"
                  />
                </div>

                {/* Birth Place */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    مكان الازدياد (Lieu de naissance)
                  </label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="تمارة"
                    className="canva-input w-full px-4 py-2 text-xs text-slate-800"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    هاتف المتعلم
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0612345678"
                    className="canva-input w-full px-4 py-2 text-xs font-mono text-slate-800"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    رقم الواتساب
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0612345678"
                    className="canva-input w-full px-4 py-2 text-xs font-mono text-slate-800"
                  />
                </div>

                {/* Guardian Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم ولي الأمر
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="محمد العلمي"
                    className="canva-input w-full px-4 py-2 text-xs text-slate-800"
                  />
                </div>

                {/* Guardian Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    هاتف ولي الأمر
                  </label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="0698765432"
                    className="canva-input w-full px-4 py-2 text-xs font-mono text-slate-800"
                  />
                </div>

                {/* Registration Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    تاريخ التسجيل بالمركز (JJ/MM/AAAA)
                  </label>
                  <input
                    type="text"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    placeholder="01/09/2026"
                    className="canva-input w-full px-4 py-2 text-xs font-mono tabular-nums text-slate-800"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    عنوان السكن (Adresse du domicile)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="حي النهضة، مركز زرارة"
                    className="canva-input w-full px-4 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#76C7B7] hover:bg-[#62B5A5] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#76C7B7]/25 transition-all cursor-pointer"
                >
                  {editingStudent ? 'حفظ التعديلات' : 'إضافة المتعلم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CSV Import */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-black">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F4EDFB] text-[#4C2673] flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5 text-[#4C2673]" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  استيراد لائحة المتعلمين (CSV / Excel)
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">
              يمكنك رفع ملف CSV بترميز UTF-8 وفاصلة منقوطة (;). تأكد من إدراج رقم مسار والاسم لكل متعلم.
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleCSVFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-[#76C7B7] bg-slate-50/70 hover:bg-[#E7F7F4]/30 rounded-2xl p-8 text-center cursor-pointer transition-all"
            >
              <Upload className="w-8 h-8 text-[#76C7B7] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                انقر هنا لاختيار ملف CSV من الحاسوب
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                صيغة الملف: .csv بفاصلة منقوطة بترميز UTF-8
              </p>
            </div>

            {importSuccessCount !== null && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>تم استيراد {importSuccessCount} متعلم بنجاح!</span>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1 font-medium">
                <span className="font-bold block mb-1">تم العثور على أخطاء:</span>
                {importErrors.map((err, i) => (
                  <p key={i} className="text-[11px]">• {err}</p>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={generateStudentsImportTemplate}
                className="text-xs text-[#76C7B7] hover:text-[#5EAB9D] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل نموذج الاستيراد الجاهز</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
