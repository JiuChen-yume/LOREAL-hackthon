import React, { useState } from 'react';
import { 
  Search, 
  Settings, 
  Sprout, 
  AlertTriangle, 
  Ban, 
  Bot, 
  ChevronRight, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Heart,
  Plus,
  Trash2,
  Calendar,
  Volume2,
  Download,
  Shield,
  X,
  Clock,
  UserCheck,
  Flame,
  SlidersHorizontal
} from 'lucide-react';
import { BeautyProduct, BlacklistIngredient, SkinFeedbackLog, IdolCompanionProfile } from '../../types/beauty';
import { UserProfile } from '../../types/auth';
import { skincareCalm, vanityHero, makeupLookImg } from '../../data/mockData';

interface ProfileScreenProps {
  products: BeautyProduct[];
  blacklist: BlacklistIngredient[];
  feedbackLogs: SkinFeedbackLog[];
  cyclePhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  onUpdateCyclePhase: (phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal') => void;
  idolProfile?: IdolCompanionProfile;
  onUpdateIdolProfile?: React.Dispatch<React.SetStateAction<IdolCompanionProfile>>;
  onAddBlacklistIngredient: (item: BlacklistIngredient) => void;
  onRemoveBlacklistIngredient: (name: string) => void;
  onUpdateProductListStatus?: (productId: string, status: 'red' | 'yellow' | 'black' | 'none') => void;
  onAddFeedbackLog?: (log: SkinFeedbackLog) => void;
  onExportData: () => void;
  onShowPrivacyModal: () => void;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  products,
  blacklist,
  feedbackLogs,
  cyclePhase,
  onUpdateCyclePhase,
  idolProfile,
  onUpdateIdolProfile,
  onAddBlacklistIngredient,
  onRemoveBlacklistIngredient,
  onUpdateProductListStatus,
  onAddFeedbackLog,
  onExportData,
  onShowPrivacyModal,
  currentUser,
  onOpenLogin,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'red' | 'yellow' | 'black' | 'ingredients' | 'feedbacks'>('red');
  const [autoFilterBlacklist, setAutoFilterBlacklist] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals inside Profile
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);

  // Add ingredient state
  const [newIngName, setNewIngName] = useState('');
  const [newIngRisk, setNewIngRisk] = useState<'high' | 'medium'>('high');
  const [newIngReason, setNewIngReason] = useState('');

  // Add feedback state
  const [feedbackProdId, setFeedbackProdId] = useState(products[0]?.id || '');
  const [feedbackRoutine, setFeedbackRoutine] = useState<'morning' | 'evening'>('morning');
  const [feedbackStatus, setFeedbackStatus] = useState<'舒服' | '紧绷' | '泛红' | '刺痛' | '起痘'>('舒服');
  const [feedbackFeelings, setFeedbackFeelings] = useState<string[]>(['水润通透']);
  const [feedbackNotes, setFeedbackNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const tabs = [
    { id: 'red', label: '红榜' },
    { id: 'yellow', label: '黄榜' },
    { id: 'black', label: '黑榜' },
    { id: 'ingredients', label: '成分避雷库' },
    { id: 'feedbacks', label: '使用反馈' }
  ];

  // Categorized products
  const redListProducts = products.filter(p => p.list_status === 'red');
  const yellowListProducts = products.filter(p => p.list_status === 'yellow');
  const blackListProducts = products.filter(p => p.list_status === 'black');

  // Filtered by search
  const filteredRed = redListProducts.filter(p => 
    !searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredYellow = yellowListProducts.filter(p => 
    !searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBlack = blackListProducts.filter(p => 
    !searchQuery || p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredIngredients = blacklist.filter(b => 
    !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Add Ingredient
  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim()) {
      showToast('请输入避雷成分名称');
      return;
    }
    onAddBlacklistIngredient({
      name: newIngName.trim(),
      risk_level: newIngRisk,
      reason: newIngReason.trim() || '用户自定义致敏/不适成分',
      associated_products_count: 0
    });
    setNewIngName('');
    setNewIngReason('');
    setShowAddIngredientModal(false);
    showToast(`已将「${newIngName.trim()}」加入成分避雷库！全系统自动拦截`);
  };

  // Handle Add Feedback
  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === feedbackProdId) || products[0];
    const newLog: SkinFeedbackLog = {
      id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      routine_type: feedbackRoutine,
      feelings: feedbackFeelings,
      mood: feedbackStatus === '舒服' ? '很舒缓' : feedbackStatus === '泛红' ? '略微敏感' : '需观察',
      notes: feedbackNotes || `${prod?.product_name || '护肤'}使用体验：${feedbackStatus}，${feedbackFeelings.join('、')}`,
      products_used_ids: [prod?.id || 'prod_1']
    };
    if (onAddFeedbackLog) {
      onAddFeedbackLog(newLog);
    }
    setShowAddFeedbackModal(false);
    setFeedbackNotes('');
    showToast('已记录今日真实护肤体感！');
  };

  // Play voice greeting
  const playGreeting = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = idolProfile?.style === 'idol' && idolProfile.idolName
        ? `早上好！${idolProfile.idolName}提醒你：护肤是一场温暖的自我照顾，今天也一起保持闪闪发光吧！`
        : "早上好，护肤是一场温和照顾自己的时刻，健康通透便是最好的状态。";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      showToast('正在播放专属陪伴语音...');
    } else {
      showToast('您的浏览器暂不支持语音合成');
    }
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

