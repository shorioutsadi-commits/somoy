import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Bell, 
  ShieldCheck, 
  Database, 
  Trash2, 
  Check, 
  HelpCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { AppSettings, Reminder, ChatMessage } from '../types';
import { vibrateDevice, showSystemNotification, requestNotificationPermission } from '../utils/notifications';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  reminders: Reminder[];
  messages: ChatMessage[];
  onOpenDataDeletion: () => void;
  onOpenInstallModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  setSettings,
  reminders,
  messages,
  onOpenDataDeletion,
  onOpenInstallModal,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [exported, setExported] = useState(false);

  const toggleSound = () => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toggleVibration = () => {
    vibrateDevice(25);
    setSettings(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }));
  };

  const toggleFollowUp = () => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    setSettings(prev => ({ ...prev, followUpEnabled: !prev.followUpEnabled }));
  };

  const handleExportData = () => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    const data = {
      app: 'Somoy Android App',
      exportDate: new Date().toISOString(),
      reminders,
      messages,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `somoy-reminders-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const handleAskNotification = async () => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    const granted = await requestNotificationPermission();
    if (granted) {
      showSystemNotification('Somoy সময়', 'নোটিফিকেশন সক্রিয় হয়েছে! নির্ধারিত সময়ে রিমাইন্ডার পাবেন।');
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 overflow-y-auto p-4 space-y-5">
      {/* Android APK Card */}
      <div className="p-4 bg-gradient-to-br from-neutral-950 via-neutral-950 to-teal-950/50 rounded-2xl border border-teal-500/30 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
              <span>Android APK হিসেবে ইনস্টল করুন</span>
              <span className="text-[10px] bg-teal-950 text-teal-300 px-1.5 py-0.2 rounded font-mono border border-teal-800">
                PWA / APK
              </span>
            </h2>
            <p className="text-[11px] text-neutral-400">
              ফোনের হোম স্ক্রিনে ইনস্টল করে সরাসরি অ্যাপ হিসেবে ব্যবহার করুন
            </p>
          </div>
        </div>

        <button
          onClick={onOpenInstallModal}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-98"
        >
          <Download className="w-4 h-4" />
          <span>APK ইনস্টল নির্দেশিকা ও ডাউনলোড</span>
        </button>
      </div>

      {/* Free Promise Banner */}
      <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-teal-400">
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-white">১০০% সম্পূর্ণ ফ্রি অ্যাপ</span>
        </div>
        <span className="text-[11px] text-neutral-400 font-mono">
          কোনো সাবস্ক্রিপশন নেই
        </span>
      </div>

      {/* App Preferences */}
      <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3.5">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
          অ্যাপ সেটিংস
        </h3>

        {/* Sound toggle */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-200">
            <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <p className="font-medium">সাউন্ড এফেক্টস ও অ্যালার্ম টিউন</p>
              <p className="text-[10px] text-neutral-500">মেসেজ ও রিমাইন্ডার ট্রিগার সাউন্ড</p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.soundEnabled ? 'bg-teal-600' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Vibration toggle */}
        <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-neutral-900">
          <div className="flex items-center gap-2 text-neutral-200">
            <Vibrate className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <p className="font-medium">হ্যাপটিক ভাইব্রেশন (অ্যান্ড্রয়েড)</p>
              <p className="text-[10px] text-neutral-500">টাচ ও বাটনে বাস্তবসম্মত কম্পন</p>
            </div>
          </div>
          <button
            onClick={toggleVibration}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.vibrationEnabled ? 'bg-teal-600' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Follow-up toggle */}
        <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-neutral-900">
          <div className="flex items-center gap-2 text-neutral-200">
            <Bell className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <p className="font-medium">স্মার্ট ফলো-আপ মনে করানো</p>
              <p className="text-[10px] text-neutral-500">কাজ শেষ না হলে একবার ভদ্রভাবে জিজ্ঞেস করা</p>
            </div>
          </div>
          <button
            onClick={toggleFollowUp}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.followUpEnabled ? 'bg-teal-600' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.followUpEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* System notification permission */}
        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
          <span className="text-neutral-300">সিস্টেম নোটিফিকেশন</span>
          <button
            onClick={handleAskNotification}
            className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-teal-400 border border-neutral-800 rounded-lg text-xs"
          >
            অনুমতি যাচাই
          </button>
        </div>
      </div>

      {/* Data and Privacy */}
      <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
          ডাটা ও গোপনীয়তা
        </h3>

        <div className="flex items-start gap-2 text-xs text-neutral-400">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <span>আমরা আপনার ডাটা বিক্রি করি না। সব রিমাইন্ডার আপনার ডিভাইসেই নিরাপদে সংরক্ষিত।</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleExportData}
            className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs rounded-xl border border-neutral-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            {exported ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Database className="w-3.5 h-3.5" />}
            <span>{exported ? 'ডাউনলোড সম্পন্ন' : 'ডাটা ব্যাকআপ'}</span>
          </button>

          <button
            onClick={onOpenDataDeletion}
            className="py-2 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-300 text-xs rounded-xl border border-red-800/60 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>ডাটা মুছুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
