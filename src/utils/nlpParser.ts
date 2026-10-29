import { RecurrenceType } from '../types';
import { toBengaliNumber, toEnglishNumber, formatDateTimeBn } from './notifications';

export interface ParseResult {
  type: 'reminder' | 'ambiguous' | 'list_request' | 'delete_request' | 'help' | 'greeting' | 'unknown';
  taskTitle?: string;
  targetTimestamp?: number;
  displayTime?: string;
  recurrence?: RecurrenceType;
  clarification?: {
    question: string;
    options: {
      label: string;
      value: string;
      timestamp: number;
      displayText: string;
    }[];
    task: string;
    rawTime: string;
  };
  replyMessage: string;
}

// Day mapping
const dayNamesBn: { [key: string]: number } = {
  'রবিবার': 0, 'রবি': 0, 'robibar': 0, 'robi': 0, 'sunday': 0,
  'সোমবার': 1, 'সোম': 1, 'shombar': 1, 'sombar': 1, 'shom': 1, 'monday': 1,
  'মঙ্গলবার': 2, 'মঙ্গল': 2, 'mongolbar': 2, 'tuesday': 2,
  'বুধবার': 3, 'বুধ': 3, 'budhbar': 3, 'budh': 3, 'wednesday': 3,
  'বৃহস্পতিবার': 4, 'বৃহস্পতি': 4, 'brihospotibar': 4, 'thursday': 4,
  'শুক্রবার': 5, 'শুক্র': 5, 'shukrobar': 5, 'shukro': 5, 'friday': 5,
  'শনিবার': 6, 'শনি': 6, 'shonibar': 6, 'shoni': 6, 'saturday': 6,
};

