export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays';

export type ReminderStatus = 'active' | 'triggered' | 'snoozed' | 'completed' | 'cancelled';

export interface Reminder {
  id: string;
  title: string;
  originalText: string;
  targetTimestamp: number; // Unix timestamp in ms
  displayDateText: string; // e.g. "কাল সকাল ১০:০০"
  recurrence: RecurrenceType;
  status: ReminderStatus;
  createdAt: number;
  snoozedUntil?: number;
  snoozeCount: number;
  followUpSent?: boolean;
  followUpCompleted?: boolean;
  notes?: string;
  tags?: string[];
}

export type ChatMessageType = 
  | 'text' 
  | 'confirmation' 
  | 'clarification' 
  | 'reminder_trigger' 
  | 'followup_prompt' 
  | 'reminders_list' 
  | 'data_deletion_prompt'
  | 'system_info';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'somoy';
  text: string;
  timestamp: string; // e.g. "১১:৪২"
  isoTimestamp: number;
  type?: ChatMessageType;
  metadata?: {
    reminderId?: string;
    reminder?: Reminder;
    reminders?: Reminder[];
    clarificationContext?: {
      task: string;
      rawTime: string;
      options: {
        label: string;
        value: string;
        timestamp: number;
        displayText: string;
      }[];
    };
    deletionTimerExpiresAt?: number;
    actionHandled?: boolean;
  };
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  followUpEnabled: boolean;
  mobileFrameMode: boolean;
}
