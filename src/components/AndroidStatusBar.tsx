import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Bell, Sparkles } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-7 px-4 bg-neutral-950 text-neutral-400 flex items-center justify-between text-xs select-none border-b border-neutral-900 font-mono shrink-0">
      <div className="flex items-center gap-1.5 font-medium text-neutral-200">
        <span>{timeStr}</span>
        <span className="text-[10px] text-teal-400 font-sans">সময়</span>
      </div>

      <div className="flex items-center gap-2 text-neutral-300">
        <Wifi className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold">5G</span>
        <div className="flex items-center gap-0.5">
          <span className="text-[10px]">88%</span>
          <BatteryMedium className="w-3.5 h-3.5 text-teal-400" />
        </div>
      </div>
    </div>
  );
};
