import React, { useState, useEffect } from 'react';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AndroidAppBar } from './components/AndroidAppBar';
import { AndroidBottomNav, AndroidTab } from './components/AndroidBottomNav';
import { ChatView } from './components/ChatView';
import { RemindersView } from './components/RemindersView';
import { TimelineView } from './components/TimelineView';
import { SettingsView } from './components/SettingsView';
import { NewReminderModal } from './components/NewReminderModal';
import { DataDeletionModal } from './components/DataDeletionModal';
import { InstallApkModal } from './components/InstallApkModal';
import { Reminder, ChatMessage, AppSettings } from './types';
import { INITIAL_MESSAGES, INITIAL_REMINDERS, INITIAL_SETTINGS } from './utils/initialData';
import { playReminderTriggerAlarm, playSuccessChime } from './utils/audio';
import { formatCurrentTimeBn, showSystemNotification, vibrateDevice, requestNotificationPermission } from './utils/notifications';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  const [activeTab, setActiveTab] = useState<AndroidTab>('chat');
  const { isInstallable } = usePWAInstall();

  // Persistent settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('somoy_app_settings');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Persistent reminders
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem('somoy_reminders');
      return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
    } catch {
      return INITIAL_REMINDERS;
    }
  });

  // Persistent messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('somoy_messages');
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  // Modals
  const [isNewReminderOpen, setIsNewReminderOpen] = useState(false);
  const [isDataDeletionOpen, setIsDataDeletionOpen] = useState(false);
  const [isInstallApkOpen, setIsInstallApkOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('somoy_app_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('somoy_reminders', JSON.stringify(reminders));
    } catch (e) {
      console.error(e);
    }
  }, [reminders]);

  useEffect(() => {
    try {
      localStorage.setItem('somoy_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Periodic Reminder Prober
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      
      setReminders(prevReminders => {
        let changed = false;
        const updated = prevReminders.map(rem => {
          const triggerTime = rem.snoozedUntil || rem.targetTimestamp;
          if ((rem.status === 'active' || rem.status === 'snoozed') && now >= triggerTime) {
            changed = true;
            if (settings.vibrationEnabled) vibrateDevice([80, 50, 80, 50, 80]);
            if (settings.soundEnabled) playReminderTriggerAlarm(false);
            showSystemNotification(`⏰ রিমাইন্ডার: ${rem.title}`, `সময় হয়েছে! আপনার কাজ: ${rem.title}`);

            const alertMsg: ChatMessage = {
              id: `alert-${Date.now()}`,
              sender: 'somoy',
              text: `⏰ রিমাইন্ডার: ${rem.title}`,
              timestamp: formatCurrentTimeBn(),
              isoTimestamp: Date.now(),
              type: 'reminder_trigger',
              metadata: {
                reminderId: rem.id,
                reminder: rem,
                actionHandled: false,
              },
            };
            setMessages(prevMsgs => [...prevMsgs, alertMsg]);

            return {
              ...rem,
              status: 'triggered' as const,
            };
          }
          return rem;
        });

        return changed ? updated : prevReminders;
      });
    }, 8000);

    return () => clearInterval(checkInterval);
  }, [settings]);

  const handleAskNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      showSystemNotification('Somoy সময়', 'নোটিফিকেশন অনুমতি সফল হয়েছে!');
      if (settings.soundEnabled) playSuccessChime(false);
    }
  };

  const handleConfirmDataDeletion = () => {
    setReminders([]);
    setMessages([
      {
        id: `sys-${Date.now()}`,
        sender: 'somoy',
        text: 'আপনার সমস্ত রিমাইন্ডার এবং বার্তা সম্পূর্ণভাবে মুছে ফেলা হয়েছে। নতুন কোনো কাজ থাকলে নির্দ্বিধায় বলুন।',
        timestamp: formatCurrentTimeBn(),
        isoTimestamp: Date.now(),
        type: 'system_info',
      },
    ]);
    if (settings.soundEnabled) playSuccessChime(false);
  };

  const handleAddNewReminder = (newRem: Reminder) => {
    setReminders(prev => [newRem, ...prev]);
    const confirmMsg: ChatMessage = {
      id: `smy-${Date.now()}`,
      sender: 'somoy',
      text: `ঠিক আছে। ${newRem.displayDateText}-এ ${newRem.title}-এর কথা মনে করিয়ে দেব।`,
      timestamp: formatCurrentTimeBn(),
      isoTimestamp: Date.now(),
      type: 'confirmation',
      metadata: {
        reminderId: newRem.id,
        reminder: newRem,
      },
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  const activeRemindersCount = reminders.filter(r => r.status === 'active' || r.status === 'snoozed').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center font-sans">
      {/* Outer wrapper: on desktop with mobileFrameMode it displays as an Android Phone Mockup */}
      <div
        className={`w-full transition-all duration-300 flex flex-col bg-neutral-950 overflow-hidden ${
          settings.mobileFrameMode
            ? 'max-w-md h-[100dvh] sm:h-[860px] sm:rounded-[40px] sm:border-[8px] sm:border-neutral-800 sm:shadow-2xl sm:ring-1 sm:ring-neutral-700/60 relative'
            : 'max-w-4xl h-[100dvh] border-x border-neutral-800'
        }`}
      >
        {/* Android Punch Hole Camera on Desktop Phone Frame */}
        {settings.mobileFrameMode && (
          <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-950 rounded-full ring-2 ring-neutral-800 z-50 pointer-events-none" />
        )}

        {/* Android Status Bar */}
        <AndroidStatusBar />

        {/* Android Top App Bar */}
        <AndroidAppBar
          settings={settings}
          setSettings={setSettings}
          onOpenInstallModal={() => setIsInstallApkOpen(true)}
          onAskNotification={handleAskNotification}
          isInstallable={isInstallable}
        />

        {/* Main Tab Screen Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatView
              messages={messages}
              setMessages={setMessages}
              reminders={reminders}
              setReminders={setReminders}
              settings={settings}
              setSettings={setSettings}
              onOpenDataDeletion={() => setIsDataDeletionOpen(true)}
              onOpenNewReminderModal={() => setIsNewReminderOpen(true)}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersView
              reminders={reminders}
              setReminders={setReminders}
              soundEnabled={settings.soundEnabled}
              vibrationEnabled={settings.vibrationEnabled}
              onOpenNewReminderModal={() => setIsNewReminderOpen(true)}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView
              reminders={reminders}
              setReminders={setReminders}
              soundEnabled={settings.soundEnabled}
              onOpenNewReminderModal={() => setIsNewReminderOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              setSettings={setSettings}
              reminders={reminders}
              messages={messages}
              onOpenDataDeletion={() => setIsDataDeletionOpen(true)}
              onOpenInstallModal={() => setIsInstallApkOpen(true)}
            />
          )}
        </div>

        {/* Android Bottom Navigation */}
        <AndroidBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeRemindersCount={activeRemindersCount}
          vibrationEnabled={settings.vibrationEnabled}
        />
      </div>

      {/* Modals */}
      <NewReminderModal
        isOpen={isNewReminderOpen}
        onClose={() => setIsNewReminderOpen(false)}
        onAddReminder={handleAddNewReminder}
      />

      <DataDeletionModal
        isOpen={isDataDeletionOpen}
        onClose={() => setIsDataDeletionOpen(false)}
        onConfirmDelete={handleConfirmDataDeletion}
      />

      <InstallApkModal
        isOpen={isInstallApkOpen}
        onClose={() => setIsInstallApkOpen(false)}
      />
    </div>
  );
}
