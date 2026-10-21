import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  School,
} from 'lucide-react';
import { Track } from '../../types';
import { useApp } from '../../context/AppContext';

export const TracksView: React.FC = () => {
  const { data, addTrack, updateTrack, deleteTrack } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingTrack(null);
    setName('');
    setCode('');
    setDescription('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (track: Track) => {
    setEditingTrack(track);
    setName(track.name);
    setCode(track.code);
    setDescription(track.description || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !code.trim()) {
      setFormError('اسم الشعبة ورمزها مطلوبان.');
      return;
    }

    if (editingTrack) {
      const res = updateTrack({
        ...editingTrack,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'فشل التعديل.');
        return;
      }
    } else {
      const res = addTrack({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
      });
      if (!res.success) {
        setFormError(res.message || 'فشل إضافة الشعبة.');
        return;
      }
    }

    setIsFormOpen(false);
  };

  const confirmDelete = () => {
    if (!trackToDelete) return;
    const res = deleteTrack(trackToDelete.id);
    if (!res.success) {
      alert(res.message);
    }
    setTrackToDelete(null);
  };

  return (
    <div className="space-y-6 text-black">
      {/* Top Banner */}
      <div className="canva-panel p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-black flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#76C7B7]" />
            <span>الشعب والمسالك التكوينية والمهنية</span>
          </h3>
          <p className="text-xs text-slate-700 mt-1">
            الشعب التكوينية المعتمدة بمركز الفرصة الثانية (زرارة) كقاعدة لتركيب الأقسام البيداغوجية المزدوجة.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#76C7B7] hover:bg-[#62baa8] text-[#0f4438] text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة شعبة</span>
        </button>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.tracks.length === 0 ? (
          <div className="col-span-full canva-panel p-12 text-center">
            <Layers className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-black">
              لا توجد أي شعبة مهنية مسجلة حتى الآن
            </p>
            <p className="text-xs text-slate-600 mt-1">
              أضف شعب المركز (مثال: كهرباء البناء، نجارة الألمنيوم، الفصالة والخياطة، المعلوميات، الفلاحة...).
            </p>
          </div>
        ) : (
          data.tracks.map((track) => {
            const usedClasses = data.classes.filter(
              (c) => c.trackIds && (c.trackIds[0] === track.id || c.trackIds[1] === track.id)
            );

            return (
              <div
                key={track.id}
                className="canva-card p-5 flex flex-col justify-between hover:shadow-md transition-all border border-slate-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-black">{track.name}</h4>
                      <span className="text-xs font-mono text-[#4C2673] bg-[#F4EDFB] px-2 py-0.5 rounded-md font-bold inline-block mt-1">
                        رمز: {track.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(track)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-black rounded-xl transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        onClick={() => setTrackToDelete(track)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-3 mt-3 leading-relaxed">
                    {track.description || 'لا يوجد وصف مضاف لهذه الشعبة.'}
                  </p>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="text-[11px]">مدرجة في:</span>
                  <span className="text-black font-bold text-[11px]">
                    {usedClasses.length > 0
                      ? `${usedClasses.length} أقسام (${usedClasses.map((c) => c.name).join('، ')})`
                      : 'غير مدمجة في أي قسم'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add/Edit Track */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#76C7B7]" />
                <span>{editingTrack ? 'تعديل الشعبة' : 'إضافة شعبة مهنية جديدة'}</span>
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
                  اسم الشعبة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: كهرباء البناء"
                  className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  رمز الشعبة (كود) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="مثال: ELEC-01"
                  className="canva-input w-full px-3.5 py-2 text-xs font-mono uppercase text-black font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  وصف مختصر للشعبة
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="الوحدات التكوينية، الأهداف، ورشة التكوين..."
                  rows={3}
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
                  {editingTrack ? 'حفظ التعديلات' : 'إضافة الشعبة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {trackToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-black">تأكيد حذف الشعبة</h4>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              هل أنت متأكد من حذف شعبة «<strong className="text-black">{trackToDelete.name}</strong>»؟
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setTrackToDelete(null)}
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