export function parseReminderQuery(input: string): ParseResult {
  const trimmed = input.trim();
  const lower = toEnglishNumber(trimmed.toLowerCase());

  // 1. Check for command: List / সব রিমাইন্ডার
  if (
    lower.includes('লিস্ট') || 
    lower.includes('list') || 
    lower.includes('সব রিমাইন্ডার') || 
    lower.includes('সব কাজ') || 
    lower.includes('show reminders') ||
    lower === 'রিমাইন্ডার' ||
    lower === 'dekhao'
  ) {
    return {
      type: 'list_request',
      replyMessage: 'আপনার সক্রিয় ও আসন্ন সকল রিমাইন্ডার নিচে দেওয়া হলো:',
    };
  }

  // 2. Check for command: Data deletion
  if (
    lower.includes('ডাটা মুছে') || 
    lower.includes('ডাটা মুছুন') || 
    lower.includes('delete data') || 
    lower.includes('clear data') ||
    lower.includes('data muche dao')
  ) {
    return {
      type: 'delete_request',
      replyMessage: '⚠️ আপনার গোপনীয়তা আমাদের সর্বোচ্চ অগ্রাধিকার। আপনি কি আপনার সকল রিমাইন্ডার ও চ্যাট হিস্ট্রি মুছে ফেলতে চান? নিচে নিশ্চিত করুন (১০ মিনিটের মধ্যে কার্যকর থাকবে)।',
    };
  }

  // 3. Check for Help / কীভাবে কাজ করে
  if (
    lower.includes('সাহায্য') || 
    lower.includes('help') || 
    lower.includes('কীভাবে') || 
    lower.includes('kivabe') ||
    lower.includes('ki vabe')
  ) {
    return {
      type: 'help',
      replyMessage: 'খুব সহজ! শুধু নিজের ভাষায় কাজ আর সময় লিখে পাঠিয়ে দিন। যেমন:\n• "কাল সকাল ১০টায় মাকে ফোন দিতে মনে করিও"\n• "kal shokal 8tay class"\n• "রাত ৮টায় বাবার ওষুধের কথা মনে করিও"\n• "Tomorrow at 2pm check supplier payment"\n\nসময় অস্পষ্ট থাকলে Somoy নিজে থেকেই সকাল না সন্ধ্যা জিজ্ঞেস করে নেবে!',
    };
  }

  // 4. Greetings
  if (/^(হাই|হ্যালো|সালাম|হ্যালো সময়|hi|hello|hey|assalamu alaikum|shomoy|somoy)$/i.test(trimmed)) {
    return {
      type: 'greeting',
      replyMessage: 'হ্যালো! যা মনে রাখা দরকার, নির্দ্বিধায় আমাকে বলুন। বাংলা, বাংলিশ বা ইংরেজিতে কাজ আর সময় লিখে পাঠালেই হবে।',
    };
  }

  // 5. Parse Recurrence
  let recurrence: RecurrenceType = 'none';
  if (
    lower.includes('প্রতিদিন') || 
    lower.includes('রোজ') || 
    lower.includes('daily') || 
    lower.includes('every day') || 
    lower.includes('protidin')
  ) {
    recurrence = 'daily';
  } else if (
    lower.includes('প্রতি শুক্রবার') || 
    lower.includes('প্রতি সপ্তাহে') || 
    lower.includes('weekly') || 
    lower.includes('every friday') || 
    lower.includes('proti shukrobar')
  ) {
    recurrence = 'weekly';
  } else if (
    lower.includes('প্রতি মাসে') || 
    lower.includes('monthly') || 
    lower.includes('every month') || 
    lower.includes('proti mashe')
  ) {
    recurrence = 'monthly';
  }

  // 6. Ambiguity Check: User wrote "৭টায়" or "7 tay" or "7pm" without morning/evening specified
  // e.g. "শুক্রবার ৭টায় বাবার ওষুধ", "kal 7tay meeting", "shukrobar 7tay babar oshudh"
  const ambiguousRegex = /(?:শুক্রবার|শনিবার|রবিবার|সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার|শুক্র|কাল|আজ|আগামীকাল|shukrobar|robibar|shonibar|shombar|mongolbar|budhbar|brihospotibar|kal|ajke)?\s*(\d{1,2})\s*(?:টায়|টায়|টা|tay|ta)(?!.*(?:সকাল|সন্ধ্যা|বিকেল|রাত|shokal|shondha|shondhay|bikel|rat|am|pm))/i;
  
  // Check if text has hour number with "টায়/tay" but DOES NOT have period (সকাল/সন্ধ্যা/রাত/am/pm)
  const hasTimeIndicator = /(সকাল|সন্ধ্যা|বিকেল|রাত|দুপুর|shokal|shondha|shondhay|bikel|rat|dupur|am|pm)/i.test(lower);
  const hourMatch = lower.match(/(\d{1,2})\s*(?:টায়|টায়|টা|tay|ta|:|am|pm)/i);

  if (!hasTimeIndicator && hourMatch) {
    const rawHour = parseInt(hourMatch[1], 10);
    // If between 1 and 11, it's typically ambiguous (e.g. 7টা could be 7 AM or 7 PM)
    if (rawHour >= 1 && rawHour <= 11) {
      // Find clean task title
      const cleanedTask = cleanTaskTitle(trimmed);
      const isFriday = lower.includes('শুক্রবার') || lower.includes('shukrobar') || lower.includes('friday');
      
      const now = new Date();
      let morningDate = new Date(now);
      let eveningDate = new Date(now);

      if (isFriday) {
        const daysUntilFriday = (5 + 7 - now.getDay()) % 7 || 7;
        morningDate.setDate(now.getDate() + daysUntilFriday);
        eveningDate.setDate(now.getDate() + daysUntilFriday);
      } else if (lower.includes('কাল') || lower.includes('kal') || lower.includes('tomorrow')) {
        morningDate.setDate(now.getDate() + 1);
        eveningDate.setDate(now.getDate() + 1);
      }

      morningDate.setHours(rawHour, 0, 0, 0);
      eveningDate.setHours(rawHour + 12, 0, 0, 0);

      const morningLabel = `সকাল ${toBengaliNumber(rawHour)}টা`;
      const eveningLabel = rawHour >= 7 ? `রাত ${toBengaliNumber(rawHour)}টা` : `সন্ধ্যা ${toBengaliNumber(rawHour)}টা`;

      return {
        type: 'ambiguous',
        taskTitle: cleanedTask,
        clarification: {
          question: 'সকাল না সন্ধ্যা?',
          options: [
            {
              label: morningLabel,
              value: 'morning',
              timestamp: morningDate.getTime(),
              displayText: `${isFriday ? 'শুক্রবার ' : ''}সকাল ${toBengaliNumber(rawHour)}:০০`,
            },
            {
              label: eveningLabel,
              value: 'evening',
              timestamp: eveningDate.getTime(),
              displayText: `${isFriday ? 'শুক্রবার ' : ''}${eveningLabel.split(' ')[0]} ${toBengaliNumber(rawHour)}:০০`,
            },
          ],
          task: cleanedTask,
          rawTime: `${rawHour}টা`,
        },
        replyMessage: 'সকাল না সন্ধ্যা?',
      };
    }
  }

  // 7. General date-time calculation
  const calculated = extractDateTime(lower, trimmed);
  if (calculated) {
    const cleanTask = cleanTaskTitle(trimmed);
    const displayTime = formatDateTimeBn(calculated.timestamp);
    const confirmMessage = `ঠিক আছে। ${displayTime}-এ ${cleanTask}-এর কথা মনে করিয়ে দেব।`;

    return {
      type: 'reminder',
      taskTitle: cleanTask,
      targetTimestamp: calculated.timestamp,
      displayTime,
      recurrence,
      replyMessage: confirmMessage,
    };
  }

  // Fallback: If it looks like a reminder request but couldn't parse time specifically
  const defaultTask = cleanTaskTitle(trimmed);
  const tomorrowDefault = new Date();
  tomorrowDefault.setDate(tomorrowDefault.getDate() + 1);
  tomorrowDefault.setHours(10, 0, 0, 0);

  return {
    type: 'reminder',
    taskTitle: defaultTask || 'গুরুত্বপূর্ণ কাজ',
    targetTimestamp: tomorrowDefault.getTime(),
    displayTime: 'কাল সকাল ১০:০০',
    recurrence: 'none',
    replyMessage: `ঠিক আছে। কাল সকাল ১০:০০ টায় ${defaultTask || 'কাজটির'} কথা মনে করিয়ে দেব।`,
  };
}

