import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Check, 
  ArrowRight,
  ShieldAlert, 
  Droplets,
  Calendar,
  Bell,
  Settings2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Heart,
  Flame,
  Award
} from 'lucide-react';
import { RoutinePlan, BeautyProduct, RoutineReminderSettings } from '../../types/beauty';
import { vanityHero, skincareCalm } from '../../data/mockData';
import { RoutinePushReminderModal } from '../routine/RoutinePushReminderModal';

interface CarePlanScreenProps {
  routinePlan: RoutinePlan | null;
  products: BeautyProduct[];
  onBack: () => void;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  reminderSettings?: RoutineReminderSettings;
  onUpdateReminderSettings?: (settings: RoutineReminderSettings) => void;
  onUpdatePlan?: (plan: RoutinePlan) => void;
  onAddFeedbackLog?: (log: any) => void;
}

export const CarePlanScreen: React.FC<CarePlanScreenProps> = ({
  routinePlan,
  products,
  onBack,
  onGeneratePlan,
  isGenerating,
  reminderSettings: propReminderSettings,
  onUpdateReminderSettings,
  onUpdatePlan,
  onAddFeedbackLog
}) => {
  const [activeTab, setActiveTab] = useState<'routine' | 'scenario' | 'checkin' | 'review'>('routine');
  const [onlyMyVanity, setOnlyMyVanity] = useState(true);
  const [timeBudget, setTimeBudget] = useState<'3min' | '5min' | 'full'>('5min');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Push Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState<'morning' | 'evening'>('morning');

  const [reminderSettings, setReminderSettings] = useState<RoutineReminderSettings>(propReminderSettings || {
    enabled: true,
    morningTime: '08:00',
    eveningTime: '21:30',
    webPushGranted: false,
    coreAdviceMorning: '受干燥冷空气影响，角质层水分流失较快。晨间建议「温和无泡洁面 + 拍敷精华水」，选用滋润型乳液锁水，最后务必使用温和防晒成膜，抵御光老化与泛红。',
    coreAdviceEvening: '夜间为屏障密集修护期。先用舒妍卸妆水彻底溶解彩妆浮尘，再厚敷二裂酵母修复精华深层滋养，夜间切忌高浓度频繁刷酸。'
  });

  const handleUpdateReminder = (newSettings: RoutineReminderSettings) => {
    setReminderSettings(newSettings);
    if (onUpdateReminderSettings) {
      onUpdateReminderSettings(newSettings);
    }
    showToast('护肤推送提醒设置已更新！');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Step Completion State (Interactive Check-off)
  const [completedMorningSteps, setCompletedMorningSteps] = useState<number[]>([1]);
  const [completedNightSteps, setCompletedNightSteps] = useState<number[]>([]);

  const plannedProducts = (routinePlan?.today_makeup_products || []).map(item => ({
    item,
    product: products.find(product => product.id === item.product_id)
  })).filter(({ product }) => Boolean(product));

  const togglePlannedProduct = (productId: string) => {
    if (!routinePlan || !onUpdatePlan) return;
    const updated = (routinePlan.today_makeup_products || []).map(item => item.product_id === productId ? { ...item, completed: !item.completed } : item);
    onUpdatePlan({ ...routinePlan, today_makeup_products: updated, sync_status: 'pending' });
  };

  const removePlannedProduct = (productId: string) => {
    if (!routinePlan || !onUpdatePlan) return;
    onUpdatePlan({
      ...routinePlan,
      selected_product_ids: (routinePlan.selected_product_ids || []).filter(id => id !== productId),
      today_makeup_products: (routinePlan.today_makeup_products || []).filter(item => item.product_id !== productId),
      morning_steps: (routinePlan.morning_steps || []).filter(step => step.product_id !== productId),
      evening_steps: (routinePlan.evening_steps || []).filter(step => step.product_id !== productId),
      sync_status: 'pending'
    });
    showToast('已从护肤流程移除产品');
  };

  const movePlannedProduct = (productId: string, direction: -1 | 1) => {
    if (!routinePlan || !onUpdatePlan) return;
    const items = [...(routinePlan.today_makeup_products || [])];
    const index = items.findIndex(item => item.product_id === productId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    const order = new Map(items.map((item, itemIndex) => [item.product_id, itemIndex]));
    const reorderSteps = (steps: typeof routinePlan.morning_steps) => [...(steps || [])].sort((a, b) => {
      const aOrder = a.product_id ? order.get(a.product_id) : undefined;
      const bOrder = b.product_id ? order.get(b.product_id) : undefined;
      if (aOrder === undefined || bOrder === undefined) return 0;
      return aOrder - bOrder;
    });
    onUpdatePlan({ ...routinePlan, today_makeup_products: items, morning_steps: reorderSteps(routinePlan.morning_steps), evening_steps: reorderSteps(routinePlan.evening_steps), sync_status: 'pending' });
  };

  const toggleMorningStep = (num: number) => {
    if (completedMorningSteps.includes(num)) {
      setCompletedMorningSteps(completedMorningSteps.filter(n => n !== num));
    } else {
      const next = [...completedMorningSteps, num];
      setCompletedMorningSteps(next);
      if (next.length === displayedMorningSteps.length) {
        showToast('🎉 太棒啦！今日晨间护肤步骤已全部完成！');
      } else {
        showToast(`已完成第 ${num} 步打卡`);
      }
    }
  };

  const toggleNightStep = (num: number) => {
    if (completedNightSteps.includes(num)) {
      setCompletedNightSteps(completedNightSteps.filter(n => n !== num));
    } else {
      const next = [...completedNightSteps, num];
      setCompletedNightSteps(next);
      if (next.length === displayedNightSteps.length) {
        showToast('🌙 晚间睡前修护已全部完成，祝好梦！');
      } else {
        showToast(`已完成第 ${num} 步打卡`);
      }
    }
  };

  // Morning 5 Steps
  const morningSteps = [
    {
      num: 1,
      cat: '洁面',
      product: '怡丽丝尔净颜洁面乳',
      dose: '约1cm',
      time: '30秒',
      note: '温和弱酸性清洁，手心搓出微泡轻揉T区，避免拉扯两颊干皮',
      img: skincareCalm
    },
    {
      num: 2,
      cat: '爽肤水',
      product: 'SK-II 护肤精华露 (神仙水)',
      dose: '3-5滴',
      time: '等待 30秒',
      note: '掌心温热后按压全脸，平衡水油，改善粗糙暗沉',
      img: skincareCalm
    },
    {
      num: 3,
      cat: '精华',
      product: '雅诗兰黛小棕瓶精华',
      dose: '2-3滴',
      time: '等待 30秒',
      note: '提升肌肤强韧度，由内向外提拉按摩至充分吸收',
      img: skincareCalm
    },
    {
      num: 4,
      cat: '乳液',
      product: 'IPSA 自律循环乳液',
      dose: '2泵',
      time: '轻拍吸收',
      note: '锁住角质层水分，在眼角和鼻翼起皮处轻点加强',
      img: skincareCalm
    },
    {
      num: 5,
      cat: '防晒',
      product: 'ALLIE 润色温和防晒乳',
      dose: '约1-2cm (一元硬币大)',
      time: '等待成膜 1分钟',
      note: '抵御日间紫外线，轻拍均匀勿反复揉搓以免搓泥',
      img: skincareCalm
    }
  ];

  // Night 5 Steps
  const nightSteps = [
    {
      num: 1,
      cat: '卸妆',
      product: '贝德玛舒妍温和卸妆水',
      dose: '浸润化妆棉',
      time: '敷15秒轻擦',
      note: '温和溶解防晒浮尘，湿敷眼唇避免用力拉扯睫毛',
      img: skincareCalm
    },
    {
      num: 2,
      cat: '洁面',
      product: '芙丽芳丝氨基酸洗面霜',
      dose: '黄豆粒大小',
      time: '30秒',
      note: '温水快速冲洗，不紧绷不伤脂质屏障',
      img: skincareCalm
    },
    {
      num: 3,
      cat: '爽肤水',
      product: 'SK-II 护肤精华露',
      dose: '4-5滴',
      time: '等待 30秒',
      note: '夜间深层浸润，舒缓白天外界环境带来的干燥刺痛',
      img: skincareCalm
    },
    {
      num: 4,
      cat: '修护精华',
      product: '雅诗兰黛特润修护肌透精华',
      dose: '一滴管',
      time: '配合掌心轻捂',
      note: '夜间二裂酵母黄金修护，对抗自由基暗沉',
      img: skincareCalm
    },
    {
      num: 5,
      cat: '面霜',
      product: '兰芝致美紧颜面霜 (或B5厚敷)',
      dose: '珍珠大小',
      time: '轻柔按压',
      note: '丰润锁水保护膜，防止空调房整夜水分蒸发',
      img: skincareCalm
    }
  ];

  // The saved plan augments the curated baseline. This makes products added
  // from the vanity visible in the actual morning/evening step lists.
  const planStep = (step: any, index: number) => {
    const product = products.find(item => item.id === step.product_id);
    return {
      num: index + 1,
      cat: step.category || step.title || '护肤',
      product: product ? `${product.brand} · ${product.product_name}` : step.product_name,
      dose: step.dosage || '按说明使用',
      time: step.wait_time || '吸收后进行下一步',
      note: step.instruction || '根据产品标签和个人耐受使用。',
      img: product?.image_url || skincareCalm,
      productId: step.product_id
    };
  };
  const savedMorningSteps = (routinePlan?.morning_steps || []).filter(step => step.product_id && products.some(product => product.id === step.product_id));
  const savedEveningSteps = (routinePlan?.evening_steps || []).filter(step => step.product_id && products.some(product => product.id === step.product_id));
  const displayedMorningSteps = [...morningSteps, ...savedMorningSteps.map((step, index) => planStep(step, morningSteps.length + index))];
  const displayedNightSteps = [...nightSteps, ...savedEveningSteps.map((step, index) => planStep(step, nightSteps.length + index))];

  // 4 Special Scenarios
  const specialScenarios = [
    {
      id: 'stayup',
      name: '熬夜暗沉急救',
      icon: '⚡',
      summary: '告别垮脸暗沉，抗糖抗氧 + 咖啡因眼周消水肿',
      advice: '洁面后先用冷藏化妆棉湿敷眼周 3 分钟，再涂抹二裂酵母抗氧精华，面霜中滴入半滴角鲨烷锁油。',
      matched: ['雅诗兰黛小棕瓶', '理肤泉B5修复霜', '欧莱雅黑精华']
    },
    {
      id: 'redness',
      name: '换季脱屑泛红',
      icon: '🌸',
      summary: '角质屏障修护，严禁去角质与刷酸，极简维稳',
      advice: '停止一切水杨酸与果酸！温水轻拍后仅用修丽可色修 + 理肤泉B5薄涂，减少摩擦。',
      matched: ['修丽可色修精华', '理肤泉B5修复霜', '芙丽芳丝洁面']
    },
    {
      id: 'sunburn',
      name: '暴晒晒后舒缓',
      icon: '☀️',
      summary: '物理降温补水，暂缓美白活性成分，舒缓灼热',
      advice: '先用冷水喷雾冷敷镇定 10 分钟，涂抹芦荟或玻尿酸原液补水，48小时内严禁使用A醇与酒精。',
      matched: ['喷雾冷水湿敷', 'SK-II神仙水', '理肤泉B5']
    },
    {
      id: 'flight',
      name: '长途差旅飞行',
      icon: '✈️',
      summary: '机舱极度干燥脱水，分区补水与油膜高密封',
      advice: '机舱湿度低于 20%，登机前薄揉芭比波朗橘子面霜在鼻翼法令纹，中途使用免洗晚安面膜锁水。',
      matched: ['芭比波朗橘子面霜', '自律循环乳液', '滋养面霜']
    }
  ];

  // Check-in State
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>(['水润', '舒适']);
  const [checkinStreak, setCheckinStreak] = useState(7);

  return (
    <div className="p-4 space-y-4 text-stone-900 select-none bg-[#FAF6F3]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header */}
      <div className="relative pt-1 flex items-start justify-between">
        <div className="space-y-0.5 max-w-[240px]">
          <h1 className="text-2xl font-bold font-serif tracking-tight text-stone-900">
            AI 护理计划
          </h1>
          <p className="text-[11px] text-stone-500">
            基于你的化妆台 · 个性化生成专属护理流程
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-serif text-rose-800/80 italic">
            更懂你的每一寸肌肤 ♡
          </p>
        </div>
      </div>

      {/* 2. PUSH NOTIFICATION REMINDER BANNER (基于推送通知的日常护肤提醒) */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF5F1] via-[#FDF0EB] to-[#FCEAE6] p-3.5 border border-[#F5DCD5] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-stone-900">
                  日常护肤推送提醒
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {reminderSettings.enabled ? '已开启' : '已暂停'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">
                早 {reminderSettings.morningTime} · 晚 {reminderSettings.eveningTime} 自动弹出今日核心护肤建议
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setReminderType('morning');
              setShowReminderModal(true);
            }}
            className="px-2.5 py-1 rounded-full bg-white text-stone-700 hover:text-stone-900 border border-stone-200 text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
          >
            <Settings2 className="w-3 h-3" />
            <span>设置时间</span>
          </button>
        </div>

        {/* Action Triggers to Test Push Popup */}
        <div className="pt-2 border-t border-rose-200/50 flex items-center gap-2">
          <button
            onClick={() => {
              setReminderType('morning');
              setShowReminderModal(true);
            }}
            className="flex-1 py-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-800 border border-rose-200 text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>弹出晨间建议</span>
          </button>

          <button
            onClick={() => {
              setReminderType('evening');
              setShowReminderModal(true);
            }}
            className="flex-1 py-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-800 border border-rose-200 text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span>弹出晚间修护</span>
          </button>
        </div>
      </div>

      {/* 3. Top Segmented Pills (日常 Routine | 特殊场景 | 护肤打卡 | 周期复盘) */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/70 rounded-full border border-[#EDE5DE]">
        <button
          onClick={() => setActiveTab('routine')}
          className={`py-1.5 text-xs font-semibold rounded-full transition-all text-center ${
            activeTab === 'routine' 
              ? 'bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white shadow-2xs' 
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          日常流程
        </button>
        <button
          onClick={() => {
            setActiveTab('scenario');
            showToast('已切换至特殊场景应急护理模式');
          }}
          className={`py-1.5 text-xs font-medium rounded-full transition-all text-center ${
            activeTab === 'scenario' 
              ? 'bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white shadow-2xs' 
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          特殊场景
        </button>
        <button
          onClick={() => {
            setActiveTab('checkin');
            showToast('已切换至护肤打卡记录');
          }}
          className={`py-1.5 text-xs font-medium rounded-full transition-all text-center ${
            activeTab === 'checkin' 
              ? 'bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white shadow-2xs' 
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          护肤打卡
        </button>
        <button
          onClick={() => {
            setActiveTab('review');
            showToast('已载入最近生理周期与肌肤复盘');
          }}
          className={`py-1.5 text-xs font-medium rounded-full transition-all text-center ${
            activeTab === 'review' 
              ? 'bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white shadow-2xs' 
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          周期复盘
        </button>
      </div>

      {/* TAB 1: 日常 ROUTINE */}
      {activeTab === 'routine' && (
        <div className="space-y-4 animate-in fade-in">
          {plannedProducts.length > 0 && (
            <div className="rounded-3xl bg-rose-50/70 p-4 border border-rose-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">已排入今日流程</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">从我的化妆台加入的产品会在这里执行和打卡</p>
                </div>
                <span className="text-[10px] font-semibold text-rose-700">{plannedProducts.filter(({ item }) => item.completed).length}/{plannedProducts.length} 已完成</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plannedProducts.map(({ item, product }, index) => (
                  <div key={item.product_id} className={`rounded-2xl border p-3 transition-colors ${item.completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-rose-100 hover:border-rose-300'}`}>
                    <button type="button" onClick={() => togglePlannedProduct(item.product_id)} className="w-full text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0"><p className="text-xs font-bold text-stone-900 truncate">{product?.brand} · {product?.product_name}</p><p className="text-[10px] text-stone-500 mt-1">{item.step} · {product?.subcategory || '护肤产品'}</p></div>
                      <span className={`shrink-0 text-[10px] font-semibold ${item.completed ? 'text-emerald-700' : 'text-rose-700'}`}>{item.completed ? '已完成' : '待执行'}</span>
                    </div>
                    </button>
                    <div className="mt-2 flex items-center justify-end gap-1 border-t border-stone-100 pt-2">
                      <button type="button" disabled={index === 0} onClick={() => movePlannedProduct(item.product_id, -1)} className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] text-stone-600 disabled:opacity-30">↑ 上移</button>
                      <button type="button" disabled={index === plannedProducts.length - 1} onClick={() => movePlannedProduct(item.product_id, 1)} className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] text-stone-600 disabled:opacity-30">↓ 下移</button>
                      <button type="button" onClick={() => removePlannedProduct(item.product_id)} className="rounded-lg border border-red-200 px-2 py-1 text-[10px] text-red-700">移除</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {routinePlan?.sync_status === 'failed' && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <span>护肤流程保存失败，当前修改仍保留在本机。</span>
              <button type="button" onClick={() => onUpdatePlan?.(routinePlan)} className="rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white">重试保存</button>
            </div>
          )}
          {/* 只使用我的化妆台 Card */}
          <div className="rounded-3xl bg-white p-3.5 border border-[#F0EBE6] shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/60 shrink-0">
                <img src={vanityHero} alt="化妆台产品" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-stone-900">
                  <span>只使用我的化妆台</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  基于你已有的产品，生成可执行的护理计划
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOnlyMyVanity(!onlyMyVanity)}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                onlyMyVanity ? 'bg-[#E25C70]' : 'bg-stone-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                onlyMyVanity ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* 3 Time Budget Selector Pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '3min', label: '3 分钟', sub: '极速出门' },
              { id: '5min', label: '5 分钟', sub: '精细平衡' },
              { id: 'full', label: '完整护理', sub: '全套呵护' }
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setTimeBudget(b.id as any)}
                className={`rounded-2xl p-2.5 text-center transition-all ${
                  timeBudget === b.id
                    ? 'bg-white border-2 border-[#E25C70] text-[#CF3F57] shadow-xs'
                    : 'bg-white/80 border border-[#EDE5DE] text-stone-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{b.label}</span>
                </div>
                <div className="text-[10px] mt-0.5 text-stone-400">{b.sub}</div>
              </button>
            ))}
          </div>

          {/* 晨间护理 Section */}
          <div className="rounded-3xl bg-white p-4 border border-[#F0EBE6] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">☀️</span>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">晨间护理</h3>
                  <p className="text-[10px] text-stone-400">唤醒肌肤 · 清爽透亮一整天</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-700 font-semibold">
                  完成 {completedMorningSteps.length}/{displayedMorningSteps.length}
                </span>
                <div className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  约 5分钟
                </div>
              </div>
            </div>

            {/* Morning Steps */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {displayedMorningSteps.map((s) => {
                const isDone = completedMorningSteps.includes(s.num);
                return (
                  <div 
                    key={s.num}
                    onClick={() => toggleMorningStep(s.num)}
                    className={`rounded-2xl p-2 border transition-all cursor-pointer flex flex-col items-center text-center space-y-1 ${
                      isDone 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-100 hover:border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-700' : 'text-stone-400'}`}>
                        0{s.num}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-stone-300" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold">{s.cat}</span>
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-stone-200/50 my-0.5">
                      <img src={s.img} alt={s.product} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-medium line-clamp-1">{s.product}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-100/80 text-amber-900 font-semibold">
                      {s.dose}
                    </span>
                    <span className="text-[8px] text-stone-400">{s.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 晚间护理 Section */}
          <div className="rounded-3xl bg-white p-4 border border-[#F0EBE6] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌙</span>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">晚间护理</h3>
                  <p className="text-[10px] text-stone-400">深层清洁 · 修护滋养一整晚</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-700 font-semibold">
                  完成 {completedNightSteps.length}/{displayedNightSteps.length}
                </span>
                <div className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-bold border border-indigo-200">
                  约 5分钟
                </div>
              </div>
            </div>

            {/* Night Steps */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {displayedNightSteps.map((s) => {
                const isDone = completedNightSteps.includes(s.num);
                return (
                  <div 
                    key={s.num}
                    onClick={() => toggleNightStep(s.num)}
                    className={`rounded-2xl p-2 border transition-all cursor-pointer flex flex-col items-center text-center space-y-1 ${
                      isDone 
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 shadow-2xs' 
                        : 'bg-stone-50/70 border-stone-100 hover:border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-700' : 'text-stone-400'}`}>
                        0{s.num}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-stone-300" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold">{s.cat}</span>
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-stone-200/50 my-0.5">
                      <img src={s.img} alt={s.product} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-medium line-clamp-1">{s.product}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-rose-100/80 text-rose-900 font-semibold">
                      {s.dose}
                    </span>
                    <span className="text-[8px] text-stone-400">{s.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 特殊场景 (Special Scenarios) */}
      {activeTab === 'scenario' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-900">4 大特殊场景定制急救流程</h2>
            <span className="text-[10px] text-rose-700 font-semibold">100% 调配化妆台</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {specialScenarios.map((sc) => (
              <div 
                key={sc.id}
                className="bg-white rounded-3xl p-4 border border-[#F0EBE6] shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sc.icon}</span>
                    <div>
                      <h3 className="text-xs font-bold text-stone-900">{sc.name}</h3>
                      <p className="text-[10px] text-stone-400 mt-0.5">{sc.summary}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`已将「${sc.name}」排入今日急救护理！`)}
                    className="px-2.5 py-1 rounded-full bg-[#962F43] text-white text-[10px] font-bold shadow-2xs"
                  >
                    应用方案
                  </button>
                </div>

                <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-2xl leading-relaxed">
                  {sc.advice}
                </p>

                <div className="text-[10px] text-stone-500 flex items-center gap-1.5 flex-wrap pt-1">
                  <span>调用单品：</span>
                  {sc.matched.map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 font-medium">
                      ✓ {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 护肤打卡 (Check-in) */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-3xl p-5 border border-[#F0EBE6] shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">今日护肤打卡</h3>
                <p className="text-[10px] text-stone-400">记录每一次认真护肤给肌肤带来的改变</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-amber-900 font-bold text-xs">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>连续打卡 {checkinStreak} 天</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-800 block mb-2">
              今天上完护肤后的面部感受：
            </label>
            <div className="flex flex-wrap gap-2">
              {['水润饱满', '清爽通透', '轻微紧绷', '泛红舒缓', '微微刺痛', '出油被抑制'].map((feel) => {
                const isSelected = selectedFeelings.includes(feel);
                return (
                  <button
                    key={feel}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFeelings(selectedFeelings.filter(f => f !== feel));
                      } else {
                        setSelectedFeelings([...selectedFeelings, feel]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected 
                        ? 'bg-[#962F43] border-[#962F43] text-white shadow-2xs' 
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{feel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <span className="text-[11px] text-stone-500">今日打卡将同步至「肌肤记忆档案」</span>
            <button
              onClick={() => {
                setCheckinStreak(prev => prev + 1);
                if (onAddFeedbackLog) {
                  const newLog = {
                    id: `log_${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    routine_type: 'morning' as const,
                    feelings: selectedFeelings.length > 0 ? selectedFeelings : ['水润饱满'],
                    mood: '护肤打卡完成',
                    notes: `今日护肤打卡记录（连续打卡第 ${checkinStreak + 1} 天）：体感「${selectedFeelings.join('、') || '水润饱满'}」，晨间维稳水乳防晒流程已完成。`,
                    products_used_ids: products.slice(0, 3).map(p => p.id)
                  };
                  onAddFeedbackLog(newLog);
                }
                showToast('🎉 今日护肤打卡成功！已同步至「肌肤记忆档案」');
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#E25C70] to-[#CF3F57] text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              提交今日打卡
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: 周期复盘 (Cycle Review) */}
      {activeTab === 'review' && (
        <div className="bg-white rounded-3xl p-5 border border-[#F0EBE6] shadow-xs space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-sm font-bold text-stone-900 font-serif">生理周期护肤复盘</h3>
            <p className="text-[10px] text-stone-400 mt-0.5">结合女性生理周期荷尔蒙波动，动态调整护肤节奏</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { phase: '经期 (第1-5天)', status: '易水肿/敏弱', advice: '精简保湿，舒缓泛红' },
              { phase: '卵泡期 (第6-14天)', status: '状态巅峰期', advice: '水光透亮，可密集抗老' },
              { phase: '排卵期 (第15-18天)', status: '水油平衡', advice: '做好防晒，维持稳定' },
              { phase: '黄体期 (第19-28天)', status: '皮脂分泌旺盛', advice: '水杨酸疏通，控油防痘' }
            ].map((p, idx) => (
              <div key={p.phase} className={`p-3 rounded-2xl border ${idx === 1 ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200' : 'bg-stone-50 border-stone-200'}`}>
                <span className="text-[10px] font-bold text-stone-900 block">{p.phase}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white text-rose-700 font-semibold inline-block mt-1">
                  {p.status}
                </span>
                <p className="text-[10px] text-stone-600 mt-1 leading-tight">{p.advice}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>黑榜成分拦截报告：</strong>本周护理计划已成功拦截【高浓度水杨酸】与【强刺激防腐剂】，保护偏干泛红屏障，未排入任何可能致敏单品。
            </p>
          </div>
        </div>
      )}

      {/* 8. Bottom Action Button */}
      <div className="pt-2">
        <button
          disabled={isGenerating}
          onClick={() => {
            onGeneratePlan();
            showToast('正在调取化妆台成分库，生成最新智能流程...');
          }}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#E25C70] via-[#D84C62] to-[#CF3F57] hover:from-[#d64e62] hover:to-[#bd334b] text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>{isGenerating ? 'AI 正在分析配方生成中...' : '重新生成今日个性化护理计划 >'}</span>
        </button>
      </div>

      {/* Routine Push Reminder Modal */}
      <RoutinePushReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        type={reminderType}
        reminderSettings={reminderSettings}
        onUpdateSettings={handleUpdateReminder}
        onStartRoutine={(type) => {
          setActiveTab('routine');
          showToast(`已开始执行${type === 'morning' ? '晨间' : '晚间'}护肤流程！`);
        }}
        products={products}
      />
    </div>
  );
};
