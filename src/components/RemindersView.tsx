import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Search, 
  Check, 
  RotateCcw, 
  Trash2, 
  Play, 
  Clock, 
  Calendar, 
  Repeat, 
  AlertCircle 
} from 'lucide-react';
import { Reminder, RecurrenceType } from '../types';
import { playReminderTriggerAlarm, playSuccessChime, playMessageSentSound } from '../utils/audio';
import { showSystemNotification, formatDateTimeBn, vibrateDevice } from '../utils/notifications';

interface RemindersViewProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onOpenNewReminderModal: () => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  setReminders,
  soundEnabled,
  vibrationEnabled,
  onOpenNewReminderModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'recurring' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReminders = reminders.filter((rem) => {
    const matchesSearch = 
      rem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rem.originalText.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'active') return rem.status === 'active' || rem.status === 'snoozed';
    if (filter === 'recurring') return rem.recurrence !== 'none';
    if (filter === 'completed') return rem.status === 'completed';
    return true;
  });

  const handleTriggerTest = (rem: Reminder) => {
    if (vibrationEnabled) vibrateDevice([60, 40, 60]);
    if (soundEnabled) playReminderTriggerAlarm(false);
    showSystemNotification(`⏰ রিমাইন্ডার: ${rem.title}`, `সময় হয়েছে! আপনার কাজ: ${rem.title}`);
  };

  const handleMarkDone = (id: string) => {
    if (vibrationEnabled) vibrateDevice([30, 40, 30]);
    if (soundEnabled) playSuccessChime(false);
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#2dd4bf', '#14b8a6', '#0f766e'],
      });
    } catch {
      // ignore
    }
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'completed' } : r)
    );
  };

  const handleSnooze = (id: string) => {
    if (vibrationEnabled) vibrateDevice(15);
    if (soundEnabled) playMessageSentSound(false);
    setReminders(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: 'snoozed',
              snoozeCount: (r.snoozeCount || 0) + 1,
              targetTimestamp: Date.now() + 30 * 60 * 1000,
              displayDateText: '৩০ মিনিট পরে',
            }
          : r
      )
    );
  };

  const handleDelete = (id: string) => {
    if (vibrationEnabled) vibrateDevice(15);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const activeCount = reminders.filter(r => r.status === 'active' || r.status === 'snoozed').length;
  const recurringCount = reminders.filter(r => r.recurrence !== 'none').length;
  const completedCount = reminders.filter(r => r.status === 'completed').length;

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 overflow-y-auto p-4 space-y-4">
      {/* Header and Quick Add */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-white font-sans">
            সকল রিমাইন্ডার
          </h2>
          <p className="text-[11px] text-neutral-400">
            সময়সূচি ও অ্যালার্ম তালিকা
          </p>
        </div>

        <button
          onClick={onOpenNewReminderModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>নতুন</span>
        </button>
      </div>

      {/* Filter Tabs and Search */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === 'active'
                ? 'bg-neutral-800 text-teal-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            সক্রিয় ({activeCount})
          </button>
          <button
            onClick={() => setFilter('recurring')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === 'recurring'
                ? 'bg-neutral-800 text-teal-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            পুনরাবৃত্তি ({recurringCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === 'completed'
                ? 'bg-neutral-800 text-teal-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            সম্পন্ন ({completedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-neutral-800 text-teal-400 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            সব ({reminders.length})
          </button>
        </div>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="রিমাইন্ডার খুঁজুন..."
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-teal-500 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="p-8 text-center bg-neutral-950/60 rounded-2xl border border-neutral-800 my-4">
          <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-neutral-300">কোনো রিমাইন্ডার নেই</h3>
          <p className="text-[11px] text-neutral-500 mt-1">
            চ্যাটে মুখে বলে বা লিখে নতুন রিমাইন্ডার সেট করুন।
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredReminders.map((rem) => {
            const isCompleted = rem.status === 'completed';
            const isSnoozed = rem.status === 'snoozed';

            return (
              <div
                key={rem.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                    : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold truncate ${isCompleted ? 'line-through text-neutral-400' : 'text-neutral-100'}`}>
                      {rem.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-teal-400 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-teal-400" />
                        {rem.displayDateText}
                      </span>
                      {rem.recurrence !== 'none' && (
                        <>
                          <span aria-hidden="true" className="text-neutral-600">·</span>
                          <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                            <Repeat className="w-2.5 h-2.5" />
                            {rem.recurrence === 'daily' ? 'প্রতিদিন' : rem.recurrence === 'weekly' ? 'প্রতি সপ্তাহে' : 'প্রতি মাসে'}
                          </span>
                        </>
                      )}
                      {isSnoozed && (
                        <>
                          <span aria-hidden="true" className="text-neutral-600">·</span>
                          <span className="text-amber-400 text-[11px]">
                            {rem.snoozeCount} বার স্থগিত
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={() => handleTriggerTest(rem)}
                      title="টেস্ট অ্যালার্ম বাজিয়ে শুনুন"
                      className="p-1.5 text-teal-400 hover:bg-neutral-900 rounded-lg transition-colors shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-teal-400/20" />
                    </button>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-900 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {!isCompleted ? (
                      <>
                        <button
                          onClick={() => handleMarkDone(rem.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900 rounded-lg text-xs font-medium active:scale-95"
                        >
                          <Check className="w-3 h-3" />
                          <span>হয়ে গেছে</span>
                        </button>
                        <button
                          onClick={() => handleSnooze(rem.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs active:scale-95 border border-neutral-800"
                        >
                          <RotateCcw className="w-3 h-3 text-neutral-400" />
                          <span>+৩০ মি.</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-teal-400 text-xs flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> সম্পন্ন হয়েছে
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(rem.id)}
                    title="রিমাইন্ডার মুছে ফেলুন"
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
