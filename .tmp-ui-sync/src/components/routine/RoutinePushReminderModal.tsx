import React, { useState } from 'react';
import { 
  Bell, 
  Sun, 
  Moon, 
  Sparkles, 
  Check, 
  X, 
  ChevronRight, 
  Clock, 
  ShieldAlert, 
  Droplets,
  Layers,
  Settings2,
  Volume2
} from 'lucide-react';
import { RoutineReminderSettings, BeautyProduct } from '../../types/beauty';

interface RoutinePushReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'morning' | 'evening';
  reminderSettings: RoutineReminderSettings;
  onUpdateSettings: (settings: RoutineReminderSettings) => void;
  onStartRoutine: (type: 'morning' | 'evening') => void;
  products: BeautyProduct[];
}

export const RoutinePushReminderModal: React.FC<RoutinePushReminderModalProps> = ({
  isOpen,
  onClose,
  type,
  reminderSettings,
  onUpdateSettings,
  onStartRoutine,
  products
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempMorningTime, setTempMorningTime] = useState(reminderSettings.morningTime);
  const [tempEveningTime, setTempEveningTime] = useState(reminderSettings.eveningTime);
  const [tempEnabled, setTempEnabled] = useState(reminderSettings.enabled);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  if (!isOpen) return null;

  const isMorning = type === 'morning';

  // Request actual browser Notification permission
  const handleRequestWebNotification = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          onUpdateSettings({
            ...reminderSettings,
            webPushGranted: true
          });
          setHasRequestedPermission(true);
          // Show immediate test notification
          new Notification(isMorning ? '🌅 晨间护肤时间到啦' : '🌙 晚间睡前修护提醒', {
            body: isMorning 
              ? '今日偏干泛红，核心建议：温和洁面+水光锁水，务必防晒抵御紫外线。'
              : '辛苦一天啦，核心建议：深层净澈温和卸妆，夜间二裂酵母密集修护。',
            icon: '/favicon.ico'
          });
        }
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...reminderSettings,
      morningTime: tempMorningTime,
      eveningTime: tempEveningTime,
      enabled: tempEnabled
    });
    setShowSettings(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Top Header Banner matching WeChat Push Notification */}
        <div className={`p-4 text-white relative ${
          isMorning 
            ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-[#CF3F57]' 
            : 'bg-gradient-to-r from-indigo-900 via-purple-900 to-[#962F43]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                {isMorning ? <Sun className="w-4 h-4 text-amber-200" /> : <Moon className="w-4 h-4 text-indigo-200" />}
              </div>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-white/80 block">
                  AI 护肤推送通知 · {isMorning ? reminderSettings.morningTime : reminderSettings.eveningTime}
                </span>
                <h3 className="text-sm font-bold tracking-tight">
                  {isMorning ? '今日晨间护肤提醒' : '今日晚间修护提醒'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 text-white/80 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] bg-black/20 px-3 py-1.5 rounded-xl backdrop-blur-sm">
            <Bell className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="line-clamp-1">
              已根据您设置的时间自动弹出今日护肤指引
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* 1. Core Skincare Advice Box */}
          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#962F43] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>今日核心护肤建议</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#962F43] font-semibold border border-rose-200">
                环境偏干 · UV 4
              </span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              {isMorning 
                ? reminderSettings.coreAdviceMorning || '受天气及环境影响，角质层水分流失较快。晨间主张「温和无泡洁面 + 30秒充分润透」，最后务必全脸成膜防晒，防止泛红与光老化。'
                : reminderSettings.coreAdviceEvening || '夜间是屏障黄金自我修护期。先用舒妍卸妆水彻底溶解防晒与浮尘，再厚拍二裂酵母精华进行深层维稳修护，夜间暂停高刺激刷酸。'}
            </p>

            {/* Recommended Products in Vanity */}
            <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">今日主推化妆台单品：</span>
              <span className="font-semibold text-stone-800">
                {isMorning ? 'SK-II 神仙水 + ALLIE 防晒' : '贝德玛卸妆 + 雅诗兰黛小棕瓶'}
              </span>
            </div>
          </div>

          {/* 2. Step Flow Mini Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800 px-1">
              <span>流程预估：5 分钟（共 5 步）</span>
              <span className="text-[10px] text-emerald-700 font-medium">100% 现有化妆台</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center">
              {(isMorning 
                ? ['洁面', '爽肤水', '精华', '乳液', '防晒'] 
                : ['卸妆', '洁面', '爽肤水', '精华', '面霜']
              ).map((step, idx) => (
                <div key={step} className="bg-stone-50 rounded-xl p-2 border border-stone-200/60">
                  <span className="text-[9px] text-stone-400 block font-mono">0{idx + 1}</span>
                  <span className="text-xs font-semibold text-stone-800 block mt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Settings Drawer (Collapsible) */}
          {showSettings ? (
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">日常护肤推送时间设置</span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[10px] text-stone-400 hover:text-stone-700"
                >
                  收起
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-stone-600 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>晨间推送时间</span>
                  </label>
                  <input
                    type="time"
                    value={tempMorningTime}
                    onChange={(e) => setTempMorningTime(e.target.value)}
                    className="text-xs bg-white border border-stone-200 px-2 py-1 rounded-lg font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs text-stone-600 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>晚间推送时间</span>
                  </label>
                  <input
                    type="time"
                    value={tempEveningTime}
                    onChange={(e) => setTempEveningTime(e.target.value)}
                    className="text-xs bg-white border border-stone-200 px-2 py-1 rounded-lg font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                  <span className="text-xs text-stone-600">开启日常推送提醒</span>
                  <input
                    type="checkbox"
                    checked={tempEnabled}
                    onChange={(e) => setTempEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#962F43]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleRequestWebNotification}
                  className="flex-1 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-[11px] font-semibold text-stone-700"
                >
                  🔔 开启浏览器桌面推送
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-1.5 rounded-xl bg-stone-900 text-white text-[11px] font-semibold"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>提醒时间：早 {reminderSettings.morningTime} / 晚 {reminderSettings.eveningTime}</span>
              </span>
              <button
                onClick={() => setShowSettings(true)}
                className="text-[#962F43] font-semibold hover:underline flex items-center gap-0.5"
              >
                <Settings2 className="w-3 h-3" />
                <span>修改时间</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-1 bg-white border-t border-stone-100 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors"
          >
            稍后提醒
          </button>
          <button
            onClick={() => {
              onStartRoutine(type);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#E25C70] to-[#CF3F57] hover:from-[#d64e62] hover:to-[#bd334b] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <span>立即执行此护肤</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
