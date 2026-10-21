import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  BookOpen,
  School,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Instructor } from '../../types';
import { useApp } from '../../context/AppContext';

export const InstructorsView: React.FC = () => {
  const {
    data,
    addInstructor,
    updateInstructor,
    deleteInstructor,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [subjects, setSubjects] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingInstructor(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setSpecialty('');
    setSubjects('');
    setNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (inst: Instructor) => {
    setEditingInstructor(inst);
    setFullName(inst.fullName);
    setPhone(inst.phone);
    setEmail(inst.email);
    setSpecialty(inst.specialty);
    setSubjects(inst.subjects);
    setNotes(inst.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('الاسم الكامل للمؤطر مطلوب.');
      return;
    }

    if (editingInstructor) {
      const res = updateInstructor({
        ...editingInstructor,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        specialty: specialty.trim(),
        subjects: subjects.trim(),
        notes: notes.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'فشل التعديل.');
        return;
      }
    } else {
      const res = addInstructor({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        specialty: specialty.trim(),
        subjects: subjects.trim(),
        notes: notes.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'فشل إضافة المؤطر.');
        return;
      }
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!instructorToDelete) return;
    deleteInstructor(instructorToDelete.id);
    setInstructorToDelete(null);
  };

  return (
    <div className="space-y-6 text-black">
      {/* Top Banner */}
      <div className="canva-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-black flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#76C7B7]" />
            <span>هيئة التأطير والتكوين (الأساتذة والمؤطرون)</span>
          </h3>
          <p className="text-xs text-slate-700 mt-1">
            سجل المؤطرين والأساتذة المكلفين بالتكوين والتأطير التربوي والمهني بمركز الفرصة الثانية (زرارة).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#76C7B7] hover:bg-[#62baa8] text-[#0f4438] text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مؤطر/أستاذ</span>
        </button>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.instructors.length === 0 ? (
          <div className="col-span-full canva-panel p-12 text-center">
            <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-black">
              لا يوجد أي مؤطر مسجل حتى الآن
            </p>
            <p className="text-xs text-slate-600 mt-1">
              أضف أساتذة ومؤطري المركز ليسهل إسنادهم للأقسام وتدوين تقارير الحضور.
            </p>
          </div>
        ) : (
          data.instructors.map((inst) => {
            const assignedClasses = data.classes.filter(
              (c) => c.instructorIds && c.instructorIds.includes(inst.id)
            );

            return (
              <div
                key={inst.id}
                className="canva-card p-5 flex flex-col justify-between hover:shadow-md transition-all border border-slate-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-black">{inst.fullName}</h4>
                      <span className="text-xs text-[#4C2673] bg-[#F4EDFB] px-2 py-0.5 rounded-md font-bold inline-block mt-1">
                        {inst.specialty || 'مؤطر تربوي/مهني'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(inst)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-black rounded-xl transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => setInstructorToDelete(inst)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 my-3 text-xs text-slate-700">
                    {inst.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-black font-bold tabular-nums">{inst.phone}</span>
                      </div>
                    )}
                    {inst.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-black font-medium">{inst.email}</span>
                      </div>
                    )}
                    {inst.subjects && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-black text-[11px] font-medium">{inst.subjects}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Classes */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="text-[11px] flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-slate-400" />
                    <span>الأقسام المسندة:</span>
                  </span>
                  <span className="text-black font-bold text-[11px]">
                    {assignedClasses.length > 0
                      ? assignedClasses.map((c) => c.name).join('، ')
                      : 'لا يوجد'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add/Edit Instructor */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-black flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#76C7B7]" />
                <span>{editingInstructor ? 'تعديل بيانات المؤطر' : 'إضافة مؤطر/أستاذ جديد'}</span>
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
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  الاسم الكامل للمؤطر <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: ذ. عبد الرحيم العلمي"
                  className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">
                    التخصص المهني/التربوي
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="مثال: كهرباء الإنشاءات"
                    className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">
                    المواد والوحدات المكلف بها
                  </label>
                  <input
                    type="text"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="مثال: ورشة تطبيقية، رسم صناعي"
                    className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">
                    الهاتف
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="canva-input w-full px-3.5 py-2 text-xs font-mono text-black font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="canva-input w-full px-3.5 py-2 text-xs font-mono text-black font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  ملاحظات إضافية
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات جدول الحصص أو التأطير الميداني..."
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
                  {editingInstructor ? 'حفظ التعديلات' : 'إضافة المؤطر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {instructorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-black">تأكيد حذف المؤطر</h4>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              هل أنت متأكد من حذف المؤطر «<strong className="text-black">{instructorToDelete.fullName}</strong>»؟
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setInstructorToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
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
