import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Printer,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  BookOpen,
  Wrench,
  MapPin,
  User,
  Users,
  Grid,
  List,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';
import { WeekDay, TimeSlotRange, SessionType, TimetableSession } from '../../types';
import { exportTimetableToCSV } from '../../services/storage';

const DAYS_OF_WEEK: WeekDay[] = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TIME_SLOTS: TimeSlotRange[] = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00'];
const SESSION_TYPES: SessionType[] = ['التأهيل التربوي', 'التأهيل المهني'];

export const TimetableManagementView: React.FC = () => {
  const { data, addTimetableSession, updateTimetableSession, deleteTimetableSession } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedInstructorFilter, setSelectedInstructorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TimetableSession | null>(null);

  // PDF Export Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfScope, setPdfScope] = useState<'all' | 'class' | 'track' | 'instructor' | 'day'>('all');
  const [pdfTargetId, setPdfTargetId] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('جدول_الحصص_الأسبوعي.pdf');
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Form State
  const [formDay, setFormDay] = useState<WeekDay>('الإثنين');
  const [formTimeSlot, setFormTimeSlot] = useState<TimeSlotRange>('09:00 - 11:00');
  const [formSessionType, setFormSessionType] = useState<SessionType>('التأهيل التربوي');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  const [formTrackId, setFormTrackId] = useState<string>('');
  const [formInstructorId, setFormInstructorId] = useState<string>('');
  const [formRoom, setFormRoom] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Maps for quick lookup
  const classMap = useMemo(() => new Map(data.classes.map((c) => [c.id, c])), [data.classes]);
  const trackMap = useMemo(() => new Map(data.tracks.map((t) => [t.id, t])), [data.tracks]);
  const instructorMap = useMemo(() => new Map(data.instructors.map((i) => [i.id, i])), [data.instructors]);

  // Filtered sessions for main view
  const filteredSessions = useMemo(() => {
    return (data.timetableSessions || []).filter((s) => {
      if (selectedDayFilter !== 'all' && s.day !== selectedDayFilter) return false;
      if (selectedTypeFilter !== 'all' && s.sessionType !== selectedTypeFilter) return false;
      if (selectedClassFilter !== 'all' && !s.classIds.includes(selectedClassFilter)) return false;
      if (selectedInstructorFilter !== 'all' && s.instructorId !== selectedInstructorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sub = s.subjectName.toLowerCase();
        const notes = (s.notes || '').toLowerCase();
        const room = (s.room || '').toLowerCase();
        const instName = (instructorMap.get(s.instructorId)?.fullName || '').toLowerCase();
        if (!sub.includes(q) && !notes.includes(q) && !room.includes(q) && !instName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data.timetableSessions, selectedDayFilter, selectedTypeFilter, selectedClassFilter, selectedInstructorFilter, searchQuery, instructorMap]);

  // Filtered sessions for PDF export
  const pdfFilteredSessions = useMemo(() => {
    let list = data.timetableSessions || [];
    if (pdfScope === 'class' && pdfTargetId) {
      list = list.filter((s) => s.classIds.includes(pdfTargetId));
    } else if (pdfScope === 'track' && pdfTargetId) {
      list = list.filter((s) => s.trackId === pdfTargetId);
    } else if (pdfScope === 'instructor' && pdfTargetId) {
      list = list.filter((s) => s.instructorId === pdfTargetId);
    } else if (pdfScope === 'day' && pdfTargetId) {
      list = list.filter((s) => s.day === pdfTargetId);
    }
    return list;
  }, [data.timetableSessions, pdfScope, pdfTargetId]);

  // Conflict Detection
  const detectedConflicts = useMemo(() => {
    if (!isModalOpen) return [];
    const conflicts: string[] = [];
    const allSessions = data.timetableSessions || [];

    allSessions.forEach((s) => {
      if (editingSession && s.id === editingSession.id) return;
      if (s.day === formDay && s.timeSlot === formTimeSlot) {
        // 1. Instructor Conflict
        if (formInstructorId && s.instructorId === formInstructorId) {
          const instName = instructorMap.get(formInstructorId)?.fullName || 'المنشط';
          conflicts.push(`تعارض في الجدول: الأستاذ(ة) "${instName}" لديه حصة أخرى "${s.subjectName}" في نفس التوقيت (${formDay}، ${formTimeSlot}).`);
        }
        // 2. Room Conflict
        if (formRoom.trim() && s.room && s.room.trim().toLowerCase() === formRoom.trim().toLowerCase()) {
          conflicts.push(`تعارض في القاعة: القاعة "${formRoom}" محجوزة مسبقاً للحصة "${s.subjectName}" في نفس التوقيت.`);
        }
        // 3. Class Conflict
        const overlappingClasses = s.classIds.filter((cid) => formClassIds.includes(cid));
        if (overlappingClasses.length > 0) {
          const clsNames = overlappingClasses.map((cid) => classMap.get(cid)?.name || cid).join('، ');
          conflicts.push(`تعارض في القسم: القسم (الأقسام) "${clsNames}" لديه حصة أخرى "${s.subjectName}" في نفس التوقيت.`);
        }
      }
    });

    return conflicts;
  }, [isModalOpen, formDay, formTimeSlot, formInstructorId, formRoom, formClassIds, data.timetableSessions, editingSession, instructorMap, classMap]);

  const handleOpenAddModal = () => {
    setEditingSession(null);
    setFormDay('الإثنين');
    setFormTimeSlot('09:00 - 11:00');
    setFormSessionType('التأهيل التربوي');
    setFormSubjectName('');
    setFormClassIds(data.classes.length > 0 ? [data.classes[0].id] : []);
    setFormTrackId('');
    setFormInstructorId(data.instructors.length > 0 ? data.instructors[0].id : '');
    setFormRoom('');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (session: TimetableSession) => {
    setEditingSession(session);
    setFormDay(session.day);
    setFormTimeSlot(session.timeSlot);
    setFormSessionType(session.sessionType);
    setFormSubjectName(session.subjectName);
    setFormClassIds(session.classIds || []);
    setFormTrackId(session.trackId || '');
    setFormInstructorId(session.instructorId || '');
    setFormRoom(session.room || '');
    setFormNotes(session.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formSubjectName.trim()) {
      setFormError('يرجى إدخال اسم الحصة أو المادة.');
      return;
    }
    if (formClassIds.length === 0) {
      setFormError('يرجى تحديد قسم واحد على الأقل مرتبط بالحصة.');
      return;
    }

    const payload = {
      day: formDay,
      timeSlot: formTimeSlot,
      sessionType: formSessionType,
      subjectName: formSubjectName.trim(),
      classIds: formClassIds,
      trackId: formTrackId || undefined,
      instructorId: formInstructorId,
      room: formRoom.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingSession) {
      const res = updateTimetableSession({
        ...editingSession,
        ...payload,
      });
      if (res.success) {
        showNotification('تم تحديث الحصة بنجاح.');
      }
    } else {
      const res = addTimetableSession(payload);
      if (res.success) {
        showNotification('تمت إضافة الحصة بنجاح إلى جدول الحصص الأسبوعي.');
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirmed = () => {
    if (!deletingId) return;
    deleteTimetableSession(deletingId);
    showNotification('تم حذف الحصة بنجاح من الجدول.');
    setDeletingId(null);
  };



  const handleExecutePdfExport = () => {
    setPdfError(null);
    if (pdfFilteredSessions.length === 0) {
      setPdfError('لا توجد حصص مسجلة مطابقة للاختيار المحدد. يرجى تعديل نطاق التصدير أو اختيار تصدير الجدول كاملًا.');
      return;
    }
    setIsPdfModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  return (
    <div className="space-y-6 text-black">
      {/* Institutional Header (Hidden in print except designated print container) */}
      <div className="print:hidden">
        <InstitutionalLogoHeader
          variant="banner"
          pageTitle="جدول الحصص الأسبوعي وتوقيت الورشات"
          pageSubtitle="Centre de deuxième chance - Zirara • التنظيم البيداغوجي والمهني الأسبوعي"
        />
      </div>

      {/* PRINT-ONLY DEDICATED CONTAINER FOR PDF EXPORT */}
      <div className="hidden print:block text-black bg-white p-4">
        <InstitutionalLogoHeader variant="print" />
        <div className="text-center my-4 pb-2 border-b-2 border-slate-900">
          <h1 className="text-xl font-black">وثيقة جدول الحصص الأسبوعي الرسمية</h1>
          <p className="text-xs text-slate-700 mt-1">
            السنة التكوينية: {data.settings.academicYear} • تاريخ الإصدار: {new Date().toLocaleDateString('ar-MA')}
          </p>
          {pdfScope !== 'all' && (
            <p className="text-xs font-bold text-[#125547] mt-1">
              نطاق التصدير المحدد: {pdfScope === 'class' ? `قسم: ${classMap.get(pdfTargetId)?.name}` : pdfScope === 'track' ? `شعبة: ${trackMap.get(pdfTargetId)?.name}` : pdfScope === 'instructor' ? `مؤطر: ${instructorMap.get(pdfTargetId)?.fullName}` : `يوم: ${pdfTargetId}`}
            </p>
          )}
        </div>

        <table className="w-full text-right text-xs border-collapse mt-4 border border-black">
          <thead>
            <tr className="bg-slate-100 border-b border-black text-black">
              <th className="p-2 border border-black">اليوم</th>
              <th className="p-2 border border-black">التوقيت</th>
              <th className="p-2 border border-black">نوع الحصة</th>
              <th className="p-2 border border-black">المادة / الحصة</th>
              <th className="p-2 border border-black">الأقسام</th>
              <th className="p-2 border border-black">الشعبة</th>
              <th className="p-2 border border-black">المؤطر</th>
              <th className="p-2 border border-black">القاعة</th>
            </tr>
          </thead>
          <tbody>
            {pdfFilteredSessions.map((s) => {
              const inst = instructorMap.get(s.instructorId);
              const track = s.trackId ? trackMap.get(s.trackId) : null;
              const clsNames = (s.classIds || []).map((cid) => classMap.get(cid)?.name || cid).join('، ');
              return (
                <tr key={s.id} className="border-b border-black">
                  <td className="p-2 border border-black font-bold">{s.day}</td>
                  <td className="p-2 border border-black font-mono">{s.timeSlot}</td>
                  <td className="p-2 border border-black">{s.sessionType}</td>
                  <td className="p-2 border border-black font-bold">{s.subjectName}</td>
                  <td className="p-2 border border-black">{clsNames}</td>
                  <td className="p-2 border border-black">{track?.name || '—'}</td>
                  <td className="p-2 border border-black">{inst?.fullName || 'غير محدد'}</td>
                  <td className="p-2 border border-black">{s.room || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="pt-12 flex justify-between items-center text-xs font-bold border-t border-slate-300 mt-12">
          <p>إدارة مركز الفرصة الثانية – زرارة</p>
          <p>خاتم وتوقيع الإدارة</p>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`print:hidden p-4 rounded-2xl border flex items-center gap-3 shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.text}</span>
        </div>
      )}

      {/* Control & Actions Toolbar */}
      <div className="print:hidden bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#125547] hover:bg-[#0e4438] text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حصة جديدة</span>
          </button>

          <button
            onClick={() => {
              setPdfScope('all');
              setIsPdfModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E86826] hover:bg-[#d45b1e] text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>📄 تصدير الجدول إلى PDF</span>
          </button>


        </div>

        {/* View Mode Switcher & Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الحصص والأنشطة..."
              className="canva-input w-full pr-10 pl-3.5 py-2 text-xs font-medium"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-black shadow-xs' : 'text-slate-500 hover:text-black'
              }`}
              title="عرض الشبكة الأسبوعية"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">الشبكة</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-black shadow-xs' : 'text-slate-500 hover:text-black'
              }`}
              title="عرض اللائحة"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">اللائحة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="print:hidden bg-[#F8F9FB] rounded-2xl p-4 border border-slate-200/80 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-[#125547]" />
          <span>تصفية الجدول:</span>
        </div>

        {/* Day Filter */}
        <select
          value={selectedDayFilter}
          onChange={(e) => setSelectedDayFilter(e.target.value)}
          className="canva-input px-3 py-1.5 text-xs font-semibold bg-white"
        >
          <option value="all">كل الأيام</option>
          {DAYS_OF_WEEK.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedTypeFilter}
          onChange={(e) => setSelectedTypeFilter(e.target.value)}
          className="canva-input px-3 py-1.5 text-xs font-semibold bg-white"
        >
          <option value="all">كل أنواع الحصص</option>
          {SESSION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Class Filter */}
        <select
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
          className="canva-input px-3 py-1.5 text-xs font-semibold bg-white"
        >
          <option value="all">كل الأقسام</option>
          {data.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Instructor Filter */}
        <select
          value={selectedInstructorFilter}
          onChange={(e) => setSelectedInstructorFilter(e.target.value)}
          className="canva-input px-3 py-1.5 text-xs font-semibold bg-white"
        >
          <option value="all">كل المؤطرين والمنشطين</option>
          {data.instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.fullName}
            </option>
          ))}
        </select>

        {(selectedDayFilter !== 'all' || selectedTypeFilter !== 'all' || selectedClassFilter !== 'all' || selectedInstructorFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedDayFilter('all');
              setSelectedTypeFilter('all');
              setSelectedClassFilter('all');
              setSelectedInstructorFilter('all');
              setSearchQuery('');
            }}
            className="text-xs text-rose-600 font-bold hover:underline cursor-pointer mr-auto"
          >
            إعادة ضبط الفلاتر
          </button>
        )}
      </div>

      {/* TIMETABLE DISPLAY: GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="print:hidden space-y-6">
          {DAYS_OF_WEEK.map((day) => {
            const daySessions = filteredSessions.filter((s) => s.day === day);
            if (selectedDayFilter !== 'all' && selectedDayFilter !== day) return null;

            return (
              <div key={day} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                {/* Day Header */}
                <div className="bg-[#125547] text-white px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-[#76C7B7]" />
                    <h3 className="text-sm font-extrabold">{day}</h3>
                  </div>
                  <span className="text-xs bg-white/15 px-3 py-1 rounded-full font-bold">
                    {daySessions.length} حصة مسجلة
                  </span>
                </div>

                {/* Slots container */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {TIME_SLOTS.map((slot, idx) => {
                    const slotSessions = daySessions.filter((s) => s.timeSlot === slot);

                    return (
                      <div
                        key={slot}
                        className="bg-[#F8F9FB] rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80">
                            <span className="text-xs font-black text-[#125547] font-mono flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{slot}</span>
                            </span>
                            <span className="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                              الحصة {idx + 1}
                            </span>
                          </div>

                          {/* Sessions in this slot */}
                          {slotSessions.length === 0 ? (
                            <div className="py-6 text-center text-slate-400 text-xs italic">
                              لا توجد حصص مبرمجة في هذا التوقيت
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {slotSessions.map((session) => {
                                const isEducational = session.sessionType === 'التأهيل التربوي';
                                const inst = instructorMap.get(session.instructorId);
                                const track = session.trackId ? trackMap.get(session.trackId) : null;
                                const clsNames = (session.classIds || [])
                                  .map((cid) => classMap.get(cid)?.name || cid)
                                  .join('، ');

                                return (
                                  <div
                                    key={session.id}
                                    className={`rounded-2xl p-3 border transition-all ${
                                      isEducational
                                        ? 'bg-[#E7F7F4] border-[#76C7B7]/50 text-[#0E4438]'
                                        : 'bg-[#FDF2EE] border-[#E86826]/30 text-[#9A3412]'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        {isEducational ? (
                                          <BookOpen className="w-3.5 h-3.5 text-[#125547] shrink-0" />
                                        ) : (
                                          <Wrench className="w-3.5 h-3.5 text-[#E86826] shrink-0" />
                                        )}
                                        <h4 className="text-xs font-black tracking-tight leading-tight">
                                          {session.subjectName}
                                        </h4>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => handleOpenEditModal(session)}
                                          className="p-1 hover:bg-black/5 rounded-lg text-slate-600 transition-colors cursor-pointer"
                                          title="تعديل الحصة"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setDeletingId(session.id)}
                                          className="p-1 hover:bg-rose-500/10 rounded-lg text-rose-600 transition-colors cursor-pointer"
                                          title="حذف الحصة"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-1 text-[11px] font-medium opacity-90">
                                      <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3 shrink-0 opacity-70" />
                                        <span className="truncate">الأقسام: {clsNames || '—'}</span>
                                      </div>
                                      {track && (
                                        <div className="flex items-center gap-1">
                                          <span className="font-bold">الشعبة:</span>
                                          <span className="truncate">{track.name}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3 shrink-0 opacity-70" />
                                        <span>المؤطر: {inst?.fullName || 'غير محدد'}</span>
                                      </div>
                                      {session.room && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 shrink-0 opacity-70" />
                                          <span>القاعة: {session.room}</span>
                                        </div>
                                      )}
                                      {session.notes && (
                                        <p className="text-[10px] italic pt-1 border-t border-black/10 mt-1">
                                          {session.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {idx === 1 && (
                          <div className="mt-3 text-center text-[10px] font-bold text-slate-400 bg-slate-200/50 py-1 rounded-xl">
                            فترة الاستراحة والغداء (13:00 - 14:00)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TIMETABLE DISPLAY: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="print:hidden bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F8F9FB] text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">اليوم</th>
                  <th className="py-3.5 px-4">التوقيت</th>
                  <th className="py-3.5 px-4">نوع الحصة</th>
                  <th className="py-3.5 px-4">اسم الحصة / المادة</th>
                  <th className="py-3.5 px-4">الأقسام</th>
                  <th className="py-3.5 px-4">الشعبة</th>
                  <th className="py-3.5 px-4">المؤطر المسؤول</th>
                  <th className="py-3.5 px-4">القاعة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      لا توجد حصص مطابقة لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => {
                    const isEdu = s.sessionType === 'التأهيل التربوي';
                    const inst = instructorMap.get(s.instructorId);
                    const track = s.trackId ? trackMap.get(s.trackId) : null;
                    const clsNames = (s.classIds || []).map((cid) => classMap.get(cid)?.name || cid).join('، ');

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-black">{s.day}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#125547]">{s.timeSlot}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isEdu ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-orange-50 text-orange-800 border border-orange-200'
                            }`}
                          >
                            {s.sessionType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-black">{s.subjectName}</td>
                        <td className="py-3.5 px-4">{clsNames || '—'}</td>
                        <td className="py-3.5 px-4">{track?.name || '—'}</td>
                        <td className="py-3.5 px-4 font-semibold">{inst?.fullName || 'غير محدد'}</td>
                        <td className="py-3.5 px-4 font-mono">{s.room || '—'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(s)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(s.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PDF EXPORT OPTIONS */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs print:hidden">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-black space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#E86826] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-[#E86826]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">تصدير جدول الحصص إلى PDF</h3>
                  <p className="text-xs text-slate-500">اختر نطاق التصدير وتخصيص الملف</p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pdfError && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3 text-xs font-bold">
                {pdfError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">اسم الملف المقترح</label>
                <input
                  type="text"
                  value={pdfFileName}
                  onChange={(e) => setPdfFileName(e.target.value)}
                  className="canva-input w-full px-3.5 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">نطاق التصدير</label>
                <select
                  value={pdfScope}
                  onChange={(e) => {
                    const sc = e.target.value as any;
                    setPdfScope(sc);
                    setPdfTargetId('');
                  }}
                  className="canva-input w-full px-3.5 py-2 font-semibold bg-white"
                >
                  <option value="all">تصدير الجدول الأسبوعي كاملًا</option>
                  <option value="class">تصدير جدول قسم محدد</option>
                  <option value="track">تصدير جدول شعبة محددة</option>
                  <option value="instructor">تصدير جدول منشّط / مؤطر محدد</option>
                  <option value="day">تصدير جدول يوم محدد</option>
                </select>
              </div>

              {pdfScope === 'class' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">اختر القسم</label>
                  <select
                    value={pdfTargetId}
                    onChange={(e) => setPdfTargetId(e.target.value)}
                    className="canva-input w-full px-3.5 py-2 font-semibold bg-white"
                  >
                    <option value="">— اختر القسم —</option>
                    {data.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pdfScope === 'track' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">اختر الشعبة</label>
                  <select
                    value={pdfTargetId}
                    onChange={(e) => setPdfTargetId(e.target.value)}
                    className="canva-input w-full px-3.5 py-2 font-semibold bg-white"
                  >
                    <option value="">— اختر الشعبة —</option>
                    {data.tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pdfScope === 'instructor' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">اختر المنشّط / المؤطر</label>
                  <select
                    value={pdfTargetId}
                    onChange={(e) => setPdfTargetId(e.target.value)}
                    className="canva-input w-full px-3.5 py-2 font-semibold bg-white"
                  >
                    <option value="">— اختر المنشّط —</option>
                    {data.instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pdfScope === 'day' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">اختر اليوم</label>
                  <select
                    value={pdfTargetId}
                    onChange={(e) => setPdfTargetId(e.target.value)}
                    className="canva-input w-full px-3.5 py-2 font-semibold bg-white"
                  >
                    <option value="">— اختر اليوم —</option>
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-[#F8F9FB] p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>• سيتم تنسيق المستند تلقائياً على ورق A4 بالاتجاه الأفقي (Landscape).</p>
                <p>• يتضمن الشعار الرسمي للمركز والهوية الإدارية لوزارة التربية الوطنية.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 font-bold text-slate-500 hover:text-black cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleExecutePdfExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#125547] hover:bg-[#0e4438] text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>معاينة وطباعة / حفظ PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SESSION FORM */}
      {isModalOpen && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E7F7F4] text-[#125547] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5 text-[#125547]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-black">
                    {editingSession ? 'تعديل بيانات الحصة التدريبية' : 'إضافة حصة جديدة لجدول المركز'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    لا يشترط ربط الحصة بأي مستوى دراسي؛ التنظيم يعتمد على الأقسام والورشات.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Detection Alert */}
            {detectedConflicts.length > 0 && (
              <div className="mb-5 bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2 text-amber-900 text-xs">
                <div className="flex items-center gap-2 font-extrabold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تنبيه: اكتشاف تعارض في الجدولة الزمنية</span>
                </div>
                <ul className="list-disc list-inside space-y-1 font-medium pr-2">
                  {detectedConflicts.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Day */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">يوم الأسبوع</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as WeekDay)}
                    className="canva-input w-full px-3.5 py-2 text-xs font-bold bg-white"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الفترة الزمنية</label>
                  <select
                    value={formTimeSlot}
                    onChange={(e) => setFormTimeSlot(e.target.value as TimeSlotRange)}
                    className="canva-input w-full px-3.5 py-2 text-xs font-mono font-bold bg-white"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot} {slot === '09:00 - 11:00' ? '(الحصة الأولى)' : slot === '11:00 - 13:00' ? '(الحصة الثانية)' : '(الحصة الثالثة)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Session Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الحصة</label>
                  <select
                    value={formSessionType}
                    onChange={(e) => setFormSessionType(e.target.value as SessionType)}
                    className="canva-input w-full px-3.5 py-2 text-xs font-bold bg-white"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الحصة / المادة / الورشة *</label>
                  <input
                    type="text"
                    required
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    placeholder="مثال: التركيبات الكهربائية، اللغة العربية..."
                    className="canva-input w-full px-3.5 py-2 text-xs font-bold"
                  />
                </div>

                {/* Classes (Multi-select check) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الأقسام المستهدفة (يمكن اختيار أكثر من قسم للحصص المشتركة) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8F9FB] p-3 rounded-2xl border border-slate-200">
                    {data.classes.map((cls) => {
                      const isChecked = formClassIds.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            isChecked ? 'bg-white border-[#125547] text-black shadow-2xs' : 'border-transparent text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormClassIds([...formClassIds, cls.id]);
                              } else {
                                setFormClassIds(formClassIds.filter((id) => id !== cls.id));
                              }
                            }}
                            className="rounded-md border-slate-300 text-[#125547] focus:ring-[#125547]"
                          />
                          <span>{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Track / Filière */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الشعبة (اختياري للتأهيل المهني)</label>
                  <select
                    value={formTrackId}
                    onChange={(e) => setFormTrackId(e.target.value)}
                    className="canva-input w-full px-3.5 py-2 text-xs font-medium bg-white"
                  >
                    <option value="">— عام لجميع الشعب —</option>
                    {data.tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instructor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المؤطر أو المنشط المسؤول</label>
                  <select
                    value={formInstructorId}
                    onChange={(e) => setFormInstructorId(e.target.value)}
                    className="canva-input w-full px-3.5 py-2 text-xs font-bold bg-white"
                  >
                    <option value="">— غير محدد —</option>
                    {data.instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.fullName} ({i.specialty || 'مؤطر'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">القاعة أو الورشة المعتمدة</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="مثال: قاعة رقم 1، ورشة الكهرباء..."
                    className="canva-input w-full px-3.5 py-2 text-xs font-medium"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات توجيهية اختيارية</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ملاحظات حول محتوى الحصة أو التجهيزات المطلوبة..."
                    className="canva-input w-full px-3.5 py-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#125547] hover:bg-[#0e4438] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {editingSession ? 'حفظ التعديلات' : 'إضافة الحصة للجدول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingId && (
        <div className="print:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center text-black space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-black">تأكيد حذف الحصة من الجدول</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذه الحصة الدراسية نهائياً من الجدول الأسبوعي للمركز؟
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                تراجع
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
