import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDDMMYYYY } from '../../services/storage';

export const Header: React.FC = () => {
  const {
    activeTab,
    data,
    fileHandleStatus,
    fileHandleName,
    lastSavedTime,
    reAuthorizeFileHandle,
    logout,
  } = useApp();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-MA', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'لوحة القيادة والمؤشرات العامة';
      case 'students':
        return 'إدارة المتعلمين والمستفيدين';
      case 'absences':
      case 'roll_call':
      case 'absence_log':
        return 'تدبير الغيابات والنداء اليومي';
      case 'justifications':
        return 'تدبير المبررات والوثائق الرسمية';
      case 'reports':
      case 'documents':
        return 'التقارير الإحصائية والمطبوعات الإدارية';
      case 'settings':
      case 'classes':
      case 'tracks':
      case 'instructors':
      case 'backup':
        return 'الإعدادات وتهيئة المنظومة';
      default:
        return 'فضاء الإدارة';
    }
  };

  return (
    <header className="h-20 shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between gap-4 z-10 select-none shadow-sm">
      {/* Zone 1: Breadcrumb & Module Title */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs px-2.5 py-1 rounded-full bg-canva-lavender text-canva-lavender-dark font-bold tracking-wide whitespace-nowrap hidden sm:inline-block">
          فضاء الإدارة
        </span>
        <span className="text-slate-300 hidden sm:inline-block">/</span>
        <h2 className="text-base md:text-lg font-bold text-black truncate">
          {getTitle()}
        </h2>
      </div>

      {/* Zone 2: File System Auto-Save Indicator & Administration Badge & Quick Actions */}
      <div className="flex items-center gap-2.5">
        {/* CMED Institutional Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
          <img
            src={data.settings.customLogoUrl || '/logo-cmed.jpeg'}
            alt="CMED"
            className="h-6 w-auto object-contain select-none"
            style={{ aspectRatio: '440 / 131' }}
          />
          <div className="text-[10px] text-right font-bold text-slate-700 border-r border-slate-200 pr-2 leading-tight">
            <span>مركز زرارة</span>
            <span className="block text-[#E86826] text-[9px]">{data.settings.delegation}</span>
          </div>
        </div>

        {/* Administration Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-[#76C7B7]" />
          <span className="text-black">فضاء الإدارة</span>
        </div>

        {fileHandleStatus === 'connected' ? (
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[150px] font-medium">
              {fileHandleName || 'حفظ تلقائي'}
            </span>
            {lastSavedTime && (
              <span className="text-emerald-700 font-mono text-[11px] border-r border-emerald-200 pr-2">
                {lastSavedTime}
              </span>
            )}
          </div>
        ) : fileHandleStatus === 'needs_permission' ? (
          <button
            onClick={() => reAuthorizeFileHandle()}
            className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full text-xs text-amber-900 transition-colors"
            title="انقر لتفعيل إذن الكتابة في الملف المحلي"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">إعادة تفعيل إذن الحفظ</span>
          </button>
        ) : null}

        {/* Live Date & Time */}
        <div className="hidden xl:flex items-center gap-3 text-xs text-black bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono tabular-nums font-semibold">{getTodayDDMMYYYY()}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono tabular-nums font-semibold">{currentTime}</span>
          </div>
        </div>

        {/* Lock/Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-full transition-all whitespace-nowrap cursor-pointer shadow-xs"
          title="قفل فضاء الإدارة"
        >
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>قفل</span>
        </button>
      </div>
    </header>
  );
};
