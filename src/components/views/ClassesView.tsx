import React, { useState } from 'react';
import {
  School,
  Plus,
  Edit,
  Trash2,
  Users,
  Layers,
  GraduationCap,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ClassRoom } from '../../types';
import { useApp } from '../../context/AppContext';

export const ClassesView: React.FC = () => {
  const {
    data,
    addClassRoom,
    updateClassRoom,
    deleteClassRoom,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassRoom | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [academicYear, setAcademicYear] = useState(data.settings.academicYear);
  const [track1Id, setTrack1Id] = useState('');
  const [track2Id, setTrack2Id] = useState('');
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const trackMap = new Map(data.tracks.map((t) => [t.id, t]));
  const instructorMap = new Map(data.instructors.map((i) => [i.id, i]));

  const openAddModal = () => {
    setEditingClass(null);
    setName('');
    setCode('');
    setAcademicYear(data.settings.academicYear);
    setTrack1Id(data.tracks[0]?.id || '');
    setTrack2Id(data.tracks[1]?.id || '');
    setSelectedInstructorIds([]);
    setNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (cls: ClassRoom) => {
    setEditingClass(cls);
    setName(cls.name);
    setCode(cls.code);
    setAcademicYear(cls.academicYear);
    setTrack1Id(cls.trackIds?.[0] || '');
    setTrack2Id(cls.trackIds?.[1] || '');
    setSelectedInstructorIds(cls.instructorIds || []);
    setNotes(cls.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleToggleInstructor = (id: string) => {
    setSelectedInstructorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !code.trim()) {
      setFormError('اسم القسم ورمزه مطلوبان.');
      return;
    }

    if (!track1Id || !track2Id) {
      setFormError('قاعدة إجبارية: يجب اختيار شعبتين بالضبط لكل قسم بيداغوجي.');
      return;
    }

    if (track1Id === track2Id) {
      setFormError('يجب اختيار شعبتين مختلفتين.');
      return;
    }

    if (editingClass) {
      const res = updateClassRoom({
        ...editingClass,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        academicYear: academicYear.trim(),
        trackIds: [track1Id, track2Id],
        instructorIds: selectedInstructorIds,
        notes: notes.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'فشل التعديل.');
        return;
      }
    } else {
      const res = addClassRoom({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        academicYear: academicYear.trim(),
        trackIds: [track1Id, track2Id],
        instructorIds: selectedInstructorIds,
        notes: notes.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'فشل إضافة القسم.');
        return;
      }
    }

    setIsFormOpen(false);
  };

  const confirmDelete = () => {
    if (!classToDelete) return;
    const res = deleteClassRoom(classToDelete.id);
    if (!res.success) {
      alert(res.message);
    }
    setClassToDelete(null);
  };

  return (
    <div className="space-y-6 text-black">
      {/* Top Banner */}
      <div className="canva-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-black flex items-center gap-2">
            <School className="w-5 h-5 text-[#76C7B7]" />
            <span>الأقسام البيداغوجية والشعب المزدوجة</span>
          </h3>
          <p className="text-xs text-slate-700 mt-1">
            كل قسم بيداغوجي بمركز الفرصة الثانية يضم شعبتين تكوينيتين بالضبط مع إمكانية تعيين عدة مؤطرين.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={data.tracks.length < 2}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#76C7B7] hover:bg-[#62baa8] text-[#0f4438] text-xs font-bold rounded-2xl shadow-sm transition-all disabled:opacity-40 cursor-pointer"
          title={data.tracks.length < 2 ? 'يرجى إضافة شعبتين على الأقل في تبويب الشعب أولاً' : ''}
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {data.tracks.length < 2 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            تنبيه: يلزم وجود شعبتين على الأقل لإمكانية إنشاء قسم بيداغوجي. يرجى التوجه لتبويب «الشعب التكوينية» وإضافتها أولاً.
          </span>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.classes.length === 0 ? (
          <div className="col-span-full canva-panel p-12 text-center">
            <School className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-black">
              لا توجد أقسام بيداغوجية مضافة حتى الآن
            </p>
            <p className="text-xs text-slate-600 mt-1">
              أضف الشعب أولاً، ثم قم بإنشاء الأقسام البيداغوجية للمركز.
            </p>
          </div>
        ) : (
          data.classes.map((cls) => {
            const studentCount = data.students.filter((s) => s.classId === cls.id).length;
            const t1 = trackMap.get(cls.trackIds?.[0]);
            const t2 = trackMap.get(cls.trackIds?.[1]);
            const assignedInstructors = (cls.instructorIds || [])
              .map((id) => instructorMap.get(id))
              .filter(Boolean);

            return (
              <div
                key={cls.id}
                className="canva-card p-5 flex flex-col justify-between hover:shadow-md transition-all border border-slate-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-black">{cls.name}</h4>
                      <span className="text-xs font-mono text-[#4C2673] bg-[#F4EDFB] px-2 py-0.5 rounded-md font-bold inline-block mt-1">
                        رمز: {cls.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-black rounded-xl transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => setClassToDelete(cls)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Two Tracks Badges */}
                  <div className="space-y-1.5 mb-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-600 block font-bold">
                      الشعب المدمجة بالقسم (شعبتان):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs bg-[#E7F7F4] text-[#125547] border border-[#76C7B7]/40 px-2.5 py-0.5 rounded-lg font-bold">
                        1. {t1 ? t1.name : 'شعبة مفقودة'}
                      </span>
                      <span className="text-xs bg-[#F4EDFB] text-[#4C2673] border border-[#D5BEE8]/60 px-2.5 py-0.5 rounded-lg font-bold">
                        2. {t2 ? t2.name : 'شعبة مفقودة'}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Instructors */}
                  <div className="pt-2 border-t border-slate-100 mb-3">
                    <span className="text-[11px] text-slate-600 block font-bold mb-1 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                      <span>المؤطرون المشرفون:</span>
                    </span>
                    {assignedInstructors.length === 0 ? (
                      <span className="text-[11px] text-slate-400 font-medium">لم يتم تعيين مؤطرين</span>
                    ) : (
                      <p className="text-xs text-black font-medium truncate">
                        {assignedInstructors.map((i) => i?.fullName).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Count */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#76C7B7]" />
                    <span>المستفيدين المسجلين:</span>
                  </span>
                  <span className="font-mono text-black font-bold tabular-nums text-sm bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {studentCount}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add/Edit Class */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-black flex items-center gap-2">
                <School className="w-5 h-5 text-[#76C7B7]" />
                <span>{editingClass ? 'تعديل القسم البيداغوجي' : 'إضافة قسم بيداغوجي جديد'}</span>
              </h3>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Class Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-black mb-1.5">
                    اسم القسم <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: الفوج الأول (أ)"
                    className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                  />
                </div>

                {/* Class Code */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-black mb-1.5">
                    رمز القسم (كود) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="مثال: CL-01"
                    className="canva-input w-full px-3.5 py-2 text-xs font-mono uppercase text-black font-bold"
                  />
                </div>
              </div>

              {/* Two Tracks Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-black">
                  <Layers className="w-4 h-4 text-[#76C7B7]" />
                  <span>الشعبتان المكونتان للقسم البيداغوجي (إجباري):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">الشعبة الأولى:</label>
                    <select
                      value={track1Id}
                      onChange={(e) => setTrack1Id(e.target.value)}
                      className="canva-input w-full px-3 py-2 text-xs text-black font-medium"
                    >
                      <option value="">اختر الشعبة 1</option>
                      {data.tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">الشعبة الثانية:</label>
                    <select
                      value={track2Id}
                      onChange={(e) => setTrack2Id(e.target.value)}
                      className="canva-input w-full px-3 py-2 text-xs text-black font-medium"
                    >
                      <option value="">اختر الشعبة 2</option>
                      {data.tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Instructors Multi-select */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  هيئة التأطير والأساتذة المشرفون:
                </label>
                {data.instructors.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-2 bg-slate-50 rounded-xl">
                    لا يوجد مؤطرون مضافون حالياً. يمكنك إضافتهم لاحقاً من تبويب المؤطرين.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    {data.instructors.map((inst) => {
                      const isSelected = selectedInstructorIds.includes(inst.id);
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => handleToggleInstructor(inst.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-right transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#E7F7F4] text-[#125547] border border-[#76C7B7]/50 font-bold'
                              : 'bg-white border border-slate-200 text-black hover:bg-slate-100'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] shrink-0 border ${
                              isSelected
                                ? 'bg-[#76C7B7] text-white border-[#76C7B7]'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className="truncate">{inst.fullName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  ملاحظات أو مواصفات خاصة
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ورشة التكوين، فترات التدريب الميداني..."
                  rows={2}
                  className="canva-input w-full px-3.5 py-2 text-xs text-black placeholder:text-slate-400 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#125547] hover:bg-[#0e4438] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {editingClass ? 'حفظ التعديلات' : 'إضافة القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-black">تأكيد حذف القسم</h4>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              هل أنت متأكد من حذف قسم «<strong className="text-black">{classToDelete.name}</strong>»؟
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
