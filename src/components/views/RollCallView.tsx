import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  School,
  CheckCheck,
  Check,
  UserX,
  Timer,
  Save,
  AlertCircle,
  Search,
} from 'lucide-react';
import { TimeSlot, AttendanceStatus, AttendanceRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { getTodayDDMMYYYY } from '../../services/storage';

const TIME_SLOTS: TimeSlot[] = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00'];

export const RollCallView: React.FC = () => {
  const { data, recordAttendanceSession } = useApp();

  const [date, setDate] = useState<string>(getTodayDDMMYYYY());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>('09:00 - 11:00');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    data.classes.length > 0 ? data.classes[0].id : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClassId && data.classes.length > 0) {
      setSelectedClassId(data.classes[0].id);
    }
  }, [data.classes, selectedClassId]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return data.students
      .filter((s) => s.classId === selectedClassId)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
  }, [data.students, selectedClassId]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.trim().toLowerCase();
    return classStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.massarNumber.toLowerCase().includes(q)
    );
  }, [classStudents, searchQuery]);

  useEffect(() => {
    const existingMap: Record<string, AttendanceStatus> = {};
    if (selectedClassId && date && selectedSlot) {
      const records = data.attendanceRecords.filter(
        (r) => r.date === date && r.timeSlot === selectedSlot && r.classId === selectedClassId
      );
      records.forEach((r) => {
        existingMap[r.studentId] = r.status;
      });
    }

    const newMap: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      newMap[s.id] = existingMap[s.id] || 'present';
    });
    setAttendanceMap(newMap);
    setSaveSuccessMessage(null);
  }, [date, selectedSlot, selectedClassId, classStudents, data.attendanceRecords]);

  const handleMarkAllPresent = () => {
    const newMap: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      newMap[s.id] = 'present';
    });
    setAttendanceMap(newMap);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = () => {
    if (!selectedClassId) {
      setErrorMessage('يرجى اختيار القسم البيداغوجي أولاً');
      return;
    }
    if (!date.trim()) {
      setErrorMessage('يرجى تحديد تاريخ الحصة');
      return;
    }
    if (classStudents.length === 0) {
      setErrorMessage('لا يوجد مستفيدون مسجلون في هذا القسم لحفظ الحضور');
      return;
    }

    const recordsToSave: AttendanceRecord[] = classStudents.map((s) => ({
      id: `${date}-${selectedSlot}-${s.id}-${Date.now()}`,
      studentId: s.id,
      timetableSessionId: 'manual', // Temporary placeholder for manual roll calls
      classId: selectedClassId,
      date,
      timeSlot: selectedSlot,
      status: attendanceMap[s.id] || 'present',
      recordedAt: new Date().toISOString(),
    }));

    try {
      recordAttendanceSession(recordsToSave);
      setErrorMessage(null);
      setSaveSuccessMessage('تم حفظ سجل حضور وغياب الحصة بنجاح.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch {
      setErrorMessage('حدث خطأ أثناء حفظ السجل.');
    }
  };

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    classStudents.forEach((s) => {
      const st = attendanceMap[s.id] || 'present';
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'late') late++;
      else if (st === 'excused') excused++;
    });

    return { present, absent, late, excused, total: classStudents.length };
  }, [classStudents, attendanceMap]);

  const selectedClass = data.classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Session Configuration Card */}
      <div className="canva-panel p-6">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-[#E7F7F4] text-[#125547] flex items-center justify-center font-bold">
            <School className="w-5 h-5 text-[#76C7B7]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">بيانات حصة النداء اليومي</h3>
            <p className="text-xs text-slate-500 font-medium">تسجيل مواظبة المستفيدين والمستفيدات حسب الحصة والقسم</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#76C7B7]" />
              <span>تاريخ الحصة (JJ/MM/AAAA)</span>
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="15/10/2026"
              className="canva-input w-full px-4 py-2.5 text-sm font-mono tabular-nums text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">صيغة: يوم/شهر/سنة</p>
          </div>

          {/* Time Slot Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#E86826]" />
              <span>الفترة الزمنية (الحصة)</span>
            </label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value as TimeSlot)}
              className="canva-input w-full px-4 py-2.5 text-sm font-mono text-slate-800"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">توقيت الحصص المعتمد بالمركز</p>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <School className="w-4 h-4 text-[#4C2673]" />
              <span>القسم البيداغوجي</span>
            </label>
            {data.classes.length === 0 ? (
              <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                يرجى إضافة أقسام أولاً في تبويب «الأقسام البيداغوجية».
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="canva-input w-full px-4 py-2.5 text-sm font-bold text-slate-800"
              >
                {data.classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            )}
            {selectedClass && (
              <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                عدد المسجلين بالقسم: <strong className="text-slate-700">{classStudents.length}</strong> مستفيد
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Roster & Actions Bar */}
      <div className="canva-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو رقم مسار..."
                className="canva-input pr-9 pl-4 py-2 text-xs text-slate-800 w-64"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            <button
              onClick={handleMarkAllPresent}
              disabled={classStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#E7F7F4] hover:bg-[#D4EFEA] text-[#125547] border border-[#76C7B7]/40 rounded-2xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="تحديد كل مستفيدي هذا القسم كـ حاضر"
            >
              <CheckCheck className="w-4 h-4 text-[#76C7B7]" />
              <span>الجميع حاضر</span>
            </button>
          </div>

          {/* Quick Counters Strip */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
              المجموع: <strong className="font-mono">{counts.total}</strong>
            </span>
            <span className="bg-[#E7F7F4] text-[#125547] px-3 py-1.5 rounded-full">
              حاضر: <strong className="font-mono">{counts.present}</strong>
            </span>
            <span className="bg-[#FCEDE5] text-[#923206] px-3 py-1.5 rounded-full">
              غائب: <strong className="font-mono">{counts.absent}</strong>
            </span>
            <span className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-full">
              متأخر: <strong className="font-mono">{counts.late}</strong>
            </span>
            {counts.excused > 0 && (
              <span className="bg-sky-50 text-sky-800 px-3 py-1.5 rounded-full">
                مبرر: <strong className="font-mono">{counts.excused}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {saveSuccessMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-800">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Error Toast */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Students Table */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200/80">
          {classStudents.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">
                لا يوجد مستفيدون مسجلون في هذا القسم بعد
              </p>
              <p className="text-xs text-slate-500 mt-1">
                توجه إلى قسم «المستفيدون» لإضافة مستفيدين وربطهم بالأقسام البيداغوجية.
              </p>
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">رقم مسار</th>
                  <th className="py-3 px-4">النسب والاسم</th>
                  <th className="py-3 px-4">الجنس</th>
                  <th className="py-3 px-4 text-center w-80">
                    تسجيل الحالة (حاضر / غائب / متأخر)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.map((student, idx) => {
                  const currentStatus = attendanceMap[student.id] || 'present';
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-[#F4EDFB]/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {student.massarNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 text-sm">
                        {student.lastName} {student.firstName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          student.gender === 'ذكر'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200 rounded-xl max-w-xs mx-auto">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-[#76C7B7] text-white shadow-xs'
                                : 'text-slate-600 hover:text-[#125547]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>حاضر</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-[#E86826] text-white shadow-xs'
                                : 'text-slate-600 hover:text-[#923206]'
                            }`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>غائب</span>
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-600 hover:text-amber-800'
                            }`}
                          >
                            <Timer className="w-3.5 h-3.5" />
                            <span>متأخر</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Save Button */}
        {classStudents.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              يتم حفظ السجل تلقائياً في قاعدة البيانات المحلية والملف المرتبط فور الضغط على الزر.
            </span>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-[#76C7B7] hover:bg-[#62B5A5] active:bg-[#50A494] text-white text-sm font-bold rounded-2xl shadow-md shadow-[#76C7B7]/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ نداء الحصة</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
