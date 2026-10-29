// Browser Notifications and Speech Recognition Utilities

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function vibrateDevice(pattern: number | number[] = 15) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) {
    console.error('Notification permission error', e);
    return false;
  }
}

export function showSystemNotification(title: string, body: string, iconUrl?: string) {
  if (!isNotificationSupported()) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: iconUrl || '/src/assets/images/somoy_mascot_avatar_1793260027035.jpg',
        badge: '/src/assets/images/somoy_mascot_avatar_1793260027035.jpg',
        silent: false,
      });
    } catch (e) {
      console.error('Failed to trigger notification', e);
    }
  }
}

// Bengali number translation
const bnDigits: { [key: string]: string } = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

const enDigits: { [key: string]: string } = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

export function toBengaliNumber(num: number | string): string {
  return String(num).replace(/[0-9]/g, (w) => bnDigits[w] || w);
}

export function toEnglishNumber(str: string): string {
  return String(str).replace(/[০-৯]/g, (w) => enDigits[w] || w);
}

export function formatCurrentTimeBn(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return toBengaliNumber(`${formattedHours}:${formattedMinutes}`);
}

export function formatDateTimeBn(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? (hours >= 17 ? 'সন্ধ্যা' : hours >= 15 ? 'বিকেল' : 'দুপুর') : (hours >= 5 ? 'সকাল' : 'রাত');
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const timeStr = `${period} ${toBengaliNumber(displayHours)}:${toBengaliNumber(mins)}`;

  if (isToday) {
    return `আজ ${timeStr}`;
  } else if (isTomorrow) {
    return `কাল ${timeStr}`;
  } else {
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const dayName = days[d.getDay()];
    return `${dayName} ${timeStr}`;
  }
}
