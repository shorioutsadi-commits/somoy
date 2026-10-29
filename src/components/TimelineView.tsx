import React from 'react';
import { Clock, Calendar, Check, Play, RotateCcw, Plus, AlertCircle } from 'lucide-react';
import { Reminder } from '../types';
import { toBengaliNumber } from '../utils/notifications';
import { playReminderTriggerAlarm, playSuccessChime } from '../utils/audio';

interface TimelineViewProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  soundEnabled: boolean;
  onOpenNewReminderModal: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  reminders,
  setReminders,
  soundEnabled,
  onOpenNewReminderModal,
}) => {
  const activeReminders = reminders.filter(r => r.status === 'active' || r.status === 'snoozed');

  const handleTriggerTest = (rem: Reminder) => {
    if (soundEnabled) playReminderTriggerAlarm(false);
  };

  const handleMarkDone = (id: string) => {
    if (soundEnabled) playSuccessChime(false);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r));
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 overflow-y-auto p-4 space-y-4">
      {/* Header Banner */}
      <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>আজকের সময়সূচি</span>
          </div>
          <h2 className="text-lg font-bold text-white font-sans mt-0.5">
            দৈনিক টাইমলাইন
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            সক্রিয় রিমাইন্ডার: <span className="font-mono text-teal-300 font-bold">{toBengaliNumber(activeReminders.length)}</span> টি
          </p>
        </div>

        <button
          onClick={onOpenNewReminderModal}
          className="p-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-xs transition-transform active:scale-90"
          title="নতুন রিমাইন্ডার"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Timeline items */}
      {activeReminders.length === 0 ? (
        <div className="p-10 text-center bg-neutral-950/60 rounded-2xl border border-neutral-800 space-y-2">
          <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
          <p className="text-xs text-neutral-400">আজ কোনো সক্রিয় রিমাইন্ডার বাকি নেই।</p>
          <button
            onClick={onOpenNewReminderModal}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-teal-300 text-xs rounded-lg transition-colors"
          >
            নতুন রিমাইন্ডার যোগ করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-neutral-800 pl-7">
          {activeReminders.map((rem, idx) => (
            <div key={rem.id} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-7 top-3.5 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-neutral-950" />

              {/* Card */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/80 hover:border-neutral-700 space-y-2 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white font-sans">
                      {rem.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{rem.displayDateText}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTriggerTest(rem)}
                    title="টেস্ট অ্যালার্ম বাজান"
                    className="p-1.5 text-teal-400 hover:bg-neutral-900 rounded-lg transition-colors shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-teal-400/30" />
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500 truncate">
                  "{rem.originalText}"
                </p>

                <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {rem.recurrence !== 'none' ? 'পুনরাবৃত্তি রিমাইন্ডার' : 'এককালীন রিমাইন্ডার'}
                  </span>
                  <button
                    onClick={() => handleMarkDone(rem.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900 rounded-lg text-xs font-medium active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>হয়ে গেছে</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
