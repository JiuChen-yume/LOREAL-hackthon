import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Heart, 
  ChevronRight, 
  Briefcase, 
  Sparkle, 
  Check, 
  Calendar,
  Smile,
  HeartHandshake,
  Compass,
  Star,
  User,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { BeautyProduct, RoutinePlan, CareStep, SkinFeedbackLog, CyclePhase, IdolCompanionProfile } from '../types/beauty';

interface CareRoutineProps {
  routinePlan: RoutinePlan;
  products: BeautyProduct[];
  feedbackLogs: SkinFeedbackLog[];
  cyclePhase: CyclePhase;
  onUpdateCyclePhase: (phase: CyclePhase) => void;
  idolProfile: IdolCompanionProfile;
  onUpdateIdolProfile: (profile: IdolCompanionProfile) => void;
  onUpdatePlan: (plan: RoutinePlan) => void;
  onReportStingingProduct: (productId: string, productName: string) => void;
  onSaveFeedbackLog: (log: SkinFeedbackLog) => void;
  onGenerateSpecialScenario: (scenario: string) => Promise<void>;
  isGenerating: boolean;
}

export const CareRoutine: React.FC<CareRoutineProps> = ({
  routinePlan,
  products,
  feedbackLogs,
  cyclePhase,
  onUpdateCyclePhase,
  idolProfile,
  onUpdateIdolProfile,
  onUpdatePlan,
  onReportStingingProduct,
  onSaveFeedbackLog,
  onGenerateSpecialScenario,
  isGenerating
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'special' | 'travel' | 'checkin' | 'reminders' | 'review'>('daily');

  // Daily Mode step states
  const [morningSteps, setMorningSteps] = useState<CareStep[]>(routinePlan.morning_steps);
  const [eveningSteps, setEveningSteps] = useState<CareStep[]>(routinePlan.evening_steps);

  // Check-in state
  const [checkinType, setCheckinType] = useState<'morning' | 'evening'>('morning');
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>(['舒服水润']);
  const [selectedMood, setSelectedMood] = useState<string>('放松释怀');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [usedProductIds, setUsedProductIds] = useState<string[]>(
    routinePlan.morning_steps.map(s => s.product_id).filter(Boolean) as string[]
  );
  const [checkinSavedNotice, setCheckinSavedNotice] = useState(false);

  // Stinging confirmation modal state
  const [stingingTarget, setStingingTarget] = useState<{ id: string; name: string } | null>(null);

  // Idol edit state
  const [idolNameInput, setIdolNameInput] = useState(idolProfile.idolName);
  const [idolStyle, setIdolStyle] = useState<'daily' | 'idol' | 'cos'>(idolProfile.style);

  // Sync steps if plan updates externally
  React.useEffect(() => {
    setMorningSteps(routinePlan.morning_steps);
    setEveningSteps(routinePlan.evening_steps);
  }, [routinePlan]);

  // Remove a step
  const handleRemoveStep = (isMorning: boolean, stepNumber: number) => {
    if (isMorning) {
      const updated = morningSteps.filter(s => s.step_number !== stepNumber);
      setMorningSteps(updated);
      onUpdatePlan({ ...routinePlan, morning_steps: updated });
    } else {
      const updated = eveningSteps.filter(s => s.step_number !== stepNumber);
      setEveningSteps(updated);
      onUpdatePlan({ ...routinePlan, evening_steps: updated });
    }
  };

  // Switch to minimal 3-minute mode
  const handleSwitchMinimal = () => {
    const minimalMorning = morningSteps.slice(0, 2);
    const minimalEvening = eveningSteps.slice(0, 2);
    setMorningSteps(minimalMorning);
    setEveningSteps(minimalEvening);
    onUpdatePlan({
      ...routinePlan,
      time_budget: '3min',
      morning_steps: minimalMorning,
      evening_steps: minimalEvening
    });
  };

  // Submit check-in log
  const handleCheckinSubmit = () => {
    const newLog: SkinFeedbackLog = {
      id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      routine_type: checkinType,
      feelings: selectedFeelings,
      mood: selectedMood,
      notes: checkinNotes,
      products_used_ids: usedProductIds
    };
    onSaveFeedbackLog(newLog);
    setCheckinSavedNotice(true);
    setTimeout(() => setCheckinSavedNotice(false), 3000);
  };

  // Confirm report stinging
  const handleConfirmStinging = () => {
    if (stingingTarget) {
      onReportStingingProduct(stingingTarget.id, stingingTarget.name);
      // Remove from current plan steps
      const newM = morningSteps.filter(s => s.product_id !== stingingTarget.id);
      const newE = eveningSteps.filter(s => s.product_id !== stingingTarget.id);
      setMorningSteps(newM);
      setEveningSteps(newE);
      onUpdatePlan({ ...routinePlan, morning_steps: newM, evening_steps: newE });
      setStingingTarget(null);
    }
  };

  // Travel pack generator (picks 3 multi-purpose essentials from vanity)
  const travelEssentials = [
    {
      role: '全能修护打底',
      product: products.find(p => p.subcategory === '精华' && p.list_status === 'red') || products[0],
      reason: '兼顾晨晚维稳，质地轻盈，缓解机舱空气干燥。'
    },
    {
      role: '多效封层保水',
      product: products.find(p => p.subcategory === '面霜' && p.list_status !== 'black') || products[1],
      reason: '既可用作面部晚间锁水，也能涂抹颈部与干燥手肘，避免带过多瓶罐。'
    },
    {
      role: '高频日常清洁',
      product: products.find(p => p.subcategory === '洁面') || { product_name: '温和氨基酸洁面', brand: '自备便携装' },
      reason: '温和卸除城市粉尘，不带走天然皮脂。'
    }
  ];

  // Dynamic reminder preview based on style & idol
  const getReminderMessage = (time: 'morning' | 'evening') => {
    if (idolProfile.style === 'idol') {
      const name = idolProfile.idolName || '欧巴';
      return time === 'morning'
        ? `早安！做好晨间护理，带着好状态开启今天，和${name}一起元气出发~ ✨`
        : `忙碌一天啦！${name}也在好好照顾自己，今晚记得花几分钟护理皮肤，和他一起闪闪发光 💖`;
    }
    if (idolProfile.style === 'cos') {
      const proj = idolProfile.cosProjectName || '出勤角色';
      return time === 'morning'
        ? `早安！为了【${proj}】拍摄当天最佳原生肌肤状态，温和上水水光打底~`
        : `今晚做好屏障厚敷修护，避免胶水彩妆残留，为【${proj}】提供完美服帖基地！`;
    }
    return time === 'morning'
      ? '早安！早间简单两步唤醒肌肤，轻盈出门，今天也是温和照顾自己的一天。'
      : '忙碌一天啦，花几分钟简单护理一下皮肤，关照身心，好好放松休息吧 🌙';
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Mode Switcher */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span>科学护肤计划</span>
              <span aria-hidden="true">·</span>
              <span>基于化妆台库存与动态皮肤微环境</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 mt-1">
              AI 护理计划 (Care Routine)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              严守黑榜阻断机制，提供分早晚、量化等待时间的手法指导，拒绝过度护肤与容貌焦虑。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitchMinimal}
              className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              一键切换 3 分钟极简版
            </button>
          </div>
        </div>

        {/* 生理周期三阶段专项切换 */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="font-semibold text-stone-900">女性生理周期护肤联动:</span>
            <span>当前阶段 →</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'follicular', label: '卵泡期 (代谢活跃·状态佳)', desc: '可温和美白抗老' },
              { id: 'ovulation', label: '排卵期 (皮脂渐增)', desc: '平衡水油控光' },
              { id: 'luteal', label: '黄体期/经期前 (预警爆痘)', desc: '减少厚重闷肤油脂' },
              { id: 'menstrual', label: '经期中 (屏障脆弱泛红)', desc: '极简温和修护' }
            ].map((phase) => {
              const isCurrent = cyclePhase === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => onUpdateCyclePhase(phase.id as any)}
                  className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    isCurrent 
                      ? 'bg-rose-100 text-rose-900 font-semibold border border-rose-300' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {phase.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6 Top Tabs */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          {[
            { id: 'daily', label: '日常 Routine' },
            { id: 'special', label: '特殊场景急救' },
            { id: 'travel', label: '出差旅行便携包' },
            { id: 'checkin', label: '护肤感受记录' },
            { id: 'reminders', label: '温柔提醒定制' },
            { id: 'review', label: '周期复盘洞察' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'bg-stone-900 text-white shadow-xs' 
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: 日常 Routine */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-amber-950">
                {routinePlan.title} ({routinePlan.time_budget === '3min' ? '3分钟极简版' : '5分钟标准版'})
              </h2>
              <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                {routinePlan.skin_status_summary}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-amber-800">
                <span>过滤状态：已完全屏蔽黑榜酒精与高刺激活性物叠加</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Morning Steps */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-stone-900">晨间唤醒修护 ({morningSteps.length} 步)</h3>
                </div>
                <span className="text-xs text-stone-500">水光 · 维稳 · 锁水</span>
              </div>

              <div className="space-y-3.5">
                {morningSteps.map((step) => (
                  <div key={step.step_number} className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-mono flex items-center justify-center">
                          {step.step_number}
                        </span>
                        <span className="text-xs font-semibold text-stone-900">{step.title}</span>
                        <span className="text-[10px] text-stone-500 bg-stone-200/60 px-1.5 py-0.5 rounded">
                          {step.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {step.product_id && (
                          <button
                            type="button"
                            onClick={() => setStingingTarget({ id: step.product_id!, name: step.product_name })}
                            title="标记此产品刺痛不适，并移入黑榜"
                            className="text-[10px] text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors"
                          >
                            此产品让我刺痛
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(true, step.step_number)}
                          className="text-stone-400 hover:text-stone-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-stone-800">
                      {step.brand && <span className="text-stone-500 mr-1">{step.brand}</span>}
                      {step.product_name}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-stone-600">
                      <span>用量: <strong className="text-stone-900">{step.dosage}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>等待: <strong className="text-stone-900">{step.wait_time}</strong></span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200/40">
                      {step.instruction}
                    </p>

                    {step.notes && (
                      <p className="text-[11px] text-stone-500 italic">
                        💡 {step.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Evening Steps */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-stone-900">晚间深度修护 ({eveningSteps.length} 步)</h3>
                </div>
                <span className="text-xs text-stone-500">微生态 · 厚敷乳化封层</span>
              </div>

              <div className="space-y-3.5">
                {eveningSteps.map((step) => (
                  <div key={step.step_number} className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-mono flex items-center justify-center">
                          {step.step_number}
                        </span>
                        <span className="text-xs font-semibold text-stone-900">{step.title}</span>
                        <span className="text-[10px] text-stone-500 bg-stone-200/60 px-1.5 py-0.5 rounded">
                          {step.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {step.product_id && (
                          <button
                            type="button"
                            onClick={() => setStingingTarget({ id: step.product_id!, name: step.product_name })}
                            title="标记此产品刺痛不适，并移入黑榜"
                            className="text-[10px] text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition-colors"
                          >
                            此产品让我刺痛
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(false, step.step_number)}
                          className="text-stone-400 hover:text-stone-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-stone-800">
                      {step.brand && <span className="text-stone-500 mr-1">{step.brand}</span>}
                      {step.product_name}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-stone-600">
                      <span>用量: <strong className="text-stone-900">{step.dosage}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>等待: <strong className="text-stone-900">{step.wait_time}</strong></span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200/40">
                      {step.instruction}
                    </p>

                    {step.notes && (
                      <p className="text-[11px] text-stone-500 italic">
                        💡 {step.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 特殊场景急救 */}
      {activeTab === 'special' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80">
            <h3 className="text-sm font-semibold text-stone-900 mb-1">选择当前面临的突发皮肤状况</h3>
            <p className="text-xs text-stone-500 mb-4">
              AI 拒绝恐吓话术，将护理步骤精简压缩至 3 到 5 步，避免在应激状态下叠加过多负担。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: '熬夜后', label: '熬夜后暗沉急救', desc: '促进微循环，消退浮肿与水油失衡' },
                { id: '长时间户外', label: '长时间户外暴晒', desc: '抗光热应激与深层矿物补水' },
                { id: '换季敏感', label: '换季敏感脆弱', desc: '屏障急救，剔除一切潜在致敏源' },
                { id: '突发爆痘', label: '突发爆痘调理', desc: '局部精准点涂，不剥脱全脸皮脂' },
                { id: '泛红', label: '泛红发热退红', desc: '物理降温，甘草与神经酰胺厚敷' },
                { id: '晒后', label: '晒后修护镇静', desc: '禁止立刻刷酸，以纯水性冷敷为主' },
                { id: '干燥脱皮', label: '干燥脱皮抚平', desc: '油水同补，软化干裂角质' },
                { id: '压力大', label: '压力情绪暗沉', desc: '极简无香保湿，深呼吸温和护理' }
              ].map((item) => (
                <button
                  key={item.id}
                  disabled={isGenerating}
                  onClick={() => onGenerateSpecialScenario(item.id)}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-900 hover:bg-stone-50 text-left transition-all active:scale-[0.98] group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-sm font-semibold text-stone-900 group-hover:text-stone-950 block">
                      {item.label}
                    </span>
                    <span className="text-xs text-stone-500 mt-1 block">
                      {item.desc}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs font-medium text-stone-900">
                    <span>生成急救流程</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: 出差旅行便携包 (Travel Pack - Specially from Proposal) */}
      {activeTab === 'travel' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-stone-800" />
                <h3 className="text-base font-serif font-semibold text-stone-900">
                  出差旅行便携精简选品包 (3件极简套)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                无需携带繁重瓶罐，从化妆台挑选少数便携多效产品，应对机舱干燥与水土不服。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {travelEssentials.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-2">
                <span className="text-[11px] font-semibold text-stone-800 bg-stone-200/80 px-2 py-0.5 rounded">
                  {item.role}
                </span>
                <h4 className="text-sm font-semibold text-stone-900 mt-1">
                  {item.product?.product_name || '精选单品'}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200/50">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/60">
            ✈️ <strong>行李小贴士：</strong>
            液态单瓶不超过 100ml 即可随身登机。机舱内湿度常低于 20%，建议面霜于起飞后薄涂面中防止干纹。
          </div>
        </div>
      )}

      {/* Tab 4: 护肤感受打卡 */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 max-w-2xl mx-auto space-y-5">
          <div>
            <h2 className="text-base font-serif font-semibold text-stone-900">
              记录今日护肤感受
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              客观记录肌肤真实体感，数据将自动反哺至肌肤记忆避雷库，无连续打卡压力。
            </p>
          </div>

          {/* Time mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCheckinType('morning')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                checkinType === 'morning' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              晨间记录
            </button>
            <button
              onClick={() => setCheckinType('evening')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                checkinType === 'evening' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
              }`}
            >
              晚间记录
            </button>
          </div>

          {/* Skin feeling options */}
          <div>
            <label className="text-xs font-semibold text-stone-800 block mb-2">
              当前面部体感 (可多选)
            </label>
            <div className="flex flex-wrap gap-2">
              {['舒服水润', '两颊微紧绷', '局部泛红', '轻微刺痛', '泛油光', '突发闭口痘痘', '起皮脱屑'].map((feeling) => {
                const isSelected = selectedFeelings.includes(feeling);
                return (
                  <button
                    key={feeling}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFeelings(selectedFeelings.filter(f => f !== feeling));
                      } else {
                        setSelectedFeelings([...selectedFeelings, feeling]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      isSelected 
                        ? 'bg-stone-900 border-stone-900 text-white' 
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {feeling}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood options */}
          <div>
            <label className="text-xs font-semibold text-stone-800 block mb-2">
              当下心情状态
            </label>
            <div className="flex flex-wrap gap-2">
              {['疲惫需充电', '放松释怀', '犒劳自己', '自在平静', '充满元气'].map((mood) => {
                const isSelected = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      isSelected 
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold' 
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {mood}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actual products used */}
          <div>
            <label className="text-xs font-semibold text-stone-800 block mb-2">
              实际使用的化妆台产品 (支持自由勾选)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-stone-200 rounded-xl">
              {products.filter(p => p.category === 'skincare').map((p) => {
                const isChecked = usedProductIds.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded-lg cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUsedProductIds([...usedProductIds, p.id]);
                        } else {
                          setUsedProductIds(usedProductIds.filter(id => id !== p.id));
                        }
                      }}
                      className="rounded text-stone-900 focus:ring-stone-900"
                    />
                    <span className="truncate">{p.product_name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-stone-800 block mb-1">
              自由心得备忘 (选填)
            </label>
            <textarea
              value={checkinNotes}
              onChange={(e) => setCheckinNotes(e.target.value)}
              placeholder="记录今天换了哪款精华、是否有搓泥现象或天气感受..."
              rows={3}
              className="w-full p-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            {checkinSavedNotice ? (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                已记录，已归入您的肌肤记忆库
              </span>
            ) : <span />}

            <button
              onClick={handleCheckinSubmit}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-xl shadow-xs transition-transform active:scale-95"
            >
              保存今日体感记录
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: 温柔提醒与爱豆定制 (From Proposal!) */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 max-w-2xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-serif font-semibold text-stone-900">
              个性化温柔提醒与陪伴设置
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              可定制日常温和陪伴、爱豆/偶像同频提醒或 COS 计划提醒，拒绝打扰式施压。
            </p>
          </div>

          {/* Style selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-stone-800 block">
              提醒风格定制
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: '日常温和陪伴', desc: '好好照顾自己' },
                { id: 'idol', label: '偶像/爱豆陪伴', desc: '和欧巴一起努力闪闪发光' },
                { id: 'cos', label: 'COS 角色出勤', desc: '为展会完美出片备战' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setIdolStyle(style.id as any);
                    onUpdateIdolProfile({ ...idolProfile, style: style.id as any });
                  }}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    idolStyle === style.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <span className="text-xs font-semibold block">{style.label}</span>
                  <span className={`text-[10px] mt-0.5 block ${idolStyle === style.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {style.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Idol name input if selected */}
          {idolStyle === 'idol' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3">
              <label className="text-xs font-semibold text-amber-950 block">
                【我的偶像】简易档案 (选填)
              </label>
              <input
                type="text"
                placeholder="例如：田柾国 / 周杰伦 / 任意偶像昵称"
                value={idolNameInput}
                onChange={(e) => setIdolNameInput(e.target.value)}
                onBlur={() => onUpdateIdolProfile({ ...idolProfile, idolName: idolNameInput })}
                className="w-full p-2.5 text-xs bg-white border border-amber-200 rounded-lg text-stone-900"
              />
              <p className="text-[11px] text-amber-800">
                填写后，早晚推送文案将自动代入：“好好完成今晚护肤，和【{idolNameInput || '欧巴'}】一起好好照顾自己✨”
              </p>
            </div>
          )}

          {/* Preview of current generated reminders */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-stone-800 block">今日推送文案预览：</span>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-700 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>晨间 08:30 推送</span>
              </div>
              <p className="pl-5 leading-relaxed">{getReminderMessage('morning')}</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-700 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>晚间 22:00 推送</span>
              </div>
              <p className="pl-5 leading-relaxed">{getReminderMessage('evening')}</p>
            </div>
          </div>

          {/* Continuous care milestone cards */}
          <div className="pt-3 border-t border-stone-100">
            <span className="text-xs font-semibold text-stone-800 block mb-2">
              陪伴里程碑寄语 (无排名，纯治愈)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                <div className="font-semibold text-stone-900">第 1 次温和照顾自己</div>
                <p className="text-[11px] text-stone-500 mt-1">看着你离更好的自己更近一步，我也好开心~</p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                <div className="font-semibold text-stone-900">持续 7 天温柔相伴</div>
                <p className="text-[11px] text-stone-500 mt-1">把护肤当成给自己的小礼物，今天状态满分！</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: 周期复盘洞察 */}
      {activeTab === 'review' && (
        <div className="space-y-5">
          {/* Automatic effect attribution alert if feedback exists */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <strong>产品效果自动归因机制：</strong>
              系统长期对比护肤打卡体感与当天使用的化妆台护肤品。如发现某产品在 2 次以上伴随刺痛或泛红，将主动询问是否移入黑榜并自动提取避雷成分至个人避雷库！
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-3">
              <span className="text-xs text-stone-500 font-medium block">近期最常用产品 (Top 3)</span>
              <div className="space-y-2">
                {products.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-2 bg-stone-50 rounded-lg">
                    <span className="truncate max-w-[180px] font-medium">{p.product_name}</span>
                    <span className="text-stone-500 font-mono tabular-numbers">{p.usage_count} 次</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-3">
              <span className="text-xs text-stone-500 font-medium block">用户反馈极佳的好物</span>
              <div className="space-y-2">
                {products.filter(p => p.list_status === 'red').slice(0, 3).map((p) => (
                  <div key={p.id} className="text-xs p-2 bg-rose-50/50 border border-rose-100 rounded-lg">
                    <div className="font-semibold text-rose-950 truncate">{p.product_name}</div>
                    <div className="text-[11px] text-rose-800 mt-0.5">维稳退红无刺激</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 space-y-3">
              <span className="text-xs text-stone-500 font-medium block">超 45 天闲置未动建议</span>
              <div className="space-y-2">
                {products.filter(p => p.status === 'idle').slice(0, 2).map((p) => (
                  <div key={p.id} className="text-xs p-2 bg-amber-50/60 border border-amber-100 rounded-lg">
                    <div className="font-semibold text-stone-900 truncate">{p.product_name}</div>
                    <div className="text-[11px] text-amber-800 mt-0.5">建议移入闲置拯救或循环空瓶回收</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stinging Report Confirmation Modal */}
      {stingingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold">移入黑榜并排除此产品？</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              您反馈「<strong>{stingingTarget.name}</strong>」出现刺痛不适。系统将：
              <br />1. 将其自动划归「黑榜避雷库」
              <br />2. 从早晚 Routine 和妆造推荐中实时移除
              <br />3. 提取其潜在刺激成分供后续安全拦截
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setStingingTarget(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                取消
              </button>
              <button
                onClick={handleConfirmStinging}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium rounded-xl transition-colors"
              >
                确认移入黑榜
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
