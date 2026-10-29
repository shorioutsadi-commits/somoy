import React, { useState } from 'react';
import { X, Smartphone, Download, Github, Copy, Check, Terminal, Play, AlertCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallApkModal: React.FC<InstallApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'github'>('github');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const gitCommands = `git init
git add .
git commit -m "Somoy Android App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/somoy-app.git
git push -u origin main`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-neutral-900 border border-teal-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-neutral-100 max-h-[90vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/somoy_mascot_avatar_1793260027035.jpg"
            alt="Somoy App"
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-teal-500/40 shadow-md shrink-0"
          />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-sans">
              Somoy Android APK বিল্ড ও ইনস্টল
            </h3>
            <p className="text-xs text-teal-400 font-mono">
              GitHub Actions ও Native Android APK প্রস্তুত
            </p>
          </div>
        </div>

        {/* Segmented Selector */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'github'
                ? 'bg-neutral-800 text-teal-300 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub-এ APK বিল্ড (.apk)</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-neutral-800 text-teal-300 font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>সরাসরি ফোনে ইনস্টল</span>
          </button>
        </div>

        {/* Tab 1: GitHub APK Auto-Build */}
        {activeTab === 'github' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-teal-950/40 rounded-xl border border-teal-800/40 space-y-1">
              <span className="text-teal-300 font-semibold font-sans flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
                স্বয়ংক্রিয় GitHub Actions তৈরি করা আছে!
              </span>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                এই প্রজেক্টে <code className="text-teal-400 font-mono">.github/workflows/build-apk.yml</code> ফাইল যুক্ত করা হয়েছে। আপনি কোড গিটহাবে পুশ করলেই গিটহাব অটোমেটিক <strong>.apk</strong> বিল্ড করে দেবে!
              </p>
            </div>

            {/* Step 1 */}
            <div className="space-y-1.5">
              <span className="font-semibold text-neutral-200">১. আপনার গিটহাব রিপোজিটরিতে কোড পুশ করুন:</span>
              <div className="relative">
                <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed">
                  {gitCommands}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyCommands}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-teal-300 rounded-md text-[10px] flex items-center gap-1 transition-colors border border-neutral-700"
                >
                  {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-1">
              <span className="font-semibold text-neutral-200">২. GitHub Actions-এ বিল্ড চালু হবে:</span>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                গিটহাবে গিয়ে <strong>Actions</strong> ট্যাবে ঢুকলে দেখতে পাবেন <strong>"Build Android APK (Somoy)"</strong> রান হচ্ছে (২-৩ মিনিট সময় নেবে)।
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-1">
              <span className="font-semibold text-neutral-200">৩. APK ডাউনলোড করে ফোনে চালান:</span>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                বিল্ড সফল হলে নিচে <strong>Artifacts</strong> সেকশনে <strong>Somoy-App-Android-APK</strong> পাবেন। লিংকে ক্লিক করে ডাউনলোড করে ফোনে ইনস্টল করে নিন!
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Install (PWA / Web APK) */}
        {activeTab === 'pwa' && (
          <div className="space-y-3 text-xs">
            {isInstallable && (
              <div className="p-3 bg-teal-950/60 rounded-xl border border-teal-700/60 space-y-2">
                <p className="text-xs text-teal-200">
                  আপনার ডিভাইস প্রস্তুত! নিচের বাটনে চাপলে সরাসরি ফোনে ইনস্টল প্রম্পট আসবে:
                </p>
                <button
                  onClick={async () => {
                    await install();
                    onClose();
                  }}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>এখনই ফোনে ইনস্টল করুন</span>
                </button>
              </div>
            )}

            <p className="text-neutral-300 font-semibold font-sans">
              ব্রাউজার থেকে সরাসরি ইনস্টল করার নিয়ম:
            </p>

            <div className="space-y-2 text-neutral-400 text-[11px]">
              <div className="flex items-start gap-2.5 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="w-5 h-5 rounded-full bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center text-[10px] font-mono shrink-0">১</span>
                <span>অ্যান্ড্রয়েড ফোনের Chrome ব্রাউজারে ডানদিকের <strong>তিনটি ডট (⋮)</strong> মেনু চাপুন।</span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="w-5 h-5 rounded-full bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center text-[10px] font-mono shrink-0">২</span>
                <span>মেনু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> চাপুন।</span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="w-5 h-5 rounded-full bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center text-[10px] font-mono shrink-0">৩</span>
                <span>কয়েক সেকেন্ডেই আপনার অ্যাপ ড্রয়ার ও হোম স্ক্রিনে <strong>সময় (Somoy)</strong> আইকন চলে আসবে।</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>✓ সম্পূর্ণ ফ্রি</span>
          <span>✓ অফলাইন সাপোর্ট</span>
          <span>✓ নোটিফিকেশন অ্যালার্ম</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition-colors"
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
};
