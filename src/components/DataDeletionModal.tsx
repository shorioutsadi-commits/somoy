import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';
import { toBengaliNumber } from '../utils/notifications';

interface DataDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export const DataDeletionModal: React.FC<DataDeletionModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes = 600s

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(600);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerStr = `${toBengaliNumber(minutes)}:${toBengaliNumber(seconds.toString().padStart(2, '0'))}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-neutral-900 border border-red-900/60 rounded-2xl p-6 shadow-2xl relative text-neutral-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 text-red-400 mb-3">
          <div className="p-2.5 bg-red-950/80 rounded-xl border border-red-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              ডাটা মোছার নিরাপত্তা নিশ্চিতকরণ
            </h3>
            <span className="text-xs text-red-300 font-mono">
              ১০ মিনিটের মধ্যে যাচাইকরণ
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed mb-4">
          আমাদের গোপনীয়তা নীতি অনুযায়ী, আপনার অনুরোধে আপনার সমস্ত রিমাইন্ডার এবং চ্যাট হিস্ট্রি সম্পূর্ণভাবে মুছে ফেলা হবে। এই প্রক্রিয়াটি অপরিবর্তনীয়।
        </p>

        {/* Countdown display */}
        <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center mb-5">
          <span className="text-[11px] text-neutral-400 block mb-0.5">
            নিশ্চিত করার অবশিষ্ট সময়:
          </span>
          <span className="text-2xl font-bold font-mono text-red-400">
            {timerStr}
          </span>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-xl transition-colors"
          >
            বাতিল করুন
          </button>
          <button
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>স্থায়ীভাবে ডাটা মুছুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