function cleanTaskTitle(raw: string): string {
  let cleaned = raw
    .replace(/(কাল|আজ|আগামীকাল|পরশু|রোজ|প্রতিদিন|প্রতি শুক্রবার|প্রতি সপ্তাহে|প্রতি মাসে)/gi, '')
    .replace(/(kal|ajke|shobshomoy|every day|daily|weekly|tomorrow|today)/gi, '')
    .replace(/(সকাল|সন্ধ্যা|বিকেল|রাত|দুপুর|shokal|shondha|shondhay|bikel|rat|dupur)\s*\d{1,2}(?::\d{2})?\s*(?:টায়|টায়|টা|tay|ta|am|pm)?/gi, '')
    .replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm|টায়|টায়|টা|tay|ta)/gi, '')
    .replace(/(তারিখ|tarikh)\s*\d{1,2}/gi, '')
    .replace(/(মনে করিও|মনে করে দিও|মনে করিয়ে দিও|মনে করাইও|মনে করিয়ে দেবে|মনে করিয়ে দাও|মনে রেখো)/gi, '')
    .replace(/(mone korio|mone koriye dio|mone korai dio|remind me to|remind me)/gi, '')
    .replace(/(দিতে|করতে|দেওয়ার কথা|দিতে হবে|হবে)/gi, '')
    .replace(/(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi, '')
    .trim();

  // If left with nothing or tiny phrase, fallback smartly
  if (cleaned.length < 2) {
    // try to salvage from original text
    const words = raw.split(/\s+/).filter(w => !/\d|মনে|টায়|tay|কাল|kal|আজ/i.test(w));
    cleaned = words.join(' ').trim() || 'নির্ধারিত কাজ';
  }

  // Capitalize or clean lead
  return cleaned;
}

function extractDateTime(lower: string, original: string): { timestamp: number } | null {
  const now = new Date();
  const target = new Date(now);

  // Check specific date e.g. "৫ তারিখ" / "5 tarikh"
  const dateMatch = lower.match(/(\d{1,2})\s*(?:তারিখ|tarikh|th|st|nd|rd)/i);
  if (dateMatch) {
    const dayOfMonth = parseInt(dateMatch[1], 10);
    if (dayOfMonth >= 1 && dayOfMonth <= 31) {
      if (now.getDate() > dayOfMonth) {
        target.setMonth(target.getMonth() + 1);
      }
      target.setDate(dayOfMonth);
    }
  }

  // Day of week check
  for (const [dayName, dayIndex] of Object.entries(dayNamesBn)) {
    if (lower.includes(dayName)) {
      const diff = (dayIndex + 7 - now.getDay()) % 7;
      target.setDate(now.getDate() + (diff === 0 ? 7 : diff));
      break;
    }
  }

  // Tomorrow / Today check
  if (lower.includes('কাল') || lower.includes('kal') || lower.includes('tomorrow') || lower.includes('আগামীকাল')) {
    target.setDate(now.getDate() + 1);
  } else if (lower.includes('পরশু') || lower.includes('porshu')) {
    target.setDate(now.getDate() + 2);
  }

  // Time extraction
  let hour = 10;
  let minute = 0;

  // Search for hh:mm or hh
  const timeWithMinutes = lower.match(/(\d{1,2}):(\d{2})/);
  if (timeWithMinutes) {
    hour = parseInt(timeWithMinutes[1], 10);
    minute = parseInt(timeWithMinutes[2], 10);
  } else {
    const hourOnly = lower.match(/(\d{1,2})\s*(?:টায়|টায়|টা|tay|ta|pm|am)/i);
    if (hourOnly) {
      hour = parseInt(hourOnly[1], 10);
    }
  }

  // Period adjust
  const isMorning = lower.includes('সকাল') || lower.includes('shokal') || lower.includes('am') || lower.includes('ভোর');
  const isAfternoon = lower.includes('দুপুর') || lower.includes('বিকেল') || lower.includes('bikel') || lower.includes('dupur');
  const isEveningOrNight = lower.includes('সন্ধ্যা') || lower.includes('shondha') || lower.includes('shondhay') || lower.includes('রাত') || lower.includes('rat') || lower.includes('pm');

  if (isEveningOrNight && hour < 12) {
    hour += 12;
  } else if (isAfternoon && hour < 12 && hour !== 12) {
    hour += 12;
  } else if (isMorning && hour === 12) {
    hour = 0;
  }

  target.setHours(hour, minute, 0, 0);

  // If time target already passed today and no specific date was given, push to tomorrow
  if (target.getTime() <= now.getTime() && !lower.includes('আজ') && !lower.includes('ajke') && !dateMatch) {
    target.setDate(target.getDate() + 1);
  }

  return { timestamp: target.getTime() };
}
