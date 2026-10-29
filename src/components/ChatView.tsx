import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Send, 
  Mic, 
  MicOff, 
  Clock, 
  Check, 
  RotateCcw, 
  Sparkles,
  Play,
  Trash2,
  Bell
} from 'lucide-react';
import { ChatMessage, Reminder, AppSettings } from '../types';
import { parseReminderQuery } from '../utils/nlpParser';
import { 
  playMessageSentSound, 
  playMessageReceivedSound, 
  playReminderTriggerAlarm, 
  playSuccessChime 
} from '../utils/audio';
import { 
  formatCurrentTimeBn, 
  formatDateTimeBn, 
  showSystemNotification,
  vibrateDevice
} from '../utils/notifications';

interface ChatViewProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onOpenDataDeletion: () => void;
  onOpenNewReminderModal: () => void;
}

const SAMPLE_PROMPTS = [
  'কাল সকাল ১০টায় মাকে ফোন দিতে মনে করিও',
  'শুক্রবার ৭টায় বাবার ওষুধ',
  'kal shokal 8tay class',
  'robibar shokal 10tay gas bill',
  '৫ তারিখ সকাল ১১টায় কিস্তি',
  'Tomorrow at 2pm check supplier payment',
  'Call my sister at 7pm',
  'রাত ৮টায় বাবার ওষুধের কথা মনে করিও',
  'প্রতি শুক্রবার সকাল ১১টায় মাকে ফোন',
  'সব রিমাইন্ডার দেখাও',
];

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  setMessages,
  reminders,
  setReminders,
  settings,
  onOpenDataDeletion,
  onOpenNewReminderModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice speech-to-text
  const toggleSpeechRecognition = () => {
    if (settings.vibrationEnabled) vibrateDevice(20);

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('আপনার ডিভাইসে সরাসরি ভয়েস রিকগনিশন সাপোর্ট নেই। অনুগ্রহ করে টাইপ করুন।');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognitionClass = (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition || 
                                     (window as unknown as { SpeechRecognition: any }).SpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        if (settings.vibrationEnabled) vibrateDevice(15);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Send message
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (settings.vibrationEnabled) vibrateDevice(15);
    if (settings.soundEnabled) playMessageSentSound(false);

    const currentTimeStr = formatCurrentTimeBn();
    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: currentTimeStr,
      isoTimestamp: Date.now(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputText('');

    // Somoy response
    setTimeout(() => {
      const parsed = parseReminderQuery(query);
      if (settings.soundEnabled) playMessageReceivedSound(false);
      if (settings.vibrationEnabled) vibrateDevice([20, 40, 20]);

      if (parsed.type === 'list_request') {
        const replyMsg: ChatMessage = {
          id: `smy-${Date.now()}`,
          sender: 'somoy',
          text: parsed.replyMessage,
          timestamp: formatCurrentTimeBn(),
          isoTimestamp: Date.now(),
          type: 'reminders_list',
          metadata: {
            reminders: reminders.filter(r => r.status === 'active' || r.status === 'snoozed'),
          },
        };
        setMessages(prev => [...prev, replyMsg]);
        return;
      }

      if (parsed.type === 'delete_request') {
        const replyMsg: ChatMessage = {
          id: `smy-${Date.now()}`,
          sender: 'somoy',
          text: parsed.replyMessage,
          timestamp: formatCurrentTimeBn(),
          isoTimestamp: Date.now(),
          type: 'data_deletion_prompt',
          metadata: {
            deletionTimerExpiresAt: Date.now() + 10 * 60 * 1000,
          },
        };
        setMessages(prev => [...prev, replyMsg]);
        return;
      }

      if (parsed.type === 'ambiguous' && parsed.clarification) {
        const replyMsg: ChatMessage = {
          id: `smy-${Date.now()}`,
          sender: 'somoy',
          text: parsed.replyMessage,
          timestamp: formatCurrentTimeBn(),
          isoTimestamp: Date.now(),
          type: 'clarification',
          metadata: {
            clarificationContext: parsed.clarification,
          },
        };
        setMessages(prev => [...prev, replyMsg]);
        return;
      }

      if (parsed.type === 'reminder' && parsed.taskTitle && parsed.targetTimestamp) {
        const newReminder: Reminder = {
          id: `rem-${Date.now()}`,
          title: parsed.taskTitle,
          originalText: query,
          targetTimestamp: parsed.targetTimestamp,
          displayDateText: parsed.displayTime || formatDateTimeBn(parsed.targetTimestamp),
          recurrence: parsed.recurrence || 'none',
          status: 'active',
          createdAt: Date.now(),
          snoozeCount: 0,
          tags: ['রিমাইন্ডার'],
        };

        setReminders(prev => [newReminder, ...prev]);

        const replyMsg: ChatMessage = {
          id: `smy-${Date.now()}`,
          sender: 'somoy',
          text: parsed.replyMessage,
          timestamp: formatCurrentTimeBn(),
          isoTimestamp: Date.now(),
          type: 'confirmation',
          metadata: {
            reminderId: newReminder.id,
            reminder: newReminder,
          },
        };
        setMessages(prev => [...prev, replyMsg]);
        return;
      }

      // Default
      const replyMsg: ChatMessage = {
        id: `smy-${Date.now()}`,
        sender: 'somoy',
        text: parsed.replyMessage,
        timestamp: formatCurrentTimeBn(),
        isoTimestamp: Date.now(),
        type: 'text',
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 450);
  };

  // Ambiguity resolution
  const handleResolveClarification = (
    msgId: string, 
    option: { label: string; value: string; timestamp: number; displayText: string },
    task: string
  ) => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    if (settings.soundEnabled) playMessageSentSound(false);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: option.label,
      timestamp: formatCurrentTimeBn(),
      isoTimestamp: Date.now(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      if (settings.soundEnabled) playMessageReceivedSound(false);
      const newReminder: Reminder = {
        id: `rem-${Date.now()}`,
        title: task,
        originalText: `${task} (${option.label})`,
        targetTimestamp: option.timestamp,
        displayDateText: option.displayText,
        recurrence: 'none',
        status: 'active',
        createdAt: Date.now(),
        snoozeCount: 0,
      };

      setReminders(prev => [newReminder, ...prev]);

      const somoyMsg: ChatMessage = {
        id: `smy-${Date.now()}`,
        sender: 'somoy',
        text: `ঠিক আছে। ${option.displayText}-এ ${task}-এর কথা মনে করিয়ে দেব।`,
        timestamp: formatCurrentTimeBn(),
        isoTimestamp: Date.now(),
        type: 'confirmation',
        metadata: {
          reminderId: newReminder.id,
          reminder: newReminder,
        },
      };

      setMessages(prev => 
        prev.map(m => m.id === msgId ? { ...m, metadata: { ...m.metadata, actionHandled: true } } : m).concat(somoyMsg)
      );
    }, 350);
  };

  // Mark done
  const handleMarkDone = (reminderId: string, messageId?: string) => {
    if (settings.vibrationEnabled) vibrateDevice([30, 50, 30]);
    if (settings.soundEnabled) playSuccessChime(false);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2dd4bf', '#14b8a6', '#0f766e', '#38bdf8'],
      });
    } catch {
      // ignore
    }

    setReminders(prev =>
      prev.map(r => r.id === reminderId ? { ...r, status: 'completed' } : r)
    );

    const userAck: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: 'হয়ে গেছে',
      timestamp: formatCurrentTimeBn(),
      isoTimestamp: Date.now(),
      type: 'text',
    };

    const targetReminder = reminders.find(r => r.id === reminderId);
    const somoyReply: ChatMessage = {
      id: `smy-${Date.now() + 1}`,
      sender: 'somoy',
      text: `👍 দারুণ! "${targetReminder?.title || 'কাজটি'}" সম্পন্ন হয়েছে। এই কাজের জন্য আর কোনো অ্যালার্ট আসবে না।`,
      timestamp: formatCurrentTimeBn(),
      isoTimestamp: Date.now() + 1,
      type: 'text',
    };

    setMessages(prev => {
      const updated = prev.map(m => 
        m.id === messageId ? { ...m, metadata: { ...m.metadata, actionHandled: true } } : m
      );
      return [...updated, userAck, somoyReply];
    });
  };

  // Snooze
  const handleSnooze = (reminderId: string, messageId?: string) => {
    if (settings.vibrationEnabled) vibrateDevice(15);
    if (settings.soundEnabled) playMessageSentSound(false);

    const snoozeDurationMs = 30 * 60 * 1000;
    const newTarget = Date.now() + snoozeDurationMs;

    setReminders(prev =>
      prev.map(r =>
        r.id === reminderId
          ? {
              ...r,
              status: 'snoozed',
              snoozedUntil: newTarget,
              snoozeCount: (r.snoozeCount || 0) + 1,
              displayDateText: '৩০ মিনিট পরে',
            }
          : r
      )
    );

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: '৩০ মিনিট পরে',
      timestamp: formatCurrentTimeBn(),
      isoTimestamp: Date.now(),
      type: 'text',
    };

    const somoyMsg: ChatMessage = {
      id: `smy-${Date.now() + 1}`,
      sender: 'somoy',
      text: 'ঠিক আছে। ৩০ মিনিট পরে আবার মনে করিয়ে দেব।',
      timestamp: formatCurrentTimeBn(),
      isoTimestamp: Date.now() + 1,
      type: 'text',
    };

    setMessages(prev => {
      const updated = prev.map(m =>
        m.id === messageId ? { ...m, metadata: { ...m.metadata, actionHandled: true } } : m
      );
      return [...updated, userMsg, somoyMsg];
    });
  };

  // Trigger test alarm
  const handleSimulateReminderAlert = (reminderToTrigger?: Reminder) => {
    const target = reminderToTrigger || reminders.find(r => r.status === 'active') || reminders[0];
    if (!target) return;

    if (settings.vibrationEnabled) vibrateDevice([80, 50, 80, 50, 80]);
    if (settings.soundEnabled) playReminderTriggerAlarm(false);
    showSystemNotification(`⏰ রিমাইন্ডার: ${target.title}`, `সময় হয়েছে! আপনার কাজ: ${target.title}`);

    const alertMsg: ChatMessage = {
      id: `alert-${Date.now()}`,
      sender: 'somoy',
      text: `⏰ রিমাইন্ডার: ${target.title}`,
      timestamp: formatCurrentTimeBn(),
      isoTimestamp: Date.now(),
      type: 'reminder_trigger',
      metadata: {
        reminderId: target.id,
        reminder: target,
        actionHandled: false,
      },
    };

    setMessages(prev => [...prev, alertMsg]);

    // Free Follow-up trigger after 6 seconds if not handled
    if (settings.followUpEnabled) {
      setTimeout(() => {
        setMessages(currentMessages => {
          const triggerMsg = currentMessages.find(m => m.id === alertMsg.id);
          if (triggerMsg && !triggerMsg.metadata?.actionHandled) {
            if (settings.soundEnabled) playMessageReceivedSound(false);
            const followUpMsg: ChatMessage = {
              id: `followup-${Date.now()}`,
              sender: 'somoy',
              text: `কাজটা কি হয়েছে? (${target.title}) একবার মনে করিয়ে দিচ্ছি।`,
              timestamp: formatCurrentTimeBn(),
              isoTimestamp: Date.now(),
              type: 'followup_prompt',
              metadata: {
                reminderId: target.id,
                reminder: target,
                actionHandled: false,
              },
            };
            return [...currentMessages, followUpMsg];
          }
          return currentMessages;
        });
      }, 6000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 relative overflow-hidden">
      {/* Sample Prompts Scrollable Strip */}
      <div className="bg-neutral-950/80 border-b border-neutral-800/80 py-2 px-3 overflow-x-auto flex items-center gap-1.5 text-xs no-scrollbar shrink-0">
        <span className="text-neutral-500 text-[11px] whitespace-nowrap flex items-center gap-1 shrink-0 font-medium">
          <Sparkles className="w-3 h-3 text-teal-400" />
          নমুনা:
        </span>
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="whitespace-nowrap px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs transition-colors shrink-0 border border-neutral-800/80 active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-950/30">
        <div className="flex justify-center my-1">
          <span className="text-[11px] font-medium text-neutral-400 bg-neutral-900/90 px-3 py-0.5 rounded-full border border-neutral-800">
            আজ
          </span>
        </div>

        {messages.map((message) => {
          const isUser = message.sender === 'user';

          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div className={`flex gap-2 max-w-[88%] sm:max-w-[78%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isUser && (
                  <img
                    src="/src/assets/images/somoy_mascot_avatar_1793260027035.jpg"
                    alt="Somoy"
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-teal-500/30"
                  />
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm relative ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-neutral-900 text-neutral-100 rounded-tl-xs border border-neutral-800/80 shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">
                    {message.text}
                  </p>

                  {/* Confirmation Card */}
                  {message.type === 'confirmation' && message.metadata?.reminder && (
                    <div className="mt-2.5 p-2.5 bg-neutral-950/90 rounded-xl border border-teal-500/30 text-xs">
                      <div className="flex items-center justify-between gap-2 text-teal-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          নিশ্চিত · {message.metadata.reminder.displayDateText}
                        </span>
                        <span className="text-neutral-400 text-[10px]">
                          {message.metadata.reminder.recurrence !== 'none' ? 'রিকারিং' : 'একবার'}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-neutral-900 flex items-center justify-between text-neutral-400">
                        <span className="truncate">কাজ: {message.metadata.reminder.title}</span>
                        <button
                          onClick={() => handleSimulateReminderAlert(message.metadata?.reminder)}
                          className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium shrink-0 ml-2"
                        >
                          <Play className="w-3 h-3 fill-teal-400" />
                          টেস্ট বাজান
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clarification Chips */}
                  {message.type === 'clarification' && message.metadata?.clarificationContext && !message.metadata?.actionHandled && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-800 flex flex-wrap gap-2">
                      {message.metadata.clarificationContext.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => 
                            handleResolveClarification(
                              message.id, 
                              opt, 
                              message.metadata!.clarificationContext!.task
                            )
                          }
                          className="px-3 py-1.5 bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-700/60 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          <Clock className="w-3 h-3 text-teal-400" />
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trigger Alert Card */}
                  {message.type === 'reminder_trigger' && message.metadata?.reminder && (
                    <div className="mt-2.5 p-3 bg-neutral-950 rounded-xl border border-teal-500/50 text-xs space-y-2">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="font-semibold text-white text-sm">
                          {message.metadata.reminder.title}
                        </span>
                        <span className="text-teal-400 font-mono text-[11px]">
                          {message.timestamp}
                        </span>
                      </div>

                      {!message.metadata.actionHandled ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleMarkDone(message.metadata!.reminderId!, message.id)}
                            className="flex-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>হয়ে গেছে</span>
                          </button>

                          <button
                            onClick={() => handleSnooze(message.metadata!.reminderId!, message.id)}
                            className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-neutral-700 active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                            <span>৩০ মি. পরে</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1 text-[11px] text-teal-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>গৃহীত</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow-up Prompt */}
                  {message.type === 'followup_prompt' && message.metadata?.reminder && (
                    <div className="mt-2.5 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-2">
                      <p className="text-neutral-300">
                        কাজটি কি শেষ হয়েছে নাকি আরও সময় লাগবে?
                      </p>
                      {!message.metadata.actionHandled ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleMarkDone(message.metadata!.reminderId!, message.id)}
                            className="flex-1 py-1.5 px-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg text-xs active:scale-95"
                          >
                            হ্যাঁ, শেষ
                          </button>
                          <button
                            onClick={() => handleSnooze(message.metadata!.reminderId!, message.id)}
                            className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs border border-neutral-700 active:scale-95"
                          >
                            ৩০ মি. পরে
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-teal-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> সম্পন্ন
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reminder List In Chat */}
                  {message.type === 'reminders_list' && (
                    <div className="mt-2.5 space-y-1.5 border-t border-neutral-800 pt-2">
                      {reminders.filter(r => r.status === 'active' || r.status === 'snoozed').length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">কোনো সক্রিয় রিমাইন্ডার নেই।</p>
                      ) : (
                        reminders
                          .filter(r => r.status === 'active' || r.status === 'snoozed')
                          .slice(0, 4)
                          .map((rem) => (
                            <div key={rem.id} className="p-2 bg-neutral-950 rounded-lg text-xs flex items-center justify-between gap-2 border border-neutral-800">
                              <div className="truncate">
                                <p className="font-semibold text-neutral-200 truncate">{rem.title}</p>
                                <p className="text-[10px] text-teal-400">{rem.displayDateText}</p>
                              </div>
                              <button
                                onClick={() => handleMarkDone(rem.id)}
                                className="px-2 py-1 bg-teal-950 text-teal-300 border border-teal-800 rounded text-[11px] shrink-0"
                              >
                                হয়ে গেছে
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {/* Deletion safety */}
                  {message.type === 'data_deletion_prompt' && (
                    <div className="mt-2.5 p-2.5 bg-red-950/40 rounded-xl border border-red-800/40 text-xs space-y-2">
                      <p className="text-red-200">
                        সমস্ত রিমাইন্ডার ও চ্যাট হিস্ট্রি রিসেট করতে নিশ্চিত করুন।
                      </p>
                      <button
                        onClick={onOpenDataDeletion}
                        className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>স্থায়ীভাবে ডাটা মুছুন</span>
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`flex items-center gap-1 text-[10px] mt-1 ${
                      isUser ? 'text-teal-200 justify-end' : 'text-neutral-500 justify-start'
                    }`}
                  >
                    <span>{message.timestamp}</span>
                    {isUser && <Check className="w-3 h-3 text-teal-200 inline" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Mic */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title={isListening ? 'রেকর্ডিং বন্ধ' : 'মুখে বলে রিমাইন্ডার দিন'}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${
              isListening
                ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-teal-400" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="বার্তা লিখুন... যেমন: কাল সকাল ১০টায় ক্লাস"
            className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 shadow-xs active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
