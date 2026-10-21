import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export interface InstitutionalLogoHeaderProps {
  variant?: 'banner' | 'compact' | 'sidebar' | 'auth' | 'print';
  className?: string;
  showAdminHierarchy?: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const OFFICIAL_LOGO_PATH = '/logo-cmed.jpeg';
export const FALLBACK_LOGO_PATH = '/assets/aistudio/cmedmaroc.org_-440x131_8fa2c039.jpeg';

export const InstitutionalLogoHeader: React.FC<InstitutionalLogoHeaderProps> = ({
  variant = 'compact',
  className = '',
  showAdminHierarchy = true,
  pageTitle,
  pageSubtitle,
}) => {
  const { data } = useApp();
  const [imgError, setImgError] = useState(false);

  // Determine active logo source (custom if set by admin, otherwise official CMED logo)
  const currentLogoSrc = imgError
    ? FALLBACK_LOGO_PATH
    : (data.settings.customLogoUrl || OFFICIAL_LOGO_PATH);

  // Administrative hierarchy text required by official Moroccan specification:
  // المملكة المغربية
  // الأكاديمية الجهوية للتربية والتكوين لجهة الرباط - سلا - القنيطرة
  // المديرية الإقليمية الصخيرات - تمارة
  // الفرصة الثانية - الجيل الجديد
  // مركز زرارة
  const academy = data.settings.academy || 'الأكاديمية الجهوية للتربية والتكوين لجهة الرباط - سلا - القنيطرة';
  const delegation = data.settings.delegation || 'المديرية الإقليمية الصخيرات - تمارة';
  const centerName = 'مركز الفرصة الثانية - الجيل الجديد (زرارة)';

  // 1. Sidebar Variant
  if (variant === 'sidebar') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="bg-white rounded-xl p-2 border border-slate-200/90 shadow-xs flex items-center justify-center overflow-hidden">
          <img
            src={currentLogoSrc}
            alt="الهيئة المغربية للتربية والتنمية - CMED"
            className="w-full h-auto max-h-12 object-contain select-none"
            style={{ aspectRatio: '440 / 131' }}
            onError={() => setImgError(true)}
            loading="eager"
          />
        </div>
        {showAdminHierarchy && (
          <div className="text-center px-1 space-y-0.5 text-slate-800">
            <p className="text-[10px] font-bold text-slate-900 leading-tight">المملكة المغربية</p>
            <p className="text-[9px] text-slate-600 font-semibold leading-tight">{academy}</p>
            <p className="text-[9px] text-[#E86826] font-bold leading-tight">{delegation}</p>
            <div className="pt-0.5 mt-0.5 border-t border-slate-100 flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-black text-[#125547]">{centerName}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Auth / Login Modal Variant
  if (variant === 'auth') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-lg mb-3 w-full max-w-xs flex items-center justify-center">
          <img
            src={currentLogoSrc}
            alt="الهيئة المغربية للتربية والتنمية - CMED"
            className="w-full h-auto max-h-16 object-contain select-none"
            style={{ aspectRatio: '440 / 131' }}
            onError={() => setImgError(true)}
            loading="eager"
          />
        </div>
        <div className="space-y-0.5 text-center">
          <p className="text-xs font-bold text-amber-400">المملكة المغربية</p>
          <p className="text-xs text-slate-200 font-semibold">{academy}</p>
          <p className="text-xs text-blue-300 font-bold">{delegation}</p>
          <h2 className="text-sm font-black text-white pt-1">
            {centerName}
          </h2>
          <p className="text-[11px] text-emerald-400 font-bold">
            منظومة التدبير الإداري وتسجيل الغياب
          </p>
        </div>
      </div>
    );
  }

  // 3. Print / Institutional PDF Document Variant
  if (variant === 'print') {
    return (
      <div className={`border-b-2 border-slate-900 pb-3 mb-4 select-text text-black ${className}`}>
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Right Column: Moroccan Administration Hierarchy */}
          <div className="text-right text-[11px] leading-tight space-y-0.5">
            <p className="font-extrabold text-xs">المملكة المغربية</p>
            <p className="font-semibold text-[10px]">وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
            <p className="font-medium text-[10px]">{academy}</p>
            <p className="font-bold text-[10px] text-slate-800">{delegation}</p>
            <p className="font-extrabold text-[11px] pt-0.5 text-black">{centerName}</p>
          </div>

          {/* Center Column: CMED Official Logo */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-1 rounded max-w-[200px] flex items-center justify-center">
              <img
                src={currentLogoSrc}
                alt="الهيئة المغربية للتربية والتنمية - CMED"
                className="w-full h-auto max-h-14 object-contain"
                style={{ aspectRatio: '440 / 131' }}
                onError={() => setImgError(true)}
              />
            </div>
          </div>

          {/* Left Column: Reference & Academic Year */}
          <div className="text-left font-mono text-[10px] leading-tight space-y-0.5">
            <p className="font-bold text-[11px]">السنة التكوينية: {data.settings.academicYear}</p>
            <p className="text-slate-600">مركز زرارة</p>
            <p className="text-slate-500 text-[9px]">الفرصة الثانية - الجيل الجديد</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Prominent Banner Variant (Dashboard, Reports & Big Headers)
  if (variant === 'banner') {
    return (
      <div
        className={`bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm relative overflow-hidden ${className}`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Logo Container with clean white background & exact proportion */}
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs shrink-0 max-w-[220px] sm:max-w-[260px] flex items-center justify-center">
              <img
                src={currentLogoSrc}
                alt="الهيئة المغربية للتربية والتنمية - CMED"
                className="w-full h-auto max-h-16 sm:max-h-20 object-contain select-none"
                style={{ aspectRatio: '440 / 131' }}
                onError={() => setImgError(true)}
                loading="eager"
              />
            </div>

            {/* Title / Subtitle if passed */}
            {(pageTitle || pageSubtitle) && (
              <div className="min-w-0">
                {pageTitle && (
                  <h1 className="text-lg sm:text-xl font-black text-black tracking-tight leading-tight">
                    {pageTitle}
                  </h1>
                )}
                {pageSubtitle && (
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                    {pageSubtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Institutional Administrative Hierarchy */}
          {showAdminHierarchy && (
            <div className="bg-[#F8F9FB] rounded-2xl p-3.5 border border-slate-200/70 text-right text-xs space-y-1 shrink-0 self-stretch lg:self-auto flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E86826]"></span>
                <span className="font-extrabold text-black">المملكة المغربية</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                {academy}
              </p>
              <p className="text-[11px] font-bold text-[#E86826] leading-snug">
                {delegation}
              </p>
              <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between gap-3 text-[11px]">
                <span className="font-black text-[#125547]">
                  {centerName}
                </span>
                <span className="font-mono text-[10px] bg-slate-200/70 px-2 py-0.5 rounded-full text-slate-800 font-bold">
                  {data.settings.academicYear}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Default Compact Variant (For top of module pages: Students, Absences, Justifications, etc.)
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-white rounded-xl p-1.5 sm:p-2 border border-slate-200 shadow-xs shrink-0 max-w-[150px] sm:max-w-[190px] flex items-center justify-center">
          <img
            src={currentLogoSrc}
            alt="الهيئة المغربية للتربية والتنمية - CMED"
            className="w-full h-auto max-h-11 sm:max-h-12 object-contain select-none"
            style={{ aspectRatio: '440 / 131' }}
            onError={() => setImgError(true)}
            loading="eager"
          />
        </div>

        <div className="min-w-0">
          {pageTitle ? (
            <h2 className="text-base sm:text-lg font-black text-black truncate leading-tight">
              {pageTitle}
            </h2>
          ) : (
            <h2 className="text-sm font-extrabold text-black truncate leading-tight">
              {centerName}
            </h2>
          )}
          {pageSubtitle ? (
            <p className="text-xs text-slate-600 truncate mt-0.5">{pageSubtitle}</p>
          ) : (
            <p className="text-[11px] text-[#E86826] font-bold truncate mt-0.5">
              {delegation}
            </p>
          )}
        </div>
      </div>

      {showAdminHierarchy && (
        <div className="hidden md:flex flex-col text-left text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium">
          <span className="font-bold text-black">{academy}</span>
          <div className="flex items-center justify-end gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
            <span>مركز زرارة</span>
            <span>•</span>
            <span className="text-[#125547] font-bold">{data.settings.academicYear}</span>
          </div>
        </div>
      )}
    </div>
  );
};
