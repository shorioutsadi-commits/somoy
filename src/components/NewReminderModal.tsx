import React, { useState } from 'react';
import { X, Clock, Calendar, Repeat, Check } from 'lucide-react';
import { Reminder, RecurrenceType } from '../types';
import { formatDateTimeBn, toBengaliNumber } from '../utils/notifications';

interface NewReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReminder: (reminder: Reminder) => void;
}

export const NewReminderModal: React.FC<NewReminderModalProps> = ({
  isOpen,
  onClose,
  onAddReminder,
}) => {
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeStr, setTimeStr] = useState('10:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [tag, setTag] = useState('ব্যক্তিগত');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [hours, mins] = timeStr.split(':').map(Number);
    const targetDate = new Date(`${dateStr}T${timeStr}:00`);
    const timestamp = targetDate.getTime();

    const displayDateText = formatDateTimeBn(timestamp);

    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      title: title.trim(),
      originalText: `${title} (${displayDateText})`,
      targetTimestamp: timestamp,
      displayDateText,
      recurrence,
      status: 'active',
      createdAt: Date.now(),
      snoozeCount: 0,
      tags: [tag],
    };

    onAddReminder(newReminder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative text-neutral-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold font-sans text-white mb-4">
          নতুন রিমাইন্ডার যুক্ত করুন
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">কাজের বিবরণ / টাইটেল</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: মাকে ফোন, গ্যাস বিল দেওয়া, ওষুধ খাওয়া"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-teal-500 rounded-lg px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:outline-none"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">তারিখ</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-teal-500 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">সময়</label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-teal-500 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">পুনরাবৃত্তি (Recurrence)</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-teal-500 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none"
            >
              <option value="none">একবার (কোনো পুনরাবৃত্তি নেই)</option>
              <option value="daily">প্রতিদিন (Daily)</option>
              <option value="weekly">প্রতি সপ্তাহে (Weekly)</option>
              <option value="monthly">প্রতি মাসে (Monthly)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-neutral-300 font-medium">ক্যাটাগরি</label>
            <div className="flex gap-2">
              {['ব্যক্তিগত', 'স্বাস্থ্য', 'পরিবার', 'বিল ও কাজ'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setTag(cat)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    tag === cat
                      ? 'bg-teal-900/60 text-teal-300 border border-teal-600 font-medium'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors font-medium"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              রিমাইন্ডার সেট করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