      {/* User Account & Personal Skin Profile Card */}
      <div className="bg-gradient-to-br from-white via-white to-[#FAF6F3] rounded-3xl p-4 sm:p-5 border border-[#EDE5DE] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt="Avatar"
                className="w-13 h-13 rounded-full object-cover border-2 border-amber-300 shadow-xs"
              />
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-[9px] font-bold shadow-2xs">
                {currentUser?.memberLevel || '黑金挚友'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-serif text-stone-900">
                  {currentUser?.nickname || '晚晚'}
                </h2>
                {currentUser?.isGuest ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 font-medium">
                    访客模式
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    云端同步中
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {currentUser?.phone ? `账号: ${currentUser.phone}` : '已开启私密肤质本地加密'}
              </p>
            </div>
          </div>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3 py-1.5 bg-[#962F43]/10 hover:bg-[#962F43]/20 text-[#962F43] border border-[#962F43]/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{currentUser?.isGuest ? '登录账号' : '切换账号'}</span>
            </button>
            <button 
              type="button" 
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-stone-100 border border-stone-200/60 text-stone-700 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              title="设置周期与伴侣"
            >
              <Settings className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>

        {/* Personalized Skin Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/60 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-500" />
            {currentUser?.skinTone === 'cool_fair' ? '冷白调·冷一白' : currentUser?.skinTone === 'warm_light' ? '暖黄调·黄一白' : '中性透亮色'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            {currentUser?.skinType === 'combination_oily' ? '混油敏感' : currentUser?.skinType === 'dry' ? '大干皮修护' : '健康水油平衡'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 font-medium flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-600" />
            生理期：{cyclePhase === 'menstrual' ? '月经期' : cyclePhase === 'follicular' ? '卵泡期·黄金护肤期' : cyclePhase === 'ovulation' ? '排卵期' : '黄体期'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/60 font-medium flex items-center gap-1">
            <Bot className="w-3 h-3 text-purple-600" />
            伴侣：{idolProfile?.idolName || currentUser?.idolCompanion || '田柾国'}
          </span>
        </div>

        {/* 4 Core Beauty Stats */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-stone-200/60 text-center">
          <div className="p-2 rounded-xl bg-white border border-[#EDE5DE] shadow-2xs">
            <div className="text-sm font-bold text-stone-900">{products.length}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">收录单品</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#EDE5DE] shadow-2xs">
            <div className="text-sm font-bold text-[#3D634B]">
              {products.filter(p => p.status === 'in_use').length}
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">开封在用</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#EDE5DE] shadow-2xs">
            <div className="text-sm font-bold text-rose-600">{blacklist.length}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">避雷成分</div>
          </div>
          <div className="p-2 rounded-xl bg-white border border-[#EDE5DE] shadow-2xs">
            <div className="text-sm font-bold text-amber-600">
              {currentUser?.streakDays || 18}天
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5">连续打卡</div>
          </div>
        </div>
      </div>

      {/* 1. Header with Search & Title */}
      <div className="pt-1 flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold font-serif tracking-tight text-stone-900">
              我的肌肤记忆档案
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-semibold border border-emerald-200/60">
              实证中枢
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            记录真实面部化学反馈 · 联动 Routine 与防踩雷推荐
          </p>
        </div>
      </div>

      {/* 2. Top Segmented Tabs (红榜 | 黄榜 | 黑榜 | 成分避雷库 | 使用反馈) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = 
            tab.id === 'red' ? redListProducts.length :
            tab.id === 'yellow' ? yellowListProducts.length :
            tab.id === 'black' ? blackListProducts.length :
            tab.id === 'ingredients' ? blacklist.length :
            feedbackLogs.length;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                showToast(`已切换至「${tab.label}」专区`);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-[#3D634B] text-white shadow-2xs' 
                  : 'bg-white/80 text-stone-600 hover:text-stone-900 border border-[#EDE5DE]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="在肌肤档案中搜索单品名、品牌或避雷成分..."
          className="w-full pl-9 pr-8 py-2 bg-white rounded-2xl border border-[#EDE5DE] text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#3D634B] shadow-2xs"
        />
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* 3. 3 Stat Cards in a Row */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Card 1: 舒服产品 */}
        <div 
          onClick={() => setActiveTab('red')}
          className={`rounded-3xl p-3 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'red' ? 'bg-[#E0EFE4] border-[#93C7A1] ring-1 ring-[#93C7A1]' : 'bg-[#EAF2EC] border-[#D3E4D7] hover:shadow-sm'
          }`}
        >
          <div>
            <div className="w-7 h-7 rounded-full bg-[#3D634B]/15 flex items-center justify-center text-[#3D634B] mb-1">
              <Sprout className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-semibold text-stone-700">舒服产品 (红榜)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-serif text-[#2B4B36]">{redListProducts.length}</span>
              <span className="text-[10px] text-[#2B4B36]">款 &gt;</span>
            </div>
          </div>
          <p className="text-[9px] text-stone-500 mt-1 leading-tight">
            极高耐受，常规流程优先推荐
          </p>
        </div>

        {/* Card 2: 需注意产品 */}
        <div 
          onClick={() => setActiveTab('yellow')}
          className={`rounded-3xl p-3 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'yellow' ? 'bg-[#FFF3D6] border-[#FCD580] ring-1 ring-[#FCD580]' : 'bg-[#FFF8E6] border-[#FDE5A7] hover:shadow-sm'
          }`}
        >
          <div>
            <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-700 mb-1">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-semibold text-stone-700">需注意 (黄榜)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-serif text-amber-700">{yellowListProducts.length}</span>
              <span className="text-[10px] text-amber-700">款 &gt;</span>
            </div>
          </div>
          <p className="text-[9px] text-stone-500 mt-1 leading-tight">
            偶有拔干泛红，换季谨慎
          </p>
        </div>

        {/* Card 3: 避免产品 */}
        <div 
          onClick={() => setActiveTab('black')}
          className={`rounded-3xl p-3 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            activeTab === 'black' ? 'bg-[#FCE1DD] border-[#F5ABA1] ring-1 ring-[#F5ABA1]' : 'bg-[#FDEAE8] border-[#F7C6C1] hover:shadow-sm'
          }`}
        >
          <div>
            <div className="w-7 h-7 rounded-full bg-rose-500/15 flex items-center justify-center text-[#CF3F57] mb-1">
              <Ban className="w-4 h-4" />
            </div>
            <div className="text-[11px] font-semibold text-stone-700">避免单品 (黑榜)</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-serif text-[#CF3F57]">{blackListProducts.length}</span>
              <span className="text-[10px] text-[#CF3F57]">款 &gt;</span>
            </div>
          </div>
          <p className="text-[9px] text-stone-500 mt-1 leading-tight">
            曾致敏刺痛，全流程智能拦截
          </p>
        </div>
      </div>

      {/* 4. 自动过滤黑榜产品 Card with Green Checkmark Toggle */}
      <div className="rounded-3xl bg-[#EAF2EC] p-3.5 border border-[#D3E4D7] shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#3D634B]/15 flex items-center justify-center text-[#3D634B] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-stone-900">自动拦截黑榜与敏感成分</h4>
              <span className="text-[9px] bg-[#3D634B] text-white px-1.5 py-0.2 rounded-full font-semibold">
                防护生效中
              </span>
            </div>
            <p className="text-[10px] text-stone-600 mt-0.5 leading-tight">
              生成护理计划、推荐妆造与商城选品时，已自动避开黑榜产品及 {blacklist.length} 项避雷成分。
            </p>
          </div>
        </div>

        {/* Green Switch with Checkmark */}
        <button
          type="button"
          onClick={() => {
            setAutoFilterBlacklist(!autoFilterBlacklist);
            showToast(autoFilterBlacklist ? '已暂停自动过滤黑榜' : '已恢复自动过滤黑榜避雷防护！');
          }}
          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
            autoFilterBlacklist ? 'bg-[#3D634B]' : 'bg-stone-300'
          }`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center transition-transform ${
            autoFilterBlacklist ? 'translate-x-6' : 'translate-x-0'
          }`}>
            {autoFilterBlacklist && <Check className="w-3 h-3 text-[#3D634B] stroke-[3]" />}
          </div>
        </button>
      </div>

      {/* 5. TAB 1: 红榜 (RED LIST) */}
      {activeTab === 'red' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-700 shrink-0" />
              <span><strong>自用圣杯红榜：</strong> 极高耐受且显著改善水光屏障，Routine 优先排入。</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold shrink-0">{filteredRed.length} 件</span>
          </div>

          {filteredRed.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-[#EDE5DE] text-stone-400 text-xs">
              暂无匹配的红榜产品，可以在化妆台中为爱用好物标记为红榜。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredRed.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl p-3.5 border border-[#EDE5DE] shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                      <img src={p.image_url || skincareCalm} alt={p.product_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-stone-400">{p.brand}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          红榜认证
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">{p.product_name}</h4>
                      <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {p.user_notes || '滋润亲肤，晨晚维稳肤感极佳。'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400">已用 {p.usage_count || 12} 次 · 评分 5.0</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (onUpdateProductListStatus) onUpdateProductListStatus(p.id, 'yellow');
                          showToast(`已将「${p.product_name}」调整为黄榜`);
                        }}
                        className="text-stone-500 hover:text-amber-700 px-2 py-0.5 rounded-md hover:bg-stone-50"
                      >
                        降至黄榜
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateProductListStatus) onUpdateProductListStatus(p.id, 'none');
                          showToast(`已将「${p.product_name}」移出红榜`);
                        }}
                        className="text-stone-400 hover:text-stone-700 px-2 py-0.5 rounded-md hover:bg-stone-50"
                      >
                        移出
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2: 黄榜 (YELLOW LIST) */}
      {activeTab === 'yellow' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>黄榜慎用好物：</strong> 换季或屏障受损时偶有紧绷发热，使用需充分打底。</span>
            </div>
            <span className="text-[10px] text-amber-700 font-bold shrink-0">{filteredYellow.length} 件</span>
          </div>

          {filteredYellow.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-[#EDE5DE] text-stone-400 text-xs">
              黄榜暂无待观察产品。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredYellow.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl p-3.5 border border-[#EDE5DE] shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                      <img src={p.image_url || skincareCalm} alt={p.product_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-stone-400">{p.brand}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                          需谨慎
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">{p.product_name}</h4>
                      <p className="text-[10px] text-amber-800/80 line-clamp-1 mt-0.5">
                        {p.user_notes || '换季期偶有微热，建议避开眼周薄皮区域。'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400">观察中</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (onUpdateProductListStatus) onUpdateProductListStatus(p.id, 'red');
                          showToast(`已将「${p.product_name}」晋升至红榜`);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded-md hover:bg-emerald-50"
                      >
                        升为红榜
                      </button>
                      <button
                        onClick={() => {
                          if (onUpdateProductListStatus) onUpdateProductListStatus(p.id, 'black');
                          showToast(`已将「${p.product_name}」列入黑榜拦截`);
                        }}
                        className="text-rose-600 hover:text-rose-800 px-2 py-0.5 rounded-md hover:bg-rose-50"
                      >
                        拉入黑榜
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 3: 黑榜 (BLACK LIST) */}
      {activeTab === 'black' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-center justify-between text-xs text-rose-950">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-700 shrink-0" />
              <span><strong>黑榜拦截库：</strong> 已自动从每日护理计划与妆前搭配中永久排除。</span>
            </div>
            <span className="text-[10px] text-rose-700 font-bold shrink-0">{filteredBlack.length} 件</span>
          </div>

          {filteredBlack.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-[#EDE5DE] text-stone-400 text-xs">
              黑榜暂无拦截产品，继续保持健康护肤！
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredBlack.map((p) => (
                <div key={p.id} className="bg-white rounded-3xl p-3.5 border border-[#EDE5DE] shadow-xs flex flex-col justify-between space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0 grayscale">
                      <img src={p.image_url || skincareCalm} alt={p.product_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-stone-400">{p.brand}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
                          已强力拦截
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">{p.product_name}</h4>
                      <p className="text-[10px] text-rose-700 mt-0.5 line-clamp-1">
                        原因: {p.user_notes || '使用后两颊灼痛发红，含有潜在刺激源。'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className="text-rose-600 font-medium">🛡️ 系统自动屏蔽</span>
                    <button
                      onClick={() => {
                        if (onUpdateProductListStatus) onUpdateProductListStatus(p.id, 'yellow');
                        showToast(`已解除对「${p.product_name}」的强制拉黑，移至黄榜`);
                      }}
                      className="text-stone-500 hover:text-stone-800 px-2.5 py-1 rounded-full border border-stone-200 hover:bg-stone-50"
                    >
                      解除黑榜
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 4: 成分避雷库 (INGREDIENTS BLACKLIST) */}
      {activeTab === 'ingredients' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold text-stone-900">个人耐受成分黑名单</h3>
              <p className="text-[10px] text-stone-500">检测到包含以下成分的产品将在所有页面显示刺痛警示</p>
            </div>
            <button
              onClick={() => setShowAddIngredientModal(true)}
              className="px-3 py-1.5 rounded-full bg-[#3D634B] hover:bg-[#2e4d39] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加避雷成分</span>
            </button>
          </div>

          <div className="space-y-2">
            {filteredIngredients.map((item) => (
              <div 
                key={item.name}
                className="bg-white rounded-2xl p-3 border border-[#EDE5DE] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900">{item.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.risk_level === 'high' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {item.risk_level === 'high' ? '高敏感源' : '中度预警'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    避雷原因: {item.reason}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onRemoveBlacklistIngredient(item.name);
                    showToast(`已从避雷库移除「${item.name}」`);
                  }}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. TAB 5: 使用反馈 (SKIN FEEL FEEDBACK LOGS) */}
      {activeTab === 'feedbacks' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold text-stone-900">真实上脸体感时间线</h3>
              <p className="text-[10px] text-stone-500">累计沉淀 {feedbackLogs.length} 条面部耐受与肤感实测</p>
            </div>
            <button
              onClick={() => setShowAddFeedbackModal(true)}
              className="px-3 py-1.5 rounded-full bg-[#3D634B] hover:bg-[#2e4d39] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>记一笔体感</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {feedbackLogs.map((log) => {
              const matchedProd = products.find(p => log.products_used_ids.includes(p.id));
              const prodName = matchedProd?.product_name || '日常自用护肤';
              const isGood = log.feelings.some(f => f.includes('水润') || f.includes('舒适') || f.includes('舒服') || f.includes('通透'));

              return (
                <div 
                  key={log.id}
                  className="bg-white rounded-3xl p-3.5 border border-[#EDE5DE] shadow-xs flex items-start gap-3"
                >
                  <div className="text-center shrink-0 pr-1 border-r border-stone-100 pt-0.5">
                    <span className="text-xs font-bold text-stone-800 block">
                      {log.date.slice(5)}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      {log.routine_type === 'morning' ? '晨间' : '晚间'}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
                    <img src={matchedProd?.image_url || skincareCalm} alt="产品图" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{prodName}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span>{isGood ? '😊 舒适' : '⚠️ 需关注'}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {log.feelings.map(f => (
                        <span key={f} className="text-[9px] px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600">
                          {f}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-stone-600 leading-relaxed bg-stone-50/70 p-2 rounded-xl">
                      {log.notes}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10. Settings & Preferences Modal (Cycle + Idol Companion + Privacy) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-y-auto p-5 shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-stone-700" />
                <h3 className="text-base font-bold font-serif text-stone-900">
                  周期护肤与专属陪伴偏好
                </h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. 生理周期调控 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>当前女性生理周期阶段</span>
                </label>
                <span className="text-[10px] text-rose-600 font-semibold">荷尔蒙智能联动</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'menstrual', name: '经期 (第1-5天)', desc: '敏弱易水肿 · 精简修护' },
                  { id: 'follicular', name: '卵泡期 (第6-14天)', desc: '巅峰水光期 · 密集抗老' },
                  { id: 'ovulation', name: '排卵期 (第15-18天)', desc: '水油平衡 · 强化防晒' },
                  { id: 'luteal', name: '黄体期 (第19-28天)', desc: '皮脂旺盛 · 控油防闭口' }
                ].map((ph) => {
                  const isCur = cyclePhase === ph.id;
                  return (
                    <button
                      key={ph.id}
                      onClick={() => {
                        onUpdateCyclePhase(ph.id as any);
                        showToast(`已切换至「${ph.name}」护理节律`);
                      }}
                      className={`p-2.5 rounded-2xl text-left border transition-all ${
                        isCur 
                          ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-300' 
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900">{ph.name}</span>
                        {isCur && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </div>
                      <span className="text-[10px] text-stone-500 block mt-0.5">{ph.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 爱豆 / 角色专属陪伴 */}
            {idolProfile && onUpdateIdolProfile && (
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>专属爱豆 / 角色陪伴</span>
                  </label>
                  <button
                    onClick={() => onUpdateIdolProfile(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      idolProfile.enabled ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {idolProfile.enabled ? '已开启' : '已关闭'}
                  </button>
                </div>

                {idolProfile.enabled && (
                  <div className="space-y-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600 shrink-0">陪伴角色姓名:</span>
                      <input 
                        type="text" 
                        value={idolProfile.idolName || ''}
                        onChange={(e) => onUpdateIdolProfile(prev => ({ ...prev, idolName: e.target.value }))}
                        placeholder="如 田柾国 / 王嘉尔 / 赛博精灵"
                        className="flex-1 px-2.5 py-1 text-xs bg-white rounded-lg border border-amber-300 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600 shrink-0">问候语气风格:</span>
                      <div className="flex gap-1.5 flex-1">
                        {[
                          { id: 'idol', label: '偶像激励' },
                          { id: 'friend', label: '元气闺蜜' },
                          { id: 'pro', label: '温和专业' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => onUpdateIdolProfile(prev => ({ ...prev, style: s.id as any }))}
                            className={`flex-1 py-1 text-[10px] font-bold rounded-lg border ${
                              idolProfile.style === s.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-stone-700 border-stone-200'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={playGreeting}
                        className="px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs hover:bg-amber-50"
                      >
                        <Volume2 className="w-3 h-3 text-amber-600" />
                        <span>试听专属问候语音</span>
                      </button>
                      <span className="text-[10px] text-amber-800/80">晨 {idolProfile.reminderTimeMorning} · 晚 {idolProfile.reminderTimeEvening}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. 数据备份与导出 */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <label className="text-xs font-bold text-stone-800 block">
                数据与隐私合规 (GDPR / 个人信息保护)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={onExportData}
                  className="flex-1 py-2 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出美妆全量档案 JSON</span>
                </button>
                <button
                  onClick={onShowPrivacyModal}
                  className="py-2 px-3 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5 text-stone-500" />
                  <span>隐私声明</span>
                </button>
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                所有肌肤测试、化妆台单品与黑榜成分均存储于本地设备，严格保护您的面部隐私。
              </p>
            </div>

            <button
              onClick={() => {
                setShowSettingsModal(false);
                showToast('偏好设置已保存！');
              }}
              className="w-full py-2.5 rounded-full bg-[#3D634B] text-white text-xs font-bold shadow-xs"
            >
              完成并保存
            </button>
          </div>
        </div>
      )}

      {/* 11. Add Blacklist Ingredient Modal */}
      {showAddIngredientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">
                添加致敏 / 避雷成分
              </h3>
              <button onClick={() => setShowAddIngredientModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">成分官方或通用名称</label>
                <input 
                  type="text" 
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  placeholder="如 变性乙醇、甲基异噻唑啉酮、高浓度视黄醇"
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#3D634B]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">避雷预警级别</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewIngRisk('high')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border ${
                      newIngRisk === 'high' ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    🔴 高敏拦截
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIngRisk('medium')}
                    className={`py-1.5 text-xs font-semibold rounded-xl border ${
                      newIngRisk === 'medium' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    🟡 谨慎关注
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">不适症状 / 避雷原因</label>
                <textarea 
                  value={newIngReason}
                  onChange={(e) => setNewIngReason(e.target.value)}
                  placeholder="如 使用后脸颊发烫爆皮，导致角质层屏障脆弱"
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl h-16 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddIngredientModal(false)}
                  className="flex-1 py-2 rounded-full border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-full bg-[#3D634B] text-white text-xs font-bold shadow-xs"
                >
                  确认录入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. Add Feedback Modal */}
      {showAddFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">
                记录今日护肤真实体感
              </h3>
              <button onClick={() => setShowAddFeedbackModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">本次使用的核心单品</label>
                <select
                  value={feedbackProdId}
                  onChange={(e) => setFeedbackProdId(e.target.value)}
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.brand} - {p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">时段与整体评价</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setFeedbackRoutine('morning')}
                      className={`flex-1 py-1 text-xs rounded-lg border ${
                        feedbackRoutine === 'morning' ? 'bg-[#3D634B] text-white border-[#3D634B]' : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      晨间
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackRoutine('evening')}
                      className={`flex-1 py-1 text-xs rounded-lg border ${
                        feedbackRoutine === 'evening' ? 'bg-[#3D634B] text-white border-[#3D634B]' : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      晚间
                    </button>
                  </div>

                  <select
                    value={feedbackStatus}
                    onChange={(e) => setFeedbackStatus(e.target.value as any)}
                    className="flex-1 p-1 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="舒服">😊 舒服水润</option>
                    <option value="紧绷">😐 轻微紧绷</option>
                    <option value="泛红">😣 偶有泛红</option>
                    <option value="刺痛">😫 刺痛发热</option>
                    <option value="起痘">😡 闭口冒痘</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">体感标签 (可多选)</label>
                <div className="flex flex-wrap gap-1.5">
                  {['水润通透', '吸收极快', '温和不刺激', '两颊微干', '刺痛发红', '出油被抑制', '底妆服帖'].map((feel) => {
                    const isSel = feedbackFeelings.includes(feel);
                    return (
                      <button
                        key={feel}
                        type="button"
                        onClick={() => {
                          if (isSel) setFeedbackFeelings(feedbackFeelings.filter(f => f !== feel));
                          else setFeedbackFeelings([...feedbackFeelings, feel]);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                          isSel ? 'bg-[#3D634B] text-white border-[#3D634B]' : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {isSel ? '✓ ' : ''}{feel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">自用笔记 / 真实感受</label>
                <textarea 
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="如 洁面后先用精华打底，吸收很好，第二天没有泛红"
                  className="w-full p-2 text-xs bg-stone-50 border border-stone-200 rounded-xl h-16 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFeedbackModal(false)}
                  className="flex-1 py-2 rounded-full border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-full bg-[#3D634B] text-white text-xs font-bold shadow-xs"
                >
                  保存记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
