import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Printer,
  Edit3,
  X,
  FileCheck,
  UserX,
  Timer,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceStatus,
  AbsenceReason,
} from '../../types';
import { useApp } from '../../context/AppContext';

export const AbsenceLogView: React.FC = () => {
  const { data, processAbsenceRecord, triggerPrintDocument } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Processing Modal State
  const [processingRecord, setProcessingRecord] = useState<AttendanceRecord | null>(null);
  const [modalStatus, setModalStatus] = useState<AttendanceStatus>('excused');
  const [modalReason, setModalReason] = useState<AbsenceReason>('مرض');
  const [modalNote, setModalNote] = useState<string>('');

  const studentMap = useMemo(() => new Map(data.students.map((s) => [s.id, s])), [data.students]);
  const classMap = useMemo(() => new Map(data.classes.map((c) => [c.id, c])), [data.classes]);

  const filteredRecords = useMemo(() => {
    return data.attendanceRecords
      .filter((r) => {
        if (r.status === 'present' && statusFilter !== 'present' && statusFilter !== 'all') {
          return false;
        }

        if (statusFilter !== 'all' && r.status !== statusFilter) {
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
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  }, [data.attendanceRecords, statusFilter, selectedClassId, dateFilter, searchQuery, studentMap]);

  const openProcessModal = (record: AttendanceRecord) => {
    setProcessingRecord(record);
    setModalStatus(record.status === 'absent' ? 'excused' : record.status);
    setModalReason(record.reason || 'مرض');
    setModalNote(record.note || '');
  };

  const handleSaveProcessing = () => {
    if (!processingRecord) return;
    processAbsenceRecord(processingRecord.id, modalStatus, modalReason, modalNote);
    setProcessingRecord(null);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FCEDE5] text-[#923206] border border-[#E86826]/30">
            <UserX className="w-3.5 h-3.5 text-[#E86826]" />
            <span>غير مبرر</span>
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E7F7F4] text-[#125547] border border-[#76C7B7]/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#76C7B7]" />
            <span>غياب مبرر</span>
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Timer className="w-3.5 h-3.5 text-amber-600" />
            <span>تأخر</span>
          </span>
        );
      case 'present':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span>حاضر</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Strip */}
      <div className="canva-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو مسار..."
              className="canva-input pr-9 pl-4 py-2 text-xs text-slate-800 w-56 font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="canva-input px-3.5 py-2 text-xs font-bold text-slate-700"
          >
            <option value="all">جميع الأقسام</option>
            {data.classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="canva-input px-3.5 py-2 text-xs font-bold text-slate-700"
          >
            <option value="all">كل الحالات (غياب / مبرر / تأخر)</option>
            <option value="absent">غياب غير مبرر فقط</option>
            <option value="excused">غياب مبرر فقط</option>
            <option value="late">تأخر فقط</option>
          </select>

          {/* Date Filter */}
          <div className="relative">
            <input
              type="text"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="تصفية بالتاريخ (JJ/MM/AAAA)"
              className="canva-input px-3.5 py-2 text-xs text-slate-800 w-48 font-mono"
            />
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-full font-mono tabular-nums">
          عدد السجلات: <strong className="text-slate-800 font-bold">{filteredRecords.length}</strong>
        </div>
      </div>

      {/* Absence Records Table */}
      <div className="canva-panel p-6 overflow-x-auto">
        {filteredRecords.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              لا توجد سجلات مطابقة للبحث أو التصفية
            </p>
            <p className="text-xs text-slate-400 mt-1">
              يتم إدراج الغيابات والتأخرات تلقائياً بمجرد إتمام تسجيل النداء اليومي.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-black font-bold">
                  <th className="py-3 px-4">المستفيد</th>
                  <th className="py-3 px-4">رقم مسار</th>
                  <th className="py-3 px-4">القسم</th>
                  <th className="py-3 px-4">التاريخ والحصة</th>
                  <th className="py-3 px-4">الوضعية</th>
                  <th className="py-3 px-4">السبب والملاحظة</th>
                  <th className="py-3 px-4">حالة المعالجة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRecords.map((record) => {
                  const student = studentMap.get(record.studentId);
                  const cls = classMap.get(record.classId);
                  return (
                    <tr key={record.id} className="hover:bg-[#F4EDFB]/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-black text-sm">
                        {student ? `${student.lastName} ${student.firstName}` : 'مستفيد غير معروف'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-black">
                        {student?.massarNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-black font-medium">
                        {cls?.name || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-black font-bold tabular-nums">{record.date}</div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">{record.timeSlot}</div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-3 px-4 text-black">
                        {record.reason && (
                          <span className="font-bold text-[#4C2673] bg-[#F4EDFB] px-2 py-0.5 rounded-md ml-1.5">{record.reason}</span>
                        )}
                        {record.note && (
                          <span className="text-slate-600 text-[11px]">({record.note})</span>
                        )}
                        {!record.reason && !record.note && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {record.processedAt ? (
                          <span className="text-xs text-[#125547] bg-[#E7F7F4] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#76C7B7]" />
                            <span>معالج ({record.processedAt})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-[#923206] bg-[#FCEDE5] px-2.5 py-1 rounded-full font-bold">قيد الانتظار</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Process Button */}
                          <button
                            onClick={() => openProcessModal(record)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4EDFB] hover:bg-[#E8D9F6] text-[#4C2673] border border-[#D5BEE8] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                            title="معالجة وتبرير الغياب"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#4C2673]" />
                            <span>معالجة</span>
                          </button>

                          {/* Quick Summons print if absent */}
                          {student && record.status === 'absent' && (
                            <button
                              onClick={() =>
                                triggerPrintDocument({
                                  type: 'summons',
                                  student,
                                  absenceRecord: record,
                                })
                              }
                              className="p-1.5 bg-[#FCEDE5] hover:bg-[#F9D7C5] text-[#923206] border border-[#E86826]/30 rounded-xl transition-all cursor-pointer"
                              title="طباعة استدعاء ولي الأمر"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Entry Ticket if excused */}
                          {student && record.status === 'excused' && (
                            <button
                              onClick={() =>
                                triggerPrintDocument({
                                  type: 'entry_ticket',
                                  student,
                                  absenceRecord: record,
                                })
                              }
                              className="p-1.5 bg-[#E7F7F4] hover:bg-[#D4EFEA] text-[#125547] border border-[#76C7B7]/40 rounded-xl transition-all cursor-pointer"
                              title="طباعة تذكرة الدخول"
                            >
                              <FileCheck className="w-4 h-4" />
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

      {/* Modal: Process Absence */}
      {processingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#F4EDFB] text-[#4C2673] flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4 text-[#4C2673]" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  معالجة وضعية الغياب / التأخر
                </h3>
              </div>
              <button
                onClick={() => setProcessingRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student info strip */}
            {(() => {
              const student = studentMap.get(processingRecord.studentId);
              const cls = classMap.get(processingRecord.classId);
              return (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl mb-5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 text-sm">
                      {student ? `${student.lastName} ${student.firstName}` : 'المستفيد'}
                    </span>
                    <span className="font-mono font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      مسار: {student?.massarNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                    <span>القسم: <strong className="text-slate-700">{cls?.name}</strong></span>
                    <span>•</span>
                    <span className="font-mono tabular-nums">التاريخ: {processingRecord.date}</span>
                    <span>•</span>
                    <span className="font-mono">{processingRecord.timeSlot}</span>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  تحديد الوضعية بعد المعالجة
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalStatus('excused')}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      modalStatus === 'excused'
                        ? 'bg-[#76C7B7] text-white border-[#76C7B7] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    غياب مبرر
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStatus('absent')}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      modalStatus === 'absent'
                        ? 'bg-[#E86826] text-white border-[#E86826] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    غياب غير مبرر
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStatus('late')}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      modalStatus === 'late'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    تأخر
                  </button>
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  السبب (حسب الإدلاء أو الاتصال)
                </label>
                <select
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value as AbsenceReason)}
                  className="canva-input w-full px-4 py-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="مرض">مرض (شهادة طبية أو وعكة)</option>
                  <option value="ظرف عائلي">ظرف عائلي طارئ</option>
                  <option value="مشكل في النقل">مشكل في النقل أو صعوبة التنقل</option>
                  <option value="موعد إداري">موعد إداري أو استدعاء رسمي</option>
                  <option value="أخرى">أخرى (يُذكر في الملاحظة)</option>
                </select>
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  ملاحظات الإدارة
                </label>
                <textarea
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="رقم الشهادة الطبية، تفاصيل تواصل الإدارة مع ولي الأمر..."
                  rows={3}
                  className="canva-input w-full px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Direct Documents Links from Processing Modal */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-600 mb-2.5">
                  توليد وطباعة الوثيقة المناسبة لهذه الحالة:
                </span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const student = studentMap.get(processingRecord.studentId);
                      if (student) {
                        triggerPrintDocument({
                          type: 'entry_ticket',
                          student,
                          absenceRecord: {
                            ...processingRecord,
                            status: modalStatus,
                            reason: modalReason,
                            note: modalNote,
                          },
                        });
                        setProcessingRecord(null);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-[#E7F7F4] hover:bg-[#D4EFEA] text-[#125547] border border-[#76C7B7]/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-[#76C7B7]" />
                    <span>طباعة تذكرة الدخول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const student = studentMap.get(processingRecord.studentId);
                      if (student) {
                        triggerPrintDocument({
                          type: 'summons',
                          student,
                          absenceRecord: processingRecord,
                        });
                        setProcessingRecord(null);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-[#FCEDE5] hover:bg-[#F9D7C5] text-[#923206] border border-[#E86826]/30 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#E86826]" />
                    <span>استدعاء ولي الأمر</span>
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProcessingRecord(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveProcessing}
                  className="px-6 py-2.5 bg-[#76C7B7] hover:bg-[#62B5A5] text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-[#76C7B7]/25 cursor-pointer"
                >
                  حفظ المعالجة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
