import React from 'react';
import { Volume2, VolumeX, Smartphone, Monitor, Download, Bell } from 'lucide-react';
import { AppSettings } from '../types';
import { vibrateDevice } from '../utils/notifications';

interface AndroidAppBarProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onOpenInstallModal: () => void;
  onAskNotification: () => void;
  isInstallable: boolean;
}

export const AndroidAppBar: React.FC<AndroidAppBarProps> = ({
  settings,
  setSettings,
  onOpenInstallModal,
  onAskNotification,
  isInstallable,
}) => {
  const toggleSound = () => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toggleFrameMode = () => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    setSettings(prev => ({ ...prev, mobileFrameMode: !prev.mobileFrameMode }));
  };

  return (
    <div className="h-14 px-4 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between gap-3 shrink-0 select-none z-20">
      {/* Brand lockup */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/src/assets/images/somoy_mascot_avatar_1793260027035.jpg"
          alt="Somoy Mascot"
          className="w-8 h-8 rounded-full object-cover ring-1 ring-teal-500/40 shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-sans leading-none">
            সময় <span className="text-teal-400 font-mono text-xs">Somoy</span>
          </h1>
          <p className="text-[10px] text-neutral-400 truncate mt-0.5">
            মেসেজিং রিমাইন্ডার · ১০০% ফ্রি
          </p>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onAskNotification}
          title="নোটিফিকেশন অনুমতি দিন"
          className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
          aria-label="Notification permission"
        >
          <Bell className="w-4 h-4 text-teal-400" />
        </button>

        <button
          onClick={toggleSound}
          title={settings.soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
          aria-label="Toggle sound"
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-teal-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-500" />
          )}
        </button>

        {/* Viewport Frame Mode Toggle (For Desktop Viewers) */}
        <button
          onClick={toggleFrameMode}
          title={settings.mobileFrameMode ? 'ফুল স্ক্রিন ভিউ করুন' : 'মোবাইল ফ্রেম ভিউ করুন'}
          className="hidden sm:flex p-2 text-neutral-400 hover:text-white rounded-lg transition-colors"
          aria-label="Toggle mobile frame"
        >
          {settings.mobileFrameMode ? (
            <Monitor className="w-4 h-4 text-neutral-300" />
          ) : (
            <Smartphone className="w-4 h-4 text-teal-400" />
          )}
        </button>

        {/* APK / PWA Install Button */}
        <button
          onClick={onOpenInstallModal}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">APK ইনস্টল</span>
          <span className="xs:hidden">APK</span>
        </button>
      </div>
    </div>
  );
};
