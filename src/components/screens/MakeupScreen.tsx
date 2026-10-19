import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  UserCheck, 
  Bookmark, 
  Upload, 
  Clock, 
  Check, 
  Camera, 
  ChevronRight, 
  Layers, 
  ShieldAlert, 
  Heart, 
  Star, 
  ShieldCheck, 
  Smile, 
  SlidersHorizontal,
  Wand2,
  Eye,
  ArrowRight,
  Lock,
  RotateCcw
} from 'lucide-react';
import { BeautyProduct, MakeupLook } from '../../types/beauty';
import { 
  makeupLookImg, 
  makeupGlamourImg, 
  homePortraitImg, 
  vanityHero 
} from '../../data/mockData';
import { Image4BeautyEditor } from '../makeup/Image4BeautyEditor';

interface MakeupScreenProps {
  products: BeautyProduct[];
  looks: MakeupLook[];
  onGenerateLook?: (params: { lookType: 'daily' | 'imitation' | 'cos'; referenceText?: string }) => void;
  onRateLook?: (lookTitle: string, rating: 'red' | 'yellow' | 'black', reason: string) => void;
  isGenerating?: boolean;
  authenticated?: boolean;
}

export const MakeupScreen: React.FC<MakeupScreenProps> = ({
  products,
  looks,
  onGenerateLook,
  onRateLook,
  isGenerating = false
}) => {
  // Navigation inside Makeup: 'create' | 'precheck' | 'profile' | 'archive'
  const [activeTab, setActiveTab] = useState<'create' | 'precheck' | 'profile' | 'archive'>('create');
  const [selectedLookType, setSelectedLookType] = useState<'daily' | 'imitation' | 'cos'>('daily');

  // User Photo State: Uploaded user photo (default to homePortraitImg so users have an immediate preview, but allow uploading or setting null)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(homePortraitImg);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Full-screen Image 4 Virtual Makeup Editor Modal
  const [showImage4Editor, setShowImage4Editor] = useState<boolean>(false);
  const [editorInitialSet, setEditorInitialSet] = useState<string>('韩蕾妆');

  // Pre-makeup skin risk state
  const [precheckCondition, setPrecheckCondition] = useState<'dry' | 'oily' | 'redness' | 'normal'>('dry');

  // Aesthetic profile state
  const [aestheticProfile, setAestheticProfile] = useState({
    faceFeatures: '中庭比例适中，原生眉骨立体，眼裂弧度柔和，唇峰轮廓清晰',
    skinTendency: '混合偏干 · 秋冬易起皮脱屑 · 局部轻微泛红',
    stylePreference: '清透氧气自然原生感 / 温暖低饱和红茶色系',
    makeupTaboos: '不适合过粗全包黑眼线、避免全脸高荧光粉色、避免厚重哑光死白面具感',
    scenePreference: '日常通勤 / 周末摄影 / 漫展角色扮演'
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Selected look to preview
  const [viewingLook, setViewingLook] = useState<MakeupLook>(looks[0] || {
    id: 'default-look',
    title: '法式复古松弛感猫系红唇',
    type: 'daily',
    occasion: '周末约会 / 氛围摄影',
    description: '以清透雾面底妆打底，低饱和大地红茶眼影勾勒眼窝，复古丝绒红唇提亮全脸气色。',
    matched_products: [
      { slot: '底妆', product_name: '芭比波朗橘子面霜', note: '妆前打底' },
      { slot: '唇妆', product_name: '植村秀小黑方 BR784', note: '赤狐红棕' },
      { slot: '眼影', product_name: '3CE九宫格眼影 OVERTAKE', note: '低饱和大地色' }
    ],
    steps: ['润泽妆前打底', '低饱和大地眼窝', '复古丝绒红唇'],
    minimal_5min_tip: '赶时间出门时：仅用橘子面霜局部打底，取植村秀唇膏一指按压唇部，余色轻点两颊当腮红，即刻通透提气色。',
    created_at: new Date().toISOString()
  });

  const [ratingNotice, setRatingNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRateCurrentLook = (rating: 'red' | 'yellow' | 'black') => {
    const reason = rating === 'red' 
      ? '这套彩妆搭配巨适配，自制唇颊腮红很通透！'
      : rating === 'yellow'
      ? '妆效尚可，但秋冬需多做打底滋润。'
      : '此色系或质地与面部产生不适，列入避雷参考。';
    if (onRateLook) {
      onRateLook(viewingLook.title, rating, reason);
    }
    setRatingNotice(rating === 'red' ? '已收录进红榜珍藏配方！' : rating === 'black' ? '已记入黑榜色系避雷库！' : '已记录反馈！');
    setTimeout(() => setRatingNotice(null), 3000);
  };

  // Handle user photo file upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserPhotoUrl(event.target.result as string);
          showToast('面部自拍已上传成功！已解锁下方详细试妆展示');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle clicking the big showcase card
  const handleOpenDetailedShowcase = (setName?: string) => {
    if (!userPhotoUrl) {
      showToast('请先在上方完成「上传我的照片」，解锁试妆镜详细展示');
      fileInputRef.current?.click();
      return;
    }
    if (setName) setEditorInitialSet(setName);
    setShowImage4Editor(true);
  };

  return (
    <div className="p-3.5 sm:p-5 space-y-4 text-stone-900 select-none bg-[#FAF6F3]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 1. TOP HEADER & SUBTABS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F0EBE6] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 font-medium">
              <span>反容貌焦虑妆造</span>
              <span aria-hidden="true">·</span>
              <span>发掘原生优势与化妆台彩妆潜力</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-0.5 tracking-tight">
              AI 妆造工作室
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              从日常提气色、图片仿妆到角色 COS，优先匹配现有彩妆并提供平替方案，拒绝闲置浪费。
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'create'
                  ? 'bg-[#962F43] border-[#962F43] text-white shadow-2xs'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>妆造创作</span>
            </button>
            <button
              onClick={() => setActiveTab('precheck')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'precheck'
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>妆前预判预警</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'profile'
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>五官底档</span>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                activeTab === 'archive'
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>妆容存档 ({looks.length})</span>
            </button>
          </div>
        </div>

        {/* 板块 1: 上传我的照片 (替换旧版图1的模式滑块) */}
        {activeTab === 'create' && (
          <div className="bg-gradient-to-r from-[#FFF5F1] via-[#FDF0EC] to-[#FCEAE6] rounded-2xl p-3 sm:p-3.5 border border-[#F5DCD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Photo Avatar Preview */}
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xs shrink-0 bg-rose-100">
                {userPhotoUrl ? (
                  <img src={userPhotoUrl} alt="User Face" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <Camera className="w-5 h-5 text-rose-400" />
                  </div>
                )}
                {userPhotoUrl && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-stone-900">
                    {userPhotoUrl ? '已载入我的面部照片' : '请先上传我的照片'}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    userPhotoUrl 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {userPhotoUrl ? '✓ 已就绪' : '待上传'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {userPhotoUrl 
                    ? '面部数据已同步 · 随时点击下方妆容展示进入 AI 虚拟试妆镜' 
                    : '上传正面清晰自拍，精准贴合五官骨相与化妆台真实色号'}
                </p>
              </div>
            </div>

            {/* Upload Buttons & Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-full bg-[#962F43] hover:bg-[#832637] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{userPhotoUrl ? '更换我的照片' : '上传我的照片'}</span>
              </button>

              {/* Quick Presets for instant trial without upload */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setUserPhotoUrl(homePortraitImg);
                    showToast('已选用「自然素颜」示例底卡');
                  }}
                  className="px-2 py-1 rounded-full text-[10px] bg-white/80 hover:bg-white text-stone-700 border border-stone-200 transition-colors"
                >
                  自然示例
                </button>
                <button
                  onClick={() => {
                    setUserPhotoUrl(makeupGlamourImg);
                    showToast('已选用「冷白清透」示例底卡');
                  }}
                  className="px-2 py-1 rounded-full text-[10px] bg-white/80 hover:bg-white text-stone-700 border border-stone-200 transition-colors"
                >
                  冷白示例
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 板块 2: 三大核心类型 (缩短到正常板块！紧凑排版) */}
        {activeTab === 'create' && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800 px-0.5">
              <span>妆造分类</span>
              <span className="text-[10px] text-stone-400">点击切换下方妆容推荐</span>
            </div>

            {/* Normal Compact Cards (缩短后的正常板块) */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Card 1: 今日专属日常妆 */}
              <button
                onClick={() => {
                  setSelectedLookType('daily');
                  showToast('已切换至「今日专属日常妆」推荐');
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative ${
                  selectedLookType === 'daily'
                    ? 'border-[#962F43] bg-gradient-to-br from-rose-50/70 to-white shadow-2xs ring-1 ring-[#962F43]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>今日日常妆</span>
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-100 text-amber-900 font-semibold">
                    今日推荐
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  适配今日气色，台面2-3件好物，5分钟极简通勤。
                </p>
              </button>

              {/* Card 2: 图片仿妆私人改造 */}
              <button
                onClick={() => {
                  setSelectedLookType('imitation');
                  showToast('已切换至「图片仿妆私人改造」');
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative ${
                  selectedLookType === 'imitation'
                    ? 'border-[#962F43] bg-gradient-to-br from-rose-50/70 to-white shadow-2xs ring-1 ring-[#962F43]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                    <span>图片仿妆</span>
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded-full bg-rose-100 text-rose-800 font-semibold">
                    社媒拆解
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  秀场/爱豆妆教，AI拆解眼唇并在化妆台找替代。
                </p>
              </button>

              {/* Card 3: COS 角色妆造定制 */}
              <button
                onClick={() => {
                  setSelectedLookType('cos');
                  showToast('已切换至「COS 角色妆造定制」');
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative ${
                  selectedLookType === 'cos'
                    ? 'border-[#962F43] bg-gradient-to-br from-rose-50/70 to-white shadow-2xs ring-1 ring-[#962F43]/30'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" />
                    <span>COS 妆造</span>
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                    二次元
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">
                  动漫角色转换，舞台持妆与眼裂下至技巧。
                </p>
              </button>
            </div>

            {/* Quick Templates Pill Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
              <span className="text-[10px] text-stone-400 whitespace-nowrap">经典套装：</span>
              {[
                { name: '韩蕾妆', lip: '#C45868' },
                { name: '清透水光', lip: '#E0735E' },
                { name: '轻欧美混血', lip: '#9E4B3E' },
                { name: '漫展COS', lip: '#8B1E3F' },
                { name: '新中式千金', lip: '#B3262E' }
              ].map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleOpenDetailedShowcase(tpl.name)}
                  className="px-2.5 py-1 rounded-full text-[10px] bg-white border border-[#EDE5DE] hover:border-[#CF3F57] text-stone-700 flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tpl.lip }} />
                  <span className="font-semibold">{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 板块 3: 妆容展示板块 (足够大！点进去可查看详细，且需上传完照片才能进入) */}
      {activeTab === 'create' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold font-serif text-stone-900">
                上传照片后的妆容展示
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-[#962F43] font-semibold border border-rose-200">
                点击大图查看详细试妆
              </span>
            </div>
            <span className="text-[11px] text-stone-400">图4沉浸式全屏试妆工坊</span>
          </div>

          {/* LARGE SHOWCASE CARD */}
          <div 
            onClick={() => handleOpenDetailedShowcase()}
            className={`relative rounded-3xl overflow-hidden border border-[#EDE5DE] shadow-md transition-all cursor-pointer group ${
              userPhotoUrl ? 'hover:shadow-xl hover:border-[#962F43]/40' : 'opacity-90'
            }`}
          >
            {/* If NOT uploaded: Lock overlay */}
            {!userPhotoUrl ? (
              <div className="min-h-[360px] bg-gradient-to-b from-stone-100 to-stone-200 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-stone-400">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-800">
                    需上传完照片后才能进入查看详细
                  </h3>
                  <p className="text-xs text-stone-500 max-w-xs">
                    请先点击上方「上传我的照片」建立 AI 面部网格，即可解锁全屏大图、化妆台色号联动试妆与妆教导入。
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#962F43] hover:bg-[#832637] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>立即上传我的照片</span>
                </button>
              </div>
            ) : (
              /* If photo is uploaded: LARGE HIGH-RES SHOWCASE VIEWPORT */
              <div className="relative min-h-[380px] sm:min-h-[440px] w-full bg-stone-950 flex items-center justify-center">
                {/* Large Face Image */}
                <img 
                  src={userPhotoUrl} 
                  alt="My Makeup Look" 
                  className="w-full h-full max-h-[480px] object-cover object-center group-hover:scale-102 transition-transform duration-500" 
                />

                {/* Simulated Soft Radiance & Makeup Layer over the preview */}
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-soft-light bg-gradient-to-t from-black/80 via-transparent to-black/30"
                />

                {/* Dynamic Lip Highlight on the large card */}
                <div 
                  className="absolute inset-x-[36%] bottom-[25%] h-[10%] rounded-[50%] pointer-events-none blur-[2px] opacity-80 mix-blend-multiply bg-[#B2382D]"
                />
                {/* Dynamic Cheek Blush on the large card */}
                <div 
                  className="absolute left-[18%] top-[45%] w-[25%] h-[18%] rounded-full pointer-events-none blur-[14px] opacity-55 mix-blend-color-burn bg-[#F5A4AC]"
                />
                <div 
                  className="absolute right-[18%] top-[45%] w-[25%] h-[18%] rounded-full pointer-events-none blur-[14px] opacity-55 mix-blend-color-burn bg-[#F5A4AC]"
                />

                {/* Top Overlay Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                    当前试妆：{viewingLook.title}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/90 text-black text-[10px] font-bold">
                    面部数据已就绪
                  </span>
                </div>

                {/* Bottom Overlay Information and Enter Button matching Image 4 trigger */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
                    <div>
                      <div className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>已联动化妆台 {viewingLook.matched_products.length} 款彩妆</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold font-serif mt-0.5">
                        {viewingLook.title}
                      </h3>
                      <p className="text-xs text-stone-300 line-clamp-1 mt-0.5">
                        {viewingLook.description}
                      </p>
                    </div>

                    {/* Big Callout Button to open Image 4 Editor */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailedShowcase();
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#22C55E] hover:bg-[#1ea34d] text-black text-xs font-bold shadow-lg flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
                    >
                      <span>点此进入详细试妆镜 (图4模式)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Horizontal mini features callout */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-stone-400">
                    <span>支持：套装 · 睫毛 · 眉毛 · 眼线 · 口红 · 腮红 · 修容 · 眼影 · 高光 · 美瞳</span>
                    <span className="text-[#22C55E] font-medium hidden sm:inline">可导入抖音/小红书妆教</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Precheck (妆前肤质预判 + 妆面风险预警) */}
      {activeTab === 'precheck' && (
        <div className="bg-white rounded-3xl p-5 border border-[#F0EBE6] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-serif font-bold text-stone-900">
                  妆前肤质预判与卡粉脱妆预警
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                先判断今天皮肤适不适合上妆、如何避免斑驳翻车，再给出教学。
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-800 block mb-2">
              点击测试您当前的面部触感：
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'dry', label: '两颊紧绷脱皮', risk: '极高卡粉斑驳风险' },
                { id: 'oily', label: 'T区明显冒油', risk: '脱妆移位与暗沉风险' },
                { id: 'redness', label: '局部泛红敏弱', risk: '摩擦加重屏障刺痛' },
                { id: 'normal', label: '水油平衡平整', risk: '状态极佳，可化水光妆' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPrecheckCondition(item.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-colors ${
                    precheckCondition === item.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className={`text-[10px] block mt-0.5 ${precheckCondition === item.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {item.risk}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Pre-check Advice */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>今日妆前防翻车专属定制提示：</span>
            </h4>
            {precheckCondition === 'dry' && (
              <p className="text-amber-900 leading-relaxed">
                🚨 <strong>偏干起皮预警：</strong>今天请绝对<strong>减少全脸烘焙散粉</strong>！
                建议上妆前用化妆台内的【芭比波朗橘子面霜】在鼻翼与法令纹处揉搓温热薄揉打底，粉底液中滴入半滴精华乳混匀，用湿润海绵蛋按压上妆，避免刷具拉扯干皮。
              </p>
            )}
            {precheckCondition === 'oily' && (
              <p className="text-amber-900 leading-relaxed">
                ⚠️ <strong>出油脱妆预警：</strong>今天需强化<strong>分区定妆</strong>！
                妆前护肤暂停厚重油质面霜，选用清爽二裂酵母打底；底妆完成后用粉扑紧密按压 T 区定妆，延长持妆 4 小时以上。
              </p>
            )}
            {precheckCondition === 'redness' && (
              <p className="text-amber-900 leading-relaxed">
                🌸 <strong>泛红敏感预警：</strong>今天主打<strong>低刺激极简轻妆</strong>！
                禁止使用粘合力过强的假睫毛胶水与撕拉式美瞳，粉底以半泵薄拍均匀肤色即可，泛红处用色修修护代替厚重遮瑕膏。
              </p>
            )}
            {precheckCondition === 'normal' && (
              <p className="text-amber-900 leading-relaxed">
                ✨ <strong>状态良好：</strong>角质层含水量充足，平整通透，无论是法式丝缎光泽妆还是 COS 动漫大眼妆均可尽情发挥！
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Profile (Aesthetic Profile) */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-5 border border-[#F0EBE6] shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-stone-900">
              五官比例与审美底档系统
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              本系统严格采用“适配优势”与“风格延展”，严禁评判或贬低任何原生五官特征。
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                五官比例与骨相特征 (AI 妆造以此为高光锚点)
              </label>
              <input
                type="text"
                value={aestheticProfile.faceFeatures}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, faceFeatures: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                肤质底色与卡粉脱妆倾向
              </label>
              <input
                type="text"
                value={aestheticProfile.skinTendency}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, skinTendency: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                个人妆容禁忌与避雷色系
              </label>
              <input
                type="text"
                value={aestheticProfile.makeupTaboos}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, makeupTaboos: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-800 block mb-1">
                偏好的风格氛围
              </label>
              <input
                type="text"
                value={aestheticProfile.stylePreference}
                onChange={(e) => setAestheticProfile({ ...aestheticProfile, stylePreference: e.target.value })}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            {profileSaved ? (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                审美底档已更新，已接入妆造生成引擎
              </span>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900"
              >
                返回妆造
              </button>
              <button
                onClick={() => {
                  setProfileSaved(true);
                  setTimeout(() => setProfileSaved(false), 3000);
                }}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-full transition-colors"
              >
                保存底档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Archive (Saved Looks) */}
      {activeTab === 'archive' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-900 font-serif">已存档的经典妆容</h2>
            <button
              onClick={() => setActiveTab('create')}
              className="text-xs text-[#962F43] hover:underline"
            >
              + 创作新妆造
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {looks.map((look) => (
              <div 
                key={look.id}
                className="bg-white rounded-2xl p-4 border border-[#F0EBE6] shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pb-2 border-b border-stone-100">
                    <span className="font-bold text-stone-800">
                      {look.type === 'daily' ? '日常妆' : look.type === 'imitation' ? '仿妆' : 'COS'}
                    </span>
                    <span>{look.occasion}</span>
                  </div>
                  <h3 className="text-xs font-bold text-stone-900 mt-2">
                    {look.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                    {look.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] text-stone-400">调用 {look.matched_products.length} 件产品</span>
                  <button
                    onClick={() => handleOpenDetailedShowcase(look.title)}
                    className="text-xs font-bold text-[#962F43] hover:underline flex items-center gap-0.5"
                  >
                    <span>一键复刻进入试妆镜 →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE 4 VIRTUAL MAKEUP EDITOR (图4 沉浸式试妆工坊) */}
      {showImage4Editor && userPhotoUrl && (
        <Image4BeautyEditor
          userPhotoUrl={userPhotoUrl}
          onClose={() => setShowImage4Editor(false)}
          products={products}
          onSaveLook={(title, rating) => {
            if (onRateLook) {
              onRateLook(title, rating, '在详细试妆镜中完成定制并确认满意的配方');
            }
          }}
          initialSet={editorInitialSet}
        />
      )}
    </div>
  );
};
