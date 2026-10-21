import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Edit3,
  X,
  FileCheck,
  AlertTriangle,
  FileClock,
  Filter,
  Check,
  Building,
  Calendar,
  User,
  School,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  AbsenceReason,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { getTodayDDMMYYYY } from '../../services/storage';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const JustificationsView: React.FC = () => {
  const { data, processAbsenceRecord, triggerPrintDocument } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'pending' | 'excused' | 'all'>('pending');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Justification Modal
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [decision, setDecision] = useState<'excused' | 'absent'>('excused');
  const [reason, setReason] = useState<AbsenceReason>('مرض');
  const [customDetail, setCustomDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [depositDate, setDepositDate] = useState(getTodayDDMMYYYY());

  const studentMap = useMemo(() => new Map(data.students.map((s) => [s.id, s])), [data.students]);
  const classMap = useMemo(() => new Map(data.classes.map((c) => [c.id, c])), [data.classes]);

  // Statistics
  const stats = useMemo(() => {
    const absentRecords = data.attendanceRecords.filter(
      (r) => r.status === 'absent' || r.status === 'excused'
    );
    const pending = absentRecords.filter((r) => r.status === 'absent').length;
    const excused = absentRecords.filter((r) => r.status === 'excused').length;
    const medical = absentRecords.filter((r) => r.status === 'excused' && r.reason === 'مرض').length;
    const total = absentRecords.length;
    const rate = total > 0 ? Math.round((excused / total) * 100) : 0;

    return { total, pending, excused, medical, rate };
  }, [data.attendanceRecords]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return data.attendanceRecords
      .filter((r) => {
        // Only absence records (either absent or excused)
        if (r.status !== 'absent' && r.status !== 'excused') {
          return false;
        }

        if (filterType === 'pending' && r.status !== 'absent') {
          return false;
        }
        if (filterType === 'excused' && r.status !== 'excused') {
          return false;
        }
        if (selectedClassId !== 'all' && r.classId !== selectedClassId) {
          return false;
        }
        if (dateFilter.trim() && !r.date.includes(dateFilter.trim())) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const student = studentMap.get(r.studentId);
          if (!student) return false;
          const matchName = `${student.lastName} ${student.firstName}`.toLowerCase().includes(q);
          const matchMassar = student.massarNumber.toLowerCase().includes(q);
          if (!matchName && !matchMassar) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pending first, then by date descending
        if (a.status === 'absent' && b.status !== 'absent') return -1;
        if (a.status !== 'absent' && b.status === 'absent') return 1;
        return b.recordedAt.localeCompare(a.recordedAt);
      });
  }, [data.attendanceRecords, filterType, selectedClassId, dateFilter, searchQuery, studentMap]);

  const handleOpenModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDecision('excused');
    setReason(record.reason || 'مرض');
    setNotes(record.note || '');
    setCustomDetail(record.customReason || '');
    setDepositDate(getTodayDDMMYYYY());
  };

  const handleSaveJustification = () => {
    if (!selectedRecord) return;
    const finalNote = customDetail
      ? `[${depositDate}] ${customDetail} - ${notes}`.trim()
      : `[${depositDate}] ${notes}`.trim();

    processAbsenceRecord(selectedRecord.id, decision, reason, finalNote);
    setSelectedRecord(null);
  };

  const handleQuickValidate = (record: AttendanceRecord) => {
    processAbsenceRecord(record.id, 'excused', 'ظرف عائلي', `تم التبرير السريع بتاريخ ${getTodayDDMMYYYY()}`);
  };

  return (
    <div className="space-y-6">
      {/* Official CMED Institutional Header */}
      <InstitutionalLogoHeader
        variant="compact"
        pageTitle="تدبير المبررات والوثائق الرسمية"
        pageSubtitle="مركز الفرصة الثانية - الجيل الجديد (زرارة)"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Justifications */}
        <div
          onClick={() => setFilterType('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterType === 'pending'
              ? 'bg-[#FCEDE5] border-[#E86826] shadow-sm'
              : 'bg-white border-slate-200 hover:border-[#E86826]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">في انتظار التبرير</span>
            <div className="w-9 h-9 rounded-xl bg-[#E86826]/10 flex items-center justify-center text-[#E86826]">
              <Clock className="w-5 h-5 text-[#E86826]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#923206]">{stats.pending}</span>
            <span className="text-xs text-slate-600">غياب غير مسوّى</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-700 font-medium">
            يتطلب استدعاء ولي الأمر أو تقديم وثيقة
          </div>
        </div>

        {/* Validated Excuses */}
        <div
          onClick={() => setFilterType('excused')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterType === 'excused'
              ? 'bg-[#E7F7F4] border-[#76C7B7] shadow-sm'
              : 'bg-white border-slate-200 hover:border-[#76C7B7]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">مبررات مقبولة</span>
            <div className="w-9 h-9 rounded-xl bg-[#76C7B7]/15 flex items-center justify-center text-[#125547]">
              <CheckCircle2 className="w-5 h-5 text-[#125547]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#125547]">{stats.excused}</span>
            <span className="text-xs text-slate-600">غياب مبرر قانونياً</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-700 font-medium">
            شهادات طبية أو التزامات عائلية مقبولة
          </div>
        </div>

        {/* Medical Certificates */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">شهادات طبية</span>
            <div className="w-9 h-9 rounded-xl bg-[#F4EDFB] flex items-center justify-center text-[#4C2673]">
              <FileCheck className="w-5 h-5 text-[#4C2673]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-[#4C2673]">{stats.medical}</span>
            <span className="text-xs text-slate-600">ملف صحي</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-700 font-medium">
            مبررات صادرة عن مصالح صحية
          </div>
        </div>

        {/* Justification Rate */}
        <div
          onClick={() => setFilterType('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-slate-100 border-slate-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">نسبة تسوية المبررات</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-black">
              <FileText className="w-5 h-5 text-black" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-black">{stats.rate}%</span>
            <span className="text-xs text-slate-600">من إجمالي {stats.total} غياب</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-700 font-medium">
            مؤشر الانضباط ومتابعة الأولياء
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="البحث بالاسم أو النسب أو رقم مسار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black placeholder:text-slate-400 focus:outline-none focus:border-[#76C7B7]"
            />
          </div>

          {/* Class Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:border-[#76C7B7]"
            >
              <option value="all">كل الأقسام البيداغوجية</option>
              {data.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-44">
            <input
              type="text"
              placeholder="التاريخ (JJ/MM/AAAA)"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black placeholder:text-slate-400 focus:outline-none focus:border-[#76C7B7]"
            />
          </div>

          {/* Tab Filter switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'pending'
                  ? 'bg-white text-[#923206] shadow-sm'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              في انتظار المبرر ({stats.pending})
            </button>
            <button
              onClick={() => setFilterType('excused')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'excused'
                  ? 'bg-white text-[#125547] shadow-sm'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              مبررة ({stats.excused})
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              الكل ({stats.total})
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-black" />
            <h2 className="font-bold text-black text-base">
              سجل متابعة وتدبير المبررات والوثائق
            </h2>
          </div>
          <span className="text-xs text-slate-700 font-mono font-medium">
            {filteredRecords.length} سجل معروض
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-black text-base">لا توجد سجلات مطابقة للبحث</p>
            <p className="text-xs text-slate-600 mt-1">
              جميع الغيابات مسواة أو لا توجد نتائج حسب المعايير المحددة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50/80 text-black border-b border-slate-200 font-bold text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">المستفيد(ة)</th>
                  <th className="py-3 px-4">القسم</th>
                  <th className="py-3 px-4">تاريخ الغياب</th>
                  <th className="py-3 px-4">الحصة</th>
                  <th className="py-3 px-4">وضعية المبرر</th>
                  <th className="py-3 px-4">نوع الوثيقة / السبب</th>
                  <th className="py-3 px-4">الملاحظات وتاريخ التسوية</th>
                  <th className="py-3 px-4 text-center">الإجراءات والطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-black">
                {filteredRecords.map((record) => {
                  const student = studentMap.get(record.studentId);
                  const cls = classMap.get(record.classId);
                  const isExcused = record.status === 'excused';

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student */}
                      <td className="py-3.5 px-4 font-bold text-black">
                        <div>
                          {student ? `${student.lastName} ${student.firstName}` : 'غير معروف'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-600">
                          {student?.massarNumber || '—'}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 text-black text-xs">
                        <span className="bg-slate-100 text-black px-2 py-0.5 rounded-md font-medium">
                          {cls?.name || 'قسم غير محدد'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-black">
                        {record.date}
                      </td>

                      {/* Time slot */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                        {record.timeSlot}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExcused ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E7F7F4] text-[#125547] border border-[#76C7B7]/40">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#125547]" />
                            <span>مبرر مقبول</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FCEDE5] text-[#923206] border border-[#E86826]/40">
                            <Clock className="w-3.5 h-3.5 text-[#E86826]" />
                            <span>في انتظار المبرر</span>
                          </span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-xs font-bold text-black">
                        {record.reason ? (
                          <span className="text-black">
                            {record.reason}
                            {record.customReason && ` (${record.customReason})`}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">بدون مبرر</span>
                        )}
                      </td>

                      {/* Notes / Processed */}
                      <td className="py-3.5 px-4 text-xs text-slate-700 max-w-xs truncate">
                        {record.note ? (
                          <span>{record.note}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {record.processedAt && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            سُوّي في: {record.processedAt}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Register / Edit Justification */}
                          <button
                            onClick={() => handleOpenModal(record)}
                            title={isExcused ? 'تعديل المبرر' : 'تسجيل مبرر والتحقق'}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              isExcused
                                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                : 'bg-[#76C7B7]/15 border-[#76C7B7]/40 text-[#125547] hover:bg-[#76C7B7]/30'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Quick Validate Button */}
                          {!isExcused && (
                            <button
                              onClick={() => handleQuickValidate(record)}
                              title="قبول وتبرير سريع"
                              className="p-1.5 rounded-lg border bg-[#E7F7F4] border-[#76C7B7]/50 text-[#125547] hover:bg-[#76C7B7]/30 transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print Billet d'entrée (Entry ticket) if excused */}
                          {isExcused && student && (
                            <button
                              onClick={() =>
                                triggerPrintDocument({
                                  type: 'entry_ticket',
                                  student,
                                  absenceRecord: record,
                                })
                              }
                              title="طباعة تذكرة الدخول للقسم"
                              className="p-1.5 rounded-lg border bg-[#F4EDFB] border-[#D5BEE8] text-[#4C2673] hover:bg-[#D5BEE8]/40 transition-all cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print Summons if pending */}
                          {!isExcused && student && (
                            <button
                              onClick={() =>
                                triggerPrintDocument({
                                  type: 'summons',
                                  student,
                                  absenceRecord: record,
                                })
                              }
                              title="طباعة استدعاء ولي الأمر"
                              className="p-1.5 rounded-lg border bg-[#FCEDE5] border-[#E86826]/30 text-[#923206] hover:bg-[#FCEDE5]/80 transition-all cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Justification Register & Validation Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute left-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#76C7B7]/15 flex items-center justify-center text-[#125547]">
                <FileCheck className="w-6 h-6 text-[#125547]" />
              </div>
              <div>
                <h3 className="font-bold text-black text-lg">
                  تسجيل مبرر الغياب والتحقق
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  معالجة ملف الغياب وإرفاق نوع الوثيقة والقرار الإداري
                </p>
              </div>
            </div>

            {/* Student info box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-5 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">المستفيد(ة):</span>
                <span className="font-bold text-black">
                  {studentMap.get(selectedRecord.studentId)?.lastName}{' '}
                  {studentMap.get(selectedRecord.studentId)?.firstName} (
                  {studentMap.get(selectedRecord.studentId)?.massarNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">حصة وتاريخ الغياب:</span>
                <span className="font-mono text-black font-bold">
                  {selectedRecord.date} — {selectedRecord.timeSlot}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">القسم:</span>
                <span className="font-medium text-black">
                  {classMap.get(selectedRecord.classId)?.name}
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveJustification();
              }}
              className="space-y-4"
            >
              {/* Decision */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  قرار المعالجة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('excused')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      decision === 'excused'
                        ? 'bg-[#E7F7F4] border-[#76C7B7] text-[#125547]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#125547]" />
                    <span>قبول المبرر (غياب مبرر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('absent')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      decision === 'absent'
                        ? 'bg-[#FCEDE5] border-[#E86826] text-[#923206]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-[#E86826]" />
                    <span>رفض المبرر (غير مبرر)</span>
                  </button>
                </div>
              </div>

              {/* Justification Type */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  نوع المبرر / الوثيقة المقدمة:
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as AbsenceReason)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:outline-none focus:border-[#76C7B7]"
                >
                  <option value="مرض">شهادة طبية معتمدة (مرض)</option>
                  <option value="ظرف عائلي">التزام / تصريح ولي الأمر (ظرف عائلي)</option>
                  <option value="مشكل في النقل">صعوبة في النقل أو مسافة الطريق</option>
                  <option value="موعد إداري">استدعاء أو موعد إداري رسمي</option>
                  <option value="أخرى">سبب آخر / رخصة استثنائية</option>
                </select>
              </div>

              {/* Details & Ref */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  مرجع الوثيقة أو تفاصيل إضافية:
                </label>
                <input
                  type="text"
                  placeholder="مثال: شهادة د. العلمي، رقم 102/2026، مدة 3 أيام..."
                  value={customDetail}
                  onChange={(e) => setCustomDetail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-[#76C7B7]"
                />
              </div>

              {/* Deposit Date */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  تاريخ إيداع المبرر بالإدارة:
                </label>
                <input
                  type="text"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black font-mono focus:outline-none focus:border-[#76C7B7]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  ملاحظات الإدارة:
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات الحارس العام أو الإدارة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black placeholder:text-slate-400 focus:outline-none focus:border-[#76C7B7]"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#125547] hover:bg-[#0e4438] text-white shadow-sm transition-all cursor-pointer"
                >
                  حفظ وتسجيل المبرر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
