import React from 'react';
import { MessageSquare, Clock, Calendar, Smartphone, Settings } from 'lucide-react';
import { vibrateDevice } from '../utils/notifications';

export type AndroidTab = 'chat' | 'reminders' | 'timeline' | 'settings';

interface AndroidBottomNavProps {
  activeTab: AndroidTab;
  setActiveTab: (tab: AndroidTab) => void;
  activeRemindersCount: number;
  vibrationEnabled: boolean;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  setActiveTab,
  activeRemindersCount,
  vibrationEnabled,
}) => {
  const handleTabClick = (tab: AndroidTab) => {
    if (vibrationEnabled) {
      vibrateDevice(12);
    }
    setActiveTab(tab);
  };

  const tabs: { id: AndroidTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'chat',
      label: 'চ্যাট',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'reminders',
      label: 'রিমাইন্ডার',
      icon: <Clock className="w-5 h-5" />,
      badge: activeRemindersCount > 0 ? activeRemindersCount : undefined,
    },
    {
      id: 'timeline',
      label: 'টাইমলাইন',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'সেটিংস ও APK',
      icon: <Smartphone className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="h-16 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800 flex items-center justify-around px-2 shrink-0 select-none z-30">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 ${
              isActive ? 'text-teal-400' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {/* Active Pill Indicator for Android Material 3 */}
            <div
              className={`w-12 h-7 rounded-full flex items-center justify-center relative transition-colors ${
                isActive ? 'bg-teal-950/80 text-teal-300 ring-1 ring-teal-500/40' : 'bg-transparent'
              }`}
            >
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-teal-500 text-neutral-950 text-[10px] font-bold font-mono rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'font-bold text-teal-300' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
