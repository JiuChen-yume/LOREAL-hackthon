import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Sun, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronRight, 
  Calendar, 
  Palette, 
  ShieldAlert, 
  ShoppingBag,
  Sprout,
  Heart,
  BellRing,
  X,
  AlertTriangle,
  Recycle,
  ShieldCheck,
  Droplets,
  CloudSun,
  Camera,
  Upload,
  Wand2,
  RefreshCw,
  User
} from 'lucide-react';
import { 
  homePortraitImg, 
  skincareCalm, 
  vanityHero, 
  makeupLookImg, 
  circularBottleEcoImg 
} from '../../data/mockData';
import { RoutineReminderSettings, BeautyProduct } from '../../types/beauty';
import { UserProfile } from '../../types/auth';

interface HomeScreenProps {
  onNavigate: (tab: 'home' | 'vanity' | 'routine' | 'makeup' | 'memory' | 'mall' | 'circular') => void;
  onOpenAddModal: (mode?: 'camera' | 'barcode' | 'manual' | 'batch') => void;
  onOpenRoutineReminder?: (type: 'morning' | 'evening') => void;
  reminderSettings?: RoutineReminderSettings;
  products?: BeautyProduct[];
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onOpenAddModal,
  onOpenRoutineReminder,
  reminderSettings,
  products = [],
  currentUser,
  onOpenLogin
}) => {
  const expiringCount = products.filter(p => p.status === 'expiring_soon').length || 2;
  const totalProductCount = products.length || 12;

  // Interactive Task List
  const [tasks, setTasks] = useState([
    { id: '1', title: '今日护理', desc: '晨间已完成 · 晚间待开始', completed: true, img: skincareCalm },
    { id: '2', title: '今日妆容', desc: '待定制专属试妆', completed: false, img: makeupLookImg },
    { id: '3', title: '临期提醒', desc: `有 ${expiringCount} 件即将过期`, completed: false, isAlert: true, img: vanityHero },
    { id: '4', title: '我的化妆台', desc: `共有 ${totalProductCount} 件自用单品`, completed: false, img: vanityHero },
  ]);

  // Skin Condition Mode Switcher
  const [skinCondition, setSkinCondition] = useState<'dry_red' | 'oily_t' | 'sensitive' | 'balanced'>('dry_red');

  // Modals & Drawers
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showWeatherDetailModal, setShowWeatherDetailModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Cartoon Virtual Avatar State
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('vanity_custom_avatar') || '';
  });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUserPhoto, setAvatarUserPhoto] = useState<string | null>(null);
  const [avatarStyle, setAvatarStyle] = useState<string>('disney_3d');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generatedAvatarPreview, setGeneratedAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAvatarPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUserPhoto(event.target.result as string);
          showToast('自拍照片已载入，请选择风格并生成卡通形象');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCartoonAvatar = async (mockImage?: string) => {
    const photoToUse = mockImage || avatarUserPhoto || homePortraitImg;
    setIsGeneratingAvatar(true);
    try {
      const response = await fetch('/api/avatar/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoToUse,
          style: avatarStyle
        })
      });
      const data: any = await response.json();
      if (data.success && data.imageUrl) {
        setGeneratedAvatarPreview(data.imageUrl);
        showToast('卡通虚拟形象生成成功！点击应用即可生效');
      } else {
        showToast('生成失败，请重试');
      }
    } catch (err) {
      console.error(err);
      showToast('网络请求异常，请检查连接');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleApplyCustomAvatar = () => {
    if (generatedAvatarPreview) {
      setCustomAvatarUrl(generatedAvatarPreview);
      localStorage.setItem('vanity_custom_avatar', generatedAvatarPreview);
      setShowAvatarModal(false);
      showToast('已成功应用我的专属卡通形象！');
    }
  };

  const handleResetToDefaultAvatar = () => {
    setCustomAvatarUrl('');
    localStorage.removeItem('vanity_custom_avatar');
    setGeneratedAvatarPreview(null);
    setAvatarUserPhoto(null);
    setShowAvatarModal(false);
    showToast('已还原为默认温润真人美妆形象');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleTaskCompletion = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        showToast(nextState ? `已完成「${t.title}」打卡！` : `已取消「${t.title}」完成状态`);
        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  const skinConditionConfig = {
    dry_red: {
      title: '偏干 / 泛红风险较高',
      desc: '受冷空气与室内暖气影响，角质层水分流失较快，两颊屏障微弱。建议温和洁面，配合二裂酵母或神经酰胺精华深层补水，最后使用温和物理防晒。',
      recommend: '温和保湿 + 低负担底妆',
      tags: '补水修护 ｜ 舒缓泛红 ｜ 清透服帖'
    },
    oily_t: {
      title: 'T区易出油 / U区偏干',
      desc: '皮脂腺分泌略显活跃，T区局部有氧化暗沉倾向。建议晨间水杨酸棉片轻擦额头鼻翼，两颊保持滋润水乳，分区护理防止脱妆搓泥。',
      recommend: '控油分区 + 柔雾定妆',
      tags: '水油平衡 ｜ 毛孔隐形 ｜ 持久控油'
    },
    sensitive: {
      title: '换季敏弱 / 屏障修复期',
      desc: '表皮微受损，停用一切高浓度果酸与强皂基洁面。使用舒缓喷雾拍敷，搭配纯净温和面霜锁水，严格拦截黑榜避雷成分。',
      recommend: '极简退红 + 纯物理防护',
      tags: '0香精酒精 ｜ 屏障加固 ｜ 舒缓镇静'
    },
    balanced: {
      title: '健康通透 / 水油平衡',
      desc: '面部水分充足饱满，肌肤耐受力良好。可进行多肽抗老维稳护理，打造光泽水光原生肌。',
      recommend: '水光光泽 + 灵动彩妆',
      tags: '水光透亮 ｜ 丰盈饱满 ｜ 氧气感'
    }
  };

  const currentSkin = skinConditionConfig[skinCondition];

  return (
    <div className="p-3.5 sm:p-5 space-y-4 text-stone-900 select-none bg-[#FAF6F3]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-stone-900">
              AI 美妆陪伴
            </h1>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">更懂你的美丽生活 · 专属智能中枢</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => onNavigate('vanity')}
            className="p-2 rounded-full bg-white border border-[#EDE5DE] text-stone-700 hover:text-stone-900 shadow-2xs hover:bg-stone-50 transition-colors"
            title="搜索化妆台"
          >
            <Search className="w-4 h-4 stroke-[2]" />
          </button>
          <button 
            type="button"
            onClick={() => setShowNotificationDrawer(true)}
            className="relative p-2 rounded-full bg-white border border-[#EDE5DE] text-stone-700 hover:text-stone-900 shadow-2xs hover:bg-stone-50 transition-colors"
            title="通知中心"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D9534F] rounded-full ring-2 ring-[#FAF6F3]" />
          </button>
        </div>
      </div>

      {/* 2. Hero Greeting & Model Portrait */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#FFF5F1] via-[#FDECE7] to-[#FCE6E2] p-4 sm:p-5 border border-[#F5DCD5] shadow-xs overflow-hidden">
        <div className="relative z-10 max-w-[210px] space-y-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 tracking-tight">
              早上好，{currentUser?.nickname || '晚晚'}
            </h2>
            <span className="text-amber-500 text-xl">🔆</span>
          </div>
          <p className="text-xs text-stone-600 font-medium leading-relaxed">
            今天想让自己轻松一点，<br />还是精致一点？
          </p>
          {currentUser?.isGuest && (
            <button type="button" onClick={onOpenLogin} className="rounded-full border border-[#E5C9BE] bg-white/75 px-3 py-1 text-[10px] text-[#962F43] hover:bg-white">
              登录后开启云端备份与专属定制
            </button>
          )}

          {/* Weather & UV Info - Clickable for details */}
          <div 
            onClick={() => setShowWeatherDetailModal(true)}
            className="flex items-center gap-2 pt-1 text-[11px] text-stone-700 cursor-pointer group"
          >
            <div className="flex items-center gap-1 bg-white/80 hover:bg-white px-2.5 py-1 rounded-full border border-stone-200/60 shadow-2xs transition-colors">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold">26℃ 晴</span>
              <span className="text-stone-400">|</span>
              <span>上海</span>
            </div>
            <div className="bg-white/80 hover:bg-white px-2 py-1 rounded-full border border-stone-200/60 shadow-2xs flex items-center gap-1 transition-colors">
              <span>紫外线</span>
              <span className="w-3.5 h-3.5 rounded-full bg-[#E05252] text-white text-[9px] flex items-center justify-center font-bold">8</span>
              <span className="text-[#E05252] font-semibold">高</span>
            </div>
          </div>
        </div>

        {/* Right Portrait with interactive cartoon avatar customizer */}
        <div 
          onClick={() => setShowAvatarModal(true)}
          className="absolute right-0 top-0 bottom-0 w-44 sm:w-52 cursor-pointer group transition-all"
          title="点击定制我的专属 AI 卡通虚拟形象"
        >
          <img 
            src={customAvatarUrl || homePortraitImg} 
            alt="AI 美妆陪伴形象" 
            className="w-full h-full object-cover object-top mask-linear-gradient group-hover:scale-103 transition-transform duration-500"
          />

          {/* Floating trigger button / tag */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1">
            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#F5DCD5] text-[10px] font-bold text-[#962F43] shadow-xs flex items-center gap-1 group-hover:bg-[#962F43] group-hover:text-white transition-all">
              <Wand2 className="w-3 h-3 text-amber-500 group-hover:text-amber-300" />
              <span>{customAvatarUrl ? '切换卡通形象' : '定制卡通分身'}</span>
            </span>
            {customAvatarUrl && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-semibold shadow-xs">
                AI 专属虚拟形象
              </span>
            )}
          </div>

          <div className="absolute top-4 right-3 text-right max-w-[120px] pointer-events-none">
            <p className="text-[10px] font-serif text-rose-800/80 italic leading-tight drop-shadow-xs">
              {customAvatarUrl ? '我的专属陪伴虚拟分身 ♡' : '美丽，是一种持续的自我陪伴 ♡'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Skin Status Card with Interactive Condition Selector */}
      <div className="rounded-3xl bg-white p-4 sm:p-5 border border-[#F0EBE6] shadow-xs space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between pb-1 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-sm">
              👩🏻
            </div>
            <span className="text-xs font-bold text-stone-900">今日皮肤状态诊断</span>
          </div>

          {/* Quick Condition Selector Dropdown/Pills */}
          <div className="flex items-center gap-1">
            {[
              { id: 'dry_red', label: '偏干泛红' },
              { id: 'oily_t', label: 'T区出油' },
              { id: 'sensitive', label: '换季脆弱' },
              { id: 'balanced', label: '健康水润' }
            ].map(sc => (
              <button
                key={sc.id}
                onClick={() => {
                  setSkinCondition(sc.id as any);
                  showToast(`已切换皮肤状态为「${sc.label}」`);
                }}
                className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-all ${
                  skinCondition === sc.id 
                    ? 'bg-[#962F43] text-white shadow-2xs' 
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div 
          onClick={() => onNavigate('routine')}
          className="cursor-pointer group flex items-start gap-3"
        >
          <div className="flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              {currentSkin.title}
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {currentSkin.desc}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
        </div>

        {/* Recommendation & Plan Action */}
        <div className="pt-2 border-t border-[#F5F0EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              <span>为你推荐 <span className="text-[#962F43]">{currentSkin.recommend}</span></span>
            </div>
            <p className="text-[11px] text-stone-400">
              {currentSkin.tags}
            </p>
          </div>

          <button
            onClick={() => onNavigate('routine')}
            className="w-full sm:w-auto px-4 py-2 rounded-full bg-gradient-to-r from-[#E25C70] to-[#CF3F57] hover:from-[#d64e62] hover:to-[#bd334b] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>生成今日计划 &gt;</span>
          </button>
        </div>
      </div>

      {/* 4. 今日任务 Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-stone-900 font-serif">今日任务</h3>
            <span className="text-[10px] text-stone-400">点击打勾完成</span>
          </div>
          <button 
            onClick={() => onNavigate('routine')}
            className="text-xs text-stone-400 hover:text-stone-600 flex items-center gap-0.5"
          >
            <span>全部护理</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Horizontal Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {tasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => {
                if (task.id === '1') {
                  if (onOpenRoutineReminder) onOpenRoutineReminder('morning');
                  else onNavigate('routine');
                } else if (task.id === '2') {
                  onNavigate('makeup');
                } else {
                  onNavigate('vanity');
                }
              }}
              className="bg-white rounded-2xl p-2.5 border border-[#F0EBE6] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#E8DFD8] transition-all group"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => toggleTaskCompletion(task.id, e)}
                  className="p-1 hover:scale-110 transition-transform"
                  title="标记完成"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className={`w-4 h-4 ${task.isAlert ? 'text-[#E05252]' : 'text-stone-300'}`} />
                  )}
                </button>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                  <img src={task.img} alt={task.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-bold text-stone-800">{task.title}</h4>
                <p className={`text-[10px] mt-0.5 ${task.isAlert ? 'text-[#E05252] font-semibold' : 'text-stone-400'}`}>
                  {task.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skincare Push Reminder Banner */}
      <div 
        onClick={() => {
          if (onOpenRoutineReminder) onOpenRoutineReminder('morning');
          else onNavigate('routine');
        }}
        className="rounded-3xl bg-gradient-to-r from-amber-50/90 via-rose-50/90 to-[#FFF0EC] p-3.5 border border-rose-200/80 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-rose-300 transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#E25C70] to-[#CF3F57] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-stone-900">日常护肤推送提醒进行中</span>
              <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full font-bold">
                早 {reminderSettings?.morningTime || '08:00'} ｜ 晚 {reminderSettings?.eveningTime || '21:30'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">
              今日偏干泛红防晒重点已推送 · 点击自动弹出今日核心建议与 5 分钟流程
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 text-xs font-bold text-[#962F43] shrink-0">
          <span>弹出建议</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 5. 4 Core Action Rounded Tiles */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <button
          onClick={() => onNavigate('routine')}
          className="bg-white rounded-2xl p-3 border border-[#F0EBE6] shadow-xs flex flex-col items-center text-center hover:bg-stone-50/80 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-1.5 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-stone-900">护理计划</span>
          <span className="text-[9px] text-stone-400 mt-0.5">定制专属方案 &gt;</span>
        </button>

        <button
          onClick={() => onNavigate('makeup')}
          className="bg-white rounded-2xl p-3 border border-[#F0EBE6] shadow-xs flex flex-col items-center text-center hover:bg-stone-50/80 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 mb-1.5 group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-stone-900">妆造工作室</span>
          <span className="text-[9px] text-stone-400 mt-0.5">AI 试妆工作台 &gt;</span>
        </button>

        <button
          onClick={() => onNavigate('memory')}
          className="bg-white rounded-2xl p-3 border border-[#F0EBE6] shadow-xs flex flex-col items-center text-center hover:bg-stone-50/80 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 mb-1.5 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-stone-900">肌肤记忆</span>
          <span className="text-[9px] text-stone-400 mt-0.5">记录看见改变 &gt;</span>
        </button>

        <button
          onClick={() => onNavigate('mall')}
          className="bg-white rounded-2xl p-3 border border-[#F0EBE6] shadow-xs flex flex-col items-center text-center hover:bg-stone-50/80 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#962F43] mb-1.5 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-xs font-bold text-stone-900">商城</span>
          <span className="text-[9px] text-stone-400 mt-0.5">大牌平替 &gt;</span>
        </button>
      </div>

      {/* 6. 美丽循环 Bottom Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FDF0EC] via-[#FCEAE6] to-[#FDE8E4] p-3.5 border border-[#FAIDD7] shadow-xs flex items-center justify-between gap-3 overflow-hidden relative">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white/90 border border-rose-200/60 flex items-center justify-center text-[#962F43] shrink-0 shadow-2xs">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">美丽循环 · 空瓶换礼</h4>
            <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
              顺丰免费上门取件 · 积累积分兑换环保替换芯与公益树苗
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button
            onClick={() => onNavigate('circular')}
            className="px-3 py-1.5 rounded-full bg-[#962F43] hover:bg-[#832637] text-white text-[11px] font-semibold shadow-xs flex items-center gap-1 transition-all"
          >
            <span>去打卡</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/80 border border-stone-200/50">
            <img src={circularBottleEcoImg} alt="美丽循环" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* 7. Notification Center Drawer Modal */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#962F43]" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  消息与智能预警中心
                </h3>
              </div>
              <button onClick={() => setShowNotificationDrawer(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {/* Notification 1 */}
              <div 
                onClick={() => {
                  setShowNotificationDrawer(false);
                  if (onOpenRoutineReminder) onOpenRoutineReminder('morning');
                }}
                className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1 cursor-pointer hover:bg-rose-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>今日晨间护肤推送建议</span>
                  </span>
                  <span className="text-[9px] text-stone-400">08:00</span>
                </div>
                <p className="text-[10px] text-stone-600 leading-tight">
                  今日空气偏干、紫外线等级高，重点做好无泡洁面温和清洁与防晒成膜。
                </p>
              </div>

              {/* Notification 2 */}
              <div 
                onClick={() => {
                  setShowNotificationDrawer(false);
                  onNavigate('vanity');
                }}
                className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>临期单品优先使用预警</span>
                  </span>
                  <span className="text-[9px] text-amber-700 font-bold">待处理</span>
                </div>
                <p className="text-[10px] text-stone-600 leading-tight">
                  化妆台有 {expiringCount} 件单品开盖已近 12 个月（PAO到期），建议优先用完或参与空瓶换礼。
                </p>
              </div>

              {/* Notification 3 */}
              <div 
                onClick={() => {
                  setShowNotificationDrawer(false);
                  onNavigate('circular');
                }}
                className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1 cursor-pointer hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Recycle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>空瓶环保积分已到账</span>
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold">+100 分</span>
                </div>
                <p className="text-[10px] text-stone-600 leading-tight">
                  顺丰已完成绿色空瓶取件核验，您当前拥有 260 绿色环保积分。
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationDrawer(false)}
              className="w-full py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 8. Weather & UV Skincare Advisory Modal */}
      {showWeatherDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  今日气象与环境护肤指南
                </h3>
              </div>
              <button onClick={() => setShowWeatherDetailModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>紫外线指数: 8 (极高预警)</span>
                  <span className="text-xs">☀️</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  户外活动超过 20 分钟易诱发真皮层胶原降解与两颊泛红。务必涂抹足量一元硬币大防晒，成膜前避免粉扑用力推擦。
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-sky-900">
                  <span>气温: 26℃ · 湿度: 42% (偏干)</span>
                  <span className="text-xs">💧</span>
                </div>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  相对湿度偏低，角质层经皮失水率加速。底妆前可选用滋润型妆前霜打底，随身可备水润舒缓喷雾。
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWeatherDetailModal(false)}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white text-xs font-bold shadow-xs"
            >
              已掌握防护重点
            </button>
          </div>
        </div>
      )}
      {/* 5. Custom Cartoon Avatar Generation Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-[#962F43]">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-stone-900">
                    定制我的专属卡通虚拟形象
                  </h3>
                  <p className="text-[10px] text-stone-500">
                    上传照片后通过生图 AI 提取五官神态，生成专属二次元/Q版形象
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAvatarModal(false)} 
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden Input for user photo */}
            <input 
              type="file" 
              ref={avatarInputRef} 
              accept="image/*" 
              onChange={handleAvatarPhotoUpload} 
              className="hidden" 
            />

            {/* Photo Upload Zone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 block">
                1. 上传我的正面照片 / 自拍底卡
              </label>

              <div className="p-3.5 border-2 border-dashed border-[#F5DCD5] rounded-2xl bg-[#FFF9F7] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-xs shrink-0 bg-rose-100 flex items-center justify-center">
                    {avatarUserPhoto ? (
                      <img src={avatarUserPhoto} alt="自拍底卡" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-rose-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-900">
                      {avatarUserPhoto ? '自拍照片已载入' : '请选择自拍照片'}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      建议正面免冠、五官清晰、光线均匀
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-full bg-[#962F43] hover:bg-[#832637] text-white text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-all"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{avatarUserPhoto ? '更换照片' : '上传照片'}</span>
                  </button>
                  {!avatarUserPhoto && (
                    <button
                      type="button"
                      onClick={() => setAvatarUserPhoto(homePortraitImg)}
                      className="px-2 py-1 rounded-full text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                    >
                      使用示例底卡
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cartoon Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 block">
                2. 选择卡通生图艺术风格
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'disney_3d', name: 'AI 迪士尼 Q版', desc: '灵动大眼 · 暖杏高级AI' },
                  { id: 'anime_watercolor', name: '日系动漫水彩', desc: '新海诚唯美微光 · 清透感' },
                  { id: 'clay_cute', name: '治愈手作粘土', desc: '软萌粘土捏脸 · 粉扑腮红' },
                  { id: 'cyber_mecha', name: '赛博潮酷分身', desc: '极光霓虹妆 · 未来科技感' }
                ].map(st => {
                  const isSelected = avatarStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAvatarStyle(st.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all ${
                        isSelected 
                          ? 'border-[#962F43] bg-rose-50/70 shadow-2xs ring-1 ring-[#962F43]/30' 
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-[#962F43]' : 'text-stone-900'}`}>
                          {st.name}
                        </span>
                        {isSelected && <Sparkles className="w-3 h-3 text-[#962F43]" />}
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                        {st.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Trigger Button */}
            <button
              type="button"
              disabled={isGeneratingAvatar}
              onClick={() => handleGenerateCartoonAvatar()}
              className="w-full py-2.5 bg-gradient-to-r from-[#962F43] via-[#B2382D] to-[#CF3F57] hover:opacity-95 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isGeneratingAvatar ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>生图 AI 正在构图并渲染卡通形象...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>链接生图 AI · 生成专属卡通虚拟形象</span>
                </>
              )}
            </button>

            {/* Generated Preview Card */}
            {generatedAvatarPreview && (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white shrink-0">
                    <img 
                      src={generatedAvatarPreview} 
                      alt="AI 生成的卡通分身" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900">生成效果预览</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        AI生图就绪
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      已提取五官比例与特色腮红，点击下方即可应用为主页陪伴形象。
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyCustomAvatar}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>应用为主页形象</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateCartoonAvatar()}
                    className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors"
                  >
                    换一张
                  </button>
                </div>
              </div>
            )}

            {/* Default Avatar Reset option if custom is currently applied */}
            {customAvatarUrl && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>当前已启用个性卡通形象</span>
                <button
                  type="button"
                  onClick={handleResetToDefaultAvatar}
                  className="text-stone-400 hover:text-stone-800 hover:underline text-[11px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>还原默认形象</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
